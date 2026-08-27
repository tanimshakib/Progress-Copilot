import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { gamificationApi } from '../modules/gamification/gamificationApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { sounds } from '../lib/audio';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export const TIMER_DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60, // 25 minutes (1500s)
  shortBreak: 5 * 60, // 5 minutes (300s)
  longBreak: 15 * 60, // 15 minutes (900s)
};

export type FocusTimerContextType = {
  mode: TimerMode;
  secondsLeft: number;
  totalDuration: number;
  isRunning: boolean;
  totalSessionsCompleted: number;
  isMuted: boolean;
  progress: number; // 0 to 100%
  formattedTime: string;
  start: () => void;
  pause: () => void;
  stop: () => void; // Reset current timer
  setMode: (mode: TimerMode) => void;
  toggleMute: () => void;
  skip: () => void;
  fastForwardSession: () => void; // Development convenience / instant finish
};

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const { user, refresh } = useAuth();
  const { addToast } = useToast();

  const [mode, setModeState] = useState<TimerMode>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMER_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSessionsCompleted, setTotalSessionsCompleted] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const totalDuration = TIMER_DURATIONS[mode];
  const progress = Math.min(100, Math.max(0, ((totalDuration - secondsLeft) / totalDuration) * 100));

  // Refs for current callbacks to avoid timer stale closures
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);

    if (modeRef.current === 'work') {
      if (!isMutedRef.current) {
        sounds.playTimerCompleteChime();
      }

      try {
        // Record completed focus session in backend & award +2 points
        const res = await gamificationApi.recordPomodoroSession();
        await refresh();

        setTotalSessionsCompleted((prev) => prev + 1);

        addToast({
          title: '+2 Points: Focus Session Completed!',
          message: `Great job! You earned +2 points. Total points: ${res.points} pts.`,
          type: 'success',
          duration: 6000,
        });
      } catch (err: any) {
        addToast({
          title: 'Focus Session Completed!',
          message: 'Take a well-deserved break.',
          type: 'info',
        });
      }

      // Auto switch to break mode
      setModeState('shortBreak');
      setSecondsLeft(TIMER_DURATIONS.shortBreak);
    } else {
      // Break finished
      if (!isMutedRef.current) {
        sounds.playTick();
      }

      addToast({
        title: 'Break Finished!',
        message: 'Ready to start another focus session?',
        type: 'info',
        duration: 5000,
      });

      setModeState('work');
      setSecondsLeft(TIMER_DURATIONS.work);
    }
  }, [addToast, refresh]);

  // Main countdown effect
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, handleSessionComplete]);

  const start = useCallback(() => {
    setIsRunning(true);
    if (!isMuted) sounds.playTick();
  }, [isMuted]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (!isMuted) sounds.playTick();
  }, [isMuted]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(TIMER_DURATIONS[mode]);
    if (!isMuted) sounds.playTick();
  }, [mode, isMuted]);

  const setMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false);
    setModeState(newMode);
    setSecondsLeft(TIMER_DURATIONS[newMode]);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const skip = useCallback(() => {
    setIsRunning(false);
    if (mode === 'work') {
      setMode('shortBreak');
    } else {
      setMode('work');
    }
  }, [mode, setMode]);

  const fastForwardSession = useCallback(() => {
    if (isRunning) {
      setSecondsLeft(2);
    } else {
      handleSessionComplete();
    }
  }, [isRunning, handleSessionComplete]);

  // Format MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <FocusTimerContext.Provider
      value={{
        mode,
        secondsLeft,
        totalDuration,
        isRunning,
        totalSessionsCompleted,
        isMuted,
        progress,
        formattedTime,
        start,
        pause,
        stop,
        setMode,
        toggleMute,
        skip,
        fastForwardSession,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const context = useContext(FocusTimerContext);
  if (!context) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}
