import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { Task } from '../App';

/**
 * Timer.tsx
 * Stateless presentational component that renders:
 * - Current status (READY / task name / BREAK)
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
 * - theme, accentColor, isCompact: visual presentation
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
  /** The currently selected task (null means READY) */
  activeTask: Task | null;
  /** Estimated break length in seconds while working */
  estimatedBreakTime: number;
  /** Current global theme */
  theme: 'light' | 'dark';
  /** Selected accent color token */
  accentColor: string;
  /** Compact layout toggle from App */
  isCompact: boolean;
}

function Timer({
  time,
  isRunning,
  isBreak,
  onStart,
  onStop,
  onReset,
  activeTask,
  estimatedBreakTime,
  theme,
  accentColor,
  isCompact
}: TimerProps) {
  /**
   * formatTime()
   * Render seconds as "mm:ss" or "h:mm:ss" when hours > 0.
   */
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * handleReset()
   * Guarded reset with user confirmation. Calls onReset() when confirmed.
   */
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the current session? This will not save any progress.')) {
      onReset();
    }
  };
 
  // Preserve original gating flags (needed by controls)
  const canStart = Boolean(!isRunning && !isBreak && activeTask);
  const canStop = Boolean(isRunning && !isBreak);
 
  // Detect Color Timer state from saved settings (avoid prop drilling)
  const colorTimerOn = (window.localStorage.getItem('flow-settings') || '').includes('"colorTimer":true');

  return (
    <div className="text-center">
      {/* Status */}
      <div
        className={[
          (!isBreak && activeTask) ? 'text-base md:text-lg' : 'text-sm',
          'font-medium mb-2',
          colorTimerOn ? 'text-white' : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')
        ].join(' ')}
      >
        {isBreak ? 'BREAK' : (activeTask ? activeTask.name : 'READY')}
      </div>

      {/* Timer Display */}
      <div
        className={[
          isCompact ? 'text-5xl' : 'text-7xl',
          'font-sans font-bold tracking-tight mb-6',
          colorTimerOn ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-900')
        ].join(' ')}
        style={colorTimerOn ? { color: '#ffffff' } : { color: theme === 'dark' ? '#ffffff' : '#111827' }}
      >
        {formatTime(time)}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        {/* Main Start/Stop Button */}
        <button
          onClick={canStart ? onStart : canStop ? onStop : undefined}
          disabled={!canStart && !canStop}
          className={`${
            isCompact ? 'w-14 h-14' : 'w-16 h-16'
          } rounded-full flex items-center justify-center font-semibold transition-all transform ${
            (() => {
              if (!(canStart || canStop)) {
                return colorTimerOn
                  ? 'bg-white/30 text-white/80 cursor-not-allowed'
                  : (theme === 'dark' ? 'bg-gray-600 text-white cursor-not-allowed' : 'bg-gray-300 text-white cursor-not-allowed');
              }
              if (colorTimerOn) {
                return 'text-white bg-white/20 hover:bg-white/30';
              }
              const map: Record<string, string> = {
                blue: 'text-white bg-blue-500 hover:bg-blue-600 shadow-lg',
                red: 'text-white bg-red-500 hover:bg-red-600 shadow-lg',
                green: 'text-white bg-green-500 hover:bg-green-600 shadow-lg',
                purple: 'text-white bg-purple-500 hover:bg-purple-600 shadow-lg',
                orange: 'text-white bg-orange-500 hover:bg-orange-600 shadow-lg',
                pink: 'text-white bg-pink-500 hover:bg-pink-600 shadow-lg',
                indigo: 'text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg',
                yellow: 'text-white bg-yellow-500 hover:bg-yellow-600 shadow-lg',
                teal: 'text-white bg-teal-500 hover:bg-teal-600 shadow-lg',
                cyan: 'text-white bg-cyan-500 hover:bg-cyan-600 shadow-lg',
                lime: 'text-white bg-lime-500 hover:bg-lime-600 shadow-lg',
                emerald: 'text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg',
                violet: 'text-white bg-violet-500 hover:bg-violet-600 shadow-lg',
                rose: 'text-white bg-rose-500 hover:bg-rose-600 shadow-lg',
                slate: 'text-white bg-slate-500 hover:bg-slate-600 shadow-lg',
                black: 'text-white bg-black hover:bg-neutral-900 shadow-lg',
              };
              return map[accentColor] ?? 'text-white bg-blue-500 hover:bg-blue-600 shadow-lg';
            })()
          }`}
          style={
            !colorTimerOn
              ? (() => {
                  // Use Tailwind's 500 swatch equivalents to keep consistency with other accent elements
                  const solidHex: Record<string, string> = {
                    blue: '#3b82f6',     // blue-500
                    purple: '#8b5cf6',   // purple-500
                    // Use project-approved green to stay consistent across app
                    green: '#266a5b',
                    red: '#ef4444',      // red-500
                    orange: '#f97316',   // orange-500
                    pink: '#ec4899',     // pink-500
                    indigo: '#6366f1',   // indigo-500
                    yellow: '#eab308',   // yellow-500
                    teal: '#14b8a6',     // teal-500
                    cyan: '#06b6d4',     // cyan-500
                    lime: '#84cc16',     // lime-500
                    emerald: '#10b981',  // emerald-500
                    violet: '#8b5cf6',   // violet-500
                    rose: '#f43f5e',     // rose-500
                    slate: '#64748b',    // slate-500
                    black: '#111827',    // black
                  };
                  const bg = solidHex[accentColor];
                  return bg ? { backgroundColor: bg } : undefined;
                })()
              : undefined
          }
        >
          {isRunning ? <Pause size={isCompact ? 20 : 24} /> : <Play size={isCompact ? 20 : 24} />}
        </button>

        {/* Reset Button */}
        {(isRunning || time > 0) && (
          <button
            onClick={handleReset}
            className={`${
              isCompact ? 'w-10 h-10' : 'w-12 h-12'
            } rounded-full flex items-center justify-center transition-all ${
              colorTimerOn
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : (theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600')
            }`}
          >
            <RotateCcw size={isCompact ? 16 : 18} />
          </button>
        )}
      </div>

      {/* Estimated Break Time */}
      {isRunning && !isBreak && estimatedBreakTime > 0 && (
        <div
          className={[
            'mt-4',
            'flex items-center justify-center gap-2',
            isCompact ? 'text-xs' : 'text-sm',
            colorTimerOn ? 'text-white/90' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
          ].join(' ')}
        >
          <span className="whitespace-nowrap">Estimated break:</span>
          <div
            className={[
              'inline-flex items-center rounded-full px-2 py-0.5',
              colorTimerOn ? 'bg-white/15' : (theme === 'dark' ? 'bg-white/10' : 'bg-black/5')
            ].join(' ')}
            style={
              !colorTimerOn && theme !== 'dark'
                ? (() => {
                    const chipHex: Record<string, { bg: string; text: string }> = {
                      blue: { bg: '#3b82f620', text: '#3b82f6' },
                      purple: { bg: '#8b5cf620', text: '#8b5cf6' },
                      // Project green tint
                      green: { bg: '#266a5b20', text: '#266a5b' },
                      red: { bg: '#ef444420', text: '#ef4444' },
                      orange: { bg: '#f9731620', text: '#f97316' },
                      pink: { bg: '#ec489920', text: '#ec4899' },
                      indigo: { bg: '#6366f120', text: '#6366f1' },
                      yellow: { bg: '#eab30820', text: '#eab308' },
                      teal: { bg: '#14b8a620', text: '#14b8a6' },
                      cyan: { bg: '#06b6d420', text: '#06b6d4' },
                      lime: { bg: '#84cc1620', text: '#84cc16' },
                      emerald: { bg: '#10b98120', text: '#10b981' },
                      violet: { bg: '#8b5cf620', text: '#8b5cf6' },
                      rose: { bg: '#f43f5e20', text: '#f43f5e' },
                      slate: { bg: '#64748b20', text: '#64748b' },
                      black: { bg: '#11182720', text: '#111827' },
                    };
                    const c = chipHex[accentColor];
                    return c ? { backgroundColor: c.bg } : undefined;
                  })()
                : undefined
            }
          >
            <span
              className="tabular-nums whitespace-nowrap"
              style={
                !colorTimerOn && theme !== 'dark'
                  ? (() => {
                      const chipHex: Record<string, { bg: string; text: string }> = {
                        blue: { bg: '#3b82f620', text: '#3b82f6' },
                        purple: { bg: '#8b5cf620', text: '#8b5cf6' },
                        // Project green tint
                        green: { bg: '#266a5b20', text: '#266a5b' },
                        red: { bg: '#ef444420', text: '#ef4444' },
                        orange: { bg: '#f9731620', text: '#f97316' },
                        pink: { bg: '#ec489920', text: '#ec4899' },
                        indigo: { bg: '#6366f120', text: '#6366f1' },
                        yellow: { bg: '#eab30820', text: '#eab308' },
                        teal: { bg: '#14b8a620', text: '#14b8a6' },
                        cyan: { bg: '#06b6d420', text: '#06b6d4' },
                        lime: { bg: '#84cc1620', text: '#84cc16' },
                        emerald: { bg: '#10b98120', text: '#10b981' },
                        violet: { bg: '#8b5cf620', text: '#8b5cf6' },
                        rose: { bg: '#f43f5e20', text: '#f43f5e' },
                        slate: { bg: '#64748b20', text: '#64748b' },
                        black: { bg: '#11182720', text: '#111827' },
                      };
                      const c = chipHex[accentColor];
                      return c ? { color: c.text } : undefined;
                    })()
                  : undefined
              }
            >
              {Math.ceil(estimatedBreakTime / 60)} min
            </span>
          </div>
        </div>
      )}

      {/* No Task Warning */}
      {!activeTask && !isCompact && (
        <div className={`mt-4 text-sm ${colorTimerOn ? 'text-white/90' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
          Select a task to start the timer
        </div>
      )}
    </div>
  );
}

export default Timer;