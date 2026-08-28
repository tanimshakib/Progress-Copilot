import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  GraduationCap,
  Clock,
  ExternalLink,
  Flame,
  Star,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../modules/dashboard/useDashboard';
import { useTasks } from '../modules/tasks/useTasks';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { ContributionGrid } from '../components/dashboard/ContributionGrid';
import { ProgressScore, ProductivityScore } from '../components/dashboard/ProductivityScore';
import { TargetProgressBars } from '../components/dashboard/TargetProgressBars';
import type { Task } from '../lib/types';
import { getErrorMessage } from '../lib/api';

function GithubIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}


export function DashboardHomePage() {
  const { user, refresh } = useAuth();
  const { data, loading, error, reload } = useDashboard();
  const { toggle } = useTasks();

  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [strikeOverrides, setStrikeOverrides] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggle = async (task: Task) => {
    const next = !task.isCompleted;
    setPendingToggles((s) => new Set(s).add(task.id));
    setStrikeOverrides((m) => ({ ...m, [task.id]: next }));
    setToggleError(null);
    try {
      await toggle(task.id, next);
      await refresh();
      await reload();
    } catch (e) {
      setStrikeOverrides((m) => {
        const c = { ...m };
        delete c[task.id];
        return c;
      });
      setToggleError(getErrorMessage(e, 'Failed to update task'));
    } finally {
      setPendingToggles((s) => {
        const c = new Set(s);
        c.delete(task.id);
        return c;
      });
    }
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <DashboardCard title="Dashboard">
        <p className="text-rose-400 text-sm">{error}</p>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const {
    user: dashUser,
    topTargets,
    pendingTasks = [],
    upcomingReminders = [],
    projects,
    recentNotes = [],
    recentCourses = [],
    coursesCount = 0,
    completedCoursesCount = 0,
    contributionGrid,
  } = data as any;

  const activeDays = contributionGrid.cells.filter((c: any) => c.count > 0).length;
  const progressScoreVal = dashUser.progressScore ?? dashUser.productivityScore ?? 0;
  const avatar = user?.avatar || dashUser.avatar;
  const initial = (user?.fullName || dashUser.fullName || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* ─── Premium Profile & Progress Score Banner (Reports-style) ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 shadow-md flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 xl:gap-32">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {avatar ? (
            <img
              src={avatar}
              alt={user?.fullName || dashUser.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-purple-400 shadow-md shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
              {initial}
            </div>
          )}
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600 dark:text-fuchsia-400">
              {dashUser.role || 'Official Progress Candidate'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {user?.fullName || dashUser.fullName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-violet-300/80 mt-0.5 font-medium">
              {user?.email || dashUser.email}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-center">
                <span className="text-xs font-black text-orange-600 dark:text-orange-400 inline-flex items-center gap-1">
                  <Flame size={14} /> {dashUser.dailyStreak} Days Streak
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-center">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <Star size={14} /> {dashUser.points} Points
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Progress Score (Old Ring) ─── */}
        <div className="flex items-center gap-4 bg-white/70 dark:bg-white/[0.03] p-4 rounded-2xl border border-purple-200/60 dark:border-white/10 shadow-sm shrink-0">
          <ProgressScore
            score={progressScoreVal}
            subtitle={`${dashUser.points} pts earned`}
          >
            <div className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-fuchsia-400 flex items-center gap-1">
              <Zap size={14} /> Progress Score
            </div>
            <div className="text-xs text-slate-600 dark:text-violet-200 mt-0.5 font-medium">
              {progressScoreVal >= 80 ? 'Mastery Pace' : progressScoreVal >= 50 ? 'Steady Growth' : 'Getting Started'}
            </div>
          </ProgressScore>
        </div>
      </div>

      {/* ─── Productivity Score (100-Point Gauge) ─── */}
      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-fuchsia-500/5 via-purple-500/5 to-indigo-500/5 dark:from-[#210d3d]/60 dark:to-[#0f0a24]/80 p-6 lg:px-12 xl:px-16 shadow-sm">
        <div className="max-w-4xl mx-auto w-full">
          <ProductivityScore
            score={dashUser.productivityScore ?? 0}
            breakdown={dashUser.scoreBreakdown}
            subtitle={`${dashUser.points} total pts earned`}
          >
            <div className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-fuchsia-400 flex items-center gap-1">
              <Zap size={14} /> Productivity Score
            </div>
            <div className="text-xs text-slate-600 dark:text-violet-200 mt-0.5 font-medium">
              Completion (50%) + Priority (30%) + Streak (20%)
            </div>
          </ProductivityScore>
        </div>
      </div>

      {/* ─── Active Targets ─── */}
      <DashboardCard
        title="Active Targets"
        subtitle="Key milestones & sub-task progress."
        action={
          <Link
            to="/dashboard/targets"
            className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline transition"
          >
            View all →
          </Link>
        }
      >
        <TargetProgressBars
          targets={topTargets}
          emptyMessage="No active targets. Create one to start tracking."
        />
      </DashboardCard>

      {/* ─── Recent Tasks ─── */}
      <DashboardCard
        title="Recent Tasks"
        subtitle="Recent standalone and target sub-tasks."
        action={
          <Link
            to="/dashboard/tasks"
            className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline transition"
          >
            View all tasks →
          </Link>
        }
      >
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-violet-300/70 italic py-4">
            No tasks found. Create a task in the Tasks section!
          </p>
        ) : (
          <ul className="space-y-2">
            {pendingTasks.map((t: Task) => {
              const strikethrough = strikeOverrides[t.id] ?? t.isCompleted;
              const busy = pendingToggles.has(t.id);
              return (
                <li
                  key={t.id}
                  className={`flex items-center justify-between gap-3 rounded-xl p-2.5 border transition ${
                    strikethrough
                      ? 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 opacity-70'
                      : 'bg-slate-50/80 dark:bg-white/[0.02] border-purple-200/50 dark:border-white/5 hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(t)}
                      disabled={busy}
                      aria-label={strikethrough ? 'Mark as not done' : 'Mark as done'}
                      className={
                        'h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center transition-all cursor-pointer ' +
                        (strikethrough
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'border-slate-400 dark:border-white/30 hover:border-emerald-400') +
                        (busy ? ' opacity-50' : '')
                      }
                    >
                      {strikethrough && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="w-3 h-3 text-white"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-sm font-semibold truncate ${
                        strikethrough
                          ? 'line-through text-slate-400 dark:text-violet-300/40'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      strikethrough
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {strikethrough ? 'Completed' : 'Pending'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {toggleError && (
          <p className="text-xs text-rose-500 mt-2">{toggleError}</p>
        )}
      </DashboardCard>

      {/* ─── Reminders + GitHub Projects strip ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Upcoming Reminders"
          subtitle="Scheduled target & task alerts."
          action={
            <Link
              to="/dashboard/reminders"
              className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline transition"
            >
              Manage Reminders →
            </Link>
          }
        >
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-violet-300/70 italic py-2">
              No pending reminders scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingReminders.map((r: any) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl p-2.5 bg-slate-50/80 dark:bg-white/[0.02] border border-purple-200/50 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-700 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
                      <Bell size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {r.target?.title ?? r.task?.title ?? 'Reminder'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-violet-300/70 flex items-center gap-1">
                        <Clock size={11} /> {new Date(r.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="GitHub Integration"
          subtitle="Real-time repositories and contributions."
          action={
            <Link
              to="/dashboard/projects"
              className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline transition"
            >
              {projects.githubConnected ? 'View Projects →' : 'Connect GitHub →'}
            </Link>
          }
        >
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <GithubIcon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {projects.githubConnected ? `@${projects.username}` : 'GitHub Not Connected'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-violet-300/70">
                  {projects.githubConnected ? 'Live sync & contribution tracking active' : 'Connect to track repos & commits'}
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/projects"
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold shadow hover:bg-purple-500 transition"
            >
              {projects.githubConnected ? 'Explore' : 'Connect'}
            </Link>
          </div>
        </DashboardCard>
      </div>

      {/* ─── Courses & Notes Overview strip ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <DashboardCard
          title={`Enrolled Courses (${completedCoursesCount}/${coursesCount})`}
          subtitle="Semester tracks and learning materials."
          action={
            <Link
              to="/dashboard/courses"
              className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline transition"
            >
              All Courses →
            </Link>
          }
        >
          {recentCourses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-violet-300/70 italic py-2">
              No courses added yet. Add your curriculum courses to track them.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentCourses.map((c: any) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl p-2.5 bg-slate-50/80 dark:bg-white/[0.02] border border-purple-200/50 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <GraduationCap size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-violet-300/70 font-semibold">{c.semester || 'Course'}</p>
                    </div>
                  </div>
                  {c.resourceLink && (
                    <a
                      href={c.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-purple-600 dark:text-fuchsia-400 hover:bg-purple-500/10 transition"
                      title="Open Resource"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {/* Recent Notes */}
        <DashboardCard
          title="Recent Study Notes"
          subtitle="Quick notes, code snippets and guides."
          action={
            <Link
              to="/dashboard/notes"
              className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline transition"
            >
              All Notes →
            </Link>
          }
        >
          {recentNotes.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-violet-300/70 italic py-2">
              No notes saved yet. Capture thoughts in the Notes section.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentNotes.map((n: any) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-3 rounded-xl p-2.5 bg-slate-50/80 dark:bg-white/[0.02] border border-purple-200/50 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
                      <BookOpen size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-violet-300/70 truncate">{n.content?.slice(0, 40) || 'Study note'}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard/notes"
                    className="text-xs font-bold text-purple-600 dark:text-fuchsia-400 hover:underline shrink-0"
                  >
                    Read →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      {/* ─── Realtime Streak + Centered Activity Calendar ─────────────────────────── */}
      <DashboardCard
        title={`Daily Streak & Activity Calendar (${activeDays} ${activeDays === 1 ? 'Day' : 'Days'} Active)`}
        subtitle="Real-time 365-day task completions and streak consistency."
      >
        <ContributionGrid cells={contributionGrid.cells} />
      </DashboardCard>
    </div>
  );
}

function DashboardSkeleton() {
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