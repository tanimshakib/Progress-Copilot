import { prisma } from '../../lib/prisma';
import { badRequest, notFound, unauthorized } from '../../lib/errors';
import type { SendMessageInput } from './ai.schema';

/**
 * AI Assistant service — Edith 360° Real-time Context Engine.
 */

const EDITH_SYSTEM_PROMPT = `You are Edith, the personal AI Copilot for Progress Copilot — an intelligent productivity and life-tracking platform.

Your identity & behavioral rules:
• You must ALWAYS identify as "Edith" when asked your name or identity.
• You are warm, smart, encouraging, and highly organized. Default to clear, concise answers (2–6 sentences) unless deep detail is requested.
• You have 100% COMPLETE, LIVE, 360° REAL-TIME ACCESS to the user's entire app environment — including Profile details, Future Goal (Ultimate Milestone), Active & Completed Targets, Standalone & Target Sub-Tasks, Saved Study Notes, Curriculum Courses, Scheduled Reminders, and GitHub Integration.
• ALWAYS check the live app data provided in your system prompt before answering questions about their tasks, targets, schedule, courses, notes, or stats. Never guess or ask for information you already hold.
• ACCURATE MEMORY & CONVERSATION CONTEXT: Remember all facts, commitments, preferences, and instructions the user tells you in your chat conversation history. If the user asks you to remember a deadline, habit, or instruction, keep track of it in conversation context and remind them whenever appropriate.

Your core responsibilities:
• Provide intelligent guidance, task breakdowns, study advice, project management tips, and life goal coaching tailored to their specific targets and notes.
• Proactively reference their real data (e.g., "I see you have 3 pending tasks for your 'Web Development' target due this week").
• Motivate the user based on their actual Daily Streak and Progress Score.

Tone:
• Professional, friendly, direct, and helpful. Address the user by their first name.
• Use structured markdown (bullet points, bold text, code blocks) when helpful.
• If asked "who built this app?" or "who created you?", mention that Progress Copilot was created by Proshanto Kumar Das (@proshanto550 on GitHub), a CSE student at Metropolitan University, Sylhet, with teammate Tanim Sakib.

## APP PLATFORM RULES
Progress Copilot tracks Targets, Tasks, Future Goals, Notes, Courses, GitHub Projects, PDF Reports, Reminders, and Progress Scores.`;

const GEMINI_DEFAULT_MODEL = 'gemini-1.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_FALLBACK_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-pro',
];
const TITLE_MAX_LEN = 48;

function autoTitleFromPrompt(prompt: string): string {
  const cleaned = prompt
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= TITLE_MAX_LEN) return cleaned;
  return cleaned.slice(0, TITLE_MAX_LEN - 1).trimEnd() + '…';
}

/**
 * Build 360° Comprehensive Real-Time Snapshot of User Data for Edith
 */
