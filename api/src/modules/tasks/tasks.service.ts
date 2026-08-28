import { prisma } from '../../lib/prisma';
import { badRequest, notFound, unauthorized } from '../../lib/errors';
import { recomputeTargetStatus } from '../targets/targets.service';
import type {
  CreateTaskInput,
  ToggleTaskInput,
  UpdateTaskInput,
} from './tasks.schema';

/**
 * Tasks service — Phase 4.
 *
 * Point rules (per task completion):
 *   • HIGH   priority + has targetId  → +5
 *   • MEDIUM priority + has targetId  → +4
 *   • LOW    priority + has targetId  → +3
 *   • Standalone task (no targetId)   → +2
 *
 * Unchecking a completed task reverses those exact points. We do NOT
 * decrement the streak — once a day counts, it stays counted. If the user
 * unchecks later in the same day, they keep the streak credit. Streak is
 * only ever incremented forward.
 *
 * Streak rules:
 *   • If `lastTaskCompleteDate` is null OR not equal to today's date
 *     (UTC), bump `dailyStreak` by 1 and write today's UTC midnight.
 *   • Otherwise, leave the streak alone — multiple completions on the
 *     same day all count toward the same streak day.
 *
 * Targets:
 *   • Whenever a sub-task's completion status changes, recompute its
 *     parent target's status. A target becomes COMPLETED iff every one
 *     of its sub-tasks is COMPLETED. It goes back to INCOMPLETE the
 *     moment a sub-task is unchecked.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function pointsForSubTask(priority: 'HIGH' | 'MEDIUM' | 'LOW'): number {
  switch (priority) {
    case 'HIGH':
      return 5;
    case 'MEDIUM':
      return 4;
    case 'LOW':
      return 3;
  }
}

const POINTS_FOR_STANDALONE = 2;

function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isSameUTCDate(a: Date, b: Date): boolean {
  return startOfUTCDay(a).getTime() === startOfUTCDay(b).getTime();
}

/* ─────────────────────── ownership helper ─────────────────────── */

async function ensureOwnTask(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      target: { select: { id: true, userId: true, priority: true } },
    },
  });
  if (!task) throw notFound('Task not found');
  if (task.userId !== userId) throw unauthorized('Not your task');
  return task;
}

/* ─────────────────────────── CRUD ─────────────────────────── */

/**
 * Shape returned by the list endpoints. We hydrate the parent target
 * (id, title, deadline, status) so the Tasks page can show a badge /
 * deadline without a second round-trip.
 */
function includeTarget() {
  return {
    target: {
      select: { id: true, title: true, deadline: true, status: true },
    },
  };
}

