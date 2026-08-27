import type { ReactNode } from 'react';
import { ProductivityScoreGauge } from './ProductivityScoreGauge';
import type { ProductivityBreakdown } from '../../lib/types';

/**
 * ProgressScore — the original circular progress ring + numeric badge.
 * Displays overall progress score accurately based on targets, tasks, and streaks.
 */
export function ProgressScore({
  score,
  subtitle,
  size = 132,
  children,
}: {
  score: number;
  subtitle?: string;
  size?: number;
  children?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid place-items-center"
        style={{ width: size, height: size }}
        aria-label={`Progress score ${pct} percent`}
        role="img"
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-purple-200/40 dark:text-white/10"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressScoreGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
          <defs>
            <linearGradient id="progressScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-extrabold tabular-nums leading-none text-slate-900 dark:text-white">
              {pct}
              <span className="text-base font-bold text-slate-500 dark:text-violet-300/70">%</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-fuchsia-400 mt-1">
              Progress
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        {children}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/**
 * ProductivityScore — Wrapper around 100-point ProductivityScoreGauge.
 * Displays circular gauge on left, description text in middle, and score breakdown on right in a horizontal layout.
 */
export function ProductivityScore({
  score,
  breakdown,
  subtitle,
  children,
}: {
  score: number;
  breakdown?: ProductivityBreakdown;
  subtitle?: string;
  children?: ReactNode;
}) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const compScore = breakdown?.completionScore ?? Math.round((safeScore * 0.5));
  const prioScore = breakdown?.priorityScore ?? Math.round((safeScore * 0.3));
  const streakScore = breakdown?.consistencyScore ?? Math.round((safeScore * 0.2));

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 w-full">
      {/* Left side: Gauge circle and badge label */}
      <div className="flex flex-col items-center shrink-0">
        <ProductivityScoreGauge score={score} breakdown={breakdown} size={110} showBreakdown={false} />
      </div>

      {/* Middle side: Title, Subtitle and text info */}
      <div className="min-w-0 flex-1 text-center lg:text-left lg:ml-2">
        {children}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      {/* Right side: Score Breakdown boxes on the same line */}
      <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 shrink-0">
        <div className="p-3 rounded-xl bg-white/80 dark:bg-cardBg/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[90px] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-violet-300/60">Completion</div>
          <div className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">{compScore}/50</div>
        </div>
        <div className="p-3 rounded-xl bg-white/80 dark:bg-cardBg/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[90px] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-violet-300/60">Priority</div>
          <div className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">{prioScore}/30</div>
        </div>
        <div className="p-3 rounded-xl bg-white/80 dark:bg-cardBg/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[90px] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-violet-300/60">Streak</div>
          <div className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">{streakScore}/20</div>
        </div>
      </div>
    </div>
  );
}