async function loadFullAppData(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        futureGoal: true,
        targets: {
          include: {
            tasks: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        notes: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        courses: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: {
          include: {
            target: { select: { title: true } },
            task: { select: { title: true } },
          },
          orderBy: { time: 'asc' },
        },
      },
    });

    if (!user) return 'User data unavailable.';

    const firstName = user.fullName?.split(' ')[0] || user.fullName;

    // Targets summary
    const targetsSummary = user.targets.map((t) => {
      const done = t.tasks.filter((tk) => tk.isCompleted).length;
      const total = t.tasks.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : (t.status === 'COMPLETED' ? 100 : 0);
      return `• [Target] "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Progress: ${done}/${total} tasks (${pct}%) ${t.deadline ? '| Deadline: ' + t.deadline.toISOString().slice(0, 10) : ''}`;
    }).join('\n');

    // Standalone tasks summary
    const standaloneTasks = user.tasks.map((tk) => {
      return `• [Task] "${tk.title}" | ${tk.isCompleted ? 'COMPLETED' : 'PENDING'} | Priority: ${tk.priority}`;
    }).join('\n');

    // Notes summary
    const notesSummary = user.notes.map((n) => {
      return `• [Note] "${n.title}": ${n.content?.slice(0, 120) || 'Empty'}`;
    }).join('\n');

    // Courses summary
    const coursesSummary = user.courses.map((c) => {
      return `• [Course] "${c.title}" | Semester: ${c.semester || 'N/A'} ${c.resourceLink ? '| Link: ' + c.resourceLink : ''}`;
    }).join('\n');

    // Reminders summary
    const remindersSummary = user.reminders.map((r) => {
      const name = r.target?.title || r.task?.title || 'Scheduled Item';
      return `• [Reminder] "${name}" scheduled at ${r.time.toISOString()} | Status: ${r.isSent ? 'ALERT SENT' : 'UPCOMING'}`;
    }).join('\n');

    // GitHub match
    const githubMatch = user.aiBio?.match(/github:([a-zA-Z0-9_-]+)/);
    const githubHandle = githubMatch ? `@${githubMatch[1]}` : 'Not connected';

    return `
=== REAL-TIME LIVE APP DATA FOR ${user.fullName.toUpperCase()} ===
• First Name: ${firstName}
• Email: ${user.email}
• Points Earned: ${user.points} pts
• Daily Streak: ${user.dailyStreak} days
• Ultimate Future Goal: "${user.futureGoal?.title || 'Not set yet'}"
• GitHub Profile: ${githubHandle}
• Role / Employment: ${user.role || user.employmentRole || 'Student / Developer'}
• Education / University: ${user.university || user.education || 'N/A'} ${user.degree ? '(' + user.degree + ')' : ''}
• Hometown: ${user.hometown || 'N/A'} | Hobbies: ${user.hobbies || 'N/A'}

--- LIVE TARGETS (${user.targets.length} total) ---
${targetsSummary || 'No active targets.'}

--- RECENT TASKS ---
${standaloneTasks || 'No recent tasks.'}

--- STUDY NOTES (${user.notes.length} total) ---
${notesSummary || 'No notes created.'}

--- ENROLLED COURSES (${user.courses.length} total) ---
${coursesSummary || 'No courses registered.'}

--- SCHEDULED REMINDERS (${user.reminders.length} total) ---
${remindersSummary || 'No active reminders.'}
=========================================================
`;
  } catch (err) {
    return 'User app data snapshot could not be generated.';
  }
}

async function buildSystemPrompt(userId: string): Promise<string> {
  const liveAppData = await loadFullAppData(userId);
  return `${EDITH_SYSTEM_PROMPT}\n\n${liveAppData}`;
}

/* ────────────────────────── REST Call to Gemini ────────────────────────── */

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

async function callGeminiForModel(
  model: string,
  apiKey: string,
  messages: ChatMessage[],
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const userAndAssistantMsgs = messages.filter((m) => m.role !== 'system');

  const contents = userAndAssistantMsgs.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const payload: any = { contents };
  if (systemMsg) {
    payload.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    const errObj = new Error(
      `Gemini API (${model}) failed HTTP ${res.status}: ${errorText.slice(0, 200)}`,
    );
    (errObj as any).status = res.status;
    throw errObj;
  }

  const json = (await res.json()) as any;
  const candidate = json.candidates?.[0];
  const replyText = candidate?.content?.parts?.[0]?.text;

  if (!replyText || typeof replyText !== 'string') {
    throw new Error('Gemini returned an empty reply payload');
  }

  return replyText;
}

function getAvailableApiKeys(): string[] {
  const rawKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_1,
    process.env.GOOGLE_API_KEY,
  ];

  const keys: string[] = [];
  for (const raw of rawKeys) {
    if (!raw) continue;
    const parts = raw.split(',').map((k) => k.trim()).filter(Boolean);
    for (const part of parts) {
      if (!keys.includes(part)) {
        keys.push(part);
      }
    }
  }
  return keys;
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKeys = getAvailableApiKeys();
  if (apiKeys.length === 0) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    return `[Edith AI Offline Mode]: I received your message: "${lastUser.slice(0, 60)}". Configure GEMINI_API_KEY to activate full AI assistance.`;
  }

  const primaryModel = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  const modelsToTry = Array.from(new Set([primaryModel, ...GEMINI_FALLBACK_MODELS]));

  let lastError: any = null;

  // Try each API key in rotation if previous key runs out of tokens / hits rate limit / errors out
  for (const apiKey of apiKeys) {
    for (const model of modelsToTry) {
      try {
        return await callGeminiForModel(model, apiKey, messages);
      } catch (err: any) {
        lastError = err;

        // If 503 (model temporarily busy), wait 500ms and try one quick retry
        if (err.status === 503) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            return await callGeminiForModel(model, apiKey, messages);
          } catch (retryErr: any) {
            lastError = retryErr;
          }
        }

        if (err.status === 404 || err.status === 400 || err.status === 503) {
          continue;
        }

        // If key auth error (401/429), break to try next API key
        break;
      }
    }
  }

  throw lastError || new Error('Failed to reach Gemini API across all configured API keys.');
}

