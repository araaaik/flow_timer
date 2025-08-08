import { useState, useEffect } from 'react';
import type { Task } from '../App';
import { useLocalStorage } from './useLocalStorage';

/**
 * useTasks()
 * LocalStorage-backed task registry with an active task pointer.
 *
 * Storage keys:
 * - 'flow-tasks' -> Task[]
 * - 'flow-active-task' -> Task | null
 *
 * API:
 * - tasks: Task[] (reactive)
 * - activeTask: Task | null (reactive)
 * - addTask(name, estimatedTime?)
 * - deleteTask(id)
 * - setActiveTask(task)
 *
 * Notes:
 * - deleteTask also cleans up the 'flow-task-history' suggestion list.
 * - Keeps activeTask in sync with tasks when list changes.
 */
export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('flow-tasks', []);
  const [activeTask, setActiveTaskState] = useLocalStorage<Task | null>('flow-active-task', null);

  /**
   * addTask()
   * Create and persist a new Task with optional goal (seconds).
   */
  const addTask = (name: string, estimatedTime?: number) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      timeSpent: 0,
      estimatedTime,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
  };

  /**
   * deleteTask()
   * Remove a task by id, clear active selection if it matches,
   * and prune the deleted name from 'flow-task-history' suggestions.
   */
  const deleteTask = (id: string) => {
    // Remove from tasks
    setTasks(prev => prev.filter(task => task.id !== id));

    // Clear active task if it matches
    if (activeTask?.id === id) {
      setActiveTaskState(null);
    }

    // Also remove from task history so deleted tasks do not show up in suggestions
    try {
      const historyKey = 'flow-task-history';
      const raw = localStorage.getItem(historyKey);
      if (raw) {
        const names: string[] = JSON.parse(raw);
        // Find the deleted task's name from current storage snapshot if available
        const tasksRaw = localStorage.getItem('flow-tasks');
        let deletedName: string | null = null;
        if (tasksRaw) {
          const storedTasks: { id: string; name: string }[] = JSON.parse(tasksRaw);
          const t = storedTasks.find(t => t.id === id);
          if (t) deletedName = t.name;
        }
        const next = deletedName
          ? names.filter(n => n !== deletedName)
          : names;

        localStorage.setItem(historyKey, JSON.stringify(next));
      }
    } catch {
      // no-op on history cleanup errors
    }
  };

  /**
   * setActiveTask()
   * Persist active selection for cross-reload continuity.
   */
  const setActiveTask = (task: Task | null) => {
    setActiveTaskState(task);
  };

  // Keep activeTask reference fresh when tasks array mutates (e.g., time updates)
  useEffect(() => {
    if (activeTask) {
      const updatedActiveTask = tasks.find(task => task.id === activeTask.id);
      if (updatedActiveTask && updatedActiveTask !== activeTask) {
        setActiveTaskState(updatedActiveTask);
      }
    }
  }, [tasks, activeTask, setActiveTaskState]);

  return {
    tasks,
    activeTask,
    addTask,
    deleteTask,
    setActiveTask
  };
}