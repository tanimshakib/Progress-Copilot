import type { Request } from 'express';
import PDFDocument from 'pdfkit';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

const TREND_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isoDate(d: Date): string {
  return startOfUTCDay(d).toISOString().slice(0, 10);
}

async function getProgressMetrics(userId: string) {
  const now = new Date();
  const trendStart = startOfUTCDay(
    new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS),
  );
  const trendCompletions = await prisma.task.findMany({
    where: { userId, isCompleted: true },
    select: { completedAt: true, updatedAt: true },
  });

  const trendCounts = new Map<string, number>();
  for (const c of trendCompletions) {
    const dateToUse = c.completedAt || c.updatedAt;
    if (!dateToUse) continue;
    const key = isoDate(dateToUse);
    trendCounts.set(key, (trendCounts.get(key) ?? 0) + 1);
  }

  const tasksCompletedLast30Days: { date: string; count: number }[] = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart.getTime() + i * DAY_MS);
    const key = isoDate(d);
    tasksCompletedLast30Days.push({
      date: key,
      count: trendCounts.get(key) ?? 0,
    });
  }

  const allUserTasks = await prisma.task.findMany({
    where: { userId },
    select: { isCompleted: true, priority: true, targetId: true },
  });

  const pointsDistribution = { high: 0, medium: 0, low: 0 };
  for (const t of allUserTasks.filter((t) => t.isCompleted)) {
    const earned = t.targetId
      ? t.priority === 'HIGH'
        ? 5
        : t.priority === 'MEDIUM'
          ? 4
          : 3
      : 2;
    if (t.priority === 'HIGH') pointsDistribution.high += earned;
    else if (t.priority === 'MEDIUM') pointsDistribution.medium += earned;
    else pointsDistribution.low += earned;
  }

  return { tasksCompletedLast30Days, pointsDistribution };
}

export const getReportSummary = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      avatar: true,
      points: true,
      dailyStreak: true,
      createdAt: true,
    },
  });
  if (!user) throw notFound('User not found');

  const targets = await prisma.target.findMany({ where: { userId } });
  const tasks = await prisma.task.findMany({ where: { userId } });
  const notesCount = await prisma.note.count({ where: { userId } });
  const coursesCount = await prisma.course.count({ where: { userId } });

  const completedTargets = targets.filter((t) => t.status === 'COMPLETED').length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const targetScore = targets.length ? (completedTargets / targets.length) * 40 : 0;
  const taskScore = tasks.length ? (completedTasks / tasks.length) * 35 : 0;
  const streakScore = Math.min(user.dailyStreak * 5, 25);
  const progressScore = Math.min(100, Math.round(targetScore + taskScore + streakScore));

  const { tasksCompletedLast30Days, pointsDistribution } = await getProgressMetrics(userId);

  return res.json({
    user,
    stats: {
      points: user.points,
      dailyStreak: user.dailyStreak,
      progressScore,
      totalTargets: targets.length,
      completedTargets,
      targetCompletionRate: targets.length ? Math.round((completedTargets / targets.length) * 100) : 0,
      totalTasks: tasks.length,
      completedTasks,
      taskCompletionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
      notesCount,
      coursesCount,
    },
    tasksCompletedLast30Days,
    pointsDistribution,
  });
});

