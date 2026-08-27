export type User = {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  theme: 'light' | 'dark';
  points: number;
  dailyStreak: number;
  createdAt: string;
};

export type AuthResponse = { token: string; user: User };

/* ─────────────────────────────────────────────────────────────────── */
/* Phase 4 — Targets / Tasks / Future Goal                              */
/* ─────────────────────────────────────────────────────────────────── */

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TargetStatus = 'INCOMPLETE' | 'COMPLETED';

export type FutureGoal = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Target = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  status: TargetStatus;
  createdAt: string;
  updatedAt: string;
  /** Sub-tasks are only populated on the GET /targets/:id endpoint. */
  tasks?: Task[];
};

export type Task = {
  id: string;
  userId: string;
  /** Null for a standalone task; set for a target sub-task. */
  targetId: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  isCompleted: boolean;
  priority: Priority;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Hydrated for sub-tasks so the Tasks page can show a parent badge. */
  target?: {
    id: string;
    title: string;
    deadline: string | null;
    status: TargetStatus;
  } | null;
};

/**
 * Response shape for `PATCH /tasks/:id/toggle`.
 * `pointsDelta` is +5/4/3/2 on completion, or the negative of the same
 * value on uncheck. `streakBumped` is true only on the call that crossed
 * into a new UTC day.
 */
export type ToggleTaskResult = {
  task: Task;
  pointsDelta: number;
  streakBumped: boolean;
};

/* ── Input DTOs (mirror the backend Zod schemas so the wire contract is
     shared between the two packages without a build-time dependency). */

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  priority?: Priority;
  targetId?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type TargetSubTaskSeed = {
  title: string;
  deadline?: Date | string | null;
};

export type CreateTargetInput = {
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  priority?: Priority;
  /** A target must be created with at least one sub-task. */
  subTasks: TargetSubTaskSeed[];
};

export type UpdateTargetInput = {
  title?: string;
  description?: string | null;
  deadline?: Date | string | null;
  priority?: Priority;
  status?: TargetStatus;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Phase 5 — Dashboard / My Progress payloads
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * A target with pre-computed sub-task progress. Returned by the dashboard
 * and progress endpoints so the UI can render bars without N+1 queries.
 */
export type TargetWithProgress = Target & {
  taskTotal: number;
  doneTotal: number;
  percent: number;
};

/** One cell of the 365-day contribution grid (or a 30/90-day slice). */
export type ContributionCell = {
  /** YYYY-MM-DD in UTC. */
  date: string;
  count: number;
};

export type ReminderLite = {
  id: string;
  userId: string;
  targetId: string | null;
  taskId: string | null;
  time: string;
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
  target?: { id: string; title: string } | null;
  task?: { id: string; title: string } | null;
};

export type DashboardProjects = {
  githubConnected: boolean;
  repoCount: number;
};

export type ProductivityBreakdown = {
  completionScore: number;
  priorityScore: number;
  consistencyScore: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  highPriorityTotal: number;
  highPriorityCompleted: number;
  highPriorityRate: number;
  dailyStreak: number;
};

/** Payload of GET /api/dashboard. */
export type DashboardData = {
  user: {
    id: string;
    fullName: string;
    avatar: string | null;
    points: number;
    dailyStreak: number;
    createdAt: string;
    productivityScore: number;
    scoreBreakdown?: ProductivityBreakdown;
  };
  topTargets: TargetWithProgress[];
  pendingTasks: Task[];
  upcomingReminders: ReminderLite[];
  projects: DashboardProjects;
  contributionGrid: {
    days: number;
    cells: ContributionCell[];
  };
};

/** Payload of GET /api/progress. */
export type ProgressData = {
  user: {
    id: string;
    fullName: string;
    avatar: string | null;
    points: number;
    dailyStreak: number;
    productivityScore: number;
    scoreBreakdown?: ProductivityBreakdown;
  };
  targetBreakdown: TargetWithProgress[];
  tasksCompletedLast30Days: ContributionCell[];
  pointsDistribution: {
    high: number;
    medium: number;
    low: number;
  };
};
export type ChatSender = 'USER' | 'AI';

/** Lightweight chat row for the sidebar list. */
export type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

/** A single message inside a chat. */
export type ChatMessage = {
  id: string;
  sender: ChatSender;
  content: string;
  createdAt: string;
};

/** Body of POST /api/ai/chat. */
export type SendMessageArgs = {
  chatId?: string | null;
  content: string;
};

/** Response of POST /api/ai/chat. */
export type SendMessageResponse = {
  chatId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

/** Body of PATCH /api/ai/chats/:id (rename). */
export type RenameChatArgs = {
  title: string;
};
