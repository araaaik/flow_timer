/**
 * Storage cleanup utilities
 * Handles cleaning up orphaned references and invalid data
 */

import type { Task } from '../App';
import { STORAGE_KEYS } from './constants';

/**
 * Safe JSON parse with fallback
 */
const safeJsonParse = <T>(json: string | null, fallback: T): T => {
  if (!json || json === 'null') return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

/**
 * Clean up orphaned active task references (optimized)
 */
export function cleanupActiveTask(): void {
  try {
    const activeTaskRaw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TASK);
    const tasksRaw = localStorage.getItem(STORAGE_KEYS.TASKS);
    
    // Early returns for common cases
    if (!activeTaskRaw || activeTaskRaw === 'null') return;
    if (!tasksRaw) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TASK);
      return;
    }
    
    const activeTask = safeJsonParse(activeTaskRaw, null);
    const tasks: Task[] = safeJsonParse(tasksRaw, []);
    
    if (!activeTask?.id || !tasks.some(task => task.id === activeTask.id)) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TASK);
      if (activeTask?.name) {
        console.log('Cleaned up orphaned active task:', activeTask.name);
      }
    }
  } catch (error) {
    console.error('Error during active task cleanup:', error);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TASK);
  }
}

/**
 * Clean up timer state if it references a non-existent task (simplified)
 */
export function cleanupTimerState(): void {
  try {
    const timerStateRaw = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (!timerStateRaw) return;
    
    const timerState = safeJsonParse(timerStateRaw, null);
    if (!timerState?.sessionId || !timerState?.isRunning) return;
    
    const tasksRaw = localStorage.getItem(STORAGE_KEYS.TASKS);
    const activeTaskRaw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TASK);
    
    if (!tasksRaw || !activeTaskRaw) {
      console.warn('Timer running but no tasks/active task found');
      return;
    }
    
    const tasks: Task[] = safeJsonParse(tasksRaw, []);
    const activeTask = safeJsonParse(activeTaskRaw, null);
    
    if (activeTask?.id && !tasks.some(task => task.id === activeTask.id)) {
      console.warn('Timer state references deleted task:', activeTask.name);
    }
  } catch (error) {
    console.error('Error during timer state cleanup:', error);
  }
}

/**
 * Run all cleanup operations
 * Should be called on app startup
 */
export function runStorageCleanup(): void {
  cleanupActiveTask();
  cleanupTimerState();
}