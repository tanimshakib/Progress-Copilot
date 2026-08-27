import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Flame,
  Coffee,
  Brain,
  Zap,
} from 'lucide-react';
import { useFocusTimer, type TimerMode } from '../../context/FocusTimerContext';

export function FocusTimerCard() {
  const {
    mode,
    isRunning,
    formattedTime,
    progress,
    totalSessionsCompleted,
    isMuted,
    start,
    pause,
    stop,
    setMode,
    toggleMute,
    skip,
    fastForwardSession,
  } = useFocusTimer();

  const strokeDashoffset = 440 - (440 * progress) / 100;

  const modeThemes: Record<
    TimerMode,
    {
      title: string;
      color: string;
      glow: string;
      gradient: string;
      border: string;
      icon: any;
    }
  > = {
    work: {
      title: 'Deep Focus Session',
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.35)',
      gradient: 'from-purple-600 via-fuchsia-600 to-indigo-600',
      border: 'border-purple-500/30',
      icon: Brain,
    },
    shortBreak: {
      title: 'Short Break',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.35)',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      border: 'border-emerald-500/30',
      icon: Coffee,
    },
    longBreak: {
      title: 'Extended Rest',
      color: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.35)',
      gradient: 'from-sky-600 via-blue-600 to-indigo-600',
      border: 'border-blue-500/30',
      icon: Coffee,
    },
  };

  const currentTheme = modeThemes[mode];
  const Icon = currentTheme.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 shadow-xl dark:shadow-glow-purple">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-r ${currentTheme.gradient} shadow-md`}
          >
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
              {currentTheme.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-violet-300/70">
              {mode === 'work' ? 'Earn +2 points per 25-minute focus session' : 'Rest your eyes & refresh'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute chimes' : 'Mute chimes'}
          className="p-2 rounded-xl text-slate-500 dark:text-violet-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-500/10 transition"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-[#0c0819] border border-purple-200/60 dark:border-cardBorder/40 mb-6">
        {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              mode === m
                ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {m === 'work' ? 'Focus (25m)' : m === 'shortBreak' ? 'Break (5m)' : 'Rest (15m)'}
          </button>
        ))}
      </div>

      {/* Timer Circular Display */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <div className="relative w-52 h-52 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background circle track */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-purple-200/60 dark:stroke-white/5"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={currentTheme.color}
              strokeWidth="10"
              strokeDasharray={440}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${currentTheme.glow})` }}
            />
          </svg>

          {/* Time digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-black text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight font-mono">
              {formattedTime}
            </span>
            <span className="text-[11px] font-bold text-purple-600 dark:text-fuchsia-300 mt-1 uppercase tracking-wider">
              {isRunning ? 'Running' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Control Buttons */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={stop}
          title="Reset Timer"
          className="p-3 rounded-2xl border border-purple-200 dark:border-cardBorder text-slate-600 dark:text-violet-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/10 transition active:scale-95"
        >
          <RotateCcw size={18} />
        </button>

        {isRunning ? (
          <button
            type="button"
            onClick={pause}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:brightness-110 active:scale-95 transition"
          >
            <Pause size={18} /> Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className={`px-8 py-3.5 rounded-2xl bg-gradient-to-r ${currentTheme.gradient} text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 hover:brightness-110 active:scale-95 transition`}
          >
            <Play size={18} /> Start Focus
          </button>
        )}

        <button
          type="button"
          onClick={skip}
          title="Skip to next session"
          className="p-3 rounded-2xl border border-purple-200 dark:border-cardBorder text-slate-600 dark:text-violet-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/10 transition active:scale-95"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Bottom Session Stats & Fast-Forward shortcut */}
      <div className="mt-6 pt-4 border-t border-purple-200/60 dark:border-cardBorder/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-fuchsia-300">
          <Flame size={15} className="text-amber-500" />
          <span>{totalSessionsCompleted} Sessions Done</span>
          <span className="text-slate-400 dark:text-violet-300/40">
            (+{totalSessionsCompleted * 2} pts earned)
          </span>
        </div>

        <button
          type="button"
          onClick={fastForwardSession}
          title="Fast-forward test (awards points on finish)"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-violet-300 hover:bg-purple-500/20 transition"
        >
          <Zap size={11} className="text-amber-500" /> Complete Test
        </button>
      </div>
    </div>
  );
}
