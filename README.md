# Progress Copilot

> A platform for smarter progress — user-centric progress tracking with targets, tasks, reminders, notes, courses, AI assistant, GitHub projects, life path timeline and reports.

## Stack

- **web/** — React (Vite) + TypeScript + Tailwind + Framer Motion + React Router + React Query + Axios + Recharts
- **api/** — Node + Express + TypeScript + Prisma + PostgreSQL + JWT + Bcrypt + Zod
- AI: Google Gemini (Edith assistant, added in later phases)

## Quick start (After Cloning from GitHub)

```bash
# 1. Clone repo & install all dependencies (runs Prisma Client generation automatically)
git clone <repository-url>
cd Progress-Copilot
npm install

# 2. Configure environment variables for API
cp api/.env.example api/.env
# Edit api/.env to set your DATABASE_URL, JWT_SECRET, etc.

# 3. Apply database migrations & generate Prisma client
npm run prisma:migrate
npm run prisma:generate

# 4. Start development servers (API on :4000, Web on :5173)
npm run dev

# Or run services individually
npm run dev:api
npm run dev:web
```

> **Note for Prisma Client Error (`Cannot find module ... runtime/library.js`):**  
> If you pull new changes or update packages and see a Prisma module error, simply run `npm run prisma:generate` at the root to regenerate the Prisma Client.

## Folder layout

```
Progress Copilot/
├── package.json           # npm workspaces root
├── api/
│   ├── prisma/schema.prisma
│   └── src/               # server.ts, app.ts (added in later phases)
└── web/
    └── src/               # React entry (added in later phases)
```

## Phase 1 scope

- Monorepo scaffold (`api` + `web`)
- Tooling and dependencies for the entire stack
- Complete `schema.prisma`: User, FutureGoal, Target, Task, Note, Course, Reminder, ChatHistory, Message
- No business logic yet — that ships feature-by-feature.