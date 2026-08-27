import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Sparkles, Star } from 'lucide-react';
import { sounds } from '../../lib/audio';

type ConfettiCelebrationProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  pointsAwarded?: number;
  subtitle?: string;
};

const COLORS = [
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
];

export function ConfettiCelebration({
  isOpen,
  onClose,
  title = 'Course Milestone Completed!',
  pointsAwarded = 50,
  subtitle = 'Great dedication! You earned a milestone bonus.',
}: ConfettiCelebrationProps) {
  useEffect(() => {
    if (isOpen) {
      sounds.playCelebrationChime();
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  // Generate random particle positions
  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500 - 80,
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.8 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.15,
      shape: i % 3 === 0 ? 'star' : i % 2 === 0 ? 'rect' : 'circle',
    }));
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
          {/* Backdrop flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-purple-950/20 backdrop-blur-[2px]"
          />

          {/* Confetti Particles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: p.scale,
                  opacity: [1, 1, 0],
                  rotate: p.rotation,
                }}
                transition={{
                  duration: 1.8 + Math.random() * 0.8,
                  ease: [0.15, 0.9, 0.35, 1],
                  delay: p.delay,
                }}
                className="absolute"
                style={{
                  width: p.shape === 'rect' ? 12 : 10,
                  height: p.shape === 'rect' ? 6 : 10,
                  borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0',
                  backgroundColor: p.color,
                  boxShadow: `0 0 12px ${p.color}`,
                }}
              >
                {p.shape === 'star' && (
                  <Star size={12} fill={p.color} stroke={p.color} className="opacity-90" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Celebratory Central Banner */}
          <motion.div
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="relative pointer-events-auto max-w-sm w-full rounded-3xl border-2 border-purple-400/60 dark:border-fuchsia-500/50 bg-gradient-to-b from-white via-purple-50/90 to-indigo-50/90 dark:from-[#1b1037] dark:via-[#140b2b] dark:to-[#0c071a] p-6 text-center shadow-[0_0_50px_rgba(168,85,247,0.4)] backdrop-blur-xl"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-purple-400/30">
              <Award size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-extrabold text-xs mb-2">
              <Sparkles size={14} /> +{pointsAwarded} MILESTONE POINTS
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-violet-300/80 mt-1.5 leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-500/20 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
