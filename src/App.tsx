import { useState, useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { MainContent } from './components/MainContent';
import History from './components/History';
import MusicPlayer from './components/MusicPlayer';
import GlobalMusicIframe from './components/GlobalMusicIframe';
import SettingsPanel from './components/SettingsPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTimer } from './hooks/useTimer';
import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { getAccentHex } from './utils/colorSystem';
import { runStorageCleanup } from './utils/storageCleanup';
import { formatTime } from './utils/timeUtils';

import { ColorSystemProvider, useColorSystemContext } from './contexts/ColorSystemContext';
import { NotificationProvider } from './contexts/NotificationContext';

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
  /** Worked duration in seconds */
  duration: number;
  /** Human-readable date key (Date.toDateString) for grouping */
  date: string;
  /** ISO timestamp when session started */
  startTime?: string;
  /** ISO timestamp when session ended */
  endTime?: string;
}

/**
 * Settings
 * User preferences controlling notifications, theme, and visuals.
 */
export interface Settings {
  visualNotifications: boolean;
  audioNotifications: boolean;
  /** Sound volume (0-1) */
  soundVolume?: number;
  /** Selected notification sound ID */
  notificationSound?: string;
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
  
  // Timer mode settings
  /** Timer mode: 'flow' for Flowmodoro, 'pomodoro' for classic Pomodoro, 'timer' for simple timer */
  timerMode?: 'flow' | 'pomodoro' | 'timer';
  
  // Flow mode settings
  /** When true, enables break after work session in Flow mode */
  flowBreakEnabled?: boolean;
  /** Break calculation type: 'percentage' or 'fixed' */
  flowBreakType?: 'percentage' | 'fixed';
  /** Break percentage (10, 15, 20, 25) when using percentage type */
  flowBreakPercentage?: 10 | 15 | 20 | 25;
  /** Fixed break duration in minutes (5, 10, 20, 30) when using fixed type */
  flowBreakFixed?: 5 | 10 | 20 | 30;
 /** When true, allows skipping break after work session in Flow mode */
 flowBreakSkipEnabled?: boolean;
  
  // Pomodoro mode settings
  /** Work session duration in minutes */
  pomodoroWorkDuration?: number;
  /** Break duration in minutes */
  pomodoroBreakDuration?: number;
  /** Number of sessions (1-8) */
  pomodoroSessions?: number;
}

/**
 * App()
 * Composition root coordinating:
 * - State: settings (useLocalStorage), tasks (useTasks), timer (useTimer), sessions
 * - Layout: widget toggle and compact/full layout
 * - Overlays: History modal, Settings panel, optional MusicPlayer block
 */
