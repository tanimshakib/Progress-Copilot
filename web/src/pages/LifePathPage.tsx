import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Compass, CheckCircle2, Clock, Flag, Target as TargetIcon, Edit3, Save, Loader2, Calendar, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useFutureGoal } from '../modules/futureGoal/useFutureGoal';
import { useToast } from '../context/ToastContext';

export function LifePathPage() {
  const { addToast } = useToast();
  const { goal, loading: futureGoalLoading, save: saveGoal } = useFutureGoal();
  const [editingFutureGoal, setEditingFutureGoal] = useState(false);
  const [futureGoalTitle, setFutureGoalTitle] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Fetch targets
  const { data: targetsData, isLoading: targetsLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: async () => {
      const { data } = await api.get('/api/targets');
      return data.targets || [];
    },
  });

  const handleFutureGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!futureGoalTitle.trim()) return;
    try {
      setSavingGoal(true);
      await saveGoal(futureGoalTitle.trim());
      setEditingFutureGoal(false);
      addToast({
        type: 'success',
        title: 'Future Goal Updated',
        message: 'Your ultimate milestone has been saved and synced.',
      });
    } catch {
      addToast({
        type: 'warning',
        title: 'Save Failed',
        message: 'Could not update future goal.',
      });
    } finally {
      setSavingGoal(false);
    }
  };

  // Chronological order: Oldest target first, then recent ones follow
  const rawTargets = targetsData ?? [];
  const targets = [...rawTargets].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const futureGoal = goal;
  const hasFutureGoal = !!futureGoal?.title?.trim();
  const isLoading = targetsLoading || futureGoalLoading;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="text-purple-600 dark:text-fuchsia-400" size={26} /> Life Path & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Chronological journey: Target #1 (Oldest) &rarr; Next Targets &rarr; Ultimate Milestone.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="relative py-4">
          {/* Vertical Center Connector Line */}
          <div className="absolute left-6 sm:left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-purple-500 via-indigo-500 to-fuchsia-500 -translate-x-1/2 rounded-full opacity-40 dark:opacity-60" />

          {/* Timeline Nodes */}
          <div className="space-y-10 relative">
            {targets.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/60 dark:bg-cardBg/40 rounded-2xl border border-dashed border-purple-300 dark:border-purple-500/30 p-6">
                <TargetIcon className="mx-auto text-purple-400 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-700 dark:text-white">No active targets set yet.</p>
                <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-1">Add targets in the Target section to see them automatically line up on your chronological Life Path.</p>
              </div>
            ) : (
              targets.map((target: any, index: number) => {
                const isDone = target.status === 'COMPLETED';
                const isLeft = index % 2 === 0;

                return (
                  <motion.div
                    key={target.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`flex flex-col sm:flex-row items-center gap-6 ${isLeft ? 'sm:flex-row-reverse' : ''
                      }`}
                  >
                    {/* Content Card */}
                    <div className="w-full sm:w-[calc(50%-2rem)] pl-12 sm:pl-0">
                      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-md hover:shadow-lg transition">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-fuchsia-400">
                            Target #{index + 1}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${target.priority === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : target.priority === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              }`}
                          >
                            {target.priority}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                          {target.title}
                        </h3>

                        {target.description && (
                          <p className="text-xs text-slate-600 dark:text-violet-200/80 mb-3 line-clamp-2">
                            {target.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-200/60 dark:border-cardBorder/40">
                          <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-violet-300">
                            {isDone ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Completed
                              </span>
                            ) : (
                              <span className="text-purple-600 dark:text-fuchsia-400 flex items-center gap-1">
                                <Clock size={14} /> In Progress
                              </span>
                            )}
                          </span>

                          <span className="text-slate-500 dark:text-violet-300/60 flex items-center gap-1">
                            <Calendar size={11} /> {new Date(target.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Node Badge */}
                    <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                      <div
                        className={`w-10 h-10 rounded-full border-4 flex items-center justify-center shadow-lg transition-all ${isDone
                          ? 'bg-emerald-500 border-white dark:border-[#110b24] text-white shadow-emerald-500/50'
                          : 'bg-purple-600 border-white dark:border-[#110b24] text-white shadow-purple-500/50 animate-pulse'
                          }`}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : <TargetIcon size={18} />}
                      </div>
                    </div>

                    {/* Spacer for two-column alignment */}
                    <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
                  </motion.div>
                );
              })
            )}

            {/* End Milestone: Ultimate Milestone Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: targets.length * 0.1 }}
              className="relative pt-6"
            >
              {/* Flag Badge Node */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 top-0 z-10 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-sky-500 text-white flex items-center justify-center shadow-xl border-4 border-white dark:border-[#110b24]">
                  <Flag size={22} />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-fuchsia-500/40 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-fuchsia-900/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-center mt-6">
                <span className="text-xs uppercase tracking-widest font-black text-violet-500 bg-fuchsia-500/20 px-3 py-1 rounded-full border border-fuchsia-500/30 inline-block mb-3">
                  Ultimate Milestone
                </span>

                {!editingFutureGoal ? (
                  <div>
                    {hasFutureGoal && futureGoal ? (
                      <>
                        <h2 className="text-2xl sm:text-3xl font-black text-white-600 tracking-tight">
                          {futureGoal.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setFutureGoalTitle(futureGoal.title);
                            setEditingFutureGoal(true);
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wide transition inline-flex items-center gap-1.5 border border-white/20"
                        >
                          <Edit3 size={14} /> Edit Future Goal
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl sm:text-2xl font-bold text-violet-200/90 tracking-tight">
                          No Future Goal Set in Target Feature
                        </h2>
                        <p className="text-xs text-violet-300/70 mt-1 max-w-sm mx-auto">
                          Set your high-level ultimate goal below or in the Target section.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setFutureGoalTitle('');
                            setEditingFutureGoal(true);
                          }}
                          className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-bold tracking-wide transition inline-flex items-center gap-1.5 shadow-md"
                        >
                          <Plus size={14} /> Set Future Goal
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFutureGoalSubmit} className="max-w-md mx-auto space-y-3">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={futureGoalTitle}
                      onChange={(e) => setFutureGoalTitle(e.target.value)}
                      placeholder="e.g. Become a Senior Software Engineer & Build My Product"
                      className="w-full rounded-xl bg-[#0c0a17] border border-fuchsia-500/50 px-4 py-2.5 text-white text-center font-bold text-lg focus:outline-none"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFutureGoal(false)}
                        className="px-4 py-1.5 rounded-lg border border-white/20 text-white text-xs font-semibold hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingGoal || !futureGoalTitle.trim()}
                        className="px-5 py-1.5 rounded-lg bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-500 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {savingGoal && <Loader2 size={14} className="animate-spin" />}
                        <Save size={14} /> Save Goal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
