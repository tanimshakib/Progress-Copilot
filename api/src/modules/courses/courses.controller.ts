import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

const courseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(150),
  resourceLink: z.string().min(1, 'Resource link is required'),
  semester: z.string().min(1, 'Semester is required').default('1st Semester'),
});

export const getCourses = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
  });
  return res.json({ courses });
});

export const createCourse = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { title, resourceLink, semester } = courseSchema.parse(req.body);
  const course = await prisma.course.create({
    data: { userId, title, resourceLink, semester },
  });
  return res.status(201).json({ course });
});

export const updateCourse = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;
  const { title, resourceLink, semester } = courseSchema.parse(req.body);

  const existing = await prisma.course.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Course not found');

  const course = await prisma.course.update({
    where: { id },
    data: { title, resourceLink, semester },
  });
  return res.json({ course });
});

export const deleteCourse = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;

  const existing = await prisma.course.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Course not found');

  // If the deleted course was completed, reverse the 50 points bonus
  if ((existing as any).isCompleted) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    const nextPoints = Math.max(0, (user?.points ?? 0) - 50);
    await prisma.user.update({
      where: { id: userId },
      data: { points: nextPoints },
    });
  }

  await prisma.course.delete({ where: { id } });
  return res.json({ ok: true });
});

function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const COURSE_MILESTONE_POINTS = 50;

/**
 * PATCH /api/courses/:id/toggle
 * Toggle course completion status and award/refund +50 points milestone bonus.
 */
export const toggleCourseComplete = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;
  const desiredState = typeof req.body.isCompleted === 'boolean' ? req.body.isCompleted : undefined;

  const existing = await prisma.course.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Course not found');

  const currentStatus = Boolean((existing as any).isCompleted);
  const nextStatus = desiredState !== undefined ? desiredState : !currentStatus;

  if (currentStatus === nextStatus) {
    return res.json({ course: existing, pointsDelta: 0, streakBumped: false });
  }

  let pointsDelta = 0;
  let streakBumped = false;

  if (nextStatus) {
    // Marking completed: +50 points
    pointsDelta = COURSE_MILESTONE_POINTS;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true, dailyStreak: true, lastTaskCompleteDate: true },
      });
      if (!user) throw notFound('User not found');

      const today = startOfUTCDay(new Date());
      const lastDay = user.lastTaskCompleteDate ? startOfUTCDay(user.lastTaskCompleteDate) : null;
      const crossed = !lastDay || lastDay.getTime() !== today.getTime();

      const updatedCourse = await tx.course.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        } as any,
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: { increment: COURSE_MILESTONE_POINTS },
          ...(crossed
            ? {
                dailyStreak: { increment: 1 },
                lastTaskCompleteDate: today,
              }
            : {}),
        },
        select: { points: true, dailyStreak: true },
      });

      return { updatedCourse, updatedUser, crossed };
    });

    streakBumped = result.crossed;
    return res.json({
      course: result.updatedCourse,
      pointsDelta,
      newPoints: result.updatedUser.points,
      dailyStreak: result.updatedUser.dailyStreak,
      streakBumped,
    });
  } else {
    // Unmarking completed: -50 points
    pointsDelta = -COURSE_MILESTONE_POINTS;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      const nextPoints = Math.max(0, (user?.points ?? 0) - COURSE_MILESTONE_POINTS);

      const updatedCourse = await tx.course.update({
        where: { id },
        data: {
          isCompleted: false,
          completedAt: null,
        } as any,
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: nextPoints },
        select: { points: true, dailyStreak: true },
      });

      return { updatedCourse, updatedUser };
    });

    return res.json({
      course: result.updatedCourse,
      pointsDelta,
      newPoints: result.updatedUser.points,
      streakBumped: false,
    });
  }
});

/**
 * POST /api/courses/semester/complete
 * Mark all courses in a semester as completed and award +50 points per newly completed course.
 */
export const completeSemester = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { semester } = z.object({ semester: z.string().min(1) }).parse(req.body);

  const courses = await prisma.course.findMany({
    where: { userId, semester },
  });

  const uncompleted = courses.filter((c) => !(c as any).isCompleted);
  if (uncompleted.length === 0) {
    return res.json({
      ok: true,
      updatedCount: 0,
      pointsAwarded: 0,
      message: 'All courses in this semester are already completed.',
    });
  }

  const totalPoints = uncompleted.length * COURSE_MILESTONE_POINTS;

  const result = await prisma.$transaction(async (tx) => {
    const uncompletedIds = uncompleted.map((c) => c.id);

    await tx.course.updateMany({
      where: { id: { in: uncompletedIds } },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      } as any,
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true, dailyStreak: true, lastTaskCompleteDate: true },
    });
    if (!user) throw notFound('User not found');

    const today = startOfUTCDay(new Date());
    const lastDay = user.lastTaskCompleteDate ? startOfUTCDay(user.lastTaskCompleteDate) : null;
    const crossed = !lastDay || lastDay.getTime() !== today.getTime();

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        points: { increment: totalPoints },
        ...(crossed
          ? {
              dailyStreak: { increment: 1 },
              lastTaskCompleteDate: today,
            }
          : {}),
      },
      select: { points: true, dailyStreak: true },
    });

    return { updatedUser, crossed };
  });

  return res.json({
    ok: true,
    updatedCount: uncompleted.length,
    pointsAwarded: totalPoints,
    newPoints: result.updatedUser.points,
    dailyStreak: result.updatedUser.dailyStreak,
    streakBumped: result.crossed,
  });
});

