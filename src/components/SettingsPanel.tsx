import React, { useState } from 'react';
import { Bell, BellOff, Palette, Layers, Brush, Music, Plus, Edit3, Trash2, Check, X, Eye, EyeOff, Image as ImageIcon, Timer, CheckSquare, Sun, Moon, Minus } from 'lucide-react';
import type { Settings } from '../App';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { useColorSystem } from '../hooks/useColorSystem';
import { generateRandomColor, isLightColor } from '../utils/colorSystem';

/**
 * SettingsPanel.tsx
 * Visual and notification preferences editor.
 *
 * Props:
 * - settings: current Settings bag (persisted by parent via useLocalStorage)
 * - onUpdateSettings(partial): merge-like setter to update settings in parent
 * - theme: current resolved theme for surface colors
 *
 * Controls:
 * - Timer settings (mode, flow/pomodoro options)
 * - Task settings (show tasks, require selection)
 * - Music settings (show player, streams)
 * - Appearance (notifications, visual effects, colors, backgrounds)
 */
interface SettingsPanelProps {
  /** Current user settings */
  settings: Settings;
  /** Updater that merges provided fields into Settings */
  onUpdateSettings: (settings: Partial<Settings>) => void;
  /** Current theme for rendering */
  theme: 'light' | 'dark';
}



// Helper to get thumbnail for a given stream (custom or YouTube)
const getThumb = (stream: { name: string; url: string; customThumbnail?: string }) => {
  if (stream.customThumbnail) {
    return stream.customThumbnail;
  }
  
  try {
    const id = new URL(stream.url).searchParams.get('v');
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  } catch {
    const id = stream.url.split('v=')[1] || '';
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  }
};



interface MusicStreamsSettingsProps {
  theme: 'light' | 'dark';
}

