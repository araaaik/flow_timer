import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Clock, Target } from 'lucide-react';
import type { Task, Session } from '../App';

interface TaskManagerProps {
  tasks: Task[];
  activeTask: Task | null;
  onAddTask: (name: string, estimatedTime?: number) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
  taskHistory: string[];
  theme: 'light' | 'dark';
  accentColor: string;
  sessions?: Session[];
}

function TaskManager({
  tasks,
  activeTask,
  onAddTask,
  onDeleteTask,
  onSelectTask,
  taskHistory,
  theme,
  accentColor,
  sessions
}: TaskManagerProps & { isRunning?: boolean }) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Live seconds ticker to refresh UI every second while a timer is running (single declaration)
  const [liveTick, setLiveTick] = useState(0);
  const [, forceRender] = useState(0); // force re-render when storage changes (same-tab)

  // Start ticking once per second while a work session is running.
  // Also listen to storage changes to immediately react to timer start/stop from other components/tabs.
  useEffect(() => {
    let interval: number | undefined;

    const startTick = () => {
      if (!interval) {
        interval = window.setInterval(() => {
          setLiveTick((v) => (v + 1) % 60000);
        }, 1000);
      }
    };

    const stopTick = () => {
      if (interval) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };

    const checkState = () => {
      try {
        const raw = localStorage.getItem('flow-timer-state');
        const state = raw ? JSON.parse(raw) : null;
        if (state?.isRunning && !state?.isBreak) startTick();
        else stopTick();
      } catch {
        stopTick();
      }
    };

    checkState();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'flow-timer-state') checkState();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      stopTick();
    };
  }, []);

  /* removed duplicate liveTick ticker (consolidated above) */

  /* removed duplicate liveTick ticker (consolidated above) */

  const filteredSuggestions = taskHistory
    .filter(task => task.toLowerCase().includes(newTaskName.toLowerCase()) && task !== newTaskName)
    .slice(0, 5);

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const estimatedMinutes = newTaskTime ? parseInt(newTaskTime, 10) : undefined;
    const estimatedSeconds = estimatedMinutes ? estimatedMinutes * 60 : undefined;
    onAddTask(newTaskName.trim(), estimatedSeconds);
    setNewTaskName('');
    setNewTaskTime('');
    setShowTimeInput(false);
    setShowSuggestions(false);
  };

  const handleDelete = (id: string, taskName: string) => {
    if (window.confirm(`Delete task "${taskName}"? This will remove all recorded time.`)) {
      onDeleteTask(id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const formatHHMM = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setShowSuggestions(newTaskName.length > 0 && filteredSuggestions.length > 0);
  }, [newTaskName, filteredSuggestions.length]);

  // Also force a re-render immediately on same-tab timer state changes so UI updates without waiting 1s
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'flow-timer-state') {
        // bump a dummy state to force re-render of computed values (totalToday/pctToday)
        forceRender(v => (v + 1) % 1000000);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="min-w-0">
      <h2 className={`text-lg font-semibold mb-4 transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
        Tasks
      </h2>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div>
            <div className="space-y-3">
              <div className="relative">
                <div className="flex items-stretch w-full overflow-hidden">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add new task..."
                    maxLength={15}
                    className={`min-w-0 w-full px-3 py-2 rounded-l-lg border transition-colors duration-240 ease-out-smooth ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                    } focus:outline-none`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowTimeInput(!showTimeInput)}
                    title="Set goal (minutes)"
                    className={`px-3 rounded-r-none border-y border-l transition-colors duration-240 ease-out-smooth ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Target size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTaskName.trim()}
                    title="Add task"
                    className={`px-3 rounded-r-lg border-y border-r transition-colors duration-240 ease-out-smooth ${
                      newTaskName.trim()
                        ? `text-white bg-${accentColor}-500 hover:bg-${accentColor}-600 border-${accentColor}-600`
                        : `text-white ${theme === 'dark' ? 'bg-gray-500 border-gray-500' : 'bg-gray-300 border-gray-300'} cursor-not-allowed`
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {showTimeInput && (
                  <div className="mt-2">
                    <select
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className={`px-3 py-2 w-48 rounded-lg border text-sm transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none`}
                    >
                      <option value="">No goal</option>
                      <option value="60">1 Hr</option>
                      <option value="120">2 Hr</option>
                      <option value="180">3 Hr</option>
                      <option value="240">4 Hr</option>
                      <option value="300">5 Hr</option>
                      <option value="360">6 Hr</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {tasks.map((task) => {
              const showBadge = Array.isArray(sessions);
              const todayStr = new Date().toDateString();

              // Base = accumulated saved sessions for today
              const baseToday = showBadge
                ? (sessions as Session[])
                    .filter(s => s.taskId === task.id && s.date === todayStr)
                    .reduce((sum, s) => sum + s.duration, 0)
                : 0;

              // If this is the active task and timer is running, add the currently elapsed live seconds
              // Live increment = activeTask.timeSpent since start is not tracked here, so approximate by the running timer hint:
              // We piggyback on localStorage 'flow-timer-state' if present to detect running elapsed; otherwise show baseToday.
              let liveExtra = 0;
              try {
                const raw = localStorage.getItem('flow-timer-state');
                if (raw) {
                  const state = JSON.parse(raw || '{}');
                  // Expect shape: { isRunning, isBreak, startTime }
                  if (
                    state?.isRunning &&
                    !state?.isBreak &&
                    activeTask &&
                    activeTask.id === task.id &&
                    typeof state?.startTime === 'number'
                  ) {
                    // elapsed seconds since startTime (kept by useTimer)
                    const now = Date.now();
                    const elapsed = Math.max(0, Math.floor((now - state.startTime) / 1000));
                    liveExtra = elapsed;
                  }
                }
              } catch {}

              const totalToday = baseToday + liveExtra;

              const hasGoal = typeof task.estimatedTime === 'number' && task.estimatedTime > 0;
              const pctToday = hasGoal
                ? Math.min(100, Math.max(0, Math.round(((totalToday || 0) / (task.estimatedTime || 1)) * 100)))
                : 0;

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    if ((TaskManager as any).isRunningGlobal) return;
                    onSelectTask(task);
                  }}
                  className={`rounded-lg ${((TaskManager as any).isRunningGlobal ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')} transition-all duration-240 ease-out-smooth ${
                    activeTask?.id === task.id
                      ? `ring-2 ring-offset-0 border-0 ${accentColor === 'blue' ? 'ring-blue-500'
                        : accentColor === 'red' ? 'ring-red-500'
                        : accentColor === 'green' ? 'ring-green-500'
                        : accentColor === 'purple' ? 'ring-purple-500'
                        : accentColor === 'orange' ? 'ring-orange-500'
                        : accentColor === 'pink' ? 'ring-pink-500'
                        : accentColor === 'indigo' ? 'ring-indigo-500'
                        : accentColor === 'yellow' ? 'ring-yellow-500'
                        : accentColor === 'teal' ? 'ring-teal-500'
                        : accentColor === 'cyan' ? 'ring-cyan-500'
                        : accentColor === 'lime' ? 'ring-lime-500'
                        : accentColor === 'emerald' ? 'ring-emerald-500'
                        : accentColor === 'violet' ? 'ring-violet-500'
                        : accentColor === 'rose' ? 'ring-rose-500'
                        : accentColor === 'slate' ? 'ring-slate-500'
                        : 'ring-blue-500'}`
                      : theme === 'dark'
                        ? 'border border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                        : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Two-row layout per spec when goal exists; otherwise keep current row */}
                  <div className="px-3 py-2 min-h-10 transition-colors duration-240 ease-out-smooth">
                    {/* Row 1: name left, today's badge and delete on right */}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className={`font-semibold truncate transition-colors duration-240 ease-out-smooth ${
                          activeTask?.id === task.id
                            ? `text-${accentColor}-700 dark:text-${accentColor}-300`
                            : theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {task.name}
                        </span>

                        {/* Removed left-side today's time badge to avoid duplication; it will be shown on the right only */}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showBadge && (
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center transition-colors duration-240 ease-out-smooth ${
                              theme === 'dark'
                                ? `bg-${accentColor}-600 text-white`
                                : `bg-${accentColor}-500 text-white`
                            }`}
                            title="Today's total time for this task"
                          >
                            {/* Force re-render with liveTick or storage changes so numbers update each second */}
                            <span className="tabular-nums transition-colors duration-240 ease-out-smooth">{formatHHMM(totalToday)}</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id, task.name);
                          }}
                          className={`p-1 rounded transition-colors duration-240 ease-out-smooth ${
                            theme === 'dark'
                              ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400'
                              : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: full-width progress bar if goal is set */}
                   {hasGoal && (
                      <div className="mt-2">
                        <div className={`w-full h-1.5 rounded-full transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div
                            className={`h-1.5 rounded-full bg-${accentColor}-500 transition-[width,background-color] duration-240 ease-out-smooth will-change-[width]`}
                            style={{ width: `${pctToday}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] leading-3">
                          <span className={`transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Goal: {Math.floor((task.estimatedTime || 0) / 3600)}h {Math.floor(((task.estimatedTime || 0) % 3600) / 60)}m
                          </span>
                          <span className={`tabular-nums transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-300' : `text-${accentColor}-700`}`}>
                            {pctToday}%{/* depends on liveTick via totalToday */}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Task UI below list when tasks exist */}
            <div className="mt-4 space-y-3 transition-colors duration-240 ease-out-smooth">
              {/* Collapsed trigger: small + button on the left */}
              {tasks.length > 0 && !showSuggestions && !showTimeInput && !newTaskName && (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions(true);
                      // Focus input on next tick
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-240 ease-out-smooth ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Add task"
                    aria-label="Add task"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}

              {/* Expanded form (appears after clicking +) */}
              {(!tasks.length || showSuggestions || showTimeInput || newTaskName) && (
                <div className="relative">
                  <div className="flex items-stretch w-full overflow-hidden">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="Add new task..."
                      maxLength={15}
                      className={`min-w-0 w-full px-3 py-2 rounded-l-lg border transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-400'
                      } focus:outline-none`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowTimeInput(!showTimeInput)}
                      title="Set goal (minutes)"
                      className={`px-3 rounded-r-none border-y border-l transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Target size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={handleAddTask}
                      disabled={!newTaskName.trim()}
                      title="Add task"
                      className={`px-3 rounded-r-lg border-y border-r transition-colors duration-240 ease-out-smooth ${
                        newTaskName.trim()
                          ? `text-white bg-${accentColor}-500 hover:bg-${accentColor}-600 border-${accentColor}-600`
                          : `text-white ${theme === 'dark' ? 'bg-gray-500 border-gray-500' : 'bg-gray-300 border-gray-300'} cursor-not-allowed`
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {showTimeInput && (
                    <div className="mt-2">
                      <select
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className={`px-3 py-2 w-48 rounded-lg border text-sm transition-colors duration-240 ease-out-smooth ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none`}
                      >
                        <option value="">No goal</option>
                        <option value="60">1 Hr</option>
                        <option value="120">2 Hr</option>
                        <option value="180">3 Hr</option>
                        <option value="240">4 Hr</option>
                        <option value="300">5 Hr</option>
                        <option value="360">6 Hr</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskManager;