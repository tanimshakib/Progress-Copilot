import { NavLink, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  GROUP_A,
  GROUP_B,
  GROUP_C,
  SETTINGS_ITEM,
  type NavItem,
} from './navItems';

/**
 * Sidebar — left rail for the private layout.
 *
 * Structure (matches Phase 3 spec):
 *   - Brand: Logo + Name + Slogan + collapse toggle (<)
 *   - Group A: Dashboard, My Progress, AI Assistant
 *   - Divider
 *   - Group B: Target, Tasks, Reminder, Notes, Courses
 *   - Divider
 *   - Group C: Projects, Life Path, Reports
 *   - Bottom: Settings
 *
 * Active item is highlighted via NavLink's `isActive` callback. Collapse
 * state is controlled by the parent (`PrivateLayout`) so the main column
 * can animate its left-padding in lockstep with the rail's width.
 */

type Item = NavItem & { icon: JSX.Element };

export const SIDEBAR_WIDTH_EXPANDED = '16rem'; // 64 → 256px
export const SIDEBAR_WIDTH_COLLAPSED = '78px'; // 78px

export function Sidebar({
  collapsed: collapsedProp,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
}) {
  const { theme } = useTheme();
  // We render text-coloured icons that need to contrast on the current
  // background; the actual class is computed per-item inside SidebarLink.
  void theme;
  const collapsed = collapsedProp;

  // Auto-collapse on narrow viewports, but never auto-expand.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 900 && !collapsed) {
        onCollapsedChange(true);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [collapsed, onCollapsedChange]);

  return (
    <aside
      className={
        'fixed inset-y-0 left-0 z-30 hidden md:flex md:flex-col ' +
        'border-r border-purple-200/80 dark:border-white/10 ' +
        'bg-gradient-to-b from-slate-50/95 via-indigo-50/90 to-purple-50/80 dark:from-[#0e091f]/95 dark:via-[#0b0717]/95 dark:to-[#080512]/95 backdrop-blur-xl ' +
        'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
        (collapsed ? 'w-[78px]' : 'w-64')
      }
      aria-label="Primary navigation"
    >
      {/* ───────── Brand + collapse ───────── */}
      <div
        className={
          'flex items-center h-16 shrink-0 border-b border-purple-200/70 dark:border-white/10 ' +
          (collapsed ? 'justify-center px-2' : 'justify-between px-4')
        }
      >
        {/* Brand links back to home; only the inline logo icon is shown when
            collapsed. Clicking either logo returns the user to the landing. */}
        <Link
          to="/"
          aria-label="Go to home page"
          className="flex items-center gap-3 group"
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-purple-900/30 shrink-0 border border-purple-500/30">
            <img src="/logo.svg" alt="Progress Copilot Logo" className="w-full h-full object-cover rounded-full" />
            <div className="absolute inset-0 bg-purple-500 blur-md opacity-25 rounded-full -z-10" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                Progress <span className="text-purple-600 dark:text-purple-300">Copilot</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-600 dark:text-gray-400 mt-0.5">
                Smarter Progress
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={() => onCollapsedChange(true)}
            aria-label="Collapse sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/10 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeftIcon />
          </button>
        )}
      </div>

      {/* When collapsed, the < button floats on the right edge. */}
      {collapsed && (
        <button
          type="button"
          onClick={() => onCollapsedChange(false)}
          aria-label="Expand sidebar"
          className="absolute -right-3 top-6 z-10 h-7 w-7 rounded-full border border-purple-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0717] text-slate-700 dark:text-gray-400 hover:text-white hover:bg-purple-600 transition-colors flex items-center justify-center shadow-md"
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* ───────── Nav groups ───────── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <NavGroup items={GROUP_A_ITEMS} collapsed={collapsed} />
        <Divider />
        <NavGroup items={GROUP_B_ITEMS} collapsed={collapsed} />
        <Divider />
        <NavGroup items={GROUP_C_ITEMS} collapsed={collapsed} />
      </nav>

      {/* ───────── Settings pinned at bottom ───────── */}
      <div className="border-t border-purple-200/70 dark:border-white/10 px-2.5 py-3">
        <SidebarLink
          item={{ ...SETTINGS_ITEM, icon: <GearIcon /> }}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

/* ────────────────────── Sub-components ────────────────────── */

function NavGroup({ items, collapsed }: { items: Item[]; collapsed: boolean }) {
  return (
    <ul className="space-y-1 mb-1">
      {items.map((item) => (
        <li key={item.to}>
          <SidebarLink item={item} collapsed={collapsed} />
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <hr className="my-3 border-purple-200/70 dark:border-white/10" />;
}

function SidebarLink({ item, collapsed }: { item: Item; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
          isActive
            ? 'bg-gradient-to-r from-purple-600/20 via-purple-500/15 to-fuchsia-500/10 text-purple-900 dark:text-white border-l-4 border-fuchsia-500 shadow-sm font-bold'
            : 'text-slate-700 dark:text-gray-300 hover:text-purple-900 dark:hover:text-white hover:bg-purple-500/10 dark:hover:bg-white/5 border border-transparent',
          collapsed ? 'justify-center px-0' : '',
        ].join(' ')
      }
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"
      >
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

/* ────────────────────── Icons (inline SVG, 18px) ────────────────────── */

function svg(d: string) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      {d.split('|').map((seg, i) => (
        <path key={i} d={seg} />
      ))}
    </svg>
  );
}
const HomeIcon = () =>
  svg('M3 11.5 12 4l9 7.5|M5 10v10h14V10');
const ChartIcon = () => svg('M3 3v18h18|M7 15l3-3 3 3 5-5');
const SparkleIcon = () =>
  svg(
    'M12 2v6|M12 16v6|M4.93 4.93l4.24 4.24|M14.83 14.83l4.24 4.24|M2 12h6|M16 12h6|M4.93 19.07l4.24-4.24|M14.83 9.17l4.24-4.24',
  );
const TargetIcon = () =>
  svg(
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z|M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  );
const CheckIcon = () =>
  svg('M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11');
const BellIcon = () =>
  svg(
    'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M13.73 21a2 2 0 0 1-3.46 0',
  );
const NoteIcon = () =>
  svg('M4 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4z|M8 9h8M8 13h6M8 17h4');
const BookIcon = () =>
  svg('M4 19.5A2.5 2.5 0 0 1 6.5 17H20|M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z');
const FolderIcon = () =>
  svg(
    'M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  );
const PathIcon = () =>
  svg('M5 4v16M5 4h6a4 4 0 0 1 4 4v8a4 4 0 0 0 4 4');
const GearIcon = () =>
  svg(
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
  );

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ────────────────────── Group lists (icons defined above) ────────────────────── */

const GROUP_A_ITEMS: Item[] = [
  { ...GROUP_A[0], icon: <HomeIcon /> },
  { ...GROUP_A[1], icon: <ChartIcon /> },
  { ...GROUP_A[2], icon: <SparkleIcon /> },
];

const GROUP_B_ITEMS: Item[] = [
  { ...GROUP_B[0], icon: <TargetIcon /> },
  { ...GROUP_B[1], icon: <CheckIcon /> },
  { ...GROUP_B[2], icon: <BellIcon /> },
  { ...GROUP_B[3], icon: <NoteIcon /> },
  { ...GROUP_B[4], icon: <BookIcon /> },
];

const GROUP_C_ITEMS: Item[] = [
  { ...GROUP_C[0], icon: <FolderIcon /> },
  { ...GROUP_C[1], icon: <PathIcon /> },
  { ...GROUP_C[2], icon: <ChartIcon /> },
];