function AppContent() {
  const [isWidget, setIsWidget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(true);
  // Layout: 'compact' = side-by-side, 'full' = stacked like mobile
  // Backward compatibility: accept legacy values 'horizontal'/'vertical' and treat them as 'compact'/'full'
  const [layoutRaw, setLayoutRaw] = useLocalStorage<'compact' | 'full' | 'horizontal' | 'vertical'>('flow-layout', 'compact');
  const layout: 'compact' | 'full' = layoutRaw === 'horizontal' ? 'compact' : (layoutRaw === 'vertical' ? 'full' : (layoutRaw as 'compact' | 'full'));
  const setLayout = (next: 'compact' | 'full') => setLayoutRaw(next);

  const [settings, setSettings] = useLocalStorage<Settings>('flow-settings', {
    visualNotifications: true,
    audioNotifications: true,
    theme: 'light',
    accentColor: 'blue-500',
    flatMode: false,
    requireTaskSelection: true,
    showMusicPlayer: true,
    showTasks: true,
    lightBg: 'gray-200',
    darkBg: 'gray-700',
    // Timer mode defaults
    timerMode: 'flow',
    // Flow mode defaults
    flowBreakEnabled: true,
    flowBreakType: 'percentage',
    flowBreakPercentage: 20,
    flowBreakFixed: 10,
    // Pomodoro mode defaults
    pomodoroWorkDuration: 25,
    pomodoroBreakDuration: 5,
    pomodoroSessions: 4,
  });

  const { theme, toggleTheme, accentColor } = useTheme(settings.theme, settings.accentColor);
  const colorSystem = useColorSystemContext();

  // Sync showMusicPlayer with settings
  useEffect(() => {
    console.log('App: Syncing showMusicPlayer with settings:', settings.showMusicPlayer);
    setShowMusicPlayer(settings.showMusicPlayer ?? true);
  }, [settings.showMusicPlayer]);

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
    skipBreak,
    estimatedBreakTime,
    currentSession,
    totalSessions
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
    } else {
      // Run cleanup on app startup to fix orphaned references
      runStorageCleanup();
    }
  }, []);

  const handleTaskAdd = (name: string, estimatedTime?: number) => {
    if (!taskHistory?.includes(name)) {
      setTaskHistory(prev => [...(prev || []), name]);
    }
    addTask(name, estimatedTime);
  };

  // Sync task history with existing tasks on app load
  useEffect(() => {
    const syncTaskHistory = () => {
      const existingTaskNames = tasks.map(task => task.name);
      const currentHistory = taskHistory || [];
      
      // Find task names that exist in tasks but not in history
      const missingFromHistory = existingTaskNames.filter(name => !currentHistory.includes(name));
      
      if (missingFromHistory.length > 0) {
        console.log('Syncing task history, adding:', missingFromHistory);
        setTaskHistory(prev => [...(prev || []), ...missingFromHistory]);
      }
    };

    // Only sync if we have tasks but empty/incomplete history
    if (tasks.length > 0) {
      syncTaskHistory();
    }
  }, [tasks, taskHistory, setTaskHistory]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const todaysSessions = (Array.isArray(sessions) ? sessions : []).filter(session =>
    session.date === new Date().toDateString()
  );

  const todaysTime = todaysSessions.reduce((total, session) => total + session.duration, 0);
  // Music control for widget header
  const { isPlaying: musicPlaying, setPlaying: setMusicPlaying } = useMusicPlayer();
  // Global switch for card shadows: disabled in flatMode (ON => no shadows)
  const cardShadow = settings.flatMode ? '' : 'shadow-lg';

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

  console.log('App render - showMusicPlayer:', showMusicPlayer, 'settings.showMusicPlayer:', settings.showMusicPlayer);
  
  return (
    <NotificationProvider settings={{
      audioNotifications: settings.audioNotifications,
      soundVolume: settings.soundVolume,
      notificationSound: settings.notificationSound
    }}>
      <div className={`min-h-screen transition-all duration-300 ease-out-smooth ${
        theme === 'dark'
          ? `${darkBgClass} text-white`
          : `${lightBgClass} text-gray-900`
      }`}>
    {/* Always-mounted hidden YouTube iframe for uninterrupted playback */}
    <GlobalMusicIframe />
    <div className={`mx-auto ${isWidget ? 'max-w-2xl p-4' : 'max-w-4xl px-4 sm:px-6 py-6'}`}>

        <AppHeader
          isWidget={isWidget}
          setIsWidget={setIsWidget}
          todaysTime={todaysTime}
          isRunning={isRunning}
          theme={theme}
          accentColor={accentColor}
          showMusicPlayer={showMusicPlayer}
          setShowMusicPlayer={setShowMusicPlayer}
          musicPlaying={musicPlaying}
          setMusicPlaying={setMusicPlaying}
          showTasks={settings.showTasks ?? true}
          layout={layout}
          setLayout={setLayout}
          toggleTheme={toggleTheme}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
        />

                 {/* Music Player (global placement for full mode only) */}
         <div className={`transition-height ${(settings.showMusicPlayer ?? true) && showMusicPlayer && !isWidget && layout !== 'compact' ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
              style={{
                '--max-height': '24rem'
              } as React.CSSProperties}>
           {(settings.showMusicPlayer ?? true) && showMusicPlayer && !isWidget && layout !== 'compact' && (
             <div className="animate-slide-in-up">
               <MusicPlayer theme={theme} />
             </div>
           )}
         </div>

         {/* Settings Panel */}
         {showSettings && (
           <div className={`animate-slide-in-up ${cardShadow} mb-6`}>
             <SettingsPanel
               settings={settings}
               onUpdateSettings={updateSettings}
               theme={theme}
             />
           </div>
         )}

        <MainContent
          isWidget={isWidget}
          layout={layout}
          settings={settings}
          theme={theme}
          accentColor={accentColor}
          cardShadow={cardShadow}
          showMusicPlayer={showMusicPlayer}
          showSettings={showSettings}
          time={time}
          isRunning={isRunning}
          isBreak={isBreak}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={resetTimer}
          onSkipBreak={skipBreak}
          activeTask={activeTask}
          estimatedBreakTime={estimatedBreakTime}
          currentSession={currentSession}
          totalSessions={totalSessions}
          tasks={tasks}
          onAddTask={handleTaskAdd}
          onDeleteTask={deleteTask}
          onSelectTask={setActiveTask}
          taskHistory={taskHistory}
          sessions={sessions}
          onShowHistory={() => setShowHistory(true)}
        />

                 {/* History Modal */}
         {showHistory && (
           <History
             sessions={Array.isArray(sessions) ? sessions : []}
             tasks={tasks}
             onClose={() => setShowHistory(false)}
             onDeleteSession={(sessionId) => {
               setSessions(prev => prev.filter(s => s.id !== sessionId));
             }}
             onDeleteDay={(date) => {
               setSessions(prev => prev.filter(s => s.date !== date));
             }}
             onUpdateSessions={setSessions}
             onUpdateTasks={(updatedTasks) => {
               // Update tasks via localStorage
               localStorage.setItem('flow-tasks', JSON.stringify(updatedTasks));
               window.location.reload(); // Reload to update state
             }}
             theme={theme}
             accentColor={accentColor}
           />
         )}
      </div>
    </div>
    </NotificationProvider>
  );
}

function App() {
  return (
    <ColorSystemProvider>
      <AppContent />
    </ColorSystemProvider>
  );
}

export default App;
