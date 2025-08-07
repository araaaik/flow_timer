import React from 'react';
import { Bell, BellOff, Palette } from 'lucide-react';
import type { Settings } from '../App';

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  theme: 'light' | 'dark';
}

const accentColors = [
  { name: 'Blue', value: 'blue', color: '#3b82f6' },
  { name: 'Purple', value: 'purple', color: '#8b5cf6' },
  { name: 'Green', value: 'green', color: '#10b981' },
  { name: 'Red', value: 'red', color: '#ef4444' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Pink', value: 'pink', color: '#ec4899' }
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

        {/* Accent Colors */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            ACCENT COLOR
          </h4>
          <div className="grid grid-cols-6 gap-2">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onUpdateSettings({ accentColor: color.value })}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  settings.accentColor === color.value
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color.color }}
                title={color.name}
              />
            ))}
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