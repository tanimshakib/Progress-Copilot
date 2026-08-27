import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, Flame, Info, Trophy } from 'lucide-react';
import type { ProductivityBreakdown } from '../../lib/types';

export function ProductivityScoreGauge({
  score = 0,
  breakdown,
  size = 140,
  showBreakdown = true,
}: {
  score?: number;
  breakdown?: ProductivityBreakdown;
  size?: number;
  showBreakdown?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  // Dynamic Theme Colors based on score
  const getScoreTheme = (val: number) => {
    if (val >= 80) {
      return {
        stroke: '#10b981',
        bg: 'from-emerald-500/20 to-teal-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
        label: 'Mastery Pace',
      };
    }
    if (val >= 50) {
      return {
        stroke: '#f59e0b',
        bg: 'from-amber-500/20 to-orange-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300',
        label: 'Steady Growth',
      };
    }
    return {
      stroke: '#a855f7',
      bg: 'from-purple-500/20 to-fuchsia-500/10',
      text: 'text-purple-600 dark:text-fuchsia-400',
      badge: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-fuchsia-300',
      label: 'Getting Started',
    };
  };

  const theme = getScoreTheme(safeScore);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (circumference * safeScore) / 100;

  // Breakdown values fallback
  const compScore = breakdown?.completionScore ?? Math.round((safeScore * 0.5));
  const prioScore = breakdown?.priorityScore ?? Math.round((safeScore * 0.3));
  const streakScore = breakdown?.consistencyScore ?? Math.round((safeScore * 0.2));

  return (
    <div className="flex flex-col items-center text-center">
      {/* Gauge Circle */}
      <div className="relative group cursor-pointer" onClick={() => setShowTooltip((prev) => !prev)}>
        <svg width={size} height={size} viewBox="0 0 130 130" className="-rotate-90 transform">
          {/* Background Track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            className="stroke-slate-200 dark:stroke-white/10"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke={theme.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${theme.stroke}66)` }}
          />
        </svg>

        {/* Center Score Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-black text-2xl sm:text-3xl text-slate-900 dark:text-white font-mono tracking-tight">
            {safeScore}
          </span>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-violet-300/60 tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      {/* Label Badge & Info Icon */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
          {theme.label}
        </span>
        <button
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-white transition"
          title="Score Breakdown Formula"
        >
          <Info size={14} />
        </button>
      </div>

      {/* Formula Breakdown Badge */}
      {showBreakdown && (
        <div className="mt-3 w-full max-w-xs rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-purple-200/60 dark:border-white/10 p-2.5 text-[11px] text-slate-600 dark:text-violet-200/90 font-medium">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white text-xs mb-1.5">
            <span className="flex items-center gap-1">
              <Zap size={13} className="text-amber-500" /> Score Breakdown
            </span>
            <span className="font-mono text-purple-600 dark:text-fuchsia-400">{safeScore}/100</span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center font-mono">
            <div className="p-1 rounded-lg bg-white/80 dark:bg-cardBg/60 border border-slate-200/60 dark:border-white/5">
              <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-violet-300/60">Completion</div>
              <div className="font-extrabold text-slate-900 dark:text-white">{compScore}/50</div>
            </div>
            <div className="p-1 rounded-lg bg-white/80 dark:bg-cardBg/60 border border-slate-200/60 dark:border-white/5">
              <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-violet-300/60">Priority</div>
              <div className="font-extrabold text-slate-900 dark:text-white">{prioScore}/30</div>
            </div>
            <div className="p-1 rounded-lg bg-white/80 dark:bg-cardBg/60 border border-slate-200/60 dark:border-white/5">
              <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-violet-300/60">Streak</div>
              <div className="font-extrabold text-slate-900 dark:text-white">{streakScore}/20</div>
            </div>
          </div>
        </div>
      )}

      {/* Popover / Detailed Modal Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mt-3 w-full max-w-sm rounded-2xl border border-purple-300 dark:border-cardBorder bg-white/95 dark:bg-[#150d2c]/95 backdrop-blur-xl p-4 shadow-2xl text-left text-xs text-slate-700 dark:text-violet-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-cardBorder/40 mb-2.5">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" /> Productivity Engine Formula
              </span>
              <button
                type="button"
                onClick={() => setShowTooltip(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-2 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Completion Rate (50%): </span>
                  <code>(Completed Tasks / Total Tasks) × 50</code>
                  {breakdown && (
                    <span className="block text-[10px] text-slate-500 dark:text-violet-300/70">
                      Current: {breakdown.completedTasks}/{breakdown.totalTasks} tasks ({breakdown.completionRate}%) = {compScore} pts
                    </span>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-2">
                <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Priority Focus (30%): </span>
                  <code>Bonus for HIGH priority completions</code>
                  {breakdown && (
                    <span className="block text-[10px] text-slate-500 dark:text-violet-300/70">
                      High Priority: {breakdown.highPriorityCompleted}/{breakdown.highPriorityTotal} ({breakdown.highPriorityRate}%) = {prioScore} pts
                    </span>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-2">
                <Flame size={14} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Streak Consistency (20%): </span>
                  <code>Full 20 pts at 7+ days streak</code>
                  {breakdown && (
                    <span className="block text-[10px] text-slate-500 dark:text-violet-300/70">
                      Current Streak: {breakdown.dailyStreak} days = {streakScore} pts
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
