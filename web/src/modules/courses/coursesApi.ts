import { api } from '../../lib/api';

export type Course = {
  id: string;
  userId: string;
  semester: string;
  title: string;
  resourceLink: string;
  isCompleted?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ToggleCourseResponse = {
  course: Course;
  pointsDelta: number;
  newPoints: number;
  dailyStreak?: number;
  streakBumped?: boolean;
};

export type CompleteSemesterResponse = {
  ok: boolean;
  updatedCount: number;
  pointsAwarded: number;
  newPoints?: number;
  dailyStreak?: number;
  streakBumped?: boolean;
  message?: string;
};

export const coursesApi = {
  getAll: () => api.get<{ courses: Course[] }>('/api/courses').then((r) => r.data.courses),
  create: (data: { title: string; resourceLink: string; semester: string }) =>
    api.post<{ course: Course }>('/api/courses', data).then((r) => r.data.course),
  update: (id: string, data: { title: string; resourceLink: string; semester: string }) =>
    api.put<{ course: Course }>(`/api/courses/${id}`, data).then((r) => r.data.course),
  toggleComplete: (id: string, isCompleted?: boolean) =>
    api.patch<ToggleCourseResponse>(`/api/courses/${id}/toggle`, { isCompleted }).then((r) => r.data),
  completeSemester: (semester: string) =>
    api.post<CompleteSemesterResponse>('/api/courses/semester/complete', { semester }).then((r) => r.data),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/courses/${id}`).then((r) => r.data),
};
