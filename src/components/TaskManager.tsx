import { useState, useRef } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import type { Task, Session } from '../App';
import { useColorSystemContext } from '../contexts/ColorSystemContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { getAccentHex } from '../utils/colorSystem';

interface TaskManagerProps {
  tasks: Task[];
  activeTask: Task | null;
  onAddTask: (name: string, estimatedTime?: number) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: Task | null) => void;
  taskHistory: string[];
  theme: 'light' | 'dark';
  accentColor: string;
  sessions?: Session[];
  layout?: 'compact' | 'full';
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
  const colorSystem = useColorSystemContext();
  const { confirm } = useNotificationContext();
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());
  
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = (taskHistory || [])
    .filter(task => {
      if (task === newTaskName) return false;
      
      const searchTerm = newTaskName.toLowerCase();
      const taskName = task.toLowerCase();
      
      // Create regex that matches the search term at the beginning of words
      // \b ensures word boundary, so "in" will match "integrate" but not "maintain"
      const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      
      return regex.test(taskName);
    })
    .slice(0, 5);

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const estimatedMinutes = newTaskTime ? parseInt(newTaskTime, 10) : undefined;
    const estimatedSeconds = estimatedMinutes ? estimatedMinutes * 60 : undefined;
    onAddTask(newTaskName.trim(), estimatedSeconds);
    setNewTaskName('');
    setNewTaskTime('');
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setNewTaskName('');
    setNewTaskTime('');
  };

  const handleDelete = async (id: string, taskName: string) => {
    const confirmed = await confirm(`Delete task "${taskName}"? This will remove all recorded time.`);
    if (confirmed) {
      onDeleteTask(id);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = Boolean(target.closest('button, input, select, textarea, a, [role="button"], [data-no-clear]'));
    const isInsideTaskItem = Boolean(target.closest('[data-task-item]'));
    if (!isInteractive && !isInsideTaskItem) {
      onSelectTask(null);
    }
  };

  /** formatHHMM() -> "H:MM" display for badges */
  const formatHHMM = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${m}m`;
  };

  return (
    <>
      <style>{`
        .task-accent-bg {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        .task-accent-bg:hover {
          background-color: var(--accent-color-hover) !important;
        }
      `}</style>
      
      <div 
        className="min-w-0" 
        onClick={handleContainerClick}
        style={{
          '--accent-color': accentHex,
          '--accent-color-hover': accentHex + 'dd',
        } as React.CSSProperties}
      >
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
            isExpanded ? (
              <div className="py-4" data-no-clear>
                <div className="space-y-2">
                  <div className={`rounded-lg border transition-colors duration-240 ease-out-smooth ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700/30'
                      : 'border-gray-200 bg-gray-50/50'
                  }`}>
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
                          className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-240 ease-out-smooth shadow-sm hover:shadow-md flex items-center justify-center ${
                            newTaskName.trim()
                              ? 'task-accent-bg'
                              : `${theme === 'dark' ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                          }`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions - показываем только после ввода минимум 2 символов */}
                  {newTaskName.length >= 2 && filteredSuggestions.length > 0 && (
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
              </div>
            ) : (
              <div className={`py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <button
                  onClick={handleExpand}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg border-2 border-dashed transition-all duration-240 ease-out-smooth ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/20 text-gray-400 hover:text-gray-300'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Plus size={18} />
                  <span className="text-sm">Add task</span>
                </button>
              </div>
            )
          ) : (
            <>
              {tasks.filter((task) => {
                // Only show tasks that have today's sessions or were created today
                const todayStr = new Date().toDateString();
                const createdToday = new Date(task.createdAt).toDateString() === todayStr;
                const hasTodaySessions = Array.isArray(sessions) && 
                  (sessions as Session[]).some(s => s.taskId === task.id && s.date === todayStr);
                
                return createdToday || hasTodaySessions;
              }).map((task) => {
                const showBadge = Array.isArray(sessions);
                const todayStr = new Date().toDateString();

                // Base = Accumulated saved sessions for today
                const baseToday = showBadge
                  ? (sessions as Session[])
                      .filter(s => s.taskId === task.id && s.date === todayStr)
                      .reduce((sum, s) => sum + s.duration, 0)
                  : 0;

                // If this is the active task and timer is running, add elapsed live seconds
                let liveExtra = 0;
                try {
                  const raw = localStorage.getItem('flow-timer-state');
                  if (raw) {
                    const state = JSON.parse(raw || '{}');
                    if (
                      state?.isRunning &&
                      !state?.isBreak &&
                      activeTask &&
                      activeTask.id === task.id &&
                      typeof state?.startTime === 'number'
                    ) {
                      const now = Date.now();
                      const elapsed = Math.max(0, Math.floor((now - state.startTime) / 1000));
                      liveExtra = elapsed;
                    }
                  }
                } catch {
                  // Ignore localStorage parsing errors
                }

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
                    if (activeTask?.id === task.id) {
                      onSelectTask(null);
                    } else {
                      onSelectTask(task);
                    }
                  }}
                                     className={`rounded-lg animate-slide-in-up cursor-pointer transition-all duration-240 ease-out-smooth border-2 ${
                     layout === 'compact' ? 'min-h-[3rem]' : 'min-h-10'
                   } ${
                     activeTask?.id === task.id
                       ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/15'
                       : theme === 'dark'
                         ? 'border-transparent bg-gray-700/50 hover:bg-gray-700'
                         : 'border-transparent bg-gray-50 hover:bg-gray-100'
                   }`}
                >
                  <div className={`px-3 transition-colors duration-240 ease-out-smooth ${
                    layout === 'compact' ? 'py-3' : 'py-2 min-h-10'
                  }`}>
                    {/* Row 1: name, today's badge, delete */}
                    <div className={`flex ${layout === 'compact' ? 'items-start' : 'items-center'} justify-between gap-2`}>
                      <div className="min-w-0 flex-1">
                        <span 
                          className={`font-semibold transition-colors duration-240 ease-out-smooth ${
                            layout === 'compact' 
                              ? 'block leading-tight' 
                              : 'truncate'
                          } ${
                            activeTask?.id === task.id
                              ? (theme === 'dark' ? 'text-white' : 'text-gray-900')
                              : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')
                          }`}
                          style={layout === 'compact' ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          } : undefined}
                        >
                          {task.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showBadge && (
                          <div
                            className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center transition-colors duration-240 ease-out-smooth task-accent-bg"
                            title="Today's total time for this task"
                          >
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

                    {/* Row 2: progress bar if goal is set */}
                    {hasGoal && (
                      <div className="mt-2">
                        <div className={`w-full h-1.5 rounded-full transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div
                            className="h-1.5 rounded-full transition-[width,background-color] duration-240 ease-out-smooth will-change-[width]"
                            style={{ width: `${pctToday}%`, backgroundColor: accentHex }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] leading-3">
                          <span className={`transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Goal: {Math.floor((task.estimatedTime || 0) / 3600)}h {Math.floor(((task.estimatedTime || 0) % 3600) / 60)}m
                          </span>
                          <span className={`tabular-nums transition-colors duration-240 ease-out-smooth ${theme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>
                            {pctToday}%
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

        {/* Small plus button when tasks exist */}
        {tasks.length > 0 && !isExpanded && (
          <div className="mt-3" data-no-clear>
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
          </div>
        )}

        {/* Universal Add Task Form - только когда есть задачи */}
        {isExpanded && tasks.length > 0 && (
          <div className="mt-3" data-no-clear>
            <div className="space-y-2">
              <div className={`rounded-lg border transition-colors duration-240 ease-out-smooth ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700/30'
                  : 'border-gray-200 bg-gray-50/50'
              }`}>
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
                      className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-240 ease-out-smooth shadow-sm hover:shadow-md flex items-center justify-center ${
                        newTaskName.trim()
                          ? 'task-accent-bg'
                          : `${theme === 'dark' ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions - показываем только после ввода минимум 2 символов */}
              {newTaskName.length >= 2 && filteredSuggestions.length > 0 && (
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
          </div>
        )}
      </div>
    </>
  );
}

export default TaskManager;