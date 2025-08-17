import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Square } from 'lucide-react';
import type { Task, Settings } from '../App';

import { useColorSystemContext } from '../contexts/ColorSystemContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { getAccentHex } from '../utils/colorSystem';
import { formatTimerDisplay } from '../utils/timeUtils';

/**
 * Timer.tsx
 * Stateless presentational component that renders:
 * - Current status (FOCUS / task name / RELAX)
 * - A large time display (mm:ss or h:mm:ss)
 * - Start/Stop primary button and a conditional Reset button
 * - An "Estimated break" chip while working, based on useTimer.estimatedBreakTime
 *
 * Props contract:
 * - time: seconds to display (work elapsed or break remaining)
 * - isRunning: whether timer loop is active
 * - isBreak: whether currently in break countdown
 * - onStart/onStop/onReset: control handlers from useTimer
 * - activeTask: selected task or null (controls readiness)
 * - estimatedBreakTime: seconds; only shown during active work
 * - theme, accentColor, isWidget: visual presentation
 */
interface TimerProps {
  /** Seconds to show in the clock (work elapsed or break remaining) */
  time: number;
  /** True when timer is counting (work or break) */
  isRunning: boolean;
  /** True when in break countdown mode */
  isBreak: boolean;
  /** Start work session (requires activeTask) */
  onStart: () => void;
  /** Stop work session (saves a session and starts break) */
  onStop: () => void;
  /** Reset any session state (confirmation handled in component) */
  onReset: () => void;
  /** Skip current break */
  onSkipBreak?: () => void;
  /** The currently selected task (null means FOCUS) */
  activeTask: Task | null;
  /** Estimated break length in seconds while working */
  estimatedBreakTime: number;
  /** Current session number (for Pomodoro mode) */
  currentSession?: number;
  /** Total sessions (for Pomodoro mode) */
  totalSessions?: number;
  /** Current global theme */
  theme: 'light' | 'dark';
  /** Selected accent color token */
  accentColor: string;
  /** Widget mode toggle from App */
  isWidget: boolean;
  /** User settings */
  settings: Settings;
}

