/**
 * Storage cleanup utilities
 * Handles cleaning up orphaned references and invalid data
 */

import type { Task } from '../App';

/**
 * Clean up orphaned active task references
 * If the active task ID doesn't exist in the tasks array, clear it
 */
export function cleanupActiveTask(): void {
  try {
    const activeTaskRaw = localStorage.getItem('flow-active-task');
    const tasksRaw = localStorage.getItem('flow-tasks');
    
    if (!activeTaskRaw || activeTaskRaw === 'null') {
      return; // No active task set
    }
    
    const activeTask = JSON.parse(activeTaskRaw);
    if (!activeTask || !activeTask.id) {
      localStorage.removeItem('flow-active-task');
      return;
    }
    
    if (!tasksRaw) {
      // No tasks exist, clear active task
      localStorage.removeItem('flow-active-task');
      return;
    }
    
    const tasks: Task[] = JSON.parse(tasksRaw);
    const taskExists = tasks.some(task => task.id === activeTask.id);
    
    if (!taskExists) {
      // Active task doesn't exist in tasks array, clear it
      localStorage.removeItem('flow-active-task');
      console.log('Cleaned up orphaned active task:', activeTask.name);
    }
  } catch (error) {
    console.error('Error during active task cleanup:', error);
    // If there's any error, clear the active task to be safe
    localStorage.removeItem('flow-active-task');
  }
}

/**
 * Clean up timer state if it references a non-existent task
 */
export function cleanupTimerState(): void {
  try {
    const timerStateRaw = localStorage.getItem('flow-timer-state');
    const tasksRaw = localStorage.getItem('flow-tasks');
    
    if (!timerStateRaw) {
      return; // No timer state
    }
    
    const timerState = JSON.parse(timerStateRaw);
    if (!timerState.sessionId) {
      return; // No session running
    }
    
    // If timer is running but no tasks exist, we might have an issue
    if (!tasksRaw && timerState.isRunning) {
      const tasks: Task[] = JSON.parse(tasksRaw || '[]');
      const activeTaskRaw = localStorage.getItem('flow-active-task');
      
      if (activeTaskRaw && activeTaskRaw !== 'null') {
        const activeTask = JSON.parse(activeTaskRaw);
        if (activeTask && activeTask.id) {
          const taskExists = tasks.some(task => task.id === activeTask.id);
          if (!taskExists) {
            // Timer is running for a non-existent task, this could cause issues
            console.log('Warning: Timer state may reference deleted task');
          }
        }
      }
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