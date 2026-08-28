import 'dotenv/config';
import app from './app';
import { initPenaltyCron } from './jobs/penaltyCron';
import { initLeaderboardCron } from './jobs/leaderboardCron';

const PORT = Number(process.env.PORT) || 4000;

// Bind explicitly to IPv4 — fixes "ERR_CONNECTION_RESET" on Windows when Node binds to ::
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] listening on http://127.0.0.1:${PORT}`);
  initPenaltyCron();
  initLeaderboardCron();
});

// Surface Prisma / DB errors instead of crashing silently
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
