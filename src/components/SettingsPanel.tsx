import React from 'react';
import { Bell, BellOff, Palette, Layers, Brush } from 'lucide-react';
import type { Settings } from '../App';

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
 * - Shadows (flatMode): global switch disabling card shadows when true
 * - Color Timer (colorTimer): use accent color for the timer surface
 * - Background presets per theme (lightBg/darkBg)
 * - Accent color picker
 * - Visual/Audio notification toggles
 */
interface SettingsPanelProps {
  /** Current user settings */
  settings: Settings;
  /** Updater that merges provided fields into Settings */
  onUpdateSettings: (settings: Partial<Settings>) => void;
  /** Current theme for rendering */
  theme: 'light' | 'dark';
}

const accentColors = [
  { name: 'Blue', value: 'blue', color: '#3b82f6' },
  { name: 'Purple', value: 'purple', color: '#8b5cf6' },
  { name: 'Green', value: 'green', color: '#266a5b' },
  { name: 'Red', value: 'red', color: '#ef4444' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Pink', value: 'pink', color: '#ec4899' },
  { name: 'Black', value: 'black', color: '#111827' }
];

function SettingsPanel({ settings, onUpdateSettings, theme }: SettingsPanelProps) {
  return (
    <div className={`rounded-lg p-4 ${
      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 flex items-center ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
      }`}>
        <Palette size={20} className="mr-2" />
        Settings
      </h3>

      <div className="space-y-6">
        {/* Appearance */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            APPEARANCE
          </h4>
          <div className="space-y-5">
            {/* Shadows toggle */}
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
                  settings.flatMode
                    ? (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400') /* ON = flat = no shadows (neutral track) */
                    : 'bg-blue-500' /* OFF = shadows on (accent track) */
                }`}
                aria-pressed={!!settings.flatMode}
                aria-label="Toggle shadows"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.flatMode ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>

            {/* Color Timer toggle (moved right after Shadows) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brush size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Color Timer
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ colorTimer: !settings.colorTimer })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.colorTimer
                    ? 'bg-blue-500'
                    : (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')
                }`}
                aria-pressed={!!settings.colorTimer}
                aria-label="Toggle color timer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.colorTimer ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Background (Light theme) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Background (Light theme)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'gray-50', cls: 'bg-gray-50', label: '50' },
                  { key: 'gray-100', cls: 'bg-gray-100', label: '100' },
                  { key: 'gray-200', cls: 'bg-gray-200', label: '200' },
                  { key: 'gray-300', cls: 'bg-gray-300', label: '300' },
                  { key: 'gray-400', cls: 'bg-gray-400', label: '400' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => onUpdateSettings({ lightBg: opt.key as Settings['lightBg'] })}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${opt.cls} ${
                      settings.lightBg === opt.key
                        ? 'border-gray-900 dark:border-white scale-105'
                        : 'border-transparent hover:scale-105'
                    }`}
                    title={`Light ${opt.label}`}
                  />
                ))}
              </div>
            </div>

            {/* Background (Dark theme) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Background (Dark theme)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'gray-700', cls: 'bg-gray-700', label: '700' },
                  { key: 'gray-800', cls: 'bg-gray-800', label: '800' },
                  { key: 'gray-900', cls: 'bg-gray-900', label: '900' },
                  { key: 'gray-950', cls: 'bg-gray-950', label: '950' },
                  { key: 'neutral-900', cls: 'bg-neutral-900', label: 'N900' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => onUpdateSettings({ darkBg: opt.key as Settings['darkBg'] })}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${opt.cls} ${
                      settings.darkBg === opt.key
                        ? 'border-gray-900 dark:border-white scale-105'
                        : 'border-transparent hover:scale-105'
                    }`}
                    title={`Dark ${opt.label}`}
                  />
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Palette size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Accent color
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onUpdateSettings({ accentColor: color.value })}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      settings.accentColor === color.value
                        ? 'border-gray-900 dark:border-white scale-105'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            NOTIFICATIONS
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Visual notifications
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ visualNotifications: !settings.visualNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.visualNotifications 
                    ? 'bg-blue-500' 
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
              <div className="flex items-center space-x-2">
                <BellOff size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Audio notifications
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ audioNotifications: !settings.audioNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.audioNotifications
                    ? 'bg-blue-500'
                    : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                }`}
                aria-pressed={settings.audioNotifications}
                aria-label="Toggle audio notifications"
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


        {/* About */}
        <div className={`text-xs text-center pt-4 border-t ${
          theme === 'dark' 
            ? 'text-gray-400 border-gray-600' 
            : 'text-gray-500 border-gray-200'
        }`}>
          Flow Timer v1.0 • Built with React & Tailwind
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;