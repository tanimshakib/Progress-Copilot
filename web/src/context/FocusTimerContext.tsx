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

export const DEFAULT_DURATIONS_MINUTES: Record<TimerMode, number> = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

const STORAGE_KEY = 'pc_focus_timer_durations';

function getInitialDurations(): Record<TimerMode, number> {
  if (typeof window === 'undefined') return DEFAULT_DURATIONS_MINUTES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        work: Math.max(1, Math.min(180, Number(parsed.work) || 25)),
        shortBreak: Math.max(1, Math.min(60, Number(parsed.shortBreak) || 5)),
        longBreak: Math.max(1, Math.min(90, Number(parsed.longBreak) || 15)),
      };
    }
  } catch {
    /* fallback to default */
  }
  return DEFAULT_DURATIONS_MINUTES;
}

export type FocusTimerContextType = {
  mode: TimerMode;
  secondsLeft: number;
  totalDuration: number;
  durationsInMinutes: Record<TimerMode, number>;
  isRunning: boolean;
  totalSessionsCompleted: number;
  isMuted: boolean;
  progress: number; // 0 to 100%
  formattedTime: string;
  start: () => void;
  pause: () => void;
  stop: () => void; // Reset current timer
  setMode: (mode: TimerMode) => void;
  setCustomDurationInMinutes: (mode: TimerMode, minutes: number) => void;
  resetAllDurationsToDefault: () => void;
  toggleMute: () => void;
  skip: () => void;
  fastForwardSession: () => void; // Development convenience / instant finish
};

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const { refresh } = useAuth();
  const { addToast } = useToast();

  const [mode, setModeState] = useState<TimerMode>('work');
  const [durationsInMinutes, setDurationsInMinutes] = useState<Record<TimerMode, number>>(getInitialDurations);

  const [modeSeconds, setModeSeconds] = useState<Record<TimerMode, number>>(() => {
    const initialMins = getInitialDurations();
    return {
      work: initialMins.work * 60,
      shortBreak: initialMins.shortBreak * 60,
      longBreak: initialMins.longBreak * 60,
    };
  });

  const [isRunning, setIsRunning] = useState(false);
  const [totalSessionsCompleted, setTotalSessionsCompleted] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const durationsInSeconds: Record<TimerMode, number> = {
    work: durationsInMinutes.work * 60,
    shortBreak: durationsInMinutes.shortBreak * 60,
    longBreak: durationsInMinutes.longBreak * 60,
  };

  const secondsLeft = modeSeconds[mode];
  const totalDuration = durationsInSeconds[mode];
  const progress = Math.min(100, Math.max(0, ((totalDuration - secondsLeft) / totalDuration) * 100));

  // Refs for current callbacks to avoid timer stale closures
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const durationsInSecondsRef = useRef(durationsInSeconds);
  durationsInSecondsRef.current = durationsInSeconds;

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);

    const currentM = modeRef.current;
    const defaultM = durationsInSecondsRef.current[currentM];

    setModeSeconds((prev) => ({
      ...prev,
      [currentM]: defaultM,
    }));

    if (currentM === 'work') {
      if (!isMutedRef.current) {
        sounds.playTimerCompleteChime();
      }

      try {
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

      setModeState('shortBreak');
    } else {
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
    }
  }, [addToast, refresh]);

  // Main countdown effect
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        setModeSeconds((prev) => {
          const currentM = modeRef.current;
          const currentVal = prev[currentM];
          if (currentVal <= 1) {
            clearInterval(interval);
            handleSessionComplete();
            return {
              ...prev,
              [currentM]: durationsInSecondsRef.current[currentM],
            };
          }
          return {
            ...prev,
            [currentM]: currentVal - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, handleSessionComplete]);

  const start = useCallback(() => {
    setIsRunning(true);
    if (!isMutedRef.current) sounds.playTick();
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (!isMutedRef.current) sounds.playTick();
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setModeSeconds((prev) => ({
      ...prev,
      [modeRef.current]: durationsInSecondsRef.current[modeRef.current],
    }));
    if (!isMutedRef.current) sounds.playTick();
  }, []);

  const setMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false);
    setModeState(newMode);
    if (!isMutedRef.current) sounds.playTick();
  }, []);

  const setCustomDurationInMinutes = useCallback((targetMode: TimerMode, minutes: number) => {
    const validMins = Math.max(1, Math.min(180, minutes));
    const newSeconds = validMins * 60;

    setDurationsInMinutes((prev) => {
      const next = { ...prev, [targetMode]: validMins };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

    setModeSeconds((prev) => {
      // If setting duration for currently selected mode and not running, or if it exceeds new max
      return {
        ...prev,
        [targetMode]: newSeconds,
      };
    });
  }, []);

  const resetAllDurationsToDefault = useCallback(() => {
    setDurationsInMinutes(DEFAULT_DURATIONS_MINUTES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setModeSeconds({
      work: DEFAULT_DURATIONS_MINUTES.work * 60,
      shortBreak: DEFAULT_DURATIONS_MINUTES.shortBreak * 60,
      longBreak: DEFAULT_DURATIONS_MINUTES.longBreak * 60,
    });
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
      setModeSeconds((prev) => ({
        ...prev,
        [modeRef.current]: 2,
      }));
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
        durationsInMinutes,
        isRunning,
        totalSessionsCompleted,
        isMuted,
        progress,
        formattedTime,
        start,
        pause,
        stop,
        setMode,
        setCustomDurationInMinutes,
        resetAllDurationsToDefault,
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
