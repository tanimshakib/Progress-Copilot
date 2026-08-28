import type { ReactNode } from 'react';

/**
 * Single source of truth for dashboard navigation. The Sidebar reads it
 * for rendering, and the TopNavbar reads it for the dynamic page title.
 */
export type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  // Optional: provide a render function so the icon tree is computed
  // only where it's needed (Sidebar), not on every Title lookup.
  icon?: ReactNode;
};

export const GROUP_A: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/my-progress', label: 'My Progress' },
  { to: '/dashboard/ai-assistant', label: 'AI Assistant' },
  { to: '/dashboard/leaderboard', label: 'Leaderboard' },
];

export const GROUP_B: NavItem[] = [
  { to: '/dashboard/targets', label: 'Target' },
  { to: '/dashboard/tasks', label: 'Tasks' },
  { to: '/dashboard/reminders', label: 'Reminder' },
  { to: '/dashboard/notes', label: 'Notes' },
  { to: '/dashboard/courses', label: 'Courses' },
];

export const GROUP_C: NavItem[] = [
  { to: '/dashboard/projects', label: 'Projects' },
  { to: '/dashboard/life-path', label: 'Life Path' },
  { to: '/dashboard/reports', label: 'Reports' },
];

export const SETTINGS_ITEM: NavItem = {
  to: '/dashboard/settings',
  label: 'Settings',
};

export const ALL_NAV_ITEMS: NavItem[] = [
  ...GROUP_A,
  ...GROUP_B,
  ...GROUP_C,
  SETTINGS_ITEM,
];

/**
 * Pick the matching label for the current pathname.
 * Falls back to "Dashboard" so the navbar is never empty.
 */
export function titleForPath(pathname: string): string {
  // exact-match first (handles the `end` flag for /dashboard itself)
  for (const item of ALL_NAV_ITEMS) {
    if (item.end && pathname === item.to) return item.label;
  }
  // longest-prefix wins so `/dashboard/notes/123` shows "Notes"
  const sorted = [...ALL_NAV_ITEMS].sort((a, b) => b.to.length - a.to.length);
  for (const item of sorted) {
    if (!item.end && pathname.startsWith(item.to)) return item.label;
  }
  return 'Dashboard';
}