function MusicStreamsSettings({ theme }: MusicStreamsSettingsProps) {
  const {
    streams,
    addStream,
    updateStream,
    deleteStream,
    toggleStreamVisibility,
    isStreamHidden
  } = useMusicPlayer();
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(streams[index].name);
    setEditUrl(streams[index].url);
    setEditThumbnail(streams[index].customThumbnail || '');
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditName('');
    setEditUrl('');
    setEditThumbnail('');
  };

  const saveEdit = () => {
    if (editName.trim() && editUrl.trim()) {
      const thumbnail = editThumbnail.trim() || undefined;
      if (editingIndex !== null) {
        updateStream(editingIndex, editName.trim(), editUrl.trim(), thumbnail);
        setEditingIndex(null);
      } else if (isAdding) {
        addStream(editName.trim(), editUrl.trim(), thumbnail);
        setIsAdding(false);
      }
      setEditName('');
      setEditUrl('');
      setEditThumbnail('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setIsAdding(false);
    setEditName('');
    setEditUrl('');
    setEditThumbnail('');
  };

  const handleDelete = (index: number) => {
    if (streams.length > 1 && window.confirm('Are you sure you want to delete this stream?')) {
      deleteStream(index);
    }
  };

  const quickEditThumbnail = (index: number) => {
    const newThumbnail = prompt(
      'Enter custom thumbnail URL (leave empty for YouTube thumbnail):',
      streams[index].customThumbnail || ''
    );
    if (newThumbnail !== null) {
      updateStream(index, streams[index].name, streams[index].url, newThumbnail.trim() || undefined);
    }
  };

  return (
    <div className="space-y-4">
      <h5 className={`text-sm font-medium ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      }`}>
        Music Streams
      </h5>
      <div className="space-y-3">
        {/* Add new stream */}
        {isAdding ? (
          <div className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Stream name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white border-gray-500' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              />
              <input
                type="text"
                placeholder="YouTube URL"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white border-gray-500' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              />
              <input
                type="url"
                placeholder="Custom thumbnail URL (optional)"
                value={editThumbnail}
                onChange={(e) => setEditThumbnail(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white border-gray-500' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-white settings-action-button"
                >
                  <Check size={12} />
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={startAdd}
            className={`w-full p-3 rounded-lg border-2 border-dashed transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
            }`}
          >
            <Plus size={16} className="mx-auto mb-1" />
            <span className="text-sm font-medium">Add Stream</span>
          </button>
        )}

        {/* Stream list */}
        <div className="space-y-2">
          {streams.map((stream, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              }`}
            >
              {editingIndex === index ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-white border-gray-500' 
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  />
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-white border-gray-500' 
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  />
                  <input
                    type="url"
                    placeholder="Custom thumbnail URL (optional)"
                    value={editThumbnail}
                    onChange={(e) => setEditThumbnail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-white border-gray-500' 
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-white settings-action-button"
                    >
                      <Check size={12} />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium ${
                        theme === 'dark'
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    src={getThumb(stream)}
                    alt={stream.name}
                    className="w-12 h-8 object-cover rounded"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {stream.name}
                    </div>
                    <div className={`text-xs truncate ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {stream.url}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStreamVisibility(index)}
                      className={`p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                      title={isStreamHidden(index) ? 'Show stream' : 'Hide stream'}
                    >
                      {isStreamHidden(index) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => quickEditThumbnail(index)}
                      className={`p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                      title="Edit thumbnail"
                    >
                      <ImageIcon size={14} />
                    </button>
                    <button
                      onClick={() => startEdit(index)}
                      className={`p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                      title="Edit stream"
                    >
                      <Edit3 size={14} />
                    </button>
                    {streams.length > 1 && (
                      <button
                        onClick={() => handleDelete(index)}
                        className={`p-1 rounded transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-red-900 text-red-400 hover:text-red-300'
                            : 'hover:bg-red-100 text-red-500 hover:text-red-700'
                        }`}
                        title="Delete stream"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Color management components
interface ColorManagerProps {
  theme: 'light' | 'dark';
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
}

function AccentColorManager({ theme, settings, onUpdateSettings }: ColorManagerProps) {
  const colorSystem = useColorSystem();
  const [isAdding, setIsAdding] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorValue, setNewColorValue] = useState('');

  const allColors = colorSystem.getAllAccentColors();

  const handleAddColor = () => {
    if (newColorName.trim() && newColorValue.trim()) {
      const success = colorSystem.addAccentColor(newColorName.trim(), newColorValue.trim());
      if (success) {
        setNewColorName('');
        setNewColorValue('');
        setIsAdding(false);
      }
    }
  };

  const handleRandomColor = () => {
    setNewColorValue(generateRandomColor());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Accent colors
          </span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`p-1 rounded transition-colors ${
            theme === 'dark'
              ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          title="Add custom color"
        >
          <Plus size={14} />
        </button>
      </div>

      {isAdding && (
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Color name"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-600 text-white border-gray-500' 
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={newColorValue}
                onChange={(e) => setNewColorValue(e.target.value)}
                className="w-12 h-10 rounded border-0 cursor-pointer"
              />
              <input
                type="text"
                placeholder="#000000"
                value={newColorValue}
                onChange={(e) => setNewColorValue(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white border-gray-500' 
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              />
              <button
                onClick={handleRandomColor}
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Random
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddColor}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-white settings-action-button"
              >
                <Check size={12} />
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewColorName('');
                  setNewColorValue('');
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allColors.map((color) => (
          <div key={color.value} className="relative group">
            <button
              onClick={() => onUpdateSettings({ accentColor: color.value })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                settings.accentColor === color.value
                  ? 'border-gray-900 dark:border-white scale-105 shadow-lg'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ 
                backgroundColor: color.color,
                minWidth: '2.5rem',
                minHeight: '2.5rem'
              }}
              title={color.name}
            />
            {color.isCustom && (
              <button
                onClick={() => colorSystem.removeAccentColor(color.value)}
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${
                  isLightColor(color.color) ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                } opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
                title="Remove color"
              >
                <Minus size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BackgroundManager({ theme, settings, onUpdateSettings, type }: ColorManagerProps & { type: 'light' | 'dark' }) {
  const colorSystem = useColorSystem();
  const [isAdding, setIsAdding] = useState(false);
  const [newBgLabel, setNewBgLabel] = useState('');
  const [newBgClass, setNewBgClass] = useState('');

  const allBackgrounds = type === 'light' 
    ? colorSystem.getAllLightBackgrounds() 
    : colorSystem.getAllDarkBackgrounds();

  const handleAddBackground = () => {
    if (newBgLabel.trim() && newBgClass.trim()) {
      const success = type === 'light'
        ? colorSystem.addLightBackground(newBgLabel.trim(), newBgClass.trim())
        : colorSystem.addDarkBackground(newBgLabel.trim(), newBgClass.trim());
      
      if (success) {
        setNewBgLabel('');
        setNewBgClass('');
        setIsAdding(false);
      }
    }
  };

  const handleRemoveBackground = (key: string) => {
    if (type === 'light') {
      colorSystem.removeLightBackground(key);
    } else {
      colorSystem.removeDarkBackground(key);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'light' ? <Sun size={14} /> : <Moon size={14} />}
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {type === 'light' ? 'Light' : 'Dark'} theme backgrounds
          </span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`p-1 rounded transition-colors ${
            theme === 'dark'
              ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          title="Add custom background"
        >
          <Plus size={14} />
        </button>
      </div>

      {isAdding && (
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Label (e.g., '100')"
              value={newBgLabel}
              onChange={(e) => setNewBgLabel(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-600 text-white border-gray-500' 
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            />
            <input
              type="text"
              placeholder="Tailwind class (e.g., 'bg-slate-100')"
              value={newBgClass}
              onChange={(e) => setNewBgClass(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-600 text-white border-gray-500' 
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddBackground}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-white settings-action-button"
              >
                <Check size={12} />
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewBgLabel('');
                  setNewBgClass('');
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allBackgrounds.map((bg) => (
          <div key={bg.key} className="relative group">
            <button
              onClick={() => onUpdateSettings({ 
                [type === 'light' ? 'lightBg' : 'darkBg']: bg.key 
              })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${bg.cls} ${
                (type === 'light' ? settings.lightBg : settings.darkBg) === bg.key
                  ? (type === 'light' ? 'border-gray-900' : 'border-white') + ' scale-105 shadow-lg'
                  : 'border-transparent hover:scale-105'
              }`}
              title={bg.label}
            />
            {bg.isCustom && (
              <button
                onClick={() => handleRemoveBackground(bg.key)}
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
                title="Remove background"
              >
                <Minus size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onUpdateSettings, theme }: SettingsPanelProps) {
  const colorSystem = useColorSystem();
  
  // Get hex color for CSS variables
  const getAccentHex = () => {
    const allColors = colorSystem.getAllAccentColors();
    const color = allColors.find(c => c.value === settings.accentColor);
    return color?.color || '#3b82f6'; // fallback to blue
  };

  const accentHex = getAccentHex();
  
  return (
    <div 
      className={`rounded-lg p-6 max-w-6xl mx-auto ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } ${settings.flatMode ? '' : 'shadow-lg'}`}
      style={{
        '--accent-color': accentHex,
        '--accent-color-hover': accentHex + 'dd', // slightly transparent for hover
      } as React.CSSProperties}
    >
      <h3 className={`text-xl font-semibold mb-6 flex items-center ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}>
        <Palette size={24} className="mr-3" />
        Settings
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Timer Settings */}
          <div>
            <h4 className={`text-base font-semibold mb-4 flex items-center ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}>
              <Timer size={18} className="mr-2" />
              TIMER SETTINGS
            </h4>
            <div className="space-y-5">
              {/* Mode Selection */}
              <div className="space-y-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Timer Mode
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateSettings({ timerMode: 'flow' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (settings.timerMode ?? 'flow') === 'flow'
                        ? 'settings-active-button'
                        : theme === 'dark' 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Flow Mode
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ timerMode: 'pomodoro' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (settings.timerMode ?? 'flow') === 'pomodoro'
                        ? 'settings-active-button'
                        : theme === 'dark' 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pomodoro
                  </button>
                </div>
                
                {/* Mode Explanation */}
                <div className={`text-xs p-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-300' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  {(settings.timerMode ?? 'flow') === 'flow' ? (
                    <>
                      <div className="font-medium mb-1">Flow Mode</div>
                      <div>Work as long as you need. Timer counts up. Breaks are optional and configurable.</div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium mb-1">Pomodoro Mode</div>
                      <div>Fixed work/break cycles. Timer counts down. Automatic session progression.</div>
                    </>
                  )}
                </div>
              </div>

              {/* Flow Mode Settings */}
              {(settings.timerMode ?? 'flow') === 'flow' && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  {/* Break Toggle */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Enable breaks
                    </span>
                    <button
                      onClick={() => onUpdateSettings({ flowBreakEnabled: !(settings.flowBreakEnabled ?? true) })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (settings.flowBreakEnabled ?? true)
                          ? 'settings-active-toggle'
                          : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (settings.flowBreakEnabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Break Settings */}
                  {(settings.flowBreakEnabled ?? true) && (
                    <>
                      <div className="space-y-2">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Break calculation
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onUpdateSettings({ flowBreakType: 'percentage' })}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              (settings.flowBreakType ?? 'percentage') === 'percentage'
                                ? 'settings-active-button'
                                : theme === 'dark' 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Percentage
                          </button>
                          <button
                            onClick={() => onUpdateSettings({ flowBreakType: 'fixed' })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              (settings.flowBreakType ?? 'percentage') === 'fixed'
                                ? 'settings-active-button'
                                : theme === 'dark' 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Fixed
                          </button>
                        </div>
                      </div>

                      {/* Percentage Options */}
                      {(settings.flowBreakType ?? 'percentage') === 'percentage' && (
                        <div className="space-y-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Break percentage
                          </span>
                          <div className="flex gap-2">
                            {[10, 15, 20, 25].map(percent => (
                              <button
                                key={percent}
                                onClick={() => onUpdateSettings({ flowBreakPercentage: percent as 10 | 15 | 20 | 25 })}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  (settings.flowBreakPercentage ?? 20) === percent
                                    ? 'settings-active-button'
                                    : theme === 'dark' 
                                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {percent}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fixed Options */}
                      {(settings.flowBreakType ?? 'percentage') === 'fixed' && (
                        <div className="space-y-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Break duration (minutes)
                          </span>
                          <div className="flex gap-2">
                            {[5, 10, 20, 30].map(minutes => (
                              <button
                                key={minutes}
                                onClick={() => onUpdateSettings({ flowBreakFixed: minutes as 5 | 10 | 20 | 30 })}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  (settings.flowBreakFixed ?? 10) === minutes
                                    ? 'settings-active-button'
                                    : theme === 'dark' 
                                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {minutes}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Pomodoro Mode Settings */}
              {(settings.timerMode ?? 'flow') === 'pomodoro' && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  {/* Work Duration */}
                  <div className="space-y-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Work duration (minutes)
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.pomodoroWorkDuration ?? 25}
                      onChange={(e) => onUpdateSettings({ pomodoroWorkDuration: parseInt(e.target.value) })}
                      className={`w-20 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-white border-gray-600 focus:border-gray-500' 
                          : 'bg-white text-gray-900 border-gray-300 focus:border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    />
                  </div>

                  {/* Break Duration */}
                  <div className="space-y-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Break duration (minutes)
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.pomodoroBreakDuration ?? 5}
                      onChange={(e) => onUpdateSettings({ pomodoroBreakDuration: parseInt(e.target.value) })}
                      className={`w-20 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-white border-gray-600 focus:border-gray-500' 
                          : 'bg-white text-gray-900 border-gray-300 focus:border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    />
                  </div>

                  {/* Sessions */}
                  <div className="space-y-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Number of sessions
                    </span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 6, 8].map(sessions => (
                        <button
                          key={sessions}
                          onClick={() => onUpdateSettings({ pomodoroSessions: sessions })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            (settings.pomodoroSessions ?? 4) === sessions
                              ? 'settings-active-button'
                              : theme === 'dark' 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {sessions}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task Settings */}
          <div>
            <h4 className={`text-base font-semibold mb-4 flex items-center ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}>
              <CheckSquare size={18} className="mr-2" />
              TASK SETTINGS
            </h4>
            <div className="space-y-4">
              {/* Show Tasks */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Show tasks panel
                  </span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ showTasks: !settings.showTasks })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showTasks
                      ? 'settings-active-toggle'
                      : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showTasks ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Require Task Selection */}
              {settings.showTasks && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Require task selection
                    </span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ requireTaskSelection: !settings.requireTaskSelection })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.requireTaskSelection
                        ? 'settings-active-toggle'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.requireTaskSelection ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Music Settings */}
          <div>
            <h4 className={`text-base font-semibold mb-4 flex items-center ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}>
              <Music size={18} className="mr-2" />
              MUSIC SETTINGS
            </h4>
            <div className="space-y-4">
              {/* Show Music Player */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Show music player
                  </span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ showMusicPlayer: !settings.showMusicPlayer })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showMusicPlayer
                      ? 'settings-active-toggle'
                      : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showMusicPlayer ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Music Streams */}
              {settings.showMusicPlayer && (
                <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  <MusicStreamsSettings theme={theme} />
                </div>
              )}
            </div>
          </div>

          {/* Appearance Settings */}
          <div>
            <h4 className={`text-base font-semibold mb-4 flex items-center ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}>
              <Palette size={18} className="mr-2" />
              APPEARANCE
            </h4>
            <div className="space-y-5">
              {/* Notifications */}
              <div className="space-y-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notifications
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Visual notifications
                      </span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ visualNotifications: !settings.visualNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.visualNotifications
                          ? 'settings-active-toggle'
                          : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.visualNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellOff size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Audio notifications
                      </span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ audioNotifications: !settings.audioNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.audioNotifications
                          ? 'settings-active-toggle'
                          : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.audioNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual Effects */}
              <div className="space-y-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Visual Effects
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Shadows
                      </span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ flatMode: !settings.flatMode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        !settings.flatMode
                          ? 'settings-active-toggle'
                          : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          !settings.flatMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brush size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Color timer
                      </span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ colorTimer: !settings.colorTimer })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.colorTimer
                          ? 'settings-active-toggle'
                          : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.colorTimer ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Accent Colors */}
              <AccentColorManager 
                theme={theme} 
                settings={settings}
                onUpdateSettings={onUpdateSettings}
              />

              {/* Background Colors */}
              <div className="space-y-4">
                <BackgroundManager 
                  theme={theme} 
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  type="light" 
                />
                <BackgroundManager 
                  theme={theme} 
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  type="dark" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS для централизованного управления акцентными цветами */}
      <style>{`
        /* Активные кнопки меню */
        .settings-active-button {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        
        /* Активные тогглы */
        .settings-active-toggle {
          background-color: var(--accent-color) !important;
        }
        
        /* Кнопки действий (Save, Add) */
        .settings-action-button {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        
        .settings-action-button:hover {
          background-color: var(--accent-color-hover) !important;
        }
      `}</style>
    </div>
  );
}

export default SettingsPanel;
