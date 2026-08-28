import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { getLeaderboard, triggerLeaderboardCron } from './leaderboard.controller';

const router = Router();

router.use(authRequired);

router.get('/', getLeaderboard);
router.post('/trigger-cron', triggerLeaderboardCron);

export default router;
