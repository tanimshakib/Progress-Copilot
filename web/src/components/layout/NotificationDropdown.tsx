import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Clock, Target, CheckSquare, Trash2, ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';

export function NotificationDropdown({
  onClose,
  ignoreRef,
}: {
  onClose: () => void;
  ignoreRef?: RefObject<HTMLElement>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data } = await api.get('/api/reminders');
      return data.reminders || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (panelRef.current.contains(target)) return;
      if (ignoreRef?.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, ignoreRef]);

  const rawReminders = remindersData ?? [];
  // Sort most recent first
  const sortedReminders = [...rawReminders].sort(
    (a: any, b: any) => new Date(b.createdAt || b.time).getTime() - new Date(a.createdAt || a.time).getTime(),
  );

  const displayedReminders = showAll ? sortedReminders : sortedReminders.slice(0, 3);

  return (
    <motion.div
      ref={panelRef}
      role="menu"
      aria-label="Notifications"
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-12 sm:right-16 top-[calc(100%+12px)] w-[22rem] rounded-2xl z-50 p-[1.5px] bg-gradient-to-br from-fuchsia-500/60 via-purple-500/40 to-sky-400/60 shadow-[0_20px_50px_rgba(99,102,241,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
      style={{ transformOrigin: 'top right' }}
    >
      <div className="relative w-full h-full rounded-[14px] overflow-hidden p-4 bg-gradient-to-b from-slate-50 via-indigo-50/90 to-purple-50 text-slate-900 dark:bg-gradient-to-b dark:from-[#160f2e] dark:via-[#110a24] dark:to-[#0b0718] dark:text-white backdrop-blur-xl border border-purple-200/80 dark:border-purple-500/25">
        <div className="flex items-center justify-between pb-3 border-b border-purple-200/60 dark:border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-purple-600 dark:text-fuchsia-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications & Reminders</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-fuchsia-300 font-bold">
            {sortedReminders.length}
          </span>
        </div>

        {isLoading && (
          <div className="space-y-2 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && sortedReminders.length === 0 && (
          <div className="py-6 text-center text-slate-500 dark:text-violet-300/70">
            <CheckCircle2 size={28} className="mx-auto text-emerald-500/60 mb-1.5" />
            <p className="text-xs font-semibold">No pending reminders</p>
            <p className="text-[11px] text-slate-400 dark:text-violet-400/50 mt-0.5">You're all caught up!</p>
          </div>
        )}

        {!isLoading && sortedReminders.length > 0 && (
          <div>
            <div className={`space-y-2 ${showAll ? 'max-h-72 overflow-y-auto pr-1.5' : ''}`}>
              {displayedReminders.map((r: any) => {
                const linkedTitle = r.target?.title || r.task?.title || 'Reminder';
                const isTarget = !!r.target;
                const dateStr = new Date(r.time).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-purple-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] hover:border-purple-400 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isTarget
                            ? 'bg-purple-500/15 text-purple-700 dark:text-fuchsia-400'
                            : 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        {isTarget ? <Target size={14} /> : <CheckSquare size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{linkedTitle}</p>
                        <p className="text-[10px] text-slate-500 dark:text-violet-300/70 flex items-center gap-1">
                          <Clock size={10} /> {dateStr}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition shrink-0"
                      title="Dismiss"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {sortedReminders.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full mt-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-fuchsia-300 text-xs font-extrabold transition flex items-center justify-center gap-1 border border-purple-500/15"
              >
                {showAll ? (
                  <>
                    Show Less <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    See More ({sortedReminders.length - 3} previous) <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dashboard/reminders');
            }}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            Manage All Reminders <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
