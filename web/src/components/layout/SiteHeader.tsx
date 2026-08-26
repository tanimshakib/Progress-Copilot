import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';

/**
 * Shared site navbar used by BOTH the landing page and the auth page
 * (/login, /signup). It reuses the same:
 *   - Brand (logo + name) — clicks to `/`
 *   - Nav links (Home / Features / Resources / About) — smooth-scroll on
 *     landing, navigate-then-scroll on auth so each anchor still works.
 *   - Auth-aware right side (Login + Get Demo for guests, Actionable
 *     Dashboard pill + avatar for authed users).
 *
 * The `active` / `onSelect` props are optional and only matter on the
 * landing page (so clicking Home/Features/Resources/About can update the
 * "active pill" highlight). On the auth page they're omitted and the
 * pills default to a non-active style; clicking still navigates correctly.
 */

export const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Resources', href: '#resources' },
  { label: 'About', href: '#about' },
];

export function SiteHeader({
  active,
  onSelect,
  isAuthed,
}: {
  /** Currently highlighted nav item label. Undefined disables highlighting. */
  active?: string;
  /** Called when the user picks a nav item. Undefined disables highlighting. */
  onSelect?: (label: string) => void;
  isAuthed: boolean;
}) {
  const navigate = useNavigate();

  /** Click handler for nav links.
   *  - On the landing page (path `/`): smooth-scroll via the anchor.
   *  - On the auth page (or any other route): navigate to `/hash` and let
   *    the landing page handle the scroll on mount. */
  const handleNavClick =
    (href: string, label: string) => (e: React.MouseEvent) => {
      onSelect?.(label);
      if (window.location.pathname !== '/') {
        e.preventDefault();
        navigate('/' + href);
      }
      // else: let the default anchor behaviour smooth-scroll in-page.
    };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4 md:px-8 bg-transparent border-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform shrink-0 border border-purple-500/30">
            <img src="/logo.svg" alt="Progress Copilot Logo" className="w-full h-full object-cover rounded-full" />
            <div className="absolute inset-0 bg-purple-500 blur-md opacity-25 rounded-full -z-10" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-none tracking-tight text-white flex items-center gap-1">
              Progress <span className="text-purple-300">Copilot</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
              A PLATFORM FOR SMARTER PROGRESS
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-full px-4 py-1.5 backdrop-blur-md shadow-xl bg-transparent">
          {NAV_LINKS.map((l) => {
            const isActive = active === l.label;
            return (
              <a
                key={l.label}
                href={l.href}
                onClick={handleNavClick(l.href, l.label)}
                className={[
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-all',
                  isActive
                    ? 'text-white bg-purple-950/80 border border-purple-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        <AuthAwareActions isAuthed={isAuthed} />
      </div>
    </header>
  );
}

/* Renders Login + Get Demo for guests; an avatar (with the
 * shared ProfileDropdown) for logged-in users. The "Get Demo"
 * button morphs into an "Actionable Dashboard" button whose
 * hover tooltip reads "Go To Dashboard". */
function AuthAwareActions({ isAuthed }: { isAuthed: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dashHover, setDashHover] = useState(false);

  if (!isAuthed) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/login')}
          className="hidden sm:block px-5 py-2 text-sm font-semibold text-gray-200 border border-white/10 rounded-full hover:bg-white/5 transition-colors"
        >
          Login
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-full shadow-glow-purple transition-all transform hover:scale-105 active:scale-95"
        >
          Get Demo
        </button>
      </div>
    );
  }

  const fullName = user?.fullName || user?.email || 'Progress user';
  const avatar = user?.avatar || '';
  const initial = fullName.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {/* "Actionable Dashboard" pill — same look as the original Get Demo.
          Hover surfaces a "Go To Dashboard" tooltip underneath. */}
      <div
        className="relative"
        onMouseEnter={() => setDashHover(true)}
        onMouseLeave={() => setDashHover(false)}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          aria-label="Go to dashboard"
          className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-full shadow-glow-purple transition-all transform hover:scale-105 active:scale-95"
        >
          Actionable Dashboard
        </button>
        {/* Hover tooltip */}
        <span
          aria-hidden
          className={[
            'absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-full',
            'bg-black/85 backdrop-blur-md border border-white/15',
            'text-[11px] font-semibold uppercase tracking-wider text-white whitespace-nowrap shadow-xl',
            'transition-all duration-200',
            dashHover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none',
          ].join(' ')}
        >
          Go To Dashboard
        </span>
      </div>

      {/* Avatar trigger for the profile dropdown — same behaviour as the
          TopNavbar version: clicking again toggles it closed. */}
      <button
        ref={avatarBtnRef}
        type="button"
        onClick={() => setProfileOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={profileOpen}
        aria-label="Open profile menu"
        className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/15 hover:ring-purple-500/60 transition-all"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-bold">
            {initial}
          </div>
        )}
      </button>

        <AnimatePresence>
          {profileOpen && (
            <ProfileDropdown
              onClose={() => setProfileOpen(false)}
              ignoreRef={avatarBtnRef}
            />
          )}
        </AnimatePresence>
    </div>
  );
}
