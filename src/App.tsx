import { useState, useEffect } from 'react';
import { Play, Pause, Settings, Music, Moon, Sun, Minimize2, Maximize2, Layout, Columns } from 'lucide-react';
import Timer from './components/Timer';
import TaskManager from './components/TaskManager';
import History from './components/History';
import MusicPlayer from './components/MusicPlayer';
import GlobalMusicIframe from './components/GlobalMusicIframe';
import SettingsPanel from './components/SettingsPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTimer } from './hooks/useTimer';
import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';
import { useMusicPlayer } from './hooks/useMusicPlayer';

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
  /** When true, shows tasks panel */
  showTasks?: boolean;
  /** When true and tasks are enabled, requires task selection to start timer */
  requireTaskSelection?: boolean;
  /** When true, shows music player controls and panel */
  showMusicPlayer?: boolean;
  // Per-theme background choices (8 options each)
  lightBg?: 'gray-50' | 'gray-100' | 'gray-200' | 'gray-300' | 'gray-400' | 'gray-500' | 'slate-100' | 'neutral-100';
  darkBg?: 'gray-700' | 'gray-800' | 'gray-900' | 'gray-950' | 'slate-900' | 'neutral-900' | 'black' | 'neutral-950';
}

/**
 * App()
 * Composition root coordinating:
 * - State: settings (useLocalStorage), tasks (useTasks), timer (useTimer), sessions
 * - Layout: widget toggle and compact/full layout
 * - Overlays: History modal, Settings panel, optional MusicPlayer block
 */
