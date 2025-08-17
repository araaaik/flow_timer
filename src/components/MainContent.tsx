import React, { memo } from 'react';
import Timer from './Timer';
import TaskManager from './TaskManager';
import MusicPlayer from './MusicPlayer';
import { getAccentHex } from '../utils/colorSystem';
import { useColorSystemContext } from '../contexts/ColorSystemContext';
import type { Task, Session, Settings } from '../App';

interface MainContentProps {
  isWidget: boolean;
  layout: 'compact' | 'full';
  settings: Settings;
  theme: 'light' | 'dark';
  accentColor: string;
  cardShadow: string;
  showMusicPlayer: boolean;
  showSettings: boolean;
  
  // Timer props
  time: number;
  isRunning: boolean;
  isBreak: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSkipBreak: () => void;
  activeTask: Task | null;
  estimatedBreakTime: number;
  currentSession: number;
  totalSessions: number;
  
  // Task props
  tasks: Task[];
  onAddTask: (name: string, estimatedTime?: number) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: Task | null) => void;
  taskHistory: string[];
  sessions: Session[];
  onShowHistory: () => void;
}

const MainContent: React.FC<MainContentProps> = memo(({
  isWidget,
  layout,
  settings,
  theme,
  accentColor,
  cardShadow,
  showMusicPlayer,
  showSettings,
  time,
  isRunning,
  isBreak,
  onStart,
  onStop,
  onReset,
  onSkipBreak,
  activeTask,
  estimatedBreakTime,
  currentSession,
  totalSessions,
  tasks,
  onAddTask,
  onDeleteTask,
  onSelectTask,
  taskHistory,
  sessions,
  onShowHistory
}) => {
  console.log('MainContent render - showMusicPlayer:', showMusicPlayer, 'layout:', layout, 'settings.showMusicPlayer:', settings.showMusicPlayer);
  const colorSystem = useColorSystemContext();
  
  const timerComponent = (
    <div
      className={`rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth ${
        settings.colorTimer 
          ? 'text-white' 
          : theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
      style={settings.colorTimer ? { backgroundColor: getAccentHex(accentColor, colorSystem.getAllAccentColors()) } : undefined}
    >
      <Timer
        time={time}
        isRunning={isRunning}
        isBreak={isBreak}
        onStart={onStart}
        onStop={onStop}
        onReset={onReset}
        onSkipBreak={onSkipBreak}
        activeTask={activeTask}
        estimatedBreakTime={estimatedBreakTime}
        currentSession={currentSession}
        totalSessions={totalSessions}
        theme={theme}
        accentColor={accentColor}
        isWidget={isWidget}
        settings={settings}
      />
    </div>
  );

  if (isWidget) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          {timerComponent}
        </div>
      </div>
    );
  }

  if (layout === 'compact' && settings.showTasks) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        <div className={`space-y-6 ${showSettings ? '' : 'sm:sticky sm:top-6 sm:self-start'}`}>
          {timerComponent}
          {showMusicPlayer && (
            <MusicPlayer theme={theme} layout="compact" cardShadow={cardShadow} />
          )}
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth`}>
          <TaskManager
            tasks={tasks}
            activeTask={activeTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onSelectTask={(t) => { if (!isRunning) onSelectTask(t); }}
            taskHistory={taskHistory}
            theme={theme}
            accentColor={accentColor}
            sessions={sessions}
            layout="compact"
            onShowHistory={onShowHistory}
          />
        </div>
      </div>
    );
  }

  if (layout === 'compact' && !settings.showTasks) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md space-y-6">
          {timerComponent}
          {showMusicPlayer && (
            <MusicPlayer theme={theme} layout="compact" cardShadow={cardShadow} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 transition-colors duration-240 ease-out-smooth">
      {timerComponent}
      {settings.showTasks && (
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 ${cardShadow} transition-colors duration-300 ease-out-smooth`}>
          <TaskManager
            tasks={tasks}
            activeTask={activeTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onSelectTask={(t) => { if (!isRunning) onSelectTask(t); }}
            taskHistory={taskHistory}
            theme={theme}
            accentColor={accentColor}
            sessions={sessions}
            layout="full"
            onShowHistory={onShowHistory}
          />
        </div>
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

export { MainContent };