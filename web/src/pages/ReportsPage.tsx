import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Flame,
  Star,
  Target,
  CheckSquare,
  BookOpen,
  GraduationCap,
  Loader2,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { TaskCompletionTrendChart } from '../components/dashboard/TaskCompletionTrendChart';
import { PointsDistributionChart } from '../components/dashboard/PointsDistributionChart';

export function ReportsPage() {
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reportSummary'],
    queryFn: async () => {
      const { data } = await api.get('/api/reports/summary');
      return data;
    },
  });

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get('/api/reports/download', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Progress_Report_${data?.user?.fullName?.replace(/\s+/g, '_') || 'User'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast({
        type: 'success',
        title: 'Report Downloaded!',
        message: 'Your progress summary PDF report has been downloaded successfully.',
      });
    } catch (err: any) {
      addToast({
        type: 'warning',
        title: 'Download Failed',
        message: 'Could not generate report. Please try again.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const user = data?.user;
  const stats = data?.stats;
  const progressScore = stats?.progressScore ?? 0;
  const avatar = user?.avatar;
  const initial = (user?.fullName || '?').trim().charAt(0).toUpperCase();

  const tasksCompletedLast30Days = data?.tasksCompletedLast30Days || [];
  const pointsDistribution = data?.pointsDistribution || { high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-purple-600 dark:text-fuchsia-400" size={26} /> Progress & Analytics Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Export comprehensive summary documents of your milestones, targets, tasks, and productivity score.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || isLoading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Download PDF Report
        </button>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-cardBorder bg-rose-50 dark:bg-cardBg/80 p-6 text-rose-600 dark:text-rose-400 text-sm">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && stats && (
        <div className="space-y-6">
          {/* User Overview Banner with Profile Photo */}
          <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={user?.fullName || 'avatar'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-purple-400 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {initial}
                </div>
              )}
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600 dark:text-fuchsia-400">
                  Official Progress Candidate
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {user?.fullName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-violet-300/80 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-center">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-violet-300 block">Streak</span>
                <span className="text-base font-black text-orange-600 dark:text-orange-400 inline-flex items-center gap-1">
                  <Flame size={16} /> {stats.dailyStreak} Days
                </span>
              </div>

              <div className="px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-center">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-violet-300 block">Total Points</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <Star size={16} /> {stats.points} pts
                </span>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Progress Score Card */}
            <div className="rounded-2xl border-2 border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-indigo-500/10 dark:from-[#210d3d]/90 dark:to-[#0f0a24]/95 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-fuchsia-400">
                  Progress Score
                </span>
                <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center">
                  <Zap size={18} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {progressScore} <span className="text-sm font-semibold text-slate-500 dark:text-violet-300">/ 100</span>
              </div>
              <div className="mt-3">
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-sky-500 to-purple-600 rounded-full"
                    style={{ width: `${progressScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-purple-700 dark:text-fuchsia-300 font-bold mt-1.5 flex items-center gap-1">
                  <TrendingUp size={12} /> {progressScore >= 80 ? 'Exceptional Progress!' : progressScore >= 50 ? 'Steady Growth Track' : 'Getting Started'}
                </p>
              </div>
            </div>

            {/* Target Completion */}
            <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-violet-300">Target Progress</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-fuchsia-400 flex items-center justify-center">
                  <Target size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.completedTargets} / {stats.totalTargets}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1 font-semibold text-slate-500 dark:text-violet-300/80">
                  <span>Completion Rate</span>
                  <span>{stats.targetCompletionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full"
                    style={{ width: `${stats.targetCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Task Completion */}
            <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-violet-300">Task Completion</span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CheckSquare size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.completedTasks} / {stats.totalTasks}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1 font-semibold text-slate-500 dark:text-violet-300/80">
                  <span>Completion Rate</span>
                  <span>{stats.taskCompletionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                    style={{ width: `${stats.taskCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Productivity Standing */}
            <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-violet-300">Productivity Standing</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.points >= 500 ? 'Master' : stats.points >= 200 ? 'Pro' : 'Explorer'}
              </div>
              <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-3 flex items-center gap-1 font-medium">
                <TrendingUp size={13} className="text-emerald-500" /> Continuous activity tracked
              </p>
            </div>

            {/* Study Notes */}
            <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-violet-300">Notes Documented</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-fuchsia-400 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.notesCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-3">Study and reference guides</p>
            </div>

            {/* Enrolled Courses */}
            <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-violet-300">Enrolled Courses</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <GraduationCap size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.coursesCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-3">Organized by semester tracks</p>
            </div>
          </div>

          {/* ─── Trend + Points distribution charts ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
      )}
    </div>
  );
}
