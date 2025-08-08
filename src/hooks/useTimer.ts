import { useState, useEffect, useRef } from 'react';
import type { Task, Session, Settings } from '../App';

/**
 * useTimer()
 * A drift-free work/break timer hook that:
 * - Tracks work elapsed time using wall-clock (Date.now) to avoid setInterval drift
 * - Persists state to localStorage to survive reloads and resumes correctly
 * - Starts a proportional break on stop (break = floor(workedSeconds / 5))
 * - Emits audio and optional visual notifications at break end
 *
 * Inputs:
 * - activeTask: current selected task or null (cannot start without)
 * - tasks: current task list (used to update timeSpent on stop)
 * - sessions: historical sessions (not mutated here directly, only appended)
 * - setSessions: setter to append newly finished work sessions
 * - settings: user preferences (audio/visual notifications)
 *
 * Returns:
 * - time: number
 * - isRunning: boolean
 * - isBreak: boolean
 * - startTimer(): void
 * - stopTimer(): void
 * - resetTimer(): void
 * - estimatedBreakTime: number (seconds, computed live while working)
 */
interface TimerState {
  /** seconds for display (work elapsed or break remaining) */
  time: number;
  isRunning: boolean;
  isBreak: boolean;
  /** ms reference for drift-free ticking */
  startTime: number;
  sessionId: string;
  /** ms timestamp when break should end */
  targetTime?: number;
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
      const parsed = JSON.parse(saved) as Partial<TimerState>;
      // Normalize saved state to ensure required fields exist
      return {
        time: typeof parsed.time === 'number' ? parsed.time : 0,
        isRunning: !!parsed.isRunning,
        isBreak: !!parsed.isBreak,
        startTime: typeof parsed.startTime === 'number' ? parsed.startTime : 0,
        sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : '',
        targetTime: typeof parsed.targetTime === 'number' ? parsed.targetTime : undefined,
      };
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

  // On mount, reconcile saved state with wall clock so timers continue across reloads
  useEffect(() => {
    const saved = localStorage.getItem('flow-timer-state');
    if (!saved) return;

    const parsed = JSON.parse(saved) as TimerState;
    const now = Date.now();

    if (parsed.isRunning) {
      if (!parsed.isBreak) {
        // Resume work: recompute elapsed since startTime
        const elapsedSec = Math.max(0, Math.floor((now - parsed.startTime) / 1000));
        setTimerState(prev => ({
          ...prev,
          isRunning: true,
          isBreak: false,
          startTime: parsed.startTime,
          sessionId: parsed.sessionId,
          time: elapsedSec,
          targetTime: undefined,
        }));
      } else {
        // Resume break: compute remaining from targetTime
        const remainingSec = parsed.targetTime ? Math.ceil((parsed.targetTime - now) / 1000) : 0;
        if (remainingSec > 0) {
          setTimerState(prev => ({
            ...prev,
            isRunning: true,
            isBreak: true,
            startTime: now,
            sessionId: parsed.sessionId,
            time: remainingSec,
            targetTime: parsed.targetTime,
          }));
        } else {
          // Break already finished while closed
          setTimerState(prev => ({
            ...prev,
            isRunning: false,
            isBreak: false,
            time: 0,
            targetTime: undefined,
          }));
          // Fire notifications consistent with in-app finish behavior
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
      }
    }
    // If not running, we leave it paused as saved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    // Check if we can start based on settings
    const showTasks = settings.showTasks ?? true;
    const requireTaskSelection = settings.requireTaskSelection ?? true;
    
    // Only require activeTask if tasks are shown AND task selection is required
    if (showTasks && requireTaskSelection && !activeTask) {
      return;
    }

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
    if (!timerState.isRunning || timerState.isBreak) return;

    // Compute actual worked seconds based on wall clock
    const workedSeconds = Math.max(0, Math.floor((Date.now() - timerState.startTime) / 1000));
    const breakSeconds = Math.floor(workedSeconds / 5);

    // Generate Focus session name if no task selected
    let sessionTaskId = '';
    let sessionTaskName = '';
    
    if (activeTask) {
      sessionTaskId = activeTask.id;
      sessionTaskName = activeTask.name;
    } else {
      // Generate Focus #N for sessions without task
      const today = new Date().toDateString();
      const todayFocusSessions = sessions.filter(s => 
        s.date === today && s.taskName.startsWith('Focus #')
      );
      const focusNumber = todayFocusSessions.length + 1;
      sessionTaskId = `focus-${Date.now()}`;
      sessionTaskName = `Focus #${focusNumber}`;
    }

    // Save session
    const session: Session = {
      id: timerState.sessionId || Date.now().toString(),
      taskId: sessionTaskId,
      taskName: sessionTaskName,
      startTime: new Date(timerState.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: workedSeconds,
      date: new Date().toDateString(),
    };

    setSessions(prev => [...prev, session]);

    // Update task time only if there's an active task
    if (activeTask) {
      const updatedTasks = tasks.map(task =>
        task.id === activeTask.id
          ? { ...task, timeSpent: task.timeSpent + workedSeconds }
          : task
      );
      localStorage.setItem('flow-tasks', JSON.stringify(updatedTasks));
    }

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