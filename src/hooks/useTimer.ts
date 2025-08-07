import { useState, useEffect, useRef } from 'react';
import type { Task, Session, Settings } from '../App';

interface TimerState {
  time: number;          // seconds for display (work elapsed or break remaining)
  isRunning: boolean;
  isBreak: boolean;
  startTime: number;     // ms reference for drift-free ticking
  sessionId: string;
  targetTime?: number;   // ms timestamp when break should end
}

export function useTimer(
  activeTask: Task | null,
  tasks: Task[],
  sessions: Session[],
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void,
  settings: Settings
) {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = localStorage.getItem('flow-timer-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        isRunning: false, // Always start paused when reloading
      } as TimerState;
    }
    return {
      time: 0,
      isRunning: false,
      isBreak: false,
      startTime: 0,
      sessionId: '',
      targetTime: undefined,
    };
  });

  const tickRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Save timer state to localStorage
  useEffect(() => {
    localStorage.setItem('flow-timer-state', JSON.stringify(timerState));
  }, [timerState]);

  // Drift-free ticker using requestAnimationFrame + wall clock
  useEffect(() => {
    const tick = () => {
      setTimerState(prev => {
        if (!prev.isRunning) return prev;

        const now = Date.now();

        if (!prev.isBreak) {
          // Work mode: time shows elapsed seconds since startTime
          const elapsedSec = Math.floor((now - prev.startTime) / 1000);
          if (elapsedSec !== prev.time) {
            return { ...prev, time: elapsedSec };
          }
          return prev;
        } else {
          // Break mode: countdown to targetTime
          if (!prev.targetTime) return prev;
          const remainingSec = Math.max(0, Math.ceil((prev.targetTime - now) / 1000));
          if (remainingSec !== prev.time) {
            // If finished, schedule end-of-break side effects after state update
            if (remainingSec === 0) {
              queueMicrotask(() => {
                setTimerState(current => ({
                  ...current,
                  isRunning: false,
                  isBreak: false,
                  time: 0,
                  targetTime: undefined,
                }));

                playNotification();

                if (settings.visualNotifications) {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Break time is over!', {
                      body: 'Ready to get back to work?',
                      icon: '/favicon.ico',
                    });
                  }
                }
              });
            }
            return { ...prev, time: remainingSec };
          }
          return prev;
        }
      });

      tickRef.current = requestAnimationFrame(tick);
    };

    // manage start/stop of rAF loop
    if (timerState.isRunning) {
      if (tickRef.current == null) {
        tickRef.current = requestAnimationFrame(tick);
      }
    } else {
      if (tickRef.current != null) {
        cancelAnimationFrame(tickRef.current);
        tickRef.current = null;
      }
    }

    return () => {
      if (tickRef.current != null) {
        cancelAnimationFrame(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.isBreak, settings.visualNotifications]);

  // Audio notification
  const playNotification = () => {
    if (!settings.audioNotifications) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.setValueAtTime(600, context.currentTime + 1);
      oscillator.frequency.setValueAtTime(800, context.currentTime + 2);

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 3);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const startTimer = () => {
    if (!activeTask) return;

    const sessionId = Date.now().toString();
    const now = Date.now();

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isBreak: false,
      startTime: now,
      sessionId,
      time: 0,
      targetTime: undefined,
    }));
  };

  const stopTimer = () => {
    if (!activeTask || !timerState.isRunning || timerState.isBreak) return;

    // Compute actual worked seconds based on wall clock
    const workedSeconds = Math.max(0, Math.floor((Date.now() - timerState.startTime) / 1000));
    const breakSeconds = Math.floor(workedSeconds / 5);

    // Save session
    const session: Session = {
      id: timerState.sessionId || Date.now().toString(),
      taskId: activeTask.id,
      taskName: activeTask.name,
      startTime: new Date(timerState.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: workedSeconds,
      date: new Date().toDateString(),
    };

    setSessions(prev => [...prev, session]);

    // Update task time
    const updatedTasks = tasks.map(task =>
      task.id === activeTask.id
        ? { ...task, timeSpent: task.timeSpent + workedSeconds }
        : task
    );
    localStorage.setItem('flow-tasks', JSON.stringify(updatedTasks));

    // Start break countdown drift-free
    const now = Date.now();
    const targetTime = now + breakSeconds * 1000;

    setTimerState(prev => ({
      ...prev,
      isRunning: breakSeconds > 0,
      isBreak: breakSeconds > 0,
      time: breakSeconds,
      startTime: now,
      targetTime: breakSeconds > 0 ? targetTime : undefined,
    }));

    if (breakSeconds === 0) {
      playNotification();
      if (settings.visualNotifications) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Break time is over!', {
            body: 'Ready to get back to work?',
            icon: '/favicon.ico',
          });
        }
      }
    }
  };

  const resetTimer = () => {
    setTimerState({
      time: 0,
      isRunning: false,
      isBreak: false,
      startTime: 0,
      sessionId: '',
      targetTime: undefined,
    });
  };

  const estimatedBreakTime = timerState.isRunning && !timerState.isBreak
    ? Math.floor(Math.max(0, Math.floor((Date.now() - timerState.startTime) / 1000)) / 5)
    : 0;

  return {
    time: timerState.time,
    isRunning: timerState.isRunning,
    isBreak: timerState.isBreak,
    startTimer,
    stopTimer,
    resetTimer,
    estimatedBreakTime,
  };
}