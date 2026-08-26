import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../modules/tasks/useTasks';
import { getErrorMessage } from '../lib/api';
import type { Priority, Task } from '../lib/types';

/**
 * TasksPage — Two-column layout: To Do | Done.
 *
 * - Each column is a vertical stack of task cards.
 * - Checkbox toggles `isCompleted`. Backend auto-awards / refunds points
 *   (HIGH=5, MEDIUM=4, LOW=3 for sub-tasks; flat for standalone) and
 *   bumps the daily streak.
 * - The AuthContext is refreshed after every toggle so the TopNavbar's
 *   points / streak chips stay in sync.
 * - "Add Task" form at the top creates standalone tasks (no target).
 * - Create errors are surfaced at the page level via `createError` so the
 *   message survives the AddTaskForm unmounting on success.
 */

export function TasksPage() {
  const { refresh } = useAuth();
  const { tasks, loading, error, reload, toggle, remove, create } = useTasks();
  const navigate = useNavigate();

  const [showAdd, setShowAdd] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'ALL' | Priority>('ALL');
  // Page-level banner for create errors so the message survives the
  // AddTaskForm unmounting on success.
  const [createError, setCreateError] = useState<string | null>(null);

  const { todo, done } = useMemo(() => {
    const sorted = [...tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const filtered = filterPriority === 'ALL'
      ? sorted
      : sorted.filter((t) => t.priority === filterPriority);
    return {
      todo: filtered.filter((t) => !t.isCompleted),
      done: filtered.filter((t) => t.isCompleted),
    };
  }, [tasks, filterPriority]);

  const handleToggle = async (task: Task) => {
    try {
      await toggle(task.id, !task.isCompleted);
      // Sync the navbar with the new points / streak.
      await refresh();
    } catch (err) {
      // Surface inline; the TasksPage already shows per-row errors when needed.
      console.error('toggle failed:', err);
    }
  };

  const handleDelete = async (task: Task) => {
    await remove(task.id);
    await refresh();
  };

  // Clicking a sub-task's parent badge navigates to the Targets page so the
  // user can open the matching card's "View Progress" inline.
  const handleOpenTarget = (targetId: string) => {
    navigate('/dashboard/targets', { state: { focusTargetId: targetId } });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            Standalone Tasks
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quick wins that don't belong to a Target — each one earns +2 pts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as 'ALL' | Priority)}
            className="h-10 px-3 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="ALL">All priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-900/30 hover:shadow-xl hover:brightness-110 transition-all"
          >
            <PlusIcon />
            {showAdd ? 'Close' : 'Add Task'}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <AddTaskForm
              onCancel={() => {
                setShowAdd(false);
                setCreateError(null);
              }}
              onCreate={async (data) => {
                try {
                  await create(data);
                  setCreateError(null);
                  setShowAdd(false);
                  await refresh();
                } catch (err) {
                  // Surface the error at the page level so the message is
                  // visible even after the form unmounts.
                  setCreateError(getErrorMessage(err, 'Failed to create task'));
                  throw err;
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {createError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-rose-200">{createError}</p>
          <button
            type="button"
            onClick={() => setCreateError(null)}
            className="h-9 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white text-sm font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-rose-200">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="h-9 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonColumn />
          <SkeletonColumn />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TaskColumn
            title="To Do"
            accent="amber"
            count={todo.length}
            empty="Nothing to do — add a task to get started."
          >
            {todo.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={() => handleToggle(t)}
                onDelete={() => handleDelete(t)}
                onOpenTarget={handleOpenTarget}
              />
            ))}
          </TaskColumn>

          <TaskColumn
            title="Done"
            accent="emerald"
            count={done.length}
            empty="No completed tasks yet. Check one off to earn points!"
          >
            {done.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={() => handleToggle(t)}
                onDelete={() => handleDelete(t)}
                onOpenTarget={handleOpenTarget}
              />
            ))}
          </TaskColumn>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Column ─────────────────────────── */

function TaskColumn({
  title,
  accent,
  count,
  empty,
  children,
}: {
  title: string;
  accent: 'amber' | 'emerald';
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  const accentCls =
    accent === 'amber'
      ? 'from-amber-500/15 to-amber-500/5 ring-amber-400/30'
      : 'from-emerald-500/15 to-emerald-500/5 ring-emerald-400/30';
  const dotCls = accent === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
  const badgeCls =
    accent === 'amber'
      ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 ring-amber-400/40 font-black'
      : 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 ring-emerald-400/40 font-black';

  const childArray = Array.isArray(children) ? children : [children];
  const hasChildren = childArray.filter(Boolean).length > 0;

  return (
    <section
      className={
        'rounded-2xl border border-purple-200/80 dark:border-white/10 bg-gradient-to-br ' +
        accentCls +
        ' backdrop-blur-xl p-4 sm:p-5 shadow-md dark:shadow-xl ring-1'
      }
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={'h-2 w-2 rounded-full ' + dotCls} />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <span
          className={
            'inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[11px] ring-1 ' +
            badgeCls
          }
        >
          {count}
        </span>
      </header>

      {hasChildren ? (
        <ul className="space-y-2">{children}</ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic py-6 text-center">
          {empty}
        </p>
      )}
    </section>
  );
}

/* ─────────────────────────── Task Card ─────────────────────────── */

function TaskCard({
  task,
  onToggle,
  onDelete,
  onOpenTarget,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onOpenTarget: (targetId: string) => void;
}) {
  const isDone = task.isCompleted;
  const overdue = !isDone && isOverdue(task.deadline);
  const hasParentTarget = !!task.targetId && !!task.target;
  // If this is a sub-task without an own deadline, fall back to the parent's
  // deadline so the user can still see when the work is due.
  const effectiveDeadline = task.deadline ?? (hasParentTarget ? task.target!.deadline ?? undefined : undefined);

  return (
    <li
      className={
        'group rounded-xl p-3 transition-all ring-1 border ' +
        (isDone
          ? 'bg-emerald-500/10 dark:bg-emerald-500/5 ring-emerald-500/30 border-emerald-500/20'
          : overdue
          ? 'bg-rose-500/10 dark:bg-rose-500/5 ring-rose-500/30 border-rose-500/20'
          : 'bg-white/80 dark:bg-white/[0.04] ring-slate-200/80 dark:ring-white/10 border-slate-200/90 dark:border-white/10 hover:border-purple-400/50 shadow-sm')
      }
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
          className={
            'mt-0.5 h-6 w-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ' +
            (isDone
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
              : 'border-slate-400 dark:border-white/30 bg-white/50 dark:bg-transparent hover:border-purple-500 hover:bg-purple-500/10')
          }
        >
          {isDone && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={
                'text-sm font-bold ' +
                (isDone ? 'line-through text-slate-500 dark:text-gray-500' : 'text-slate-900 dark:text-white')
              }
            >
              {task.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {hasParentTarget && task.target && (
                <button
                  type="button"
                  onClick={() => onOpenTarget(task.target!.id)}
                  title={`Open "${task.target!.title}" progress`}
                  className="inline-flex items-center gap-1 h-6 max-w-[140px] px-2 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-fuchsia-500/15 text-fuchsia-900 dark:text-fuchsia-200 ring-1 ring-fuchsia-400/40 hover:bg-fuchsia-500/25 transition-all shadow-xs"
                >
                  <TargetIcon />
                  <span className="truncate">{task.target!.title}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete task"
                className="opacity-0 group-hover:opacity-100 h-7 w-7 inline-flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={
                'mt-1 text-xs ' +
                (isDone ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-gray-300 font-medium')
              }
            >
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
            <PriorityPill priority={task.priority} />
            {effectiveDeadline && (
              <span
                className={
                  'inline-flex items-center gap-1 h-5 px-2 rounded-full ring-1 font-semibold ' +
                  (overdue
                    ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 ring-rose-400/30'
                    : 'bg-slate-200/70 dark:bg-white/5 text-slate-700 dark:text-gray-300 ring-slate-300 dark:ring-white/10')
                }
                title={
                  !task.deadline && hasParentTarget
                    ? `Inherited from target "${task.target!.title}"`
                    : undefined
                }
              >
                <CalendarIcon />
                {formatDate(effectiveDeadline)}
                {overdue && ' · overdue'}
                {!task.deadline && hasParentTarget && ' · from target'}
              </span>
            )}
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-purple-500/15 text-purple-900 dark:text-purple-200 ring-1 ring-purple-400/30 font-extrabold">
              +{pointsLabel(task.priority, task.targetId)} pts
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ─────────────────────────── Add Task ─────────────────────────── */

function AddTaskForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    deadline?: Date | null;
    priority?: Priority;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline) : null,
        priority,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create task'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 p-5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-xl shadow-black/30 space-y-3"
    >
      <h3 className="text-lg font-bold text-white">New Task</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Review linear algebra notes"
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
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="LOW">LOW</option>
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

      <p className="text-[11px] text-gray-400">
        Standalone tasks earn <span className="text-purple-300 font-bold">2 points</span> regardless of priority.
      </p>

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
          disabled={saving || !title.trim()}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Task'}
        </button>
      </div>
    </form>
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
  // Solid backgrounds with white text for strong contrast on the glass cards
  // (the previous alpha-only pills were almost invisible).
  const map: Record<Priority, { bg: string; ring: string; label: string }> = {
    HIGH: { bg: 'bg-rose-500', ring: 'ring-rose-300', label: 'HIGH' },
    MEDIUM: { bg: 'bg-amber-500', ring: 'ring-amber-300', label: 'MEDIUM' },
    LOW: { bg: 'bg-emerald-500', ring: 'ring-emerald-300', label: 'LOW' },
  };
  const p = map[priority];
  return (
    <span
      className={
        'inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ring-1 shadow-sm ' +
        p.bg + ' ' + p.ring
      }
    >
      {p.label}
    </span>
  );
}

function SkeletonColumn() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2 animate-pulse">
      <div className="h-5 w-24 rounded bg-white/10" />
      <div className="h-12 rounded-lg bg-white/5" />
      <div className="h-12 rounded-lg bg-white/5" />
      <div className="h-12 rounded-lg bg-white/5" />
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function pointsLabel(priority: Priority, targetId?: string | null): string {
  // Sub-task points depend on the target's priority; standalone is always 2.
  if (!targetId) return '2';
  return priority === 'HIGH' ? '5' : priority === 'MEDIUM' ? '4' : '3';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(deadline?: string | null): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/* ─────────────────────────── icons ─────────────────────────── */

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
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
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}