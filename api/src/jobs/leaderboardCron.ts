import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import type { League } from '@prisma/client';

const LEAGUE_ORDER: League[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

function getNextLeague(current: League): League | null {
  const index = LEAGUE_ORDER.indexOf(current);
  if (index >= 0 && index < LEAGUE_ORDER.length - 1) {
    return LEAGUE_ORDER[index + 1];
  }
  return null;
}

function getPreviousLeague(current: League): League | null {
  const index = LEAGUE_ORDER.indexOf(current);
  if (index > 0) {
    return LEAGUE_ORDER[index - 1];
  }
  return null;
}

/**
 * Executes weekly league promotions, demotions, and resets weeklyPoints to 0.
 */
export async function runWeeklyLeaderboardReset() {
  console.log('[leaderboardCron] Starting weekly league evaluation & reset...');

  let totalPromotions = 0;
  let totalDemotions = 0;

  try {
    for (const league of LEAGUE_ORDER) {
      const usersInLeague = await prisma.user.findMany({
        where: { league },
        orderBy: [{ weeklyPoints: 'desc' }, { points: 'desc' }],
        select: { id: true, fullName: true, league: true, weeklyPoints: true },
      });

      const count = usersInLeague.length;
      if (count === 0) continue;

      // Top 20% promoted (minimum 1 if count >= 3)
      const promoteCount = Math.floor(count * 0.2);
      // Bottom 10% demoted
      const demoteCount = Math.floor(count * 0.1);

      const nextLeague = getNextLeague(league);
      const prevLeague = getPreviousLeague(league);

      // Promoted users (top slice)
      if (nextLeague && promoteCount > 0) {
        const toPromote = usersInLeague.slice(0, promoteCount);
        for (const user of toPromote) {
          await prisma.user.update({
            where: { id: user.id },
            data: { league: nextLeague },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'League Promotion! 🎉',
              message: `Congratulations! You scored ${user.weeklyPoints} points this week and were promoted to the ${nextLeague} League!`,
              type: 'SYSTEM',
            },
          });
          totalPromotions++;
        }
      }

      // Demoted users (bottom slice)
      if (prevLeague && demoteCount > 0) {
        const toDemote = usersInLeague.slice(count - demoteCount);
        for (const user of toDemote) {
          await prisma.user.update({
            where: { id: user.id },
            data: { league: prevLeague },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'League Demotion Alert ⚠️',
              message: `You were moved down to the ${prevLeague} League this week. Keep completing tasks to climb back up!`,
              type: 'SYSTEM',
            },
          });
          totalDemotions++;
        }
      }
    }

    // Reset ALL users' weeklyPoints to 0
    await prisma.user.updateMany({
      data: { weeklyPoints: 0 },
    });

    console.log(
      `[leaderboardCron] Weekly evaluation completed. Promotions: ${totalPromotions}, Demotions: ${totalDemotions}`,
    );

    return { totalPromotions, totalDemotions };
  } catch (error) {
    console.error('[leaderboardCron] Error during weekly reset:', error);
    throw error;
  }
}

/**
 * Initializes weekly midnight cron job (Runs every Sunday at 00:00 - '0 0 * * 0')
 */
export function initLeaderboardCron() {
  cron.schedule('0 0 * * 0', async () => {
    try {
      await runWeeklyLeaderboardReset();
    } catch (err) {
      console.error('[leaderboardCron] Sunday cron execution failed:', err);
    }
  });

  console.log('[leaderboardCron] Weekly Sunday midnight leaderboard cron job scheduled.');
}
