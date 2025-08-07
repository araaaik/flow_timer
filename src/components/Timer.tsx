import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { Task } from '../App';

interface TimerProps {
  time: number;
  isRunning: boolean;
  isBreak: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  activeTask: Task | null;
  estimatedBreakTime: number;
  theme: 'light' | 'dark';
  accentColor: string;
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
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the current session? This will not save any progress.')) {
      onReset();
    }
  };

  const canStart = !isRunning && !isBreak && activeTask;
  const canStop = isRunning && !isBreak;

  return (
    <div className="text-center">
      {/* Status */}
      {/* Status: break = green, work = neutral; ensure no accent class leaks here */}
      <div
        className={[
          (!isBreak && activeTask) ? 'text-base md:text-lg' : 'text-sm',
          'font-medium mb-2',
          isBreak ? 'text-green-600' : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')
        ].join(' ')}
      >
        {isBreak ? 'BREAK' : (activeTask ? activeTask.name : 'READY')}
      </div>

      {/* Active Task - removed per request: we now show the project name in the status line */}

      {/* Timer Display: never use accent color for digits per requirement */}
      <div
        className={[
          isCompact ? 'text-5xl' : 'text-7xl',
          'font-sans font-bold tracking-tight mb-6',
          // force stable color classes so Tailwind never injects dynamic accent classes
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        ].join(' ')}
        // Extra insurance: inline style overrides accidental inherited color from parent
        style={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}
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
          } rounded-full flex items-center justify-center font-semibold text-white transition-all transform ${
            canStart || canStop
              ? `bg-${accentColor}-500 hover:bg-${accentColor}-600 shadow-lg`
              : `${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} cursor-not-allowed`
          }`}
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
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <RotateCcw size={isCompact ? 16 : 18} />
          </button>
        )}
      </div>

      {/* Estimated Break Time (show in both compact and regular modes) */}
      {isRunning && !isBreak && estimatedBreakTime > 0 && (
        <div
          className={[
            'mt-4',
            'flex items-center justify-center gap-2',
            isCompact ? 'text-xs' : 'text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          ].join(' ')}
        >
          <span className="whitespace-nowrap">Estimated break:</span>
          <div
            className={[
              'inline-flex items-center rounded-full px-2 py-0.5',
              theme === 'dark' ? 'bg-white/10' : 'bg-black/5'
            ].join(' ')}
          >
            <span className="tabular-nums whitespace-nowrap">
              {Math.ceil(estimatedBreakTime / 60)} min
            </span>
          </div>
        </div>
      )}

      {/* No Task Warning */}
      {!activeTask && !isCompact && (
        <div className={`mt-4 text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Select a task to start the timer
        </div>
      )}
    </div>
  );
}

export default Timer;