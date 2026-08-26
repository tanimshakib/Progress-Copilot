import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFutureGoal } from '../modules/futureGoal/useFutureGoal';
import { useTargets } from '../modules/targets/useTargets';
import { tasksApi } from '../modules/tasks/tasksApi';
import { getErrorMessage } from '../lib/api';
import type { Priority, Target, Task, TargetSubTaskSeed } from '../lib/types';

/**
 * TargetsPage — Future Goal + Target list with sub-task progress.
 *
 * Layout:
 *   ┌────────────────────────────────────────────┐
 *   │  Future Goal  (editable card)              │
 *   ├────────────────────────────────────────────┤
 *   │  [ + Add Target ]                          │
 *   │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
 *   │  │ Target 1 │ │ Target 2 │ │ Target 3 │   │
 *   │  └──────────┘ └──────────┘ └──────────┘   │
 *   └────────────────────────────────────────────┘
 *
 * Each Target card can be expanded to show a horizontal completion chart
 * and an inline sub-task list. Sub-tasks are real tasks on the backend
 * (targetId is set) and they participate in the points/streak pipeline.
 */

export function TargetsPage() {
  const { refresh } = useAuth();
  const { goal, save: saveGoal, loading: goalLoading } = useFutureGoal();
  const { targets, loading, error, reload, create, remove, update } = useTargets();
  const location = useLocation();

  const [showAdd, setShowAdd] = useState(false);

  // If the Tasks page sent us here with a focusTargetId (via router state),
  // we pre-expand that card so the user lands on View Progress directly.
  const focusTargetId = (location.state as { focusTargetId?: string } | null)?.focusTargetId;

  // Stable callback so child cards don't re-render on every TargetsPage render.
  // Updates only the affected card's status — no full grid reload, so the
  // expanded card stays mounted and the user's input is preserved.
  const handleProgressChanged = useCallback(
    async (targetId: string, nextStatus: 'INCOMPLETE' | 'COMPLETED') => {
      await update(targetId, { status: nextStatus });
      refresh();
    },
    [update, refresh],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id);
      refresh();
    },
    [remove, refresh],
  );

  return (
    <div className="space-y-6">
      <FutureGoalCard
        goal={goal}
        loading={goalLoading}
        onSave={saveGoal}
      />

      <section>
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              Your Targets
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Long-term goals with measurable sub-tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-900/30 hover:shadow-xl hover:brightness-110 transition-all"
          >
            <PlusIcon />
            {showAdd ? 'Close' : 'Add Target'}
          </button>
        </header>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <AddTargetForm
                onCancel={() => setShowAdd(false)}
                onCreate={async (data) => {
                  await create(data);
                  setShowAdd(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorBanner message={error} onRetry={reload} />
        ) : targets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {targets.map((t) => (
              <TargetCard
                key={t.id}
                target={t}
                onDelete={() => handleDelete(t.id)}
                onProgressChanged={handleProgressChanged}
                forceExpand={t.id === focusTargetId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── Future Goal ─────────────────────────── */

function FutureGoalCard({
  goal,
  loading,
  onSave,
}: {
  goal: { title: string } | null;
  loading: boolean;
  onSave: (title: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the input in sync with the loaded goal — covers the case where
  // the user opens the page for the first time and the goal is null.
  useEffect(() => {
    if (!editing) setTitle(goal?.title ?? '');
  }, [goal, editing]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(title.trim());
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save future goal'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="rounded-2xl border border-white/10 p-5 sm:p-6 bg-gradient-to-br from-purple-600/15 via-fuchsia-500/10 to-transparent backdrop-blur-xl shadow-xl shadow-purple-900/20"
    >
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white shadow-lg shadow-purple-900/30">
          <StarIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-purple-300">
                Future Goal
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                Where are you headed?
              </h2>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold text-purple-200 hover:text-white border border-purple-400/30 hover:bg-purple-500/10 transition-colors"
              >
                <PencilIcon />
                {goal ? 'Edit' : 'Set'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="mt-3 h-6 w-2/3 rounded bg-white/10 animate-pulse" />
          ) : editing ? (
            <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Launch a personal SaaS by 2027"
                maxLength={200}
                autoFocus
                className="flex-1 h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(goal?.title ?? '');
                }}
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-gray-300 hover:text-white border border-white/10"
              >
                Cancel
              </button>
            </form>
          ) : (
            <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {goal?.title || (
                <span className="text-gray-500 dark:text-gray-400 italic font-normal">
                  You haven't set a future goal yet — click "Set" to add one.
                </span>
              )}
            </p>
          )}

          {error && (
            <p className="mt-2 text-sm text-rose-400">{error}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Add Target ─────────────────────────── */

type SubTaskDraft = { title: string; deadline: string };

function AddTargetForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (data: {
    title: string;
    description?: string | null;
    deadline?: Date | null;
    priority?: Priority;
    subTasks: TargetSubTaskSeed[];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  // Always start with at least one sub-task row so the form can't submit
  // empty — the backend also enforces a min of 1.
  const [subTasks, setSubTasks] = useState<SubTaskDraft[]>([{ title: '', deadline: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSubTask = (idx: number, patch: Partial<SubTaskDraft>) =>
    setSubTasks((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const addSubTaskRow = () =>
    setSubTasks((prev) => [...prev, { title: '', deadline: '' }]);

  const removeSubTaskRow = (idx: number) =>
    setSubTasks((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );

  const validSubTasks = subTasks.filter((s) => s.title.trim().length > 0);
  const canSubmit =
    title.trim().length > 0 && validSubTasks.length > 0 && validSubTasks.length === subTasks.length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (validSubTasks.length === 0) {
      setError('Add at least one sub-task to create this target');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        subTasks: validSubTasks.map((s) => ({
          title: s.title.trim(),
          deadline: s.deadline ? new Date(s.deadline) : null,
        })),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create target'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 p-5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-xl shadow-black/30 space-y-3"
    >
      <h3 className="text-lg font-bold text-white">New Target</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Learn React and build a portfolio site"
            maxLength={200}
            className={inputCls}
          />
        </Field>
        <Field label="Priority">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputCls}
          >
            <option value="HIGH">HIGH (5 pts/sub-task)</option>
            <option value="MEDIUM">MEDIUM (4 pts/sub-task)</option>
            <option value="LOW">LOW (3 pts/sub-task)</option>
          </select>
        </Field>
        <Field label="Deadline">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            maxLength={2000}
            className={inputCls}
          />
        </Field>
      </div>

      {/* ─── Sub-task section (minimum 1 row) ─── */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Sub-tasks
            </span>
            <span className="text-[10px] text-rose-300 font-semibold">
              * at least 1 required
            </span>
          </div>
          <button
            type="button"
            onClick={addSubTaskRow}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 text-xs font-semibold border border-purple-400/30 transition-colors"
          >
            <PlusIcon />
            Add row
          </button>
        </div>

        <ul className="space-y-2">
          {subTasks.map((s, idx) => {
            const empty = s.title.trim().length === 0;
            return (
              <li
                key={idx}
                className={
                  'rounded-lg border p-2 flex flex-col sm:flex-row sm:items-center gap-2 ' +
                  (empty
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : 'border-white/10 bg-white/5')
                }
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={s.title}
                    onChange={(e) => setSubTask(idx, { title: e.target.value })}
                    placeholder={`Sub-task #${idx + 1} — e.g. Watch Module 1 lectures`}
                    maxLength={200}
                    className="h-9 w-full px-3 rounded-md bg-white/5 border border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <input
                  type="date"
                  value={s.deadline}
                  onChange={(e) => setSubTask(idx, { deadline: e.target.value })}
                  className="h-9 px-3 rounded-md bg-white/5 border border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 sm:w-44"
                />
                <button
                  type="button"
                  onClick={() => removeSubTaskRow(idx)}
                  disabled={subTasks.length === 1}
                  aria-label="Remove sub-task row"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
                >
                  <TrashIcon />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-lg text-gray-300 hover:text-white border border-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Target'}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────── Target Card ─────────────────────────── */

function TargetCard({
  target,
  onDelete,
  onProgressChanged,
  forceExpand,
}: {
  target: Target;
  onDelete: () => Promise<void> | void;
  onProgressChanged: (targetId: string, nextStatus: 'INCOMPLETE' | 'COMPLETED') => Promise<void>;
  forceExpand?: boolean;
}) {
  // Honor the parent-driven initial expansion (e.g. when we navigated from
  // the Tasks page and want View Progress open immediately). After the first
  // mount the user controls `expanded` themselves.
  const [expanded, setExpanded] = useState<boolean>(!!forceExpand);
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);

  // Stable ref so the [expanded] effect doesn't loop on every render.
  // We deliberately do NOT depend on `onProgressChanged` or `target.status`
  // here — both change whenever a sibling re-renders, which would otherwise
  // re-fire `fetchSubTasks` in an infinite loop. We compare the derived
  // status against the latest prop value via refs so the comparison stays
  // current without pulling them into our deps.
  const onProgressChangedRef = useRef(onProgressChanged);
  const targetStatusRef = useRef(target.status);
  onProgressChangedRef.current = onProgressChanged;
  targetStatusRef.current = target.status;

  const fetchSubTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const list = await tasksApi.listByTarget(target.id);
      setSubTasks(list);
      // After a fresh load, let the parent recompute the target status so
      // the COMPLETED / INCOMPLETE pill flips without waiting for a toggle.
      const allDone = list.length > 0 && list.every((t) => t.isCompleted);
      const nextStatus: 'INCOMPLETE' | 'COMPLETED' = allDone ? 'COMPLETED' : 'INCOMPLETE';
      // Only ping the parent when the derived status actually differs from
      // what's currently displayed — avoids a pointless PATCH / re-render
      // (and the infinite-spinner that used to come with it).
      if (nextStatus !== targetStatusRef.current) {
        onProgressChangedRef.current(target.id, nextStatus);
      }
    } catch {
      setSubTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [target.id]);

  useEffect(() => {
    if (expanded) fetchSubTasks();
  }, [expanded, fetchSubTasks]);

  const { completed, total, percent } = useMemo(() => {
    const t = subTasks.length;
    const c = subTasks.filter((x) => x.isCompleted).length;
    return {
      completed: c,
      total: t,
      percent: t === 0 ? 0 : Math.round((c / t) * 100),
    };
  }, [subTasks]);

  const addSubTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      const created = await tasksApi.create({
        title: newTitle.trim(),
        targetId: target.id,
      });
      setSubTasks((prev) => [created, ...prev]);
      setNewTitle('');
      // No onProgressChanged here — adding a sub-task can't complete the
      // target, so the card's pill stays INCOMPLETE without a round-trip.
    } catch {
      /* surfaced by tasksApi.create consumer */
    } finally {
      setBusy(false);
    }
  };

  const toggleSubTask = async (task: Task) => {
    try {
      await tasksApi.toggle(task.id, !task.isCompleted);
      await fetchSubTasks();
    } catch {
      /* noop */
    }
  };

  const deleteSubTask = async (id: string) => {
    try {
      await tasksApi.remove(id);
      await fetchSubTasks();
    } catch {
      /* noop */
    }
  };

  return (
    <article
      className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-5 shadow-xl shadow-black/30 hover:border-purple-400/40 transition-all"
    >
      <header className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {target.title}
          </h3>
          {target.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {target.description}
            </p>
          )}
        </div>
        <span
          className={
            target.status === 'COMPLETED'
              ? 'inline-flex items-center justify-center gap-1.5 h-6.5 px-3.5 min-w-[100px] whitespace-nowrap rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm shrink-0'
              : 'inline-flex items-center justify-center gap-1.5 h-6.5 px-3.5 min-w-[90px] whitespace-nowrap rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-300 ring-1 ring-amber-400/40 shadow-sm shrink-0'
          }
        >
          {target.status === 'COMPLETED' ? '✓ Completed' : 'Incomplete'}
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium mb-4">
        <PriorityPill priority={target.priority} />
        {target.deadline && (
          <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-white/5 text-gray-300 ring-1 ring-white/10">
            <CalendarIcon />
            {formatDate(target.deadline)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 h-9 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 text-purple-900 dark:text-purple-200 font-bold text-sm border border-purple-400/30 transition-colors"
        >
          {expanded ? 'Hide Progress' : 'View Progress'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete target"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition-colors"
        >
          <TrashIcon />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Sub-task completion
                  </span>
                  <span className="font-bold text-purple-300 tabular-nums">
                    {completed}/{total} · {percent}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide">
                  <span className="text-emerald-300">Done {completed}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-amber-300">To-do {Math.max(0, total - completed)}</span>
                </div>
              </div>

              {/* Sub-task list */}
              {loadingTasks ? (
                <div className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ) : subTasks.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No sub-tasks yet — add one below.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {subTasks.map((t) => (
                    <SubTaskRow
                      key={t.id}
                      task={t}
                      onToggle={() => toggleSubTask(t)}
                      onDelete={() => deleteSubTask(t.id)}
                    />
                  ))}
                </ul>
              )}

              {/* Quick add sub-task */}
              <form onSubmit={addSubTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Add a sub-task…"
                  maxLength={200}
                  className={inputCls + ' flex-1'}
                />
                <button
                  type="submit"
                  disabled={busy || !newTitle.trim()}
                  className="h-10 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function SubTaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={
        'group/row flex items-center gap-2 rounded-lg px-2 py-1.5 ' +
        (task.isCompleted
          ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20'
          : 'bg-white/5 ring-1 ring-white/10')
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
        className={
          'h-5 w-5 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ' +
          (task.isCompleted
            ? 'bg-emerald-500 border-emerald-400 text-white'
            : 'border-white/30 hover:border-purple-400 hover:bg-purple-500/10')
        }
      >
        {task.isCompleted && <CheckIcon />}
      </button>
      <span
        className={
          'flex-1 text-sm truncate ' +
          (task.isCompleted
            ? 'text-gray-500 line-through'
            : 'text-gray-800 dark:text-gray-200')
        }
        title={task.title}
      >
        {task.title}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete sub-task"
        className="opacity-0 group-hover/row:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
      >
        <TrashIcon />
      </button>
    </li>
  );
}

/* ─────────────────────────── shared bits ─────────────────────────── */

const inputCls =
  'h-10 w-full px-3 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
        {label} {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function PriorityPill({ priority }: { priority: Priority }) {
  // Solid colored backgrounds with white text give the strongest contrast
  // against the dark glass cards. The earlier alpha-only pills were nearly
  // invisible ("priority text color problem").
  const map: Record<Priority, { bg: string; ring: string; label: string }> = {
    HIGH: { bg: 'bg-rose-500', ring: 'ring-rose-300', label: 'HIGH' },
    MEDIUM: { bg: 'bg-amber-500', ring: 'ring-amber-300', label: 'MEDIUM' },
    LOW: { bg: 'bg-emerald-500', ring: 'ring-emerald-300', label: 'LOW' },
  };
  const p = map[priority];
  return (
    <span
      className={
        'inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ring-1 shadow-sm ' +
        p.bg + ' ' + p.ring
      }
    >
      {p.label}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 h-40 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center bg-white/[0.02]">
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-purple-500/15 ring-1 ring-purple-400/30 inline-flex items-center justify-center text-purple-300">
        <TargetIcon />
      </div>
      <h3 className="text-lg font-bold text-white">No targets yet</h3>
      <p className="text-sm text-gray-400 mt-1">
        Add your first target to start tracking measurable sub-tasks.
      </p>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-3">
      <p className="text-sm text-rose-200">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-9 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white text-sm font-semibold"
      >
        Retry
      </button>
    </div>
  );
}

/* ─────────────────────────── icons ─────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2.5l2.95 6.0 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5Z" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}