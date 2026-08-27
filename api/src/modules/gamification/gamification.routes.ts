import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './gamification.controller';

const router = Router();

router.post('/pomodoro', authRequired, controller.recordPomodoroSession);

export default router;
