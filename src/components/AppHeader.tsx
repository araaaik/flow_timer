import React, { memo } from 'react';
import { Play, Pause, Settings, Music, Moon, Sun, Minimize2, Maximize2, Layout, PanelTop } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';
import { getAccentHex } from '../utils/colorSystem';
import { useColorSystemContext } from '../contexts/ColorSystemContext';

interface AppHeaderProps {
  isWidget: boolean;
  setIsWidget: (value: boolean) => void;
  todaysTime: number;
  isRunning: boolean;
  theme: 'light' | 'dark';
  accentColor: string;
  showMusicPlayer: boolean;
  setShowMusicPlayer: (value: boolean) => void;
  musicPlaying: boolean;
  setMusicPlaying: (value: boolean) => void;
  showTasks: boolean;
  layout: 'compact' | 'full';
  setLayout: (value: 'compact' | 'full') => void;
  toggleTheme: () => void;
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
}

const AppHeader: React.FC<AppHeaderProps> = memo(({
  isWidget,
  setIsWidget,
  todaysTime,
  isRunning,
  theme,
  accentColor,
  showMusicPlayer,
  setShowMusicPlayer,
  musicPlaying,
  setMusicPlaying,
  showTasks,
  layout,
  setLayout,
  toggleTheme,
  showSettings,
  setShowSettings
}) => {
  const colorSystem = useColorSystemContext();

  if (isWidget) {
    return (
      <div className="mb-4">
        <div className="mx-auto w-full max-w-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
              style={
                isRunning
                  ? { backgroundColor: getAccentHex(accentColor, colorSystem.getAllAccentColors()) }
                  : { backgroundColor: theme === 'dark' ? '#4b5563' : '#d1d5db' }
              }
            />
            {todaysTime > 0 && (
              <div className="text-sm text-gray-500">
                {formatTime(todaysTime)} today
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
                         <button
               onClick={() => setMusicPlaying(!musicPlaying)}
               className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                 theme === 'dark' 
                   ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-400' 
                   : 'hover:bg-gray-100 text-gray-400 hover:text-gray-500'
               }`}
               title={musicPlaying ? 'Pause music' : 'Play music'}
             >
               {musicPlaying ? <Pause size={18} /> : <Play size={18} />}
             </button>
            <button
              onClick={() => setIsWidget(false)}
              className={`hidden sm:block p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-500'
              }`}
              title="Exit widget mode"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
          style={
            isRunning
              ? { backgroundColor: getAccentHex(accentColor, colorSystem.getAllAccentColors()) }
              : { backgroundColor: theme === 'dark' ? '#4b5563' : '#d1d5db' }
          }
        />
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">FLOW</h1>
          {todaysTime > 0 && (
            <div className="hidden sm:block text-lg text-gray-500">
              {formatTime(todaysTime)} today
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 transition-all duration-240 ease-out-smooth">
        <button
          onClick={() => setIsWidget(true)}
          className={`hidden sm:block p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
            theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title="Widget mode"
        >
          <Minimize2 size={18} />
        </button>

        <button
          onClick={() => {
            console.log('Music button clicked, current showMusicPlayer:', showMusicPlayer);
            setShowMusicPlayer(!showMusicPlayer);
          }}
          className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
            theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title={showMusicPlayer ? 'Hide music player' : 'Show music player'}
        >
          <Music 
            size={18} 
            className={musicPlaying && !showMusicPlayer ? 'animate-pulse' : 'transition-colors duration-200'}
            style={musicPlaying && !showMusicPlayer ? { color: getAccentHex(accentColor, colorSystem.getAllAccentColors()) } : undefined}
          />
        </button>

        {showTasks && (
          <button
            onClick={() => setLayout(layout === 'compact' ? 'full' : 'compact')}
            className={`hidden sm:block p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title={layout === 'compact' ? 'Switch to full mode' : 'Switch to compact mode'}
          >
            {layout === 'compact' ? <PanelTop size={18} /> : <Layout size={18} />}
          </button>
        )}

        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
            theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
            theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
});

AppHeader.displayName = 'AppHeader';

export { AppHeader };