export const downloadPDFReport = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');

  const targets = await prisma.target.findMany({ where: { userId } });
  const tasks = await prisma.task.findMany({ where: { userId } });
  const notesCount = await prisma.note.count({ where: { userId } });
  const coursesCount = await prisma.course.count({ where: { userId } });

  const completedTargets = targets.filter((t) => t.status === 'COMPLETED').length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const targetScore = targets.length ? (completedTargets / targets.length) * 40 : 0;
  const taskScore = tasks.length ? (completedTasks / tasks.length) * 35 : 0;
  const streakScore = Math.min(user.dailyStreak * 5, 25);
  const progressScore = Math.min(100, Math.round(targetScore + taskScore + streakScore));

  const { tasksCompletedLast30Days, pointsDistribution } = await getProgressMetrics(userId);

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Progress_Report_${user.fullName.replace(/\s+/g, '_')}.pdf"`,
  );

  doc.pipe(res);

  // Title & Header
  doc
    .fillColor('#7c3aed')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('PROGRESS COPILOT', { align: 'center' });
  doc
    .fontSize(10)
    .fillColor('#64748b')
    .text('A PLATFORM FOR SMARTER PROGRESS', { align: 'center' });
  doc.moveDown(1);

  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(1);

  doc
    .fontSize(16)
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text(`User Progress Summary Report`);
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Generated on: ${new Date().toLocaleDateString()}`);
  doc.moveDown(0.8);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(`Name: `, { continued: true })
    .font('Helvetica')
    .text(user.fullName);
  doc
    .font('Helvetica-Bold')
    .text(`Email: `, { continued: true })
    .font('Helvetica')
    .text(user.email);
  doc.moveDown(1.2);

  // Core Metrics
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#7c3aed')
    .text('Key Productivity & Progress Metrics');
  doc.moveDown(0.4);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(`• Overall Progress Score: ${progressScore} / 100`)
    .text(`• Total Productivity Points: ${user.points} pts`)
    .text(`• Daily Streak: ${user.dailyStreak} Days`)
    .text(`• Targets Completed: ${completedTargets} / ${targets.length}`)
    .text(`• Tasks Completed: ${completedTasks} / ${tasks.length}`)
    .text(`• Total Study Notes: ${notesCount}`)
    .text(`• Total Enrolled Courses: ${coursesCount}`);

  doc.moveDown(1.2);

  // ─── Chart 1: 30-Day Task Completion Trend Graph ───
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#7c3aed')
    .text('30-Day Task Completion Trend');
  doc.moveDown(0.3);

  const trendBoxX = 50;
  const trendBoxY = doc.y;
  const trendBoxWidth = 495;
  const trendBoxHeight = 85;

  // Background Box
  doc
    .rect(trendBoxX, trendBoxY, trendBoxWidth, trendBoxHeight)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  const maxCount = Math.max(...tasksCompletedLast30Days.map((d) => d.count), 5);
  const barGap = 3;
  const barWidth = (trendBoxWidth - 30 - barGap * (TREND_DAYS - 1)) / TREND_DAYS;
  const graphBottom = trendBoxY + trendBoxHeight - 18;
  const graphMaxH = 50;

  // Draw bars
  tasksCompletedLast30Days.forEach((item, idx) => {
    const x = trendBoxX + 15 + idx * (barWidth + barGap);
    const h = (item.count / maxCount) * graphMaxH;
    const y = graphBottom - Math.max(h, 3);

    // Bar color (purple if > 0, light slate if 0)
    if (item.count > 0) {
      doc.rect(x, y, barWidth, Math.max(h, 3)).fill('#9333ea');
    } else {
      doc.rect(x, graphBottom - 3, barWidth, 3).fill('#cbd5e1');
    }
  });

  // Trend labels
  doc
    .fontSize(8)
    .fillColor('#64748b')
    .text(tasksCompletedLast30Days[0].date, trendBoxX + 10, trendBoxY + trendBoxHeight - 12);
  doc
    .fontSize(8)
    .fillColor('#64748b')
    .text(tasksCompletedLast30Days[TREND_DAYS - 1].date, trendBoxX + trendBoxWidth - 75, trendBoxY + trendBoxHeight - 12, {
      align: 'right',
      width: 65,
    });

  doc.y = trendBoxY + trendBoxHeight + 15;

  // ─── Chart 2: Points Distribution Chart ───
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#7c3aed')
    .text('Points Distribution');
  doc.moveDown(0.3);

  const ptsBoxX = 50;
  const ptsBoxY = doc.y;
  const ptsBoxWidth = 495;
  const ptsBoxHeight = 85;

  doc
    .rect(ptsBoxX, ptsBoxY, ptsBoxWidth, ptsBoxHeight)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  const totalPointsDist = pointsDistribution.high + pointsDistribution.medium + pointsDistribution.low || 1;
  const tiers = [
    { label: 'HIGH Priority', pts: pointsDistribution.high, color: '#e11d48' },
    { label: 'MEDIUM Priority', pts: pointsDistribution.medium, color: '#f59e0b' },
    { label: 'LOW Priority', pts: pointsDistribution.low, color: '#10b981' },
  ];

  let currentY = ptsBoxY + 12;
  tiers.forEach((tier) => {
    const pct = Math.round((tier.pts / totalPointsDist) * 100);
    const barW = Math.max((pct / 100) * 280, 4);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text(tier.label, ptsBoxX + 15, currentY, { width: 110 });

    // Progress Bar Background
    doc
      .rect(ptsBoxX + 130, currentY + 1, 280, 10)
      .fill('#e2e8f0');

    // Fill Bar
    if (tier.pts > 0) {
      doc
        .rect(ptsBoxX + 130, currentY + 1, barW, 10)
        .fill(tier.color);
    }

    // Points text
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`${tier.pts} pts (${pct}%)`, ptsBoxX + 420, currentY);

    currentY += 22;
  });

  doc.x = 50;
  doc.y = ptsBoxY + ptsBoxHeight + 15;

  // Active Targets Breakdown
  if (targets.length > 0) {
    if (doc.y > 650) {
      doc.addPage();
      doc.x = 50;
    }

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#7c3aed')
      .text('Active Targets Breakdown', 50, doc.y);
    doc.moveDown(0.4);

    targets.forEach((t, i) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.x = 50;
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(`${i + 1}. ${t.title} [Priority: ${t.priority}] - Status: ${t.status}`, 50, doc.y);
      if (t.description) {
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`   Description: ${t.description}`, 65, doc.y);
      }
      doc.moveDown(0.3);
    });
  }

  doc.moveDown(1.5);
  doc.x = 50;
  doc
    .fontSize(9)
    .fillColor('#94a3b8')
    .font('Helvetica-Oblique')
    .text('Generated automatically by Progress Copilot. Keep tracking your growth!', 50, doc.y, {
      align: 'center',
      width: 495,
    });

  doc.end();
});
