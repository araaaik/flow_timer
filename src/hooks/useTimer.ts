import { useState, useEffect, useRef } from 'react';
import type { Task, Session, Settings } from '../App';

/**
 * useTimer()
 * A drift-free work/break timer hook that supports two modes:
 * 1. Flow mode: Flexible work time with optional proportional/fixed breaks
 * 2. Pomodoro mode: Fixed work/break cycles with session counting
 * 
 * Features:
 * - Tracks work elapsed time using wall-clock (Date.now) to avoid setInterval drift
 * - Persists state to localStorage to survive reloads and resumes correctly
 * - Supports both countdown (Pomodoro) and count-up (Flow) timing
 * - Emits audio and optional visual notifications at break end
 *
 * Inputs:
 * - activeTask: current selected task or null (cannot start without)
 * - tasks: current task list (used to update timeSpent on stop)
 * - sessions: historical sessions (not mutated here directly, only appended)
 * - setSessions: setter to append newly finished work sessions
 * - settings: user preferences (audio/visual notifications, timer mode, etc.)
 *
 * Returns:
 * - time: number
 * - isRunning: boolean
 * - isBreak: boolean
 * - startTimer(): void
 * - stopTimer(): void
 * - resetTimer(): void
 * - estimatedBreakTime: number (seconds, computed live while working)
 * - currentSession: number (for Pomodoro mode)
 * - totalSessions: number (for Pomodoro mode)
 * - skipBreak(): void (skip current break)
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
  /** Pomodoro mode: current session number (1-based) */
  currentSession?: number;
  /** Pomodoro mode: total sessions configured */
  totalSessions?: number;
  /** Pomodoro mode: work duration in seconds */
  workDuration?: number;
  /** Pomodoro mode: break duration in seconds */
  breakDuration?: number;
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
        currentSession: typeof parsed.currentSession === 'number' ? parsed.currentSession : undefined,
        totalSessions: typeof parsed.totalSessions === 'number' ? parsed.totalSessions : undefined,
        workDuration: typeof parsed.workDuration === 'number' ? parsed.workDuration : undefined,
        breakDuration: typeof parsed.breakDuration === 'number' ? parsed.breakDuration : undefined,
      };
    }
    return {
      time: 0,
      isRunning: false,
      isBreak: false,
      startTime: 0,
      sessionId: '',
      targetTime: undefined,
      currentSession: undefined,
      totalSessions: undefined,
      workDuration: undefined,
      breakDuration: undefined,
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
    const timerMode = settings.timerMode ?? 'flow';

    if (parsed.isRunning) {
      if (!parsed.isBreak) {
        // Resume work session
        if (timerMode === 'flow') {
          // Flow mode: recompute elapsed since startTime
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
          // Pomodoro mode: recompute remaining time
          const elapsedSec = Math.floor((now - parsed.startTime) / 1000);
          const remainingSec = Math.max(0, (parsed.workDuration || 0) - elapsedSec);
          setTimerState(prev => ({
            ...prev,
            isRunning: true,
            isBreak: false,
            startTime: parsed.startTime,
            sessionId: parsed.sessionId,
            time: remainingSec,
            targetTime: undefined,
            currentSession: parsed.currentSession,
            totalSessions: parsed.totalSessions,
            workDuration: parsed.workDuration,
            breakDuration: parsed.breakDuration,
          }));
        }
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
            currentSession: parsed.currentSession,
            totalSessions: parsed.totalSessions,
            workDuration: parsed.workDuration,
            breakDuration: parsed.breakDuration,
          }));
        } else {
          // Break already finished while closed
          setTimerState(prev => ({
            ...prev,
            isRunning: false,
            isBreak: false,
            time: 0,
            targetTime: undefined,
            currentSession: undefined,
            totalSessions: undefined,
            workDuration: undefined,
            breakDuration: undefined,
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
        const timerMode = settings.timerMode ?? 'flow';

        if (!prev.isBreak) {
          // Work mode
          if (timerMode === 'flow') {
            // Flow mode: count up elapsed time
            const elapsedSec = Math.floor((now - prev.startTime) / 1000);
            if (elapsedSec !== prev.time) {
              return { ...prev, time: elapsedSec };
            }
            return prev;
          } else {
            // Pomodoro mode: count down from work duration
            const elapsedSec = Math.floor((now - prev.startTime) / 1000);
            const remainingSec = Math.max(0, (prev.workDuration || 0) - elapsedSec);
            
            if (remainingSec !== prev.time) {
              // If work session finished
              if (remainingSec === 0) {
                queueMicrotask(() => {
                  // Auto-start break or finish session
                  const currentSession = prev.currentSession || 1;
                  const totalSessions = prev.totalSessions || 1;
                  const breakDuration = prev.breakDuration || 300; // 5 minutes default
                  
                  if (currentSession < totalSessions) {
                    // Start break
                    const targetTime = now + breakDuration * 1000;
                    setTimerState(current => ({
                      ...current,
                      isBreak: true,
                      time: breakDuration,
                      startTime: now,
                      targetTime,
                    }));
                  } else {
                    // All sessions completed
                    setTimerState(current => ({
                      ...current,
                      isRunning: false,
                      isBreak: false,
                      time: 0,
                      targetTime: undefined,
                      currentSession: undefined,
                      totalSessions: undefined,
                      workDuration: undefined,
                      breakDuration: undefined,
                    }));
                    
                    playNotification();
                    if (settings.visualNotifications) {
                      if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('All Pomodoro sessions completed!', {
                          body: 'Great work! Take a longer break.',
                          icon: '/favicon.ico',
                        });
                      }
                    }
                  }
                });
              }
              return { ...prev, time: remainingSec };
            }
            return prev;
          }
        } else {
          // Break mode: countdown to targetTime
          if (!prev.targetTime) return prev;
          const remainingSec = Math.max(0, Math.ceil((prev.targetTime - now) / 1000));
          if (remainingSec !== prev.time) {
            // If break finished
            if (remainingSec === 0) {
              queueMicrotask(() => {
                if (timerMode === 'pomodoro') {
                  // Start next Pomodoro session
                  const currentSession = (prev.currentSession || 1) + 1;
                  const totalSessions = prev.totalSessions || 1;
                  const workDuration = prev.workDuration || 1500; // 25 minutes default
                  
                  if (currentSession <= totalSessions) {
                    setTimerState(current => ({
                      ...current,
                      isBreak: false,
                      time: workDuration,
                      startTime: now,
                      targetTime: undefined,
                      currentSession,
                    }));
                  } else {
                    // All sessions completed
                    setTimerState(current => ({
                      ...current,
                      isRunning: false,
                      isBreak: false,
                      time: 0,
                      targetTime: undefined,
                      currentSession: undefined,
                      totalSessions: undefined,
                      workDuration: undefined,
                      breakDuration: undefined,
                    }));
                  }
                } else {
                  // Flow mode: just stop
                  setTimerState(current => ({
                    ...current,
                    isRunning: false,
                    isBreak: false,
                    time: 0,
                    targetTime: undefined,
                  }));
                }

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
  }, [timerState.isRunning, timerState.isBreak, settings.visualNotifications, settings.timerMode]);

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
    const timerMode = settings.timerMode ?? 'flow';

    if (timerMode === 'flow') {
      // Flow mode: start counting up from 0
      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        isBreak: false,
        startTime: now,
        sessionId,
        time: 0,
        targetTime: undefined,
        currentSession: undefined,
        totalSessions: undefined,
        workDuration: undefined,
        breakDuration: undefined,
      }));
    } else {
      // Pomodoro mode: start countdown from work duration
      const workDuration = (settings.pomodoroWorkDuration ?? 25) * 60; // Convert to seconds
      const breakDuration = (settings.pomodoroBreakDuration ?? 5) * 60; // Convert to seconds
      const totalSessions = settings.pomodoroSessions ?? 4;
      
      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        isBreak: false,
        startTime: now,
        sessionId,
        time: workDuration,
        targetTime: undefined,
        currentSession: 1,
        totalSessions,
        workDuration,
        breakDuration,
      }));
    }
  };

  const stopTimer = () => {
    if (!timerState.isRunning || timerState.isBreak) return;

    const timerMode = settings.timerMode ?? 'flow';
    const now = Date.now();
    
    // Compute actual worked seconds based on wall clock
    let workedSeconds: number;
    
    if (timerMode === 'flow') {
      // Flow mode: elapsed time
      workedSeconds = Math.max(0, Math.floor((now - timerState.startTime) / 1000));
    } else {
      // Pomodoro mode: work duration minus remaining time
      const elapsedSec = Math.floor((now - timerState.startTime) / 1000);
      workedSeconds = Math.min(elapsedSec, timerState.workDuration || 0);
    }

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

    if (timerMode === 'flow') {
      // Flow mode: handle break based on settings
      const flowBreakEnabled = settings.flowBreakEnabled ?? true;
      
      if (!flowBreakEnabled) {
        // No break - just stop and reset
        setTimerState(prev => ({
          ...prev,
          isRunning: false,
          isBreak: false,
          time: 0,
          targetTime: undefined,
        }));
        
        playNotification();
        if (settings.visualNotifications) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Work session completed!', {
              body: 'Ready for the next task?',
              icon: '/favicon.ico',
            });
          }
        }
        return;
      }

      // Calculate break duration
      let breakSeconds: number;
      const flowBreakType = settings.flowBreakType ?? 'percentage';
      
      if (flowBreakType === 'percentage') {
        const percentage = settings.flowBreakPercentage ?? 20;
        breakSeconds = Math.floor(workedSeconds * percentage / 100);
      } else {
        const fixedMinutes = settings.flowBreakFixed ?? 10;
        breakSeconds = fixedMinutes * 60;
      }

      // Start break countdown
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
    } else {
      // Pomodoro mode: timer will auto-transition to break or next session
      // This is handled in the ticker effect
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
      currentSession: undefined,
      totalSessions: undefined,
      workDuration: undefined,
      breakDuration: undefined,
    });
  };

  const skipBreak = () => {
    if (!timerState.isBreak || !timerState.isRunning) return;
    
    const timerMode = settings.timerMode ?? 'flow';
    const now = Date.now();
    
    if (timerMode === 'pomodoro') {
      // Start next Pomodoro session
      const currentSession = (timerState.currentSession || 1) + 1;
      const totalSessions = timerState.totalSessions || 1;
      const workDuration = timerState.workDuration || 1500; // 25 minutes default
      
      if (currentSession <= totalSessions) {
        setTimerState(prev => ({
          ...prev,
          isBreak: false,
          time: workDuration,
          startTime: now,
          targetTime: undefined,
          currentSession,
        }));
      } else {
        // All sessions completed
        setTimerState(prev => ({
          ...prev,
          isRunning: false,
          isBreak: false,
          time: 0,
          targetTime: undefined,
          currentSession: undefined,
          totalSessions: undefined,
          workDuration: undefined,
          breakDuration: undefined,
        }));
      }
    } else {
      // Flow mode: just stop
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isBreak: false,
        time: 0,
        targetTime: undefined,
      }));
    }
  };

  const estimatedBreakTime = (() => {
    if (!timerState.isRunning || timerState.isBreak) return 0;
    
    const timerMode = settings.timerMode ?? 'flow';
    
    if (timerMode === 'flow') {
      const flowBreakEnabled = settings.flowBreakEnabled ?? true;
      if (!flowBreakEnabled) return 0;
      
      const elapsedSec = Math.max(0, Math.floor((Date.now() - timerState.startTime) / 1000));
      const flowBreakType = settings.flowBreakType ?? 'percentage';
      
      if (flowBreakType === 'percentage') {
        const percentage = settings.flowBreakPercentage ?? 20;
        return Math.floor(elapsedSec * percentage / 100);
      } else {
        const fixedMinutes = settings.flowBreakFixed ?? 10;
        return fixedMinutes * 60;
      }
    } else {
      // Pomodoro mode: show break duration
      return (settings.pomodoroBreakDuration ?? 5) * 60;
    }
  })();

  return {
    time: timerState.time,
    isRunning: timerState.isRunning,
    isBreak: timerState.isBreak,
    startTimer,
    stopTimer,
    resetTimer,
    skipBreak,
    estimatedBreakTime,
    currentSession: timerState.currentSession || 1,
    totalSessions: timerState.totalSessions || 1,
  };
}