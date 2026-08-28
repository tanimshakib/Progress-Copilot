import { prisma } from '../../lib/prisma';
import { getTargetsWithProgress } from '../targets/targets.service';
import { unauthorized } from '../../lib/errors';

const DASHBOARD_DAY_LIMIT = 4;
const CONTRIBUTION_DAYS = 365;
const TREND_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isoDate(d: Date): string {
  return startOfUTCDay(d).toISOString().slice(0, 10);
}

export function calculateProgressScore(
  completedTargets: number,
  totalTargets: number,
  completedTasks: number,
  totalTasks: number,
  streak: number,
): number {
  if (totalTargets === 0 && totalTasks === 0 && streak === 0) return 0;
  const targetScore = totalTargets > 0 ? (completedTargets / totalTargets) * 40 : 20;
  const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 35 : 15;
  const streakScore = Math.min(streak * 5, 25);
  return Math.min(100, Math.max(0, Math.round(targetScore + taskScore + streakScore)));
}

export type ProductivityBreakdown = {
  completionScore: number; // max 50
  priorityScore: number; // max 30
  consistencyScore: number; // max 20
  totalTasks: number;
  completedTasks: number;
  completionRate: number; // 0-100%
  highPriorityTotal: number;
  highPriorityCompleted: number;
  highPriorityRate: number; // 0-100%
  dailyStreak: number;
};

export function calculateProductivityScore(
  tasks: { isCompleted: boolean; priority: string }[],
  streak: number,
): { productivityScore: number; scoreBreakdown: ProductivityBreakdown } {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  // 1. Completion Rate (50% weight, max 50 pts)
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 1;
  const completionScore = Math.min(50, Math.round(completionRate * 50));

  // 2. Priority Focus (30% weight, max 30 pts)
  const highTasks = tasks.filter((t) => t.priority === 'HIGH');
  const highTotal = highTasks.length;
  const highCompleted = highTasks.filter((t) => t.isCompleted).length;

  let priorityRate = 1;
  let priorityScore = 30;

  if (highTotal > 0) {
    priorityRate = highCompleted / highTotal;
    priorityScore = Math.min(30, Math.round(priorityRate * 30));
  } else if (totalTasks > 0) {
    priorityRate = completionRate;
    priorityScore = Math.min(30, Math.round(completionRate * 30));
  }

  // 3. Consistency (20% weight, max 20 pts)
  const consistencyScore = Math.min(20, Math.round((streak / 7) * 20));

  const totalScore = Math.min(100, Math.max(0, completionScore + priorityScore + consistencyScore));

  const scoreBreakdown: ProductivityBreakdown = {
    completionScore,
    priorityScore,
    consistencyScore,
    totalTasks,
    completedTasks,
    completionRate: Math.round(completionRate * 100),
    highPriorityTotal: highTotal,
    highPriorityCompleted: highCompleted,
    highPriorityRate: Math.round(priorityRate * 100),
    dailyStreak: streak,
  };

  return {
    productivityScore: totalScore,
    scoreBreakdown,
  };
}

/* ───────────────────────────── /api/dashboard ───────────────────────────── */

