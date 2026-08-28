import type { Request } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { badRequest, notFound, unauthorized } from '../../lib/errors';

export const getSettings = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      theme: true,
      timezone: true,
      pushNotifications: true,
      emailNotifications: true,
      reminderSound: true,
      isLeaderboardVisible: true,
      aiBio: true,
    },
  });
  if (!user) throw notFound('User not found');

  const githubMatch = user.aiBio?.match(/github:([a-zA-Z0-9_-]+)/);
  const githubConnected = !!githubMatch;
  const githubHandle = githubMatch ? githubMatch[1] : null;

  return res.json({
    settings: {
      theme: user.theme || 'light',
      timezone: user.timezone || 'UTC',
      pushNotifications: user.pushNotifications ?? true,
      emailNotifications: user.emailNotifications ?? true,
      reminderSound: user.reminderSound ?? true,
      isLeaderboardVisible: user.isLeaderboardVisible ?? true,
      githubConnected,
      githubHandle,
    },
  });
});

export const updateSettings = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const {
    theme,
    timezone,
    pushNotifications,
    emailNotifications,
    reminderSound,
    isLeaderboardVisible,
  } = req.body;

  const dataToUpdate: any = {};
  if (theme !== undefined) dataToUpdate.theme = theme;
  if (timezone !== undefined) dataToUpdate.timezone = timezone;
  if (pushNotifications !== undefined) dataToUpdate.pushNotifications = Boolean(pushNotifications);
  if (emailNotifications !== undefined) dataToUpdate.emailNotifications = Boolean(emailNotifications);
  if (reminderSound !== undefined) dataToUpdate.reminderSound = Boolean(reminderSound);
  if (isLeaderboardVisible !== undefined) dataToUpdate.isLeaderboardVisible = Boolean(isLeaderboardVisible);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      theme: true,
      timezone: true,
      pushNotifications: true,
      emailNotifications: true,
      reminderSound: true,
      isLeaderboardVisible: true,
      aiBio: true,
    },
  });

  const githubMatch = updated.aiBio?.match(/github:([a-zA-Z0-9_-]+)/);
  return res.json({
    ok: true,
    settings: {
      theme: updated.theme,
      timezone: updated.timezone,
      pushNotifications: updated.pushNotifications,
      emailNotifications: updated.emailNotifications,
      reminderSound: updated.reminderSound,
      isLeaderboardVisible: updated.isLeaderboardVisible,
      githubConnected: !!githubMatch,
      githubHandle: githubMatch ? githubMatch[1] : null,
    },
  });
});

export const disconnectGitHub = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');

  let aiBio = user.aiBio || '';
  if (aiBio.includes('github:')) {
    aiBio = aiBio.replace(/github:[a-zA-Z0-9_-]+/, '').trim();
    await prisma.user.update({
      where: { id: userId },
      data: { aiBio },
    });
  }

  return res.json({ ok: true });
});

export const exportUserData = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      futureGoal: true,
      targets: {
        include: {
          tasks: true,
          reminders: true,
        },
      },
      tasks: true,
      notes: true,
      courses: true,
      reminders: true,
      addresses: true,
      educations: true,
      skills: true,
    },
  });
  if (!user) throw notFound('User not found');

  // Strip sensitive password hash before sending export
  const { password, ...safeUser } = user;

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    appName: 'Progress Copilot',
    version: '1.0.0',
    user: safeUser,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Progress_Copilot_Data_${safeUser.fullName.replace(/\s+/g, '_')}.json"`,
  );

  return res.json(exportPayload);
});

export const deleteAccount = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { password, confirmText } = req.body;

  if (confirmText !== 'DELETE') {
    throw badRequest('Please type "DELETE" to confirm account deletion.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');

  const passwordValid = await bcrypt.compare(password || '', user.password);
  if (!passwordValid) {
    throw unauthorized('Incorrect password. Account deletion failed.');
  }

  // Delete user (Prisma onDelete: Cascade removes all targets, tasks, notes, courses, etc.)
  await prisma.user.delete({ where: { id: userId } });

  return res.json({ ok: true, message: 'Account deleted permanently.' });
});