function App() {
  const [isWidget, setIsWidget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  // Layout: 'compact' = side-by-side, 'full' = stacked like mobile
  // Backward compatibility: accept legacy values 'horizontal'/'vertical' and treat them as 'compact'/'full'
  const [layoutRaw, setLayoutRaw] = useLocalStorage<'compact' | 'full' | 'horizontal' | 'vertical'>('flow-layout', 'compact');
  const layout: 'compact' | 'full' = layoutRaw === 'horizontal' ? 'compact' : (layoutRaw === 'vertical' ? 'full' : (layoutRaw as 'compact' | 'full'));
  const setLayout = (next: 'compact' | 'full') => setLayoutRaw(next);

  const [settings, setSettings] = useLocalStorage<Settings>('flow-settings', {
    visualNotifications: true,
    audioNotifications: true,
    theme: 'light',
    accentColor: 'blue',
    flatMode: false,
    colorTimer: false,
    showTasks: true,
    requireTaskSelection: true,
    showMusicPlayer: true,
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

  // (removed unused accentToBg map)

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
  // Music control for widget header
  const { isPlaying: musicPlaying, setPlaying: setMusicPlaying } = useMusicPlayer();
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

  // (removed unused accentInlineStyle)

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
    {/* Always-mounted hidden YouTube iframe for uninterrupted playback */}
    <GlobalMusicIframe />
    <div className={`mx-auto ${isWidget ? 'max-w-2xl p-4' : 'max-w-2xl p-6'}`}>

        {/* Header */}
        {!isWidget ? (
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
                <h1 className="text-2xl font-bold">FLOW</h1>
                {todaysTime > 0 && (
                  <div className="hidden sm:block text-lg text-gray-500">
                    {Math.floor(todaysTime / 3600)}h {Math.floor((todaysTime % 3600) / 60)}m today
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 transition-colors duration-240 ease-out-smooth">
              <button
                onClick={() => setIsWidget(true)}
                className={`hidden sm:block p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-gray-200'
                }`}
                title="Widget mode"
              >
                <Minimize2 size={18} />
              </button>

              {/* Status dot uses accent color when on break */}
              <style>{`:root{--accent-green:#266a5b}`}</style>
              
              {(settings.showMusicPlayer ?? true) && (
                <button
                  onClick={() => setShowMusicPlayer(!showMusicPlayer)}
                  className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Music 
                    size={18} 
                    className={musicPlaying && !showMusicPlayer ? 'animate-pulse' : ''}
                    style={musicPlaying && !showMusicPlayer ? (() => {
                      const hex: Record<string, string> = {
                        blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                        orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                        teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                        violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                      };
                      return { color: hex[accentColor] ?? '#3b82f6' };
                    })() : undefined}
                  />
                </button>
              )}

              
              {/* Layout toggle: Compact / Full - only show if tasks are enabled */}
              {settings.showTasks && (
                <button
                  onClick={() => setLayout(layout === 'compact' ? 'full' : 'compact')}
                  className={`hidden sm:block p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                  title={layout === 'compact' ? 'Switch to full mode' : 'Switch to compact mode'}
                  aria-label="Toggle layout mode"
                >
                  {layout === 'compact' ? <Columns size={18} /> : <Layout size={18} />}
                </button>
              )}

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
        ) : (
          // Widget header under which the timer is placed
          <div className="mb-4">
            <div className="mx-auto w-full max-w-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
                style={
                  isRunning
                    ? (() => {
                        const hex: Record<string, string> = {
                          blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                          orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                          teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                          violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827',
                        };
                        return { backgroundColor: hex[accentColor] ?? '#3b82f6' };
                      })()
                    : { backgroundColor: theme === 'dark' ? '#4b5563' : '#d1d5db' }
                }
              />
              {todaysTime > 0 && (
                <div className="text-sm text-gray-500">
                  {Math.floor(todaysTime / 3600)}h {Math.floor((todaysTime % 3600) / 60)}m today
                </div>
              )}
              </div>
              <div className="flex items-center gap-2">
                {(settings.showMusicPlayer ?? true) && (
                  <button
                    onClick={() => setMusicPlaying(!musicPlaying)}
                    className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                    title={musicPlaying ? 'Pause music' : 'Play music'}
                  >
                    {musicPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                )}
                <button
                  onClick={() => setIsWidget(false)}
                  className={`hidden sm:block p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                  title="Exit widget mode"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

                 {/* Music Player (global placement for full mode only) */}
         <div className={`transition-size ${(settings.showMusicPlayer ?? true) && showMusicPlayer && !isWidget && layout !== 'compact' ? 'mb-6' : ''}`}>
           {(settings.showMusicPlayer ?? true) && showMusicPlayer && !isWidget && layout !== 'compact' && (
             <div className="animate-slide-in-up">
               <MusicPlayer theme={theme} />
             </div>
           )}
         </div>

         {/* Settings Panel */}
         <div className={`transition-size ${showSettings ? 'mb-6' : ''}`}>
           {showSettings && (
             <div className={`animate-slide-in-up ${cardShadow}`}>
               <SettingsPanel
                 settings={settings}
                 onUpdateSettings={updateSettings}
                 theme={theme}
               />
             </div>
           )}
         </div>

        {/* Main Content - layout controlled by toggle: compact (side-by-side) or full (stacked) */}
        {!isWidget ? (
          <>
            {layout === 'compact' && settings.showTasks ? (
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
                      isWidget={isWidget}
                      settings={settings}
                    />
                  </div>
                  {/* When in compact layout, render MusicPlayer below Timer and same width; white card with no gray background */}
                  {(settings.showMusicPlayer ?? true) && showMusicPlayer && (
                    <div
                      className={`rounded-2xl p-2 ${cardShadow} transition-colors duration-300 ease-out-smooth ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      <MusicPlayer theme={theme} layout="compact" />
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
                    onSelectTask={(t) => { if (!isRunning) setActiveTask(t); }}
                    taskHistory={taskHistory}
                    theme={theme}
                    accentColor={accentColor}
                    sessions={sessions}
                    layout="compact"
                    onShowHistory={() => setShowHistory(true)}
                  />
                </div>
              </div>
            ) : layout === 'compact' && !settings.showTasks ? (
              /* Compact layout with tasks disabled - centered timer */
              <div className="flex justify-center">
                <div className="w-full max-w-md space-y-6">
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
                        isWidget={isWidget}
                        settings={settings}
                    />
                  </div>
                  {(settings.showMusicPlayer ?? true) && showMusicPlayer && (
                    <div
                      className={`rounded-2xl p-2 ${cardShadow} transition-colors duration-300 ease-out-smooth ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                        <MusicPlayer theme={theme} layout="compact" />
                    </div>
                  )}
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
                    isWidget={isWidget}
                    settings={settings}
                  />
                </div>
                {/* Task Manager Block - only show if tasks are enabled */}
                {settings.showTasks && (
                  <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth`}>
                    <TaskManager
                      tasks={tasks}
                      activeTask={activeTask}
                      onAddTask={handleTaskAdd}
                      onDeleteTask={deleteTask}
                      onSelectTask={(t) => { if (!isRunning) setActiveTask(t); }}
                      taskHistory={taskHistory}
                      theme={theme}
                    accentColor={accentColor}
                    sessions={sessions}
                    layout="full"
                      onShowHistory={() => setShowHistory(true)}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Widget Mode - Narrow card centered horizontally under the header */
          <div className="flex justify-center">
            <div
              className={`rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth ${timerSurfaceClass} w-full max-w-xs`}
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
                isWidget={isWidget}
                settings={settings}
              />
            </div>
          </div>
        )}

                 {/* History Modal */}
         {showHistory && (
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
         )}
      </div>
    </div>
  );
}

export default App;