import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';
import { runWeeklyLeaderboardReset } from '../../jobs/leaderboardCron';
import type { League } from '@prisma/client';

const VALID_LEAGUES: League[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

/**
 * GET /api/leaderboard?league=BRONZE
 * Retrieves leaderboard entries for a given league (or user's current league),
 * filtering out users with isLeaderboardVisible === false.
 */
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = (req as any).user?.id as string;

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      league: true,
      points: true,
      weeklyPoints: true,
      dailyStreak: true,
      isLeaderboardVisible: true,
    },
  });
  if (!currentUser) throw notFound('User not found');

  let selectedLeague: League = currentUser.league;
  if (req.query.league) {
    const paramLeague = (req.query.league as string).toUpperCase() as League;
    if (VALID_LEAGUES.includes(paramLeague)) {
      selectedLeague = paramLeague;
    } else {
      throw badRequest(`Invalid league. Valid options: ${VALID_LEAGUES.join(', ')}`);
    }
  }

  // Fetch all users in selected league ordered by weeklyPoints DESC, then lifetime points DESC
  const allLeagueUsers = await prisma.user.findMany({
    where: {
      league: selectedLeague,
    },
    orderBy: [{ weeklyPoints: 'desc' }, { points: 'desc' }],
    select: {
      id: true,
      fullName: true,
      avatar: true,
      points: true,
      weeklyPoints: true,
      dailyStreak: true,
      league: true,
      isLeaderboardVisible: true,
    },
  });

  // Calculate current user rank in their actual league
  let currentUserRank = 0;
  if (selectedLeague === currentUser.league) {
    const userIndex = allLeagueUsers.findIndex((u) => u.id === currentUserId);
    currentUserRank = userIndex >= 0 ? userIndex + 1 : 0;
  } else {
    // If viewing another league, get rank in user's home league
    const homeLeagueUsers = await prisma.user.findMany({
      where: { league: currentUser.league },
      orderBy: [{ weeklyPoints: 'desc' }, { points: 'desc' }],
      select: { id: true },
    });
    const userIndex = homeLeagueUsers.findIndex((u) => u.id === currentUserId);
    currentUserRank = userIndex >= 0 ? userIndex + 1 : 0;
  }

  // Filter for public display: only users where isLeaderboardVisible === true (OR current user)
  const visibleUsers = allLeagueUsers
    .filter((u) => u.isLeaderboardVisible || u.id === currentUserId)
    .map((u, idx) => ({
      id: u.id,
      fullName: u.fullName,
      avatar: u.avatar,
      points: u.points,
      weeklyPoints: u.weeklyPoints,
      dailyStreak: u.dailyStreak,
      league: u.league,
      rank: idx + 1,
      isCurrentUser: u.id === currentUserId,
    }));

  return res.json({
    league: selectedLeague,
    availableLeagues: VALID_LEAGUES,
    leaderboard: visibleUsers,
    currentUser: {
      id: currentUser.id,
      league: currentUser.league,
      rank: currentUserRank,
      points: currentUser.points,
      weeklyPoints: currentUser.weeklyPoints,
      dailyStreak: currentUser.dailyStreak,
      isLeaderboardVisible: currentUser.isLeaderboardVisible,
    },
  });
});

/**
 * POST /api/leaderboard/trigger-cron
 * Manual trigger for testing weekly league promotions, demotions & reset.
 */
export const triggerLeaderboardCron = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await runWeeklyLeaderboardReset();
  return res.json({ ok: true, message: 'Weekly leaderboard reset executed successfully', summary });
});
