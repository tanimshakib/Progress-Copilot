import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import Logo from '../components/Logo';
import { SiteHeader } from '../components/layout/SiteHeader';

type Mode = 'login' | 'signup';

export default function AuthPage({
  initialMode,
}: {
  /** When the page mounts, which form to show. Default = login.
   *  /signup passes initialMode="signup" so the route directly renders
   *  the signup form (the route still also reads ?mode=signup). */
  initialMode?: Mode;
}) {
  const [params, setParams] = useSearchParams();
  const paramMode = params.get('mode');
  // `paramMode` always wins if present; `initialMode` is only used as the
  // *initial* default when the URL has no `?mode=` (so /signup lands on
  // signup, /login lands on login). This is what makes the in-form
  // "Create new account? Signup / Already have an account? Login" button
  // actually swap forms — without this guard, clicking the button would
  // flip the URL to ?mode=login but initialMode='signup' would force the
  // signup form back, silently swallowing the click.
  const mode: Mode =
    paramMode === 'signup' ||
    (paramMode === null && initialMode === 'signup')
      ? 'signup'
      : 'login';
  const swap = (m: Mode) => setParams({ mode: m });

  const { user } = useAuth();
  const isAuthed = !!user;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-transparent">
      {/* Shared site navbar — same component, same behaviour, same auth-aware
          right-hand side as the landing page. Authed users still see
          Actionable Dashboard + avatar dropdown here. */}
      <SiteHeader isAuthed={isAuthed} />

      <div className="flex-1 flex items-center justify-center px-4 py-10 relative">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-purple-500/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0e0a1c]/80 backdrop-blur-xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Visual side */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#1a1133] via-[#13091f] to-[#1f0e2a] relative">
          <Logo />
          <div className="relative flex-1 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full border border-purple-500/20" />
            </div>
            <motion.img
              src="/mascot.png"
              alt="Progress Copilot mascot"
              className="w-64 object-contain drop-shadow-[0_20px_60px_rgba(168,85,247,0.45)]"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-sm text-gray-300 max-w-xs">
            A platform for smarter progress — set targets, track tasks, and grow every day.
          </p>
        </div>

        {/* Form side */}
        <div className="p-8 sm:p-10 flex flex-col justify-center min-h-[520px] relative">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <LoginForm onSwitch={() => swap('signup')} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <SignupForm onSwitch={() => swap('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      // Per spec: stay on the landing page after login so the dynamic
      // header (avatar + Actionable Dashboard) can render immediately.
      // The user moves into the dashboard via the new buttons / dropdown.
      navigate('/', { replace: true });
    } catch (e: any) {
      setErr(getErrorMessage(e, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="mb-2">
        <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
        <p className="text-sm text-gray-400 mt-1">Sign in to keep your progress moving.</p>
      </div>

      <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
      <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} placeholder="Your password" required />

      {err && <p className="text-sm text-red-400">{err}</p>}

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={loading}
        type="submit"
        className="w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold py-3 shadow-glow-purple transition-all"
      >
        {loading ? 'Signing in…' : 'Login'}
      </motion.button>

      <p className="text-center text-sm text-gray-400">
        Create new account or{' '}
        <button type="button" onClick={onSwitch} className="text-purple-300 hover:text-purple-200 font-semibold">
          Signup
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup(fullName, email, password, confirmPassword);
      // After signup, also stay on the landing page so the auth-aware
      // header swaps in (Avatar + Actionable Dashboard), per spec.
      navigate('/', { replace: true });
    } catch (e: any) {
      setErr(getErrorMessage(e, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="mb-2">
        <h1 className="text-3xl font-black tracking-tight text-white">Create your account</h1>
        <p className="text-sm text-gray-400 mt-1">Start tracking smarter progress today.</p>
      </div>

      <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Jane Doe" required />
      <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
      <Field label="Password" type="password" autoComplete="new-password" value={password} onChange={setPassword} placeholder="At least 8 characters" required />
      <Field label="Confirm password" type="password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" required />

      {err && <p className="text-sm text-red-400">{err}</p>}

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={loading}
        type="submit"
        className="w-full rounded-full bg-[#ccff00] disabled:opacity-60 text-black font-extrabold py-3 shadow-glow-lime transition-all hover:bg-[#b8e600]"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </motion.button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-purple-300 hover:text-purple-200 font-semibold">
          Login
        </button>
      </p>
    </form>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder, required, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="relative mt-1">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full px-4 py-3 pr-11 rounded-xl bg-[#120e22] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-300 transition-colors focus:outline-none p-1 rounded-md"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </label>
  );
}