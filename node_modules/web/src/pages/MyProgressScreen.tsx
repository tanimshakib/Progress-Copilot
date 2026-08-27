import { Flame, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../modules/dashboard/useDashboard';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { ProgressScore } from '../components/dashboard/ProductivityScore';
import { TargetProgressBars } from '../components/dashboard/TargetProgressBars';
import { TaskCompletionTrendChart } from '../components/dashboard/TaskCompletionTrendChart';
import { PointsDistributionChart } from '../components/dashboard/PointsDistributionChart';

/**
 * MyProgressScreen — /dashboard/my-progress.
 */
export function MyProgressScreen() {
  const { user } = useAuth();
  const { data, loading, error } = useProgress();

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
            aria-label="Loading"
          />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <DashboardCard title="My Progress">
        <p className="text-rose-400 text-sm">{error}</p>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const {
    user: progUser,
    targetBreakdown,
    tasksCompletedLast30Days,
    pointsDistribution,
  } = data as any;

  const progressScoreVal = progUser.progressScore ?? progUser.productivityScore ?? 0;
  const avatar = user?.avatar || progUser.avatar;
  const initial = (user?.fullName || progUser.fullName || '?').trim().charAt(0).toUpperCase();

  const completedCount = targetBreakdown.filter(
    (t: any) => t.status === 'COMPLETED',
  ).length;
  const activeCount = targetBreakdown.length - completedCount;

  return (
    <div className="space-y-6">
      {/* ─── Premium Reports-style Profile & Progress Score Banner ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 shadow-md flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {avatar ? (
            <img
              src={avatar}
              alt={user?.fullName || progUser.fullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-purple-400 shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
              {initial}
            </div>
          )}
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600 dark:text-fuchsia-400">
              {progUser.role || 'Official Progress Candidate'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {user?.fullName || progUser.fullName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-violet-300/80 mt-0.5 font-medium">
              {user?.email || progUser.email || `${activeCount} active targets · ${completedCount} completed`}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-center">
                <span className="text-xs font-black text-orange-600 dark:text-orange-400 inline-flex items-center gap-1">
                  <Flame size={14} /> {progUser.dailyStreak} Days Streak
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-center">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <Star size={14} /> {progUser.points} Points
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/70 dark:bg-white/[0.03] p-4 rounded-2xl border border-purple-200/60 dark:border-white/10 shadow-sm shrink-0">
          <ProgressScore
            score={progressScoreVal}
            breakdown={progUser.scoreBreakdown}
            subtitle={`${progUser.points} total pts earned`}
          >
            <div className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-fuchsia-400 flex items-center gap-1">
              <Zap size={14} /> Productivity Score
            </div>
            <div className="text-xs text-slate-600 dark:text-violet-200 mt-0.5 font-medium">
              Completion (50%) + Priority (30%) + Streak (20%)
            </div>
          </ProgressScore>
        </div>
      </div>

      {/* ─── Target completion bars ──────────────────────────────── */}
      <DashboardCard
        title="Target Progress Breakdown"
        subtitle="Progress computed across active and completed targets."
      >
        <TargetProgressBars
          targets={targetBreakdown}
          emptyMessage="No targets available."
        />
      </DashboardCard>

      {/* ─── Trend + Points distribution charts ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="30-Day Task Completion Trend"
          subtitle="Daily task completions over the last 30 days."
        >
          <TaskCompletionTrendChart data={tasksCompletedLast30Days} />
        </DashboardCard>

        <DashboardCard
          title="Points Distribution"
          subtitle="Points earned by target priority (HIGH, MEDIUM, LOW)."
        >
          <PointsDistributionChart data={pointsDistribution} />
        </DashboardCard>
      </div>
    </div>
  );
}