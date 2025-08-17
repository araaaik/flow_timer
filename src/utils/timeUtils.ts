/**
 * Time formatting utilities
 * Centralized time formatting functions used across the application
 */

import { TIME_CONSTANTS } from './constants';

/**
 * Formats time in readable format (H:MM format)
 * Used consistently across the application for time display
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / TIME_CONSTANTS.SECONDS_IN_HOUR);
  const mins = Math.floor((seconds % TIME_CONSTANTS.SECONDS_IN_HOUR) / TIME_CONSTANTS.SECONDS_IN_MINUTE);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  } else {
    return `0:${mins.toString().padStart(2, '0')}`;
  }
};

/**
 * Formats time for timer display (mm:ss or h:mm:ss)
 * Used specifically in the Timer component
 */
export const formatTimerDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / TIME_CONSTANTS.SECONDS_IN_HOUR);
  const mins = Math.floor((seconds % TIME_CONSTANTS.SECONDS_IN_HOUR) / TIME_CONSTANTS.SECONDS_IN_MINUTE);
  const secs = seconds % TIME_CONSTANTS.SECONDS_IN_MINUTE;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * Formats date and time for Excel export
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};