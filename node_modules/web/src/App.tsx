import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import { ProtectedRoute, PublicOnly } from './components/guards';
import { PrivateLayout } from './components/layout/PrivateLayout';
import { DashboardHomePage } from './pages/DashboardHomePage';
import {
  MyProgressPage,
  AIAssistantPage,
  RemindersPage,
  NotesPage,
  CoursesPage,
  ProjectsPage,
  LifePathPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
} from './pages/DashboardPlaceholderPage';
import { TargetsPage } from './pages/TargetsPage';
import { TasksPage } from './pages/TasksPage';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { FocusTimerProvider } from './context/FocusTimerContext';
import { FloatingFocusWidget } from './components/gamification/FloatingFocusWidget';

export default function App() {
  // Pull the server-stored theme (if any) so the initial render matches
  // the user's saved preference — no dark-mode flicker on first paint.
  const { user } = useAuth();
  const serverTheme =
    user?.theme === 'light' || user?.theme === 'dark' ? user.theme : undefined;

  return (
    <ThemeProvider serverTheme={serverTheme}>
      <ToastProvider>
        <FocusTimerProvider>
          <Routes>
          {/* ───── Public ───── */}
          {/* Landing page renders for BOTH guests and logged-in users so the
              auth-aware header (Login/Get Demo for guests, Avatar + Actionable
              Dashboard for logged-in users) can swap based on session state. */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <AuthPage />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <AuthPage initialMode="signup" />
              </PublicOnly>
            }
          />

          {/* ───── Private (gated by ProtectedRoute) ───── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PrivateLayout />}>
              <Route path="/dashboard" element={<DashboardHomePage />} />
              <Route path="/dashboard/my-progress" element={<MyProgressPage />} />
              <Route path="/dashboard/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/dashboard/targets" element={<TargetsPage />} />
              <Route path="/dashboard/tasks" element={<TasksPage />} />
              <Route path="/dashboard/reminders" element={<RemindersPage />} />
              <Route path="/dashboard/notes" element={<NotesPage />} />
              <Route path="/dashboard/courses" element={<CoursesPage />} />
              <Route path="/dashboard/projects" element={<ProjectsPage />} />
              <Route path="/dashboard/life-path" element={<LifePathPage />} />
              <Route path="/dashboard/reports" element={<ReportsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          </Routes>
          <FloatingFocusWidget />
        </FocusTimerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}