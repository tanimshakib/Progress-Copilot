import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useFocusTimer } from '../../context/FocusTimerContext';

export function FloatingFocusWidget() {
  const {
    mode,
    isRunning,
    formattedTime,
    progress,
    start,
    pause,
    stop,
    setMode,
  } = useFocusTimer();

  const [isExpanded, setIsExpanded] = useState(false);

  const modeBg =
    mode === 'work'
      ? 'bg-purple-600'
      : mode === 'shortBreak'
      ? 'bg-emerald-600'
      : 'bg-sky-600';

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto">
      {/* Expanded Widget Popup */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-72 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-white/95 dark:bg-[#160e2e]/95 backdrop-blur-xl p-4 shadow-2xl text-slate-900 dark:text-white"
          >
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/60 dark:border-cardBorder/40 mb-3">
              <div className="flex items-center gap-2">
                <Brain className="text-purple-600 dark:text-fuchsia-400" size={18} />
                <span className="font-extrabold text-xs tracking-wide">Focus Timer</span>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0c0819] mb-3 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMode('work')}
                className={`py-1 rounded-lg transition ${
                  mode === 'work' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 dark:text-violet-300/70'
                }`}
              >
                Work
              </button>
              <button
                type="button"
                onClick={() => setMode('shortBreak')}
                className={`py-1 rounded-lg transition ${
                  mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-violet-300/70'
                }`}
              >
                Break
              </button>
              <button
                type="button"
                onClick={() => setMode('longBreak')}
                className={`py-1 rounded-lg transition ${
                  mode === 'longBreak' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 dark:text-violet-300/70'
                }`}
              >
                Rest
              </button>
            </div>

            {/* Counter */}
            <div className="text-center py-2">
              <div className="font-black text-3xl font-mono tracking-tight text-slate-900 dark:text-white">
                {formattedTime}
              </div>
              <div className="text-[10px] text-purple-600 dark:text-fuchsia-300 font-bold uppercase tracking-wider mt-0.5">
                {mode === 'work' ? '+2 pts upon completion' : 'Resting'}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className={`h-full ${modeBg} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={stop}
                className="p-2 rounded-xl border border-purple-200 dark:border-cardBorder text-slate-500 dark:text-violet-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <RotateCcw size={14} />
              </button>

              {isRunning ? (
                <button
                  type="button"
                  onClick={pause}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <Pause size={14} /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className={`px-5 py-2 rounded-xl ${modeBg} hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition`}
                >
                  <Play size={14} /> Start
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`px-4 py-2.5 rounded-full shadow-2xl border border-white/20 text-white font-bold text-xs flex items-center gap-2.5 backdrop-blur-xl ${
          isRunning ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 animate-pulse' : 'bg-slate-900/90 dark:bg-purple-950/90'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <Timer size={16} />
          {isRunning && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        <span className="font-mono text-sm font-black tracking-tight">{formattedTime}</span>

        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </motion.button>
    </div>
  );
}
