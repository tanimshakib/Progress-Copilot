import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { runPenaltyCheck } from '../../jobs/penaltyCron';

/**
 * GET /api/notifications
 * List notifications for the authenticated user
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return res.json({ notifications, unreadCount });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;

  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) throw notFound('Notification not found');

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return res.json({ ok: true, notification });
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return res.json({ ok: true });
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;

  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) throw notFound('Notification not found');

  await prisma.notification.delete({ where: { id } });
  return res.json({ ok: true });
});

/**
 * DELETE /api/notifications
 * Clear all notifications for current user
 */
export const clearAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  await prisma.notification.deleteMany({
    where: { userId },
  });

  return res.json({ ok: true });
});

/**
 * POST /api/notifications/trigger-cron
 * Manual trigger for penalty & inactivity cron job (for testing & admin)
 */
export const triggerPenaltyCron = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await runPenaltyCheck();
  return res.json({ ok: true, message: 'Penalty cron executed successfully', summary });
});