export async function listTasks(userId: string, filter?: { targetId?: string }) 
{
  return prisma.task.findMany({
    where: {
      userId,
      ...(filter?.targetId ? { targetId: filter.targetId } : {}),
    },
    include: includeTarget(),
    orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function listTasksForTarget(userId: string, targetId: string) {    
  return prisma.task.findMany({
    where: { userId, targetId },
    include: includeTarget(),
    orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getTask(userId: string, taskId: string) {
  const task = await ensureOwnTask(userId, taskId);
  // ensureOwnTask already returned the target, so just re-query with the
  // trimmed include shape so the response shape matches list endpoints.
  return prisma.task.findUnique({
    where: { id: taskId },
    include: includeTarget(),
  });
}

export async function createTask(userId: string, input: CreateTaskInput) {
  // If a targetId is provided, verify ownership + inherit priority when
  // the caller left priority unset.
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = input.priority ?? 'MEDIUM';
  if (input.targetId) {
    const target = await prisma.target.findUnique({
      where: { id: input.targetId },
      select: { id: true, userId: true, priority: true },
    });
    if (!target) throw notFound('Target not found');
    if (target.userId !== userId) throw unauthorized('Not your target');
    if (!input.priority) priority = target.priority;
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      deadline: input.deadline ?? null,
      priority,
      targetId: input.targetId ?? null,
    },
    include: includeTarget(),
  });
  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  await ensureOwnTask(userId, taskId);

  // If targetId is being moved, verify the destination target is ours.
  // (We pass `undefined` for fields the caller didn't send so partial
  // PATCHes don't blank out columns.)
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.deadline !== undefined) data.deadline = input.deadline;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.targetId !== undefined) {
    if (input.targetId === null) {
      data.targetId = null;
      data.priority = data.priority ?? 'MEDIUM';
    } else {
      const target = await prisma.target.findUnique({
        where: { id: input.targetId },
        select: { id: true, userId: true },
      });
      if (!target) throw notFound('Target not found');
      if (target.userId !== userId) throw unauthorized('Not your target');
      data.targetId = input.targetId;
      // Inherit priority from the (new) target unless caller overrode it.
      if (input.priority === undefined) {
        const t2 = await prisma.target.findUnique({
          where: { id: input.targetId },
          select: { priority: true },
        });
        if (t2) data.priority = t2.priority;
      }
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: includeTarget(),
  });
  return updated;
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await ensureOwnTask(userId, taskId);
  // Reverse points if it had been counted toward the user's total.
  if (task.isCompleted) {
    await reversePointsForCompletion(userId, task.priority, !!task.targetId);
  }
  await prisma.task.delete({ where: { id: taskId } });
  if (task.targetId) {
    await recomputeTargetStatus(task.targetId);
  }
  return { ok: true };
}

/* ─────────────────────── Toggle (the spicy one) ─────────────────────── */

/**
 * Toggle the completion state. Returns the updated task + the deltas the
 * caller might want to surface back to the client:
 *   • pointsDelta — points added (positive) or removed (negative)
 *   • streakBumped — true only when a NEW day crossed
 */
export async function toggleTask(
  userId: string,
  taskId: string,
  input: ToggleTaskInput,
) {
  const task = await ensureOwnTask(userId, taskId);
  if (task.isCompleted === input.isCompleted) {
    // No-op — caller was already in the desired state.
    return { task, pointsDelta: 0, streakBumped: false };
  }

  let pointsDelta = 0;
  let streakBumped = false;

  if (input.isCompleted) {
    // ───── Marking complete ─────
    const isSub = !!task.targetId;
    const earned = isSub
      ? pointsForSubTask(task.priority)
      : POINTS_FOR_STANDALONE;
    pointsDelta = earned;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
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

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          points: { increment: earned },
          weeklyPoints: { increment: earned },
          ...(crossed
            ? {
                dailyStreak: { increment: 1 },
                lastTaskCompleteDate: today,
              }
            : {}),
        },
      });

      return { updatedTask, crossed };
    });

    streakBumped = result.crossed;
  } else {
    // ───── Unmarking complete ─────
    const isSub = !!task.targetId;
    const refund = isSub
      ? pointsForSubTask(task.priority)
      : POINTS_FOR_STANDALONE;
    pointsDelta = -refund;

    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          isCompleted: false,
          completedAt: null,
        },
      });

      // Clamp points at 0 so an edge case (multiple toggles in flight) can't
      // drive the total negative.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true, weeklyPoints: true },
      });
      const nextPoints = Math.max(0, (user?.points ?? 0) - refund);
      const nextWeeklyPoints = Math.max(0, (user?.weeklyPoints ?? 0) - refund);

      await tx.user.update({
        where: { id: userId },
        data: { points: nextPoints, weeklyPoints: nextWeeklyPoints },
      });

      return { updatedTask };
    });
    void result;
  }

  // After completion state flips, recompute the parent target — moving a
  // sub-task from incomplete to complete (or back) changes the target's
  // progress percentage and the COMPLETED status.
  if (task.targetId) {
    await recomputeTargetStatus(task.targetId);
  }

  const fresh = await prisma.task.findUnique({
    where: { id: taskId },
    include: includeTarget(),
  });
  if (!fresh) throw badRequest('Task vanished mid-toggle');
  return { task: fresh, pointsDelta, streakBumped };
}

/* ─────────────────────── internal helpers ─────────────────────── */

async function reversePointsForCompletion(
  userId: string,
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  isSub: boolean,
) {
  const refund = isSub ? pointsForSubTask(priority) : POINTS_FOR_STANDALONE;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, weeklyPoints: true },
  });
  const nextPoints = Math.max(0, (user?.points ?? 0) - refund);
  const nextWeeklyPoints = Math.max(0, (user?.weeklyPoints ?? 0) - refund);
  await prisma.user.update({
    where: { id: userId },
    data: { points: nextPoints, weeklyPoints: nextWeeklyPoints },
  });
}

// Re-export a couple of constants for downstream consumers (tests,
// debugging) without polluting the public surface elsewhere.
export const __internals = { pointsForSubTask, POINTS_FOR_STANDALONE };
void DAY_MS;
void isSameUTCDate;
