import { useState, useRef, useEffect } from 'react';
import { Plus, X, Clock, Target, BarChart3 } from 'lucide-react';
import type { Task, Session } from '../App';

/**
 * TaskManager.tsx
 * Renders the task list, quick-add form, per-task goal progress, and today's time badges.
 * It is stateless with respect to persistence; all state comes from hooks in App.
 *
 * Key behaviors:
 * - Add task with optional goal (minutes). Persists via onAddTask(name, seconds?).
 * - Delete task with confirmation. Also cleans up task-history suggestions.
 * - When a timer is running for activeTask, shows live-updating "today" time using localStorage hint.
 * - Selecting tasks is disabled while a work session is running (gated by a static flag patched by App if required).
 *
 * Styling:
 * - Respects theme (light/dark) and accentColor to color rings, buttons, and badges.
 */
interface TaskManagerProps {
  /** All tasks persisted in localStorage */
  tasks: Task[];
  /** Currently active task (selected) */
  activeTask: Task | null;
  /** Add a new task; estimatedTime is in seconds if provided */
  onAddTask: (name: string, estimatedTime?: number) => void;
  /** Delete a task by id (with confirmation in UI) */
  onDeleteTask: (id: string) => void;
  /** Select a task as active or clear with null (no-op if timer is running; enforced here) */
  onSelectTask: (task: Task | null) => void;
  /** Prior task names for suggestions/autocomplete */
  taskHistory: string[];
  /** Global theme */
  theme: 'light' | 'dark';
  /** Accent token */
  accentColor: string;
  /** Optional sessions for today badge/progress computation */
  sessions?: Session[];
  /** Layout mode - determines form style */
  layout?: 'compact' | 'full';
  /** Callback to show history modal */
  onShowHistory?: () => void;
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
  sessions,
  layout = 'full',
  onShowHistory
}: TaskManagerProps & { isRunning?: boolean }) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Live seconds ticker to refresh UI every second while a timer is running (single declaration)
  const [, setLiveTick] = useState(0);
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

  /**
   * handleAddTask()
   * Creates a new task from input fields. Goal is in minutes, translated to seconds.
   */
  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const estimatedMinutes = newTaskTime ? parseInt(newTaskTime, 10) : undefined;
    const estimatedSeconds = estimatedMinutes ? estimatedMinutes * 60 : undefined;
    onAddTask(newTaskName.trim(), estimatedSeconds);
    setNewTaskName('');
    setNewTaskTime('');
    setIsExpanded(false);
  };

  /**
   * handleExpand()
   * Expand the add task form and focus input
   */
  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /**
   * handleCollapse()
   * Collapse the form and reset state
   */
  const handleCollapse = () => {
    setIsExpanded(false);
    setShowGoalSelector(false);
    setNewTaskName('');
    setNewTaskTime('');
  };

  /**
   * handleDelete()
   * Confirm and delegate deletion to parent.
   */
  const handleDelete = (id: string, taskName: string) => {
    if (window.confirm(`Delete task "${taskName}"? This will remove all recorded time.`)) {
      onDeleteTask(id);
    }
  };



  /** formatHHMM() -> "H:MM" display for badges */
  const formatHHMM = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };



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

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Игнорируем клики по интерактивным элементам и по самим задачам
    const isInteractive = Boolean(target.closest('button, input, select, textarea, a, [role="button"], [data-no-clear]'));
    const isInsideTaskItem = Boolean(target.closest('[data-task-item]'));
    if (!isInteractive && !isInsideTaskItem) {
      onSelectTask(null);
    }
  };

  return (
    <div className="min-w-0" onClick={handleContainerClick}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          Tasks
        </h2>
        {onShowHistory && (
          <button
            onClick={onShowHistory}
            className={`p-2 rounded-lg transition-colors duration-240 ease-out-smooth ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title="View session history"
          >
            <BarChart3 size={18} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>No tasks yet. Add one to get started!</p>
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
                  data-task-item
                  onClick={() => {
                    if ((TaskManager as any).isRunningGlobal) return;
                    if (activeTask?.id === task.id) {
                      onSelectTask(null);
                    } else {
                      onSelectTask(task);
                    }
                  }}
                  className={`rounded-lg animate-fade-in-up ${((TaskManager as any).isRunningGlobal ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')} transition-all duration-240 ease-out-smooth ${
                   activeTask?.id === task.id
                     ? (() => {
                         const map: Record<string, string> = {
                           blue: 'ring-2 ring-offset-0 border-0 ring-blue-500',
                           red: 'ring-2 ring-offset-0 border-0 ring-red-500',
                           green: 'ring-2 ring-offset-0 border-0 ring-green-500',
                           purple: 'ring-2 ring-offset-0 border-0 ring-purple-500',
                           orange: 'ring-2 ring-offset-0 border-0 ring-orange-500',
                           pink: 'ring-2 ring-offset-0 border-0 ring-pink-500',
                           indigo: 'ring-2 ring-offset-0 border-0 ring-indigo-500',
                           yellow: 'ring-2 ring-offset-0 border-0 ring-yellow-500',
                           teal: 'ring-2 ring-offset-0 border-0 ring-teal-500',
                           cyan: 'ring-2 ring-offset-0 border-0 ring-cyan-500',
                           lime: 'ring-2 ring-offset-0 border-0 ring-lime-500',
                           emerald: 'ring-2 ring-offset-0 border-0 ring-emerald-500',
                           violet: 'ring-2 ring-offset-0 border-0 ring-violet-500',
                           rose: 'ring-2 ring-offset-0 border-0 ring-rose-500',
                           slate: 'ring-2 ring-offset-0 border-0 ring-slate-500',
                           black: 'ring-2 ring-offset-0 border-0 ring-black',
                         };
                         return map[accentColor] ?? 'ring-2 ring-offset-0 border-0 ring-blue-500';
                       })()
                     : theme === 'dark'
                       ? 'border border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                       : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
                style={
                  activeTask?.id === task.id
                    ? (() => {
                        // Custom active ring overrides:
                        // - green: keep existing accent boxShadow ring
                        // - black accent in dark theme: subtle gray ring for better integration
                        if (accentColor === 'green') {
                          return { boxShadow: '0 0 0 2px #266a5b' };
                        }
                        if (accentColor === 'black' && theme === 'dark') {
                          // Using Tailwind palette approx: gray-300 over dark surfaces
                          return { boxShadow: '0 0 0 2px #d1d5db' };
                        }
                        return undefined;
                      })()
                    : undefined
                }
              >
                  {/* Two-row layout per spec when goal exists; otherwise keep current row */}
                  <div className="px-3 py-2 min-h-10 transition-colors duration-240 ease-out-smooth">
                    {/* Row 1: name left, today's badge and delete on right */}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className={`font-semibold truncate transition-colors duration-240 ease-out-smooth ${
                          activeTask?.id === task.id
                            ? (theme === 'dark' ? 'text-white' : 'text-gray-900')
                            : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')
                        }`}>
                          {task.name}
                        </span>

                        {/* Removed left-side today's time badge to avoid duplication; it will be shown on the right only */}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showBadge && (
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center transition-colors duration-240 ease-out-smooth ${
                              (() => {
                                const map: Record<string, string> = {
                                  blue: 'bg-blue-500 dark:bg-blue-600 text-white',
                                  red: 'bg-red-500 dark:bg-red-600 text-white',
                                  green: 'bg-green-500 dark:bg-green-600 text-white',
                                  purple: 'bg-purple-500 dark:bg-purple-600 text-white',
                                  orange: 'bg-orange-500 dark:bg-orange-600 text-white',
                                  pink: 'bg-pink-500 dark:bg-pink-600 text-white',
                                  indigo: 'bg-indigo-500 dark:bg-indigo-600 text-white',
                                  yellow: 'bg-yellow-500 dark:bg-yellow-600 text-white',
                                  teal: 'bg-teal-500 dark:bg-teal-600 text-white',
                                  cyan: 'bg-cyan-500 dark:bg-cyan-600 text-white',
                                  lime: 'bg-lime-500 dark:bg-lime-600 text-white',
                                  emerald: 'bg-emerald-500 dark:bg-emerald-600 text-white',
                                  violet: 'bg-violet-500 dark:bg-violet-600 text-white',
                                  rose: 'bg-rose-500 dark:bg-rose-600 text-white',
                                  slate: 'bg-slate-500 dark:bg-slate-600 text-white',
                                  black: 'bg-black dark:bg-black text-white',
                                };
                                return map[accentColor] ?? 'bg-blue-500 dark:bg-blue-600 text-white';
                              })()
                              }
                            }`}
                            style={accentColor === 'green' ? { backgroundColor: '#266a5b', color: '#ffffff' } : undefined}
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
                            className={`h-1.5 rounded-full transition-[width,background-color] duration-240 ease-out-smooth will-change-[width] ${
                              (() => {
                                const map: Record<string, string> = {
                                  blue: 'bg-blue-500',
                                  red: 'bg-red-500',
                                  green: 'bg-green-500',
                                  purple: 'bg-purple-500',
                                  orange: 'bg-orange-500',
                                  pink: 'bg-pink-500',
                                  indigo: 'bg-indigo-500',
                                  yellow: 'bg-yellow-500',
                                  teal: 'bg-teal-500',
                                  cyan: 'bg-cyan-500',
                                  lime: 'bg-lime-500',
                                  emerald: 'bg-emerald-500',
                                  violet: 'bg-violet-500',
                                  rose: 'bg-rose-500',
                                  slate: 'bg-slate-500',
                                  black: 'bg-black',
                                };
                                return map[accentColor] ?? 'bg-blue-500';
                              })()
                            }`}
                            style={{ width: `${pctToday}%`, ...(accentColor === 'green' ? { backgroundColor: '#266a5b' } : {}) }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] leading-3">
                          <span className={`transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Goal: {Math.floor((task.estimatedTime || 0) / 3600)}h {Math.floor(((task.estimatedTime || 0) % 3600) / 60)}m
                          </span>
                          <span className={`tabular-nums transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>
                            {pctToday}%{/* depends on liveTick via totalToday */}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add Task Form - Positioned after task list */}
      <div className="mt-3" data-no-clear>
        {!isExpanded ? (
          <button
            onClick={handleExpand}
            className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors duration-240 ease-out-smooth ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Add task"
          >
            <Plus size={14} />
          </button>
        ) : (
          <div className="space-y-2">
            {layout === 'full' ? (
              /* Full layout - adaptive to screen width */
              <div className={`rounded-lg border transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700/30'
                  : 'border-gray-200 bg-gray-50/50'
              }`}>
                {/* Wide screens: all in one row */}
                <div className="hidden lg:block">
                  <div className="px-3 py-2 flex items-center gap-3" style={{ minHeight: '44px' }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask();
                        if (e.key === 'Escape') handleCollapse();
                      }}
                      placeholder="Task name..."
                      maxLength={50}
                      className={`flex-1 bg-transparent text-sm font-semibold transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                      } focus:outline-none`}
                    />
                    
                    <select
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg min-w-[80px] transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700'
                      } border focus:outline-none shadow-sm`}
                    >
                      <option value="">Goal</option>
                      <option value="30">30m</option>
                      <option value="60">1h</option>
                      <option value="90">1.5h</option>
                      <option value="120">2h</option>
                      <option value="180">3h</option>
                      <option value="240">4h</option>
                      <option value="300">5h</option>
                      <option value="360">6h</option>
                    </select>

                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskName.trim()}
                      className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-240 ease-out-smooth shadow-sm hover:shadow-md ${
                        newTaskName.trim()
                          ? (() => {
                              const map: Record<string, string> = {
                                blue: 'text-white bg-blue-500 hover:bg-blue-600',
                                red: 'text-white bg-red-500 hover:bg-red-600',
                                green: 'text-white bg-green-500 hover:bg-green-600',
                                purple: 'text-white bg-purple-500 hover:bg-purple-600',
                                orange: 'text-white bg-orange-500 hover:bg-orange-600',
                                pink: 'text-white bg-pink-500 hover:bg-pink-600',
                                indigo: 'text-white bg-indigo-500 hover:bg-indigo-600',
                                yellow: 'text-white bg-yellow-500 hover:bg-yellow-600',
                                teal: 'text-white bg-teal-500 hover:bg-teal-600',
                                cyan: 'text-white bg-cyan-500 hover:bg-cyan-600',
                                lime: 'text-white bg-lime-500 hover:bg-lime-600',
                                emerald: 'text-white bg-emerald-500 hover:bg-emerald-600',
                                violet: 'text-white bg-violet-500 hover:bg-violet-600',
                                rose: 'text-white bg-rose-500 hover:bg-rose-600',
                                slate: 'text-white bg-slate-500 hover:bg-slate-600',
                                black: 'text-white bg-black hover:bg-neutral-900',
                              };
                              return map[accentColor] ?? 'text-white bg-blue-500 hover:bg-blue-600';
                            })()
                          : `${theme === 'dark' ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                      }`}
                      style={accentColor === 'green' && newTaskName.trim() ? { backgroundColor: '#266a5b' } : undefined}
                    >
                      Add
                    </button>

                    <button
                      onClick={handleCollapse}
                      className={`p-1.5 rounded-lg transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:bg-gray-600 hover:text-gray-300'
                          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Narrow screens: two-row layout like compact */}
                <div className="lg:hidden">
                  <div className="px-3 py-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask();
                        if (e.key === 'Escape') handleCollapse();
                      }}
                      placeholder="Task name..."
                      maxLength={50}
                      className={`w-full bg-transparent text-sm font-semibold transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                      } focus:outline-none`}
                    />
                  </div>

                  <div className="px-3 py-2 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between">
                    <button
                      onClick={handleCollapse}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:bg-gray-600 hover:text-gray-300'
                          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-2">
                      <select
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className={`px-3 py-1 text-xs rounded-lg min-w-[70px] transition-colors duration-240 ease-out-smooth ${
                          theme === 'dark'
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-300 text-gray-700'
                        } border focus:outline-none shadow-sm`}
                      >
                        <option value="">Goal</option>
                        <option value="30">30m</option>
                        <option value="60">1h</option>
                        <option value="90">1.5h</option>
                        <option value="120">2h</option>
                        <option value="180">3h</option>
                        <option value="240">4h</option>
                        <option value="300">5h</option>
                        <option value="360">6h</option>
                      </select>

                      <button
                        onClick={handleAddTask}
                        disabled={!newTaskName.trim()}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-all duration-240 ease-out-smooth shadow-sm hover:shadow-md ${
                          newTaskName.trim()
                            ? (() => {
                                const map: Record<string, string> = {
                                  blue: 'text-white bg-blue-500 hover:bg-blue-600',
                                  red: 'text-white bg-red-500 hover:bg-red-600',
                                  green: 'text-white bg-green-500 hover:bg-green-600',
                                  purple: 'text-white bg-purple-500 hover:bg-purple-600',
                                  orange: 'text-white bg-orange-500 hover:bg-orange-600',
                                  pink: 'text-white bg-pink-500 hover:bg-pink-600',
                                  indigo: 'text-white bg-indigo-500 hover:bg-indigo-600',
                                  yellow: 'text-white bg-yellow-500 hover:bg-yellow-600',
                                  teal: 'text-white bg-teal-500 hover:bg-teal-600',
                                  cyan: 'text-white bg-cyan-500 hover:bg-cyan-600',
                                  lime: 'text-white bg-lime-500 hover:bg-lime-600',
                                  emerald: 'text-white bg-emerald-500 hover:bg-emerald-600',
                                  violet: 'text-white bg-violet-500 hover:bg-violet-600',
                                  rose: 'text-white bg-rose-500 hover:bg-rose-600',
                                  slate: 'text-white bg-slate-500 hover:bg-slate-600',
                                  black: 'text-white bg-black hover:bg-neutral-900',
                                };
                                return map[accentColor] ?? 'text-white bg-blue-500 hover:bg-blue-600';
                              })()
                            : `${theme === 'dark' ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                        }`}
                        style={accentColor === 'green' && newTaskName.trim() ? { backgroundColor: '#266a5b' } : undefined}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Compact layout - two-row design */
              <div className={`rounded-lg border transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700/30'
                  : 'border-gray-200 bg-gray-50/50'
              }`}>
                {/* First row: Input field full width */}
                <div className="px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask();
                      if (e.key === 'Escape') handleCollapse();
                    }}
                    placeholder="Task name..."
                    maxLength={50}
                    className={`w-full bg-transparent text-sm font-semibold transition-colors duration-240 ease-out-smooth ${
                      theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    } focus:outline-none`}
                  />
                </div>

                {/* Second row: Cancel left, Goal and Add right */}
                <div className="px-3 py-2 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between">
                  <button
                    onClick={handleCollapse}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors duration-240 ease-out-smooth ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:bg-gray-600 hover:text-gray-300'
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <select
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className={`px-3 py-1 text-xs rounded-lg min-w-[70px] transition-colors duration-240 ease-out-smooth ${
                        theme === 'dark'
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700'
                      } border focus:outline-none shadow-sm`}
                    >
                      <option value="">Goal</option>
                      <option value="30">30m</option>
                      <option value="60">1h</option>
                      <option value="90">1.5h</option>
                      <option value="120">2h</option>
                      <option value="180">3h</option>
                      <option value="240">4h</option>
                      <option value="300">5h</option>
                      <option value="360">6h</option>
                    </select>

                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskName.trim()}
                      className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-240 ease-out-smooth shadow-sm hover:shadow-md flex items-center justify-center ${
                        newTaskName.trim()
                          ? (() => {
                              const map: Record<string, string> = {
                                blue: 'text-white bg-blue-500 hover:bg-blue-600',
                                red: 'text-white bg-red-500 hover:bg-red-600',
                                green: 'text-white bg-green-500 hover:bg-green-600',
                                purple: 'text-white bg-purple-500 hover:bg-purple-600',
                                orange: 'text-white bg-orange-500 hover:bg-orange-600',
                                pink: 'text-white bg-pink-500 hover:bg-pink-600',
                                indigo: 'text-white bg-indigo-500 hover:bg-indigo-600',
                                yellow: 'text-white bg-yellow-500 hover:bg-yellow-600',
                                teal: 'text-white bg-teal-500 hover:bg-teal-600',
                                cyan: 'text-white bg-cyan-500 hover:bg-cyan-600',
                                lime: 'text-white bg-lime-500 hover:bg-lime-600',
                                emerald: 'text-white bg-emerald-500 hover:bg-emerald-600',
                                violet: 'text-white bg-violet-500 hover:bg-violet-600',
                                rose: 'text-white bg-rose-500 hover:bg-rose-600',
                                slate: 'text-white bg-slate-500 hover:bg-slate-600',
                                black: 'text-white bg-black hover:bg-neutral-900',
                              };
                              return map[accentColor] ?? 'text-white bg-blue-500 hover:bg-blue-600';
                            })()
                          : `${theme === 'dark' ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                      }`}
                      style={accentColor === 'green' && newTaskName.trim() ? { backgroundColor: '#266a5b' } : undefined}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {newTaskName && filteredSuggestions.length > 0 && (
              <div className={`rounded-lg border shadow-sm ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setNewTaskName(suggestion);
                      inputRef.current?.focus();
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors duration-240 ease-out-smooth ${
                      index === 0 ? 'rounded-t-lg' : ''
                    } ${
                      index === filteredSuggestions.length - 1 ? 'rounded-b-lg' : ''
                    } ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskManager;