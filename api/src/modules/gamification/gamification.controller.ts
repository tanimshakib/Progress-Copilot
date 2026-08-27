import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * POST /api/gamification/pomodoro
 *
 * Awards +2 points for every completed 25-minute Pomodoro focus session.
 * Also bumps the user's daily streak if this is their first completed activity today.
 */
export const recordPomodoroSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  if (!userId) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const POINTS_PER_POMODORO = 2;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        points: true,
        dailyStreak: true,
        lastTaskCompleteDate: true,
      },
    });

    if (!user) throw notFound('User not found');

    const today = startOfUTCDay(new Date());
    const lastDay = user.lastTaskCompleteDate
      ? startOfUTCDay(user.lastTaskCompleteDate)
      : null;
    const crossed = !lastDay || lastDay.getTime() !== today.getTime();

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        points: { increment: POINTS_PER_POMODORO },
        ...(crossed
          ? {
              dailyStreak: { increment: 1 },
              lastTaskCompleteDate: today,
            }
          : {}),
      },
      select: {
        id: true,
        points: true,
        dailyStreak: true,
      },
    });

    return { updatedUser, crossed };
  });

  return res.json({
    ok: true,
    pointsAwarded: POINTS_PER_POMODORO,
    points: result.updatedUser.points,
    dailyStreak: result.updatedUser.dailyStreak,
    streakBumped: result.crossed,
  });
});