function Timer({
  time,
  isRunning,
  isBreak,
  onStart,
  onStop,
  onReset,
  onSkipBreak,
  activeTask,
  estimatedBreakTime,
  currentSession = 1,
  totalSessions = 1,
  theme,
  accentColor,
  isWidget,
  settings
}: TimerProps) {
  const { confirm } = useNotificationContext();
  const colorSystem = useColorSystemContext();

  // Get hex value for current accent
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());



  /**
   * truncateTaskName()
   * Truncate task name to fit in one line with ellipsis
   */
  const truncateTaskName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    
    // Find the last space before maxLength to avoid cutting words
    const truncated = name.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) {
      return name.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  /**
   * handleReset()
   * Guarded reset with user confirmation. Calls onReset() when confirmed.
   */
  const handleReset = async () => {
    const confirmed = await confirm('Are you sure you want to reset the current session? Progress will not be saved.');
    if (confirmed) {
      onReset();
    }
  };

  // Preserve original gating flags (needed by controls)
  // If tasks are disabled OR task selection is not required, allow start without activeTask
  // Use default values for backward compatibility
  const showTasks = settings.showTasks ?? true;
  const requireTaskSelection = settings.requireTaskSelection ?? true;

  const canStart = Boolean(!isRunning && !isBreak && (
    !showTasks || // Tasks disabled - can start without task
    !requireTaskSelection || // Task selection not required
    activeTask // Has selected task
  ));
  const canStop = Boolean(isRunning && !isBreak);

  // Use settings prop for Color Timer state (more reliable than localStorage parsing)
  const colorTimerOn = settings.colorTimer ?? false;

  // Debug logging
  const timerMode = settings.timerMode ?? 'flow';


  // Debug logging
  console.log('Timer debug:', {
    isRunning,
    isBreak,
    activeTask: activeTask?.name || 'none',
    showTasks,
    requireTaskSelection,
    canStart,
    timerMode,
    totalSessions,
    currentSession,
    pomodoroSessions: settings.pomodoroSessions
  });

  return (
    <>
      <style>{`
        .timer-accent-bg {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        
        .timer-accent-bg:hover {
          background-color: var(--accent-color-hover) !important;
        }
      `}</style>
      <div
        className="text-center"
        style={{
          '--accent-color': accentHex,
          '--accent-color-hover': accentHex + 'dd',
        } as React.CSSProperties}
      >
        {/* Status */}
        <div
          className={[
            'text-base md:text-lg',
            'font-medium mb-2 min-h-[1.5rem]',
            'whitespace-nowrap overflow-hidden text-ellipsis max-w-full',
            colorTimerOn ? 'text-white' : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')
          ].join(' ')}
          title={activeTask?.name} // Show full name on hover
        >
          {isBreak ? 'RELAX' : (activeTask && activeTask.name ? truncateTaskName(activeTask.name) : 'FOCUS')}
        </div>

        {/* Pomodoro Session Progress */}
        {timerMode === 'pomodoro' && !isBreak && (
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: settings.pomodoroSessions || 4 }, (_, i) => {
              // Если таймер не запущен - все точки серые
              if (!isRunning) {
                const dotStyle = colorTimerOn
                  ? 'bg-white/30'
                  : theme === 'dark'
                    ? 'bg-gray-600'
                    : 'bg-gray-300';
                return (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${dotStyle}`}
                  />
                );
              }

              // Если таймер запущен
              const accentColorStyle = { backgroundColor: colorTimerOn ? '#ffffff' : accentHex };
              if (i < currentSession - 1) {
                // Завершенные сессии - статично акцентным цветом
                return (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={accentColorStyle}
                  />
                );
              } else if (i === currentSession - 1) {
                // Текущая сессия - мигает акцентным цветом
                return (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300 animate-pulse"
                    style={accentColorStyle}
                  />
                );
              } else {
                // Будущие сессии - серые
                const dotStyle = colorTimerOn
                  ? 'bg-white/30'
                  : theme === 'dark'
                    ? 'bg-gray-600'
                    : 'bg-gray-300';
                return (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${dotStyle}`}
                  />
                );
              }
            })}
          </div>
        )}

        {/* Timer Display */}
        <div
          className={[
            isWidget ? 'text-6xl' : 'text-7xl',
            'font-sans font-bold tracking-tight mb-6',
            colorTimerOn ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-900')
          ].join(' ')}
          style={colorTimerOn ? { color: '#ffffff' } : undefined}
        >
          {formatTimerDisplay(time)}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Main Start/Stop/Skip Button */}
          <button
            onClick={
              isBreak && onSkipBreak
                ? onSkipBreak
                : canStart
                  ? onStart
                  : canStop
                    ? onStop
                    : undefined
            }
            disabled={!canStart && !canStop && !(isBreak && onSkipBreak && (settings.flowBreakSkipEnabled ?? true))}
            className={`${isWidget ? 'w-14 h-14' : 'w-16 h-16'
              } rounded-full flex items-center justify-center font-semibold transition-all duration-300 ease-out-smooth transform animate-fade-in-up ${(() => {
                if (!(canStart || canStop || (isBreak && onSkipBreak))) {
                  return colorTimerOn
                    ? 'bg-white/30 text-white/80 cursor-not-allowed'
                    : (theme === 'dark' ? 'bg-gray-600 text-white cursor-not-allowed' : 'bg-gray-300 text-white cursor-not-allowed');
                }
                if (colorTimerOn) {
                  return 'text-white bg-white/20 hover:bg-white/30';
                }
                return 'timer-accent-bg shadow-lg';
              })()
              }`}
            title={
              isBreak
                ? 'Skip break'
                : isRunning
                  ? (timerMode === 'timer' || timerMode === 'pomodoro' ? 'Stop' : 'Pause')
                  : 'Start'
            }
          >
            {isBreak ? (
              <SkipForward size={isWidget ? 20 : 24} style={colorTimerOn ? { color: '#ffffff' } : undefined} />
            ) : isRunning ? (
              timerMode === 'timer' || timerMode === 'pomodoro' ? (
                <Square size={isWidget ? 20 : 24} style={colorTimerOn ? { color: '#ffffff' } : undefined} />
              ) : (
                <Pause size={isWidget ? 20 : 24} style={colorTimerOn ? { color: '#ffffff' } : undefined} />
              )
            ) : (
              <Play size={isWidget ? 20 : 24} style={colorTimerOn ? { color: '#ffffff' } : undefined} />
            )}
          </button>

          {/* Reset Button - only show for Flow mode */}
          {(isRunning || time > 0) && !isBreak && timerMode === 'flow' && (
            <button
              onClick={handleReset}
              className={`${isWidget ? 'w-10 h-10' : 'w-12 h-12'
                } rounded-full flex items-center justify-center transition-all duration-300 ease-out-smooth animate-fade-in-up ${colorTimerOn
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : (theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600')
                }`}
            >
              <RotateCcw size={isWidget ? 16 : 18} style={colorTimerOn ? { color: '#ffffff' } : undefined} />
            </button>
          )}
        </div>

        {/* Estimated Break Time or Session Info */}
        {isRunning && !isBreak && estimatedBreakTime > 0 && (
          (timerMode === 'flow' && time >= 60) || timerMode === 'pomodoro'
        ) && (
            <div
              className={[
                'mt-4',
                'flex items-center justify-center gap-2',
                isWidget ? 'text-xs' : 'text-sm',
                colorTimerOn ? 'text-white/90' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
              ].join(' ')}
            >
              <span className="whitespace-nowrap">
                {timerMode === 'flow' ? 'Estimated break:' : 'Next break:'}
              </span>
              <div
                className={[
                  'inline-flex items-center rounded-full px-2 py-0.5',
                  colorTimerOn ? 'bg-white/15' : (theme === 'dark' ? 'bg-white/10' : 'bg-black/5')
                ].join(' ')}
                style={
                  !colorTimerOn && theme !== 'dark'
                    ? (() => {
                      return { backgroundColor: accentHex + '20', color: accentHex };
                    })()
                    : undefined
                }
              >
                <span
                  className={`tabular-nums whitespace-nowrap ${!colorTimerOn && theme !== 'dark' ? 'text-[var(--accent-color)]' : ''
                    }`}
                >
                  {Math.ceil(estimatedBreakTime / 60)} min
                </span>
              </div>
            </div>
          )}



        {/* No Task Warning */}
        {!activeTask && !isWidget && showTasks && requireTaskSelection && (
          <div className={`mt-4 text-sm ${colorTimerOn ? 'text-white/90' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
            Select a task to start the timer
          </div>
        )}
      </div>
    </>
  );
}

export default Timer;