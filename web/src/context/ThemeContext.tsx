import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
};

const STORAGE_KEY_PRIMARY = 'progress_copilot_theme';
const STORAGE_KEY_SECONDARY = 'pc:theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function detectInitial(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const storedPrimary = window.localStorage.getItem(STORAGE_KEY_PRIMARY);
  if (storedPrimary === 'light' || storedPrimary === 'dark') return storedPrimary;
  
  const storedSecondary = window.localStorage.getItem(STORAGE_KEY_SECONDARY);
  if (storedSecondary === 'light' || storedSecondary === 'dark') return storedSecondary;

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function applyToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({
  children,
  serverTheme,
}: {
  children: ReactNode;
  serverTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(detectInitial);

  // Apply the class on mount + whenever the state flips.
  useEffect(() => {
    applyToDom(theme);
  }, [theme]);

  // If the authenticated user already has a theme saved on the server and
  // it's different from the locally-derived one, prefer the server value.
  useEffect(() => {
    if (!serverTheme) return;
    if (serverTheme === theme) return;
    setThemeState(serverTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY_PRIMARY, serverTheme);
      window.localStorage.setItem(STORAGE_KEY_SECONDARY, serverTheme);
    } catch {
      /* ignore */
    }
  }, [serverTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY_PRIMARY, next);
      window.localStorage.setItem(STORAGE_KEY_SECONDARY, next);
    } catch {
      /* localStorage may be unavailable in private mode */
    }
    api
      .patch('/api/user/me', { theme: next })
      .catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return ctx;
}
