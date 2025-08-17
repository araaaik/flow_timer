/**
 * Application constants
 * Centralized constants used across the application
 */

// LocalStorage keys
export const STORAGE_KEYS = {
  TASKS: 'flow-tasks',
  ACTIVE_TASK: 'flow-active-task',
  SESSIONS: 'flow-sessions',
  SETTINGS: 'flow-settings',
  TIMER_STATE: 'flow-timer-state',
  TASK_HISTORY: 'flow-task-history',
  LAST_RESET: 'flow-last-reset',
  COLOR_SYSTEM: 'colorSystem',
} as const;

// Time constants
export const TIME_CONSTANTS = {
  SECONDS_IN_MINUTE: 60,
  SECONDS_IN_HOUR: 3600,
  MILLISECONDS_IN_SECOND: 1000,
  MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000,
} as const;

// Default values
export const DEFAULTS = {
  SOUND_VOLUME: 0.5,
  BEEP_FREQUENCY: 800,
  BEEP_DURATION: 0.3,
  BEEP_VOLUME: 0.3,
} as const;

// File extensions and MIME types
export const FILE_TYPES = {
  CSV: {
    extension: '.csv',
    mimeType: 'text/csv;charset=utf-8;',
  },
} as const;