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

export interface Task {
  id: string;
  name: string;
  timeSpent: number;
  estimatedTime?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  taskId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  duration: number;
  date: string;
}

export interface Settings {
  visualNotifications: boolean;
  audioNotifications: boolean;
  theme: 'light' | 'dark';
  accentColor: string;
}

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
    accentColor: 'blue'
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
    slate: 'bg-slate-500'
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ease-out-smooth ${
      theme === 'dark'
        ? 'bg-gray-900 text-white'
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`mx-auto ${isCompact ? 'max-w-md p-4' : 'max-w-2xl p-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: status dot + title + today's time perfectly baseline-aligned */}
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isRunning
                  ? isBreak
                    ? 'bg-green-500 animate-pulse'  // break -> green
                    : 'bg-blue-500 animate-pulse'   // work -> blue
                  : 'bg-gray-300'
              }`}
            />
            {/* Use tiny vertical nudge so text baselines visually match regardless of font metrics */}
            <div className="flex items-baseline gap-3">
              <h1 className={`text-2xl font-bold ${isCompact ? 'hidden' : ''}`} style={{ lineHeight: '1.1' }}>Flow</h1>
              {todaysTime > 0 && (
                <div className="text-lg text-gray-500" style={{ paddingTop: '2px', lineHeight: '1.1' }}>
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

            {/* Layout Toggle: Horizontal (side-by-side) vs Vertical (stacked)
                Hidden on mobile (sm:hidden) */}
            <button
              onClick={() => setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
              className={`hidden sm:inline-flex p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
              title={layout === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
            >
              {layout === 'horizontal' ? <Columns size={18} /> : <Layout size={18} />}
            </button>
            
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
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark' 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-200'
              }`}
            >
              <Settings size={18} />
            </button>
            
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark' 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-200'
              }`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
          <div className="mb-6">
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
                  <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-out-smooth`}>
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
                  {/* When in horizontal layout, render MusicPlayer below Timer and same width (no light gray bg) */}
                  {showMusicPlayer && (
                    <div className={`rounded-2xl shadow-lg transition-colors duration-300 ease-out-smooth ${
                      theme === 'dark' ? 'bg-gray-800' : ''
                    }`}>
                      <div className="p-4">
                        <MusicPlayer theme={theme} layout="horizontal" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Tasks */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-out-smooth`}>
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
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-out-smooth`}>
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
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-out-smooth`}>
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
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg transition-colors duration-300 ease-out-smooth`}>
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