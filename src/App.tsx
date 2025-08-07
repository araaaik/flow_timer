import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, BarChart3, Music, Moon, Sun, Minimize2, Maximize2, Layout, Columns } from 'lucide-react';
import Timer from './components/Timer';
import TaskManager from './components/TaskManager';
import History from './components/History';
import MusicPlayer from './components/MusicPlayer';
import SettingsPanel from './components/SettingsPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTimer } from './hooks/useTimer';
import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';

/**
 * Task
 * A single work item tracked by the app.
 */
export interface Task {
  /** Unique id (ms timestamp string) */
  id: string;
  /** Display name (<= 15 chars) */
  name: string;
  /** Total accumulated seconds across all time (persisted) */
  timeSpent: number;
  /** Optional goal in seconds for today's progress bar */
  estimatedTime?: number;
  /** ISO creation timestamp */
  createdAt: string;
}

/**
 * Session
 * An atomic period of work recorded when stopping the timer.
 */
export interface Session {
  id: string;
  taskId: string;
  taskName: string;
  /** ISO start timestamp */
  startTime: string;
  /** ISO end timestamp */
  endTime: string;
  /** Worked duration in seconds */
  duration: number;
  /** Human-readable date key (Date.toDateString) for grouping */
  date: string;
}

/**
 * Settings
 * User preferences controlling notifications, theme, and visuals.
 */
export interface Settings {
  visualNotifications: boolean;
  audioNotifications: boolean;
  theme: 'light' | 'dark';
  /** Accent color token; tailwind-safe mapping is applied in components */
  accentColor: string;
  /** When true, disables card shadows (flat surfaces) */
  flatMode?: boolean;
  /** When true, timer surface adopts accent background */
  colorTimer?: boolean;
  // Per-theme background choices (8 options each)
  lightBg?: 'gray-50' | 'gray-100' | 'gray-200' | 'gray-300' | 'gray-400' | 'gray-500' | 'slate-100' | 'neutral-100';
  darkBg?: 'gray-700' | 'gray-800' | 'gray-900' | 'gray-950' | 'slate-900' | 'neutral-900' | 'black' | 'neutral-950';
}

/**
 * App()
 * Composition root coordinating:
 * - State: settings (useLocalStorage), tasks (useTasks), timer (useTimer), sessions
 * - Layout: compact toggle and horizontal/vertical layout
 * - Overlays: History modal, Settings panel, optional MusicPlayer block
 */
