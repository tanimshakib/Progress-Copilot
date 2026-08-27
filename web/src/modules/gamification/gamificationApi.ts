import { api } from '../../lib/api';

export type PomodoroSessionResponse = {
  ok: boolean;
  pointsAwarded: number;
  points: number;
  dailyStreak: number;
  streakBumped: boolean;
};

export const gamificationApi = {
  recordPomodoroSession: async (): Promise<PomodoroSessionResponse> => {
    const { data } = await api.post<PomodoroSessionResponse>('/api/gamification/pomodoro');
    return data;
  },
};