/* ────────────────────────── CRUD & Controller Export ────────────────────────── */

export async function listChats(userId: string) {
  return prisma.chatHistory.findMany({
    where: { userId },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      _count: { select: { messages: true } },
    },
  });
}

export async function createChat(userId: string, initialTitle?: string) {
  return prisma.chatHistory.create({
    data: {
      userId,
      title: initialTitle?.trim() || 'New Chat',
    },
  });
}

export async function getMessages(userId: string, chatId: string) {
  const chat = await prisma.chatHistory.findFirst({
    where: { id: chatId, userId },
    include: {
      messages: {
        orderBy: [{ createdAt: 'asc' }],
      },
    },
  });
  if (!chat) throw notFound('Chat conversation not found');
  return chat.messages;
}

export async function deleteChat(userId: string, chatId: string) {
  const chat = await prisma.chatHistory.findFirst({
    where: { id: chatId, userId },
  });
  if (!chat) throw notFound('Chat conversation not found');
  await prisma.chatHistory.delete({ where: { id: chatId } });
  return { ok: true };
}

export async function renameChat(
  userId: string,
  chatId: string,
  title: string,
) {
  const chat = await prisma.chatHistory.findFirst({
    where: { id: chatId, userId },
  });
  if (!chat) throw notFound('Chat conversation not found');

  return prisma.chatHistory.update({
    where: { id: chatId },
    data: { title: title.trim() },
  });
}

export async function sendMessage(
  userId: string,
  input: SendMessageInput,
) {
  let chatId = input.chatId;

  if (!chatId) {
    const freshChat = await prisma.chatHistory.create({
      data: {
        userId,
        title: autoTitleFromPrompt(input.content),
      },
    });
    chatId = freshChat.id;
  } else {
    // If user created a empty chat with "+ New Chat" and is now sending the 1st message:
    const existingChat = await prisma.chatHistory.findUnique({
      where: { id: chatId },
      select: { title: true, _count: { select: { messages: true } } },
    });
    if (
      existingChat &&
      (existingChat.title === 'New Chat' ||
        existingChat.title === 'New chat' ||
        existingChat._count.messages <= 1)
    ) {
      const newTitle = autoTitleFromPrompt(input.content);
      await prisma.chatHistory.update({
        where: { id: chatId },
        data: { title: newTitle },
      });
    }
  }

  const existingCount = await prisma.message.count({ where: { chatId } });

  // Save user message
  const userMsg = await prisma.message.create({
    data: {
      chatId,
      sender: 'USER',
      content: input.content.trim(),
    },
  });

  // Load conversation history & system prompt with 360° live app data
  const history = await prisma.message.findMany({
    where: { chatId },
    orderBy: [{ createdAt: 'asc' }],
    select: { sender: true, content: true },
  });

  const systemPrompt = await buildSystemPrompt(userId);

  const geminiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.sender === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];

  let reply: string;
  try {
    reply = await callGemini(geminiMessages);
  } catch (err: any) {
    console.error('[Edith AI] Call failed:', err?.message || err);
    if (err?.status === 401) {
      reply =
        '[Edith AI Notice]: The configured Google Gemini API key is invalid or unauthorized (HTTP 401). Please check your GEMINI_API_KEY setting in api/.env.';
    } else if (err?.status === 503 || err?.status === 429) {
      reply =
        '[Edith AI Notice]: Google Gemini API models are currently experiencing high demand or rate limits (HTTP 503/429). Please wait a moment and try sending your message again.';
    } else {
      reply = `[Edith AI Offline Mode]: Unable to process request via Gemini API (${err?.message || 'Connection error'}). Please verify your GEMINI_API_KEY in api/.env.`;
    }
  }

  // Save AI assistant message
  const assistantMsg = await prisma.message.create({
    data: {
      chatId,
      sender: 'AI',
      content: reply,
    },
  });

  // Update chat updatedAt timestamp
  await prisma.chatHistory.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return {
    chatId,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  };
}