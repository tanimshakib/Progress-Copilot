import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from '../components/layout/SiteHeader';

export default function LandingPage() {
  const [active, setActive] = useState('Home');
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col antialiased">
      <SiteHeader
        active={active}
        onSelect={(l) => setActive(l)}
        isAuthed={!!user}
      />

      <main className="flex-grow">
        <Hero isAuthed={!!user} />
        <Features />
        <Resources />
        <About />
        <CTA isAuthed={!!user} />
      </main>

      <Footer />
    </div>
  );
}

/* ────────────────────── Hero ────────────────────── */

function Hero({ isAuthed }: { isAuthed: boolean }) {
  const navigate = useNavigate();
  return (
    <section id="home" className="relative pt-8 md:pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      <div
        className="absolute -top-30 left-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none">
      </div>      <div className="absolute top-1/4 right-10 w-76 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-glow" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-semibold uppercase tracking-widest text-purple-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            SMARTER PROGRESS, ONE DAY AT A TIME
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Track. Focus.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 drop-shadow-lg">
              Grow with Copilot.
            </span>
          </h1>

          <div className="space-y-2 text-gray-300 font-medium text-base sm:text-lg mb-8">
            <p className="flex items-center gap-2 flex-wrap">
              <span>Targets</span> <span className="text-purple-500">•</span>
              <span>Tasks & Reminders</span> <span className="text-purple-500">•</span>
              <span>AI Assistant</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate(isAuthed ? '/dashboard' : '/signup')}
              className="px-7 py-3.5 rounded-full bg-[#ccff00] text-black font-extrabold text-sm flex items-center gap-2 shadow-glow-lime hover:bg-[#b8e600] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started <i className="fa-solid fa-arrow-right text-xs" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-7 py-3.5 rounded-full bg-[#120e22] text-white font-semibold text-sm border-2 border-orange-500 shadow-glow-orange hover:bg-orange-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isAuthed ? 'Dashboard' : 'Watch Demo'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative flex justify-center items-center">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full to-transparent flex items-center justify-center">
            <div className="w-full h-full rounded-full border-2 border-purple-500/30 flex items-center justify-center relative" />

            <div className="absolute inset-0 flex items-center justify-center z-10 mascot-float">
              <img
                src="/mascot.png"
                alt="Progress Copilot mascot"
                className="w-[260px] sm:w-[300px] object-contain drop-shadow-[0_20px_60px_rgba(168,85,247,0.45)]"
              />
            </div>

            <Badge className="-top-2 left-[14%] z-20 bg-[#281512] border-orange-500/50 text-orange-300" symbol="✦" label="Targets" />
            <Badge className="top-8 right-0 z-20 bg-[#0d2218] border-emerald-500/50 text-emerald-300" dot="bg-emerald-400" label="Streaks" delay={0.8} />
            <Badge className="top-1/3 -left-6 z-20 bg-[#0d1a2d] border-blue-500/50 text-blue-300" symbol="✦" label="AI Assistant" delay={1.2} />
            <Badge className="top-1/2 -right-8 z-20 bg-[#241e15] border-amber-500/40 text-amber-200" symbol="▲" label="Reports" delay={0.5} />
            <Badge className="bottom-10 left-2 z-20 bg-[#2b1020] border-pink-500/50 text-pink-300" symbol="◆" label="Projects" delay={1.6} />
            <Badge className="bottom-6 right-6 z-20 bg-[#1c122e] border-purple-500/50 text-purple-300" label="Life Path" delay={1.0} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ className = '', symbol, dot, label, delay = 0 }: { className?: string; symbol?: string; dot?: string; label: string; delay?: number }) {
  return (
    <div
      className={`badge-float absolute px-3 py-1 border rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {symbol && <span>{symbol}</span>}
      {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
      {label}
    </div>
  );
}

function Features() {
  const features = [
    { icon: 'fa-solid fa-bullseye', title: 'Smart Targets', desc: 'Set goals with priorities, deadlines and sub-tasks — Copilot tracks them for you.' },
    { icon: 'fa-solid fa-list-check', title: 'Tasks & Reminders', desc: 'Add tasks, get reminded before deadlines, mark them done to earn points.' },
    { icon: 'fa-solid fa-robot', title: 'AI Assistant "Edith"', desc: 'A conversational co-pilot that helps you plan, reflect and ship faster.' },
    { icon: 'fa-solid fa-book-open', title: 'Notes & Courses', desc: 'Capture ideas, build semester courses, and centralize your learning.' },
    { icon: 'fa-solid fa-chart-line', title: 'Life Path Timeline', desc: 'Visualize every target stepping towards your future goal.' },
    { icon: 'fa-solid fa-fire', title: 'Daily Streak & Points', desc: 'Build momentum. Earn points per task. Watch streaks grow.' },
  ];

  return (
    <section id="features" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest font-bold text-purple-400 block mb-2">WHAT YOU GET</span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">grow steadily</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="dark-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-5">
              <i className={f.icon} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Resources() {
  const items = [
    { icon: 'fa-solid fa-file-lines', title: 'Getting Started Guide', desc: 'Set up your workspace in under 5 minutes.', cta: 'Read guide' },
    { icon: 'fa-solid fa-bullseye', title: 'Target Templates', desc: 'Ready-made goal structures for career, fitness & study.', cta: 'Browse' },
    { icon: 'fa-solid fa-robot', title: 'AI Prompt Packs', desc: 'Hand-picked prompts for planning, reflection & focus.', cta: 'Get packs' },
    { icon: 'fa-solid fa-graduation-cap', title: 'Learn Copilot', desc: 'Video walkthroughs of every feature.', cta: 'Watch' },
    { icon: 'fa-solid fa-chart-line', title: 'Progress Playbook', desc: 'Strategies to keep your daily streak alive.', cta: 'Explore' },
    { icon: 'fa-solid fa-headset', title: 'Help Center', desc: 'FAQs and step-by-step troubleshooting.', cta: 'Open' },
  ];

  return (
    <section id="resources" className="relative py-20 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-purple-950/30 to-transparent" />
      <div className="relative z-10 text-center mb-14">
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-300/90">
          FREE RESOURCES
        </span>
        <h2 className="mt-6 text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white">
          Useful <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">Resources</span>
        </h2>
        <p className="mt-5 text-lg text-gray-300">Everything you need to build consistent progress — free.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((it) => (
          <div key={it.title} className="resource-card p-8 rounded-[28px] flex flex-col justify-between min-h-[250px] relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700/60 to-indigo-500/40 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-6">
              <i className={it.icon} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{it.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">{it.desc}</p>
            <button className="w-fit px-5 py-2 rounded-full bg-[#1a1528] border border-white/10 text-xs font-semibold text-white hover:bg-purple-600 transition-all">
              {it.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  const values = [
    { icon: 'fa-solid fa-user-check', title: 'User-centric', desc: 'No admin panel. Everything you do belongs to you.' },
    { icon: 'fa-solid fa-fire', title: 'Daily momentum', desc: 'Streaks and points keep you moving each day.' },
    { icon: 'fa-solid fa-shield-halved', title: 'Yours & private', desc: 'Encrypted at rest. Strict tenant isolation.' },
    { icon: 'fa-solid fa-feather', title: 'Lightweight', desc: 'Minimal UI. Focused on the work that matters.' },
    { icon: 'fa-solid fa-bolt', title: 'Powered by AI', desc: 'Edith on Gemini — plans, summaries, more.' },
  ];

  return (
    <section id="about" className="py-12 px-4 md:px-8 max-w-7xl mx-auto text-center">
      <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-400 block mb-8">WHY PROGRESS COPILOT?</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {values.map((v) => (
          <div key={v.title} className="dark-card p-4 rounded-2xl flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <i className={`${v.icon} text-sm`} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{v.title}</h4>
              <p className="text-[10px] text-gray-400 leading-tight">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA({ isAuthed }: { isAuthed: boolean }) {
  const navigate = useNavigate();
  return (
    <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-[#21112b] via-[#1a0e28] to-[#3a1a2b] border border-purple-500/20 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Ready to make every day count?
          </h2>
          <p className="text-sm text-purple-200/80 font-normal">Start tracking your progress in under a minute.</p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-4 shrink-0">
          <button
            onClick={() => navigate(isAuthed ? '/dashboard' : '/signup')}
            className="px-6 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs sm:text-sm shadow-glow-orange hover:from-orange-400 hover:to-amber-400 transition-all transform hover:-translate-y-0.5"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-glow-purple transition-all transform hover:-translate-y-0.5"
          >
            {isAuthed ? 'Dashboard' : 'Watch Demo'}
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#050409] border-t border-white/5 pt-16 pb-8 px-4 md:px-8 text-gray-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">
        <div className="lg:col-span-4 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-pink-500 flex items-center justify-center">
              <span className="text-white font-black text-lg italic">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-white tracking-tight">
                Progress <span className="text-purple-300">Copilot</span>
              </span>
              <span className="text-[8px] uppercase tracking-wider font-semibold text-gray-500">
                A PLATFORM FOR SMARTER PROGRESS
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 max-w-xs">A user-centric platform for tracking goals, tasks, learning and growth — all in one place.</p>
        </div>

        <div className="lg:col-span-2">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h5>
          <ul className="space-y-2.5 text-xs">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#resources" className="hover:text-white">Resources</a></li>
            <li><a href="#about" className="hover:text-white">About</a></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Modules</h5>
          <ul className="space-y-2.5 text-xs">
            <li>Targets</li>
            <li>Tasks</li>
            <li>AI Assistant</li>
            <li>Reports</li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Learn</h5>
          <ul className="space-y-2.5 text-xs">
            <li><a href="#resources" className="hover:text-white">Guides</a></li>
            <li><a href="#resources" className="hover:text-white">Templates</a></li>
            <li><a href="#resources" className="hover:text-white">FAQs</a></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Newsletter</h5>
          <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">Get product updates and free growth tips.</p>
          <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
            <input type="email" required placeholder="Enter your email" className="w-full pl-4 pr-10 py-2.5 bg-[#120e22] border border-white/10 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
            <button type="submit" className="absolute right-1.5 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-colors">
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
            </button>
          </form>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-[11px] text-gray-500">
        © {new Date().getFullYear()} Progress Copilot. All rights reserved.
      </div>
    </footer>
  );
}