function App() {
  const [isCompact, setIsCompact] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  // Layout: 'horizontal' = side-by-side, 'vertical' = stacked like mobile
  const [layout, setLayout] = useLocalStorage<'horizontal' | 'vertical'>('flow-layout', 'horizontal');

  const [settings, setSettings] = useLocalStorage<Settings>('flow-settings', {
    visualNotifications: true,
    audioNotifications: true,
    theme: 'light',
    accentColor: 'blue',
    flatMode: false,
    colorTimer: false,
    lightBg: 'gray-50',
    darkBg: 'gray-900',
  });

  const { theme, toggleTheme, accentColor } = useTheme(settings.theme, settings.accentColor);

  // Ensure UI re-renders immediately when theme toggles without page reload
  useEffect(() => {
    const onThemeChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: 'light' | 'dark' }>).detail;
      if (!detail) return;
      setSettings(prev => ({ ...prev, theme: detail.theme }));
    };
    window.addEventListener('flow-theme-changed', onThemeChanged);
    return () => window.removeEventListener('flow-theme-changed', onThemeChanged);
  }, [setSettings]);

  // Tailwind-safe mapping for accent background classes
  const accentToBg: Record<string, string> = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    yellow: 'bg-yellow-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    lime: 'bg-lime-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
    black: 'bg-black'
  };

  const [sessions, setSessions] = useLocalStorage<Session[]>('flow-sessions', []);
  const [taskHistory, setTaskHistory] = useLocalStorage<string[]>('flow-task-history', []);
  
  const { tasks, activeTask, addTask, deleteTask, setActiveTask } = useTasks();
  const { 
    time, 
    isRunning, 
    isBreak, 
    startTimer, 
    stopTimer, 
    resetTimer, 
    estimatedBreakTime 
  } = useTimer(activeTask, tasks, sessions, setSessions, settings);

  // Check for daily reset
  useEffect(() => {
    const lastResetDate = localStorage.getItem('flow-last-reset');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      // Reset daily data but keep history
      localStorage.setItem('flow-last-reset', today);
      localStorage.removeItem('flow-tasks');
      localStorage.removeItem('flow-active-task');
      localStorage.removeItem('flow-timer-state');
      window.location.reload();
    }
  }, []);

  const handleTaskAdd = (name: string, estimatedTime?: number) => {
    if (!taskHistory.includes(name)) {
      setTaskHistory(prev => [...prev, name]);
    }
    addTask(name, estimatedTime);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const todaysSessions = sessions.filter(session => 
    session.date === new Date().toDateString()
  );

  const todaysTime = todaysSessions.reduce((total, session) => total + session.duration, 0);
  // Global switch for card shadows: disabled in flatMode (ON => no shadows)
  const cardShadow = settings.flatMode ? '' : 'shadow-lg';

  // Helper to map accent color to Tailwind classes for backgrounds and text
  const accentBgMap: Record<string, string> = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    // Green accent now uses custom hex via inline style, keep class as fallback
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    yellow: 'bg-yellow-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    lime: 'bg-lime-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
    black: 'bg-black',
  };
  const timerSurfaceClass = settings.colorTimer
    ? `${accentBgMap[accentColor] ?? 'bg-blue-500'} text-white`
    : `${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;

  // Inline overrides for custom HEX accents (apply when Color Timer is ON)
  const accentInlineStyle: Record<string, React.CSSProperties | undefined> = {
    green: { backgroundColor: '#266a5b', color: '#ffffff' },
  };

  // Compute page/background classes based on per-theme background settings
  const lightBgClass = (() => {
    switch (settings.lightBg) {
      case 'gray-100': return 'bg-gray-100';
      case 'gray-200': return 'bg-gray-200';
      case 'gray-300': return 'bg-gray-300';
      case 'gray-400': return 'bg-gray-400';
      case 'gray-500': return 'bg-gray-500';
      case 'slate-100': return 'bg-slate-100';
      case 'neutral-100': return 'bg-neutral-100';
      case 'gray-50':
      default: return 'bg-gray-50';
    }
  })();
  const darkBgClass = (() => {
    switch (settings.darkBg) {
      case 'gray-700': return 'bg-gray-700';
      case 'gray-800': return 'bg-gray-800';
      case 'gray-950': return 'bg-gray-950';
      case 'slate-900': return 'bg-slate-900';
      case 'neutral-900': return 'bg-neutral-900';
      case 'neutral-950': return 'bg-neutral-950';
      case 'black': return 'bg-black';
      case 'gray-900':
      default: return 'bg-gray-900';
    }
  })();

  return (
  <div className={`min-h-screen transition-colors duration-300 ease-out-smooth ${
    theme === 'dark'
      ? `${darkBgClass} text-white`
      : `${lightBgClass} text-gray-900`
  }`}>
    <div className={`mx-auto ${isCompact ? 'max-w-md p-4' : 'max-w-2xl p-6'}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: status dot + title + today's time perfectly baseline-aligned */}
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
              style={
                isRunning
                  ? (() => {
                      // Map accent color to solid color for the status dot
                      const hex: Record<string, string> = {
                        blue: '#3b82f6',
                        purple: '#8b5cf6',
                        green: '#266a5b',  // project green
                        red: '#ef4444',
                        orange: '#f97316',
                        pink: '#ec4899',
                        indigo: '#6366f1',
                        yellow: '#eab308',
                        teal: '#14b8a6',
                        cyan: '#06b6d4',
                        lime: '#84cc16',
                        emerald: '#10b981',
                        violet: '#8b5cf6',
                        rose: '#f43f5e',
                        slate: '#64748b',
                        black: '#111827',
                      };
                      return { backgroundColor: hex[accentColor] ?? '#3b82f6' };
                    })()
                  : { backgroundColor: theme === 'dark' ? '#4b5563' : '#d1d5db' } // gray when not running (dark: gray-600, light: gray-300)
              }
            />
            {/* Center-align title and today's counter vertically with each other */}
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-bold ${isCompact ? 'hidden' : ''}`}>FLOW</h1>
              {todaysTime > 0 && (
                <div className="hidden sm:block text-lg text-gray-500">
                  {Math.floor(todaysTime / 3600)}h {Math.floor((todaysTime % 3600) / 60)}m today
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 transition-colors duration-240 ease-out-smooth">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
              title={isCompact ? 'Expand' : 'Compact mode'}
            >
              {isCompact ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>

            {/* Status dot uses accent color when on break */}
            <style>{`:root{--accent-green:#266a5b}`}</style>
            
            <button
              onClick={() => setShowMusicPlayer(!showMusicPlayer)}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              <Music size={18} />
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={18} />
            </button>
            
            {/* Layout toggle: Horizontal / Vertical */}
            <button
              onClick={() => setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
              title={layout === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
              aria-label="Toggle layout"
            >
              {layout === 'horizontal' ? <Columns size={18} /> : <Layout size={18} />}
            </button>

            {/* Swapped order: Theme toggle before Settings */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Music Player (global placement for vertical/compact only) */}
        {showMusicPlayer && !isCompact && layout !== 'horizontal' && (
          <div className="mb-6">
            <MusicPlayer theme={theme} />
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className={`mb-6 ${cardShadow}`}>
            <SettingsPanel
              settings={settings}
              onUpdateSettings={updateSettings}
              theme={theme}
            />
          </div>
        )}

        {/* Main Content - layout controlled by toggle: horizontal (side-by-side) or vertical (stacked) */}
        {!isCompact ? (
          <>
            {layout === 'horizontal' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Left Column: Timer (+ optional player under it) */}
                <div className="space-y-6 sm:sticky sm:top-6 sm:self-start">
                  <div
                    className={`rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth ${timerSurfaceClass}`}
                    style={settings.colorTimer && accentColor === 'green' ? { backgroundColor: '#266a5b', color: '#ffffff' } : undefined}
                  >
                    <Timer
                      time={time}
                      isRunning={isRunning}
                      isBreak={isBreak}
                      onStart={startTimer}
                      onStop={stopTimer}
                      onReset={resetTimer}
                      activeTask={activeTask}
                      estimatedBreakTime={estimatedBreakTime}
                      theme={theme}
                      accentColor={accentColor}
                      isCompact={isCompact}
                    />
                  </div>
                  {/* When in horizontal layout, render MusicPlayer below Timer and same width; white card with no gray background */}
                  {showMusicPlayer && (
                     <div
                       className={`rounded-2xl ${cardShadow} transition-colors duration-300 ease-out-smooth ${
                         theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                       }`}
                     >
                       <div className="p-4">
                         <MusicPlayer theme={theme} layout="horizontal" />
                       </div>
                     </div>
                   )}
                </div>

                {/* Right Column: Tasks */}
                <div
                  className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth`}
                >
                  <TaskManager
                    tasks={tasks}
                    activeTask={activeTask}
                    onAddTask={handleTaskAdd}
                    onDeleteTask={deleteTask}
                    onSelectTask={isRunning ? () => {} : setActiveTask}
                    taskHistory={taskHistory}
                    theme={theme}
                    accentColor={accentColor}
                    sessions={sessions}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 transition-colors duration-240 ease-out-smooth">
                {/* Timer Block */}
                <div
                  className={`rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth ${timerSurfaceClass}`}
                  style={settings.colorTimer && accentColor === 'green' ? { backgroundColor: '#266a5b', color: '#ffffff' } : undefined}
                >
                  <Timer
                    time={time}
                    isRunning={isRunning}
                    isBreak={isBreak}
                    onStart={startTimer}
                    onStop={stopTimer}
                    onReset={resetTimer}
                    activeTask={activeTask}
                    estimatedBreakTime={estimatedBreakTime}
                    theme={theme}
                    accentColor={accentColor}
                    isCompact={isCompact}
                  />
                </div>
                {/* Task Manager Block */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth`}>
                  <TaskManager
                    tasks={tasks}
                    activeTask={activeTask}
                    onAddTask={handleTaskAdd}
                    onDeleteTask={deleteTask}
                    onSelectTask={isRunning ? () => {} : setActiveTask}
                    taskHistory={taskHistory}
                    theme={theme}
                    accentColor={accentColor}
                    sessions={sessions}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Compact Mode - Single Column unchanged */
          <div
            className={`rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth ${timerSurfaceClass}`}
            style={settings.colorTimer && accentColor === 'green' ? { backgroundColor: '#266a5b', color: '#ffffff' } : undefined}
          >
            <Timer
              time={time}
              isRunning={isRunning}
              isBreak={isBreak}
              onStart={startTimer}
              onStop={stopTimer}
              onReset={resetTimer}
              activeTask={activeTask}
              estimatedBreakTime={estimatedBreakTime}
              theme={theme}
              accentColor={accentColor}
              isCompact={isCompact}
            />
          </div>
        )}

        {/* History Modal */}
        {showHistory && (
          <div className={cardShadow}>
            <History
              sessions={sessions}
              tasks={tasks}
              onClose={() => setShowHistory(false)}
              onDeleteSession={(sessionId) => {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
              }}
              onDeleteDay={(date) => {
                setSessions(prev => prev.filter(s => s.date !== date));
              }}
              theme={theme}
              accentColor={accentColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;