export async function getDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
      role: true,
      experience: true,
      aiBio: true,
      points: true,
      dailyStreak: true,
      createdAt: true,
    },
  });
  if (!user) throw unauthorized('User not found');

  // ── 1. Top 4 active targets (with completed backfill if < 4)
  const allTargets = await getTargetsWithProgress(userId);
  const completedTargetsCount = allTargets.filter((t) => t.status === 'COMPLETED').length;
  const incompleteTargets = allTargets.filter((t) => t.status === 'INCOMPLETE');
  let topTargets = incompleteTargets.slice(0, DASHBOARD_DAY_LIMIT);
  if (topTargets.length < DASHBOARD_DAY_LIMIT) {
    const needed = DASHBOARD_DAY_LIMIT - topTargets.length;
    const completedTargets = allTargets.filter((t) => t.status === 'COMPLETED');
    topTargets = [...topTargets, ...completedTargets.slice(0, needed)];
  }

  // ── 2. All Tasks: Fetch minimum 4 tasks (both standalone and target subtasks)
  // Show incomplete tasks first. If fewer than 4 incomplete, backfill with completed tasks
  const allUserTasks = await prisma.task.findMany({
    where: { userId },
    select: { id: true, isCompleted: true, priority: true },
  });
  const completedTasksCount = allUserTasks.filter((t) => t.isCompleted).length;
  void completedTasksCount;

  const incompleteTasks = await prisma.task.findMany({
    where: { userId, isCompleted: false },
    include: {
      target: {
        select: { id: true, title: true, deadline: true, status: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: DASHBOARD_DAY_LIMIT,
  });

  let dashboardTasks = [...incompleteTasks];
  if (dashboardTasks.length < DASHBOARD_DAY_LIMIT) {
    const needed = DASHBOARD_DAY_LIMIT - dashboardTasks.length;
    const completedTasks = await prisma.task.findMany({
      where: { userId, isCompleted: true },
      include: {
        target: {
          select: { id: true, title: true, deadline: true, status: true },
        },
      },
      orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
      take: needed,
    });
    dashboardTasks = [...dashboardTasks, ...completedTasks];
  }

  // ── 3. Upcoming reminders
  const now = new Date();
  const upcomingReminders = await prisma.reminder.findMany({
    where: { userId, isSent: false },
    include: {
      target: { select: { id: true, title: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: [{ time: 'asc' }],
    take: DASHBOARD_DAY_LIMIT,
  });

  // ── 4. GitHub Projects connection
  const githubMatch = user.aiBio?.match(/github:([a-zA-Z0-9_-]+)/);
  const projects = {
    githubConnected: !!githubMatch,
    username: githubMatch ? githubMatch[1] : null,
  };

  // ── 5. Recent Notes & Courses
  const recentNotes = await prisma.note.findMany({
    where: { userId },
    orderBy: [{ updatedAt: 'desc' }],
    take: 3,
  });

  const recentCourses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }],
    take: 3,
  });

  const coursesCount = await prisma.course.count({ where: { userId } });
  const completedCoursesCount = await prisma.course.count({ where: { userId, isCompleted: true } });

  // ── 6. 365-day contribution grid (realtime sync with completed tasks + streak)
  const since = startOfUTCDay(
    new Date(now.getTime() - (CONTRIBUTION_DAYS - 1) * DAY_MS),
  );
  const completions = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: true,
    },
    select: { completedAt: true, updatedAt: true },
  });

  const counts = new Map<string, number>();
  for (const c of completions) {
    const dateToUse = c.completedAt || c.updatedAt;
    if (!dateToUse) continue;
    const key = isoDate(dateToUse);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // If user has an active streak today, ensure today is active
  if (user.dailyStreak > 0) {
    const todayKey = isoDate(now);
    if (!counts.has(todayKey) || counts.get(todayKey) === 0) {
      counts.set(todayKey, 1);
    }
  }

  const cells: { date: string; count: number }[] = [];
  for (let i = 0; i < CONTRIBUTION_DAYS; i++) {
    const d = new Date(since.getTime() + i * DAY_MS);
    const key = isoDate(d);
    cells.push({ date: key, count: counts.get(key) ?? 0 });
  }

  const progressScoreVal = calculateProgressScore(
    completedTargetsCount,
    allTargets.length,
    completedTasksCount,
    allUserTasks.length,
    user.dailyStreak,
  );

  const { productivityScore, scoreBreakdown } = calculateProductivityScore(
    allUserTasks,
    user.dailyStreak,
  );

  return {
    user: {
      ...user,
      progressScore: progressScoreVal,
      productivityScore,
      scoreBreakdown,
    },
    topTargets,
    pendingTasks: dashboardTasks,
    upcomingReminders,
    projects,
    recentNotes,
    recentCourses,
    coursesCount,
    completedCoursesCount,
    contributionGrid: {
      days: CONTRIBUTION_DAYS,
      cells,
    },
  };
}

/* ──────────────────────────── /api/progress ─────────────────────────────── */

export async function getProgress(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
      role: true,
      experience: true,
      points: true,
      dailyStreak: true,
    },
  });
  if (!user) throw unauthorized('User not found');

  const targetBreakdown = await getTargetsWithProgress(userId);
  const completedTargetsCount = targetBreakdown.filter((t) => t.status === 'COMPLETED').length;

  const allUserTasks = await prisma.task.findMany({
    where: { userId },
    select: { id: true, isCompleted: true, priority: true, targetId: true },
  });
  const completedTasksCount = allUserTasks.filter((t) => t.isCompleted).length;

  // ── 30-day completion trend
  const now = new Date();
  const trendStart = startOfUTCDay(
    new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS),
  );
  const trendCompletions = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: true,
    },
    select: { completedAt: true, updatedAt: true },
  });

  const trendCounts = new Map<string, number>();
  for (const c of trendCompletions) {
    const dateToUse = c.completedAt || c.updatedAt;
    if (!dateToUse) continue;
    const key = isoDate(dateToUse);
    trendCounts.set(key, (trendCounts.get(key) ?? 0) + 1);
  }

  const tasksCompletedLast30Days: { date: string; count: number }[] = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart.getTime() + i * DAY_MS);
    const key = isoDate(d);
    tasksCompletedLast30Days.push({
      date: key,
      count: trendCounts.get(key) ?? 0,
    });
  }

  // ── Points distribution
  const pointsDistribution = { high: 0, medium: 0, low: 0 };
  for (const t of allUserTasks.filter((t) => t.isCompleted)) {
    const earned = t.targetId
      ? t.priority === 'HIGH'
        ? 5
        : t.priority === 'MEDIUM'
          ? 4
          : 3
      : 2;
    if (t.priority === 'HIGH') pointsDistribution.high += earned;
    else if (t.priority === 'MEDIUM') pointsDistribution.medium += earned;
    else pointsDistribution.low += earned;
  }

  const progressScoreVal = calculateProgressScore(
    completedTargetsCount,
    targetBreakdown.length,
    completedTasksCount,
    allUserTasks.length,
    user.dailyStreak,
  );

  const { productivityScore, scoreBreakdown } = calculateProductivityScore(
    allUserTasks,
    user.dailyStreak,
  );

  return {
    user: {
      ...user,
      progressScore: progressScoreVal,
      productivityScore,
      scoreBreakdown,
    },
    targetBreakdown,
    tasksCompletedLast30Days,
    pointsDistribution,
  };
}
