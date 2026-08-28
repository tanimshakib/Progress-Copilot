import cron from 'node-cron';
import { prisma } from '../lib/prisma';

/**
 * Executes all daily penalty checks:
 * 1. Missed Deadline (Tasks & Targets overdue & incomplete)
 * 2. Inactivity (No completed task for >= 3 days)
 * 3. Streak Break (No completed task for >= 3 days -> dailyStreak reset to 0)
 */
export async function runPenaltyCheck() {
  console.log('[penaltyCron] Starting daily penalty and inactivity check...');
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let totalPenalizedTasks = 0;
  let totalPenalizedTargets = 0;
  let totalInactivityPenalties = 0;
  let totalStreakBreaks = 0;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Missed Deadline — Tasks
    // ─────────────────────────────────────────────────────────────────────────
    const overdueTasks = await prisma.task.findMany({
      where: {
        deadline: { lt: now },
        isCompleted: false,
        isPenalized: false,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        priority: true,
      },
    });

    for (const task of overdueTasks) {
      const penaltyAmount = task.priority === 'HIGH' ? 5 : 2;

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: task.userId },
          select: { points: true, weeklyPoints: true },
        });

        if (user) {
          const newPoints = Math.max(0, user.points - penaltyAmount);
          const newWeeklyPoints = Math.max(0, user.weeklyPoints - penaltyAmount);

          await tx.user.update({
            where: { id: task.userId },
            data: { points: newPoints, weeklyPoints: newWeeklyPoints },
          });

          await tx.task.update({
            where: { id: task.id },
            data: { isPenalized: true },
          });

          await tx.notification.create({
            data: {
              userId: task.userId,
              title: 'Overdue Task Penalty',
              message: `⚠️ You lost ${penaltyAmount} points for an overdue task: "${task.title}"`,
              type: 'PENALTY',
            },
          });
        }
      });
      totalPenalizedTasks++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Missed Deadline — Targets
    // ─────────────────────────────────────────────────────────────────────────
    const overdueTargets = await prisma.target.findMany({
      where: {
        deadline: { lt: now },
        status: 'INCOMPLETE',
        isPenalized: false,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        priority: true,
      },
    });

    for (const target of overdueTargets) {
      const penaltyAmount = target.priority === 'HIGH' ? 5 : 2;

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: target.userId },
          select: { points: true, weeklyPoints: true },
        });

        if (user) {
          const newPoints = Math.max(0, user.points - penaltyAmount);
          const newWeeklyPoints = Math.max(0, user.weeklyPoints - penaltyAmount);

          await tx.user.update({
            where: { id: target.userId },
            data: { points: newPoints, weeklyPoints: newWeeklyPoints },
          });

          await tx.target.update({
            where: { id: target.id },
            data: { isPenalized: true },
          });

          await tx.notification.create({
            data: {
              userId: target.userId,
              title: 'Overdue Target Penalty',
              message: `⚠️ You lost ${penaltyAmount} points for an overdue target: "${target.title}"`,
              type: 'PENALTY',
            },
          });
        }
      });
      totalPenalizedTargets++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2 & 3. Inactivity & Streak Break per User
    // ─────────────────────────────────────────────────────────────────────────
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        points: true,
        weeklyPoints: true,
        dailyStreak: true,
        lastTaskCompleteDate: true,
        createdAt: true,
      },
    });

    for (const user of allUsers) {
      const referenceDate = user.lastTaskCompleteDate || user.createdAt;
      const startOfRefDate = new Date(
        Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()),
      );

      const daysDiff = Math.floor((startOfToday.getTime() - startOfRefDate.getTime()) / (1000 * 60 * 60 * 24));

      // Penalty 3: Streak Break
      // Reset streak if user has been inactive for >= 3 days
      if (daysDiff >= 3 && user.dailyStreak > 0) {
        const oldStreak = user.dailyStreak;
        await prisma.user.update({
          where: { id: user.id },
          data: { dailyStreak: 0 },
        });

        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Streak Lost',
            message: `⚠️ Your daily streak of ${oldStreak} ${oldStreak === 1 ? 'day' : 'days'} was reset to 0 due to 3 days of inactivity.`,
            type: 'STREAK_BREAK',
          },
        });
        totalStreakBreaks++;
      }

      // Penalty 2: Inactivity
      // If difference from today is >= 3 days, deduct 1 point per day of inactivity
      if (daysDiff >= 3) {
        const currentPoints = user.points;
        const currentWeekly = user.weeklyPoints;
        if (currentPoints > 0 || currentWeekly > 0) {
          const newPoints = Math.max(0, currentPoints - 1);
          const newWeeklyPoints = Math.max(0, currentWeekly - 1);

          await prisma.user.update({
            where: { id: user.id },
            data: { points: newPoints, weeklyPoints: newWeeklyPoints },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Inactivity Penalty',
              message: `⚠️ You lost 1 point due to ${daysDiff} days of inactivity. Complete a task today to stay active!`,
              type: 'INACTIVITY',
            },
          });
          totalInactivityPenalties++;
        }
      }
    }

    console.log(
      `[penaltyCron] Complete. Overdue Tasks: ${totalPenalizedTasks}, Overdue Targets: ${totalPenalizedTargets}, Inactivity Penalties: ${totalInactivityPenalties}, Streak Reset Users: ${totalStreakBreaks}`,
    );
    return {
      totalPenalizedTasks,
      totalPenalizedTargets,
      totalInactivityPenalties,
      totalStreakBreaks,
    };
  } catch (error) {
    console.error('[penaltyCron] Error during penalty check:', error);
    throw error;
  }
}

/**
 * Initializes daily midnight cron job ('0 0 * * *')
 */
export function initPenaltyCron() {
  // Cron schedule: At 00:00 (midnight) every day
  cron.schedule('0 0 * * *', async () => {
    try {
      await runPenaltyCheck();
    } catch (err) {
      console.error('[penaltyCron] Midnight cron execution failed:', err);
    }
  });

  console.log('[penaltyCron] Daily midnight penalty cron job scheduled.');
}
