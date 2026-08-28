import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  triggerPenaltyCron,
} from './notifications.controller';

const router = Router();

router.use(authRequired);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);
router.post('/trigger-cron', triggerPenaltyCron);

export default router;
