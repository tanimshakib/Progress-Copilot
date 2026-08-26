import { useEffect, useRef, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * ProfileDropdown — glassmorphism animated menu anchored under the navbar avatar.
 * Animates in on open and animates up on close using Framer Motion.
 */
export function ProfileDropdown({
  onClose,
  ignoreRef,
}: {
  onClose: () => void;
  ignoreRef?: RefObject<HTMLElement>;
}) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (panelRef.current.contains(target)) return;
      if (ignoreRef?.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, ignoreRef]);

  const fullName = user?.fullName || 'Progress user';
  const email = user?.email || '';
  const avatar = user?.avatar || '';
  const initial = fullName.trim().charAt(0).toUpperCase();

  const go = (path: string) => () => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
    } finally {
      setTheme('dark');
      navigate('/', { replace: true });
    }
  };

  return (
    <motion.div
      ref={panelRef}
      role="menu"
      aria-label="Profile menu"
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-4 top-[calc(100%+12px)] w-[19.5rem] rounded-2xl z-50 p-[1.5px] bg-gradient-to-br from-fuchsia-500/60 via-purple-500/40 to-sky-400/60 shadow-[0_20px_50px_rgba(99,102,241,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
      style={{ transformOrigin: 'top right' }}
    >
      <div className="relative w-full h-full rounded-[14px] overflow-hidden p-1 bg-gradient-to-b from-slate-50 via-indigo-50/90 to-purple-50 text-slate-900 dark:bg-gradient-to-b dark:from-[#160f2e] dark:via-[#110a24] dark:to-[#0b0718] dark:text-white backdrop-blur-xl border border-purple-200/80 dark:border-purple-500/25">
        {/* ───── Header ───── */}
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-purple-500/40 shadow-md">
              {avatar ? (
                <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-purple-700 via-indigo-600 to-sky-500 text-white font-extrabold text-xl">
                  {initial}
                </div>
              )}
            </div>
            <div className="mt-3 min-w-0">
              <div className="font-extrabold text-[15px] text-slate-900 dark:text-white truncate">
                {fullName}
              </div>
              <div className="text-xs text-slate-600 dark:text-violet-300/80 truncate mt-0.5 font-medium">
                {email}
              </div>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={go('/dashboard/profile')}
              className="mt-4 w-full h-10 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] transition"
            >
              View Profile
            </button>
          </div>
        </div>

        <Divider />

        {/* ───── Theme toggle ───── */}
        <div className="px-2 py-1.5">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-800 dark:text-white/90 hover:bg-purple-500/10 dark:hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15 dark:bg-white/15 text-purple-700 dark:text-white">
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </span>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-glow-indigo' : 'bg-slate-300'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`h-5 w-5 rounded-full bg-white shadow-md flex items-center justify-center ${
                  theme === 'dark' ? 'translate-x-5 text-indigo-700' : 'translate-x-0 text-amber-500'
                }`}
              >
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
              </motion.span>
            </span>
          </button>
        </div>

        <Divider />

        {/* ───── Links ───── */}
        <div className="px-2 py-1.5">
          <MenuItem onClick={go('/dashboard')} icon={<HomeIcon />}>
            Dashboard
          </MenuItem>
          <MenuItem onClick={go('/dashboard/ai-assistant')} icon={<SparkIcon />}>
            Edith AI Assistant
          </MenuItem>
          <MenuItem onClick={go('/dashboard/settings')} icon={<GearIcon />}>
            Settings
          </MenuItem>
        </div>

        <Divider />

        {/* ───── Logout ───── */}
        <div className="px-2 py-1.5 pb-2">
          <MenuItem onClick={handleLogout} icon={<LogoutIcon />} tone="danger">
            Logout
          </MenuItem>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────── Local helpers ────────────────────── */

function Divider() {
  return <hr className="mx-4 border-slate-300/40 dark:border-white/15" />;
}

function MenuItem({
  children,
  onClick,
  icon,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-rose-600 dark:text-pink-300 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:bg-pink-500/20 dark:hover:text-white'
      : 'text-slate-700 dark:text-white/90 hover:bg-purple-500/10 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white';
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${toneClass}`}
    >
      {icon && (
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 dark:bg-white/10 text-purple-700 dark:text-white"
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

/* ────────────────────── Icons ────────────────────── */

function svg(d: string, size = 16) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ height: size, width: size }}
    >
      {d.split('|').map((seg, i) => (
        <path key={i} d={seg} />
      ))}
    </svg>
  );
}

const HomeIcon = () => svg('M3 11.5 12 4l9 7.5|M5 10v10h14V10', 15);
const SparkIcon = () =>
  svg(
    'M12 3v4|M12 17v4|M5 12H1|M23 12h-4|M6.34 6.34 4.22 4.22|M19.78 19.78l-2.12-2.12|M6.34 17.66l-2.12 2.12|M19.78 4.22l-2.12 2.12',
    15,
  );
const GearIcon = () =>
  svg(
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
    15,
  );
const LogoutIcon = () =>
  svg('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9', 15);
const SunIcon = () =>
  svg(
    'M12 4V2|M12 22v-2|M4 12H2|M22 12h-2|M5.6 5.6 4.2 4.2|M19.8 19.8l-1.4-1.4|M5.6 18.4l-1.4 1.4|M19.8 4.2l-1.4 1.4|M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    15,
  );
const MoonIcon = () =>
  svg('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z', 15);