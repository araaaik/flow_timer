import { useState, useRef, useEffect } from 'react';
import { Plus, X, Clock, Target, BarChart3 } from 'lucide-react';
import type { Task, Session } from '../App';
import { getAccentClasses } from '../utils/colorSystem';
import { useColorSystemContext } from '../contexts/ColorSystemContext';
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
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());
  
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = (taskHistory || [])
    .filter(task => task.toLowerCase().includes(newTaskName.toLowerCase()) && task !== newTaskName)
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

  const handleDelete = (id: string, taskName: string) => {
    if (window.confirm(`Delete task "${taskName}"? This will remove all recorded time.`)) {
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

  return (
    <>
      <style>{`
        .task-accent-ring {
          box-shadow: 0 0 0 2px var(--accent-color);
        }
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
          ) : (
            <>
              {tasks.map((task) => (
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
                  className={`rounded-lg animate-fade-in-up cursor-pointer transition-all duration-240 ease-out-smooth ${
                    activeTask?.id === task.id
                      ? 'task-accent-ring'
                      : theme === 'dark'
                        ? 'border border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                        : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="px-3 py-2 min-h-10 transition-colors duration-240 ease-out-smooth">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className={`font-semibold truncate transition-colors duration-240 ease-out-smooth ${
                          activeTask?.id === task.id
                            ? (theme === 'dark' ? 'text-white' : 'text-gray-900')
                            : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')
                        }`}>
                          {task.name}
                        </span>
                      </div>
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
                </div>
              ))}
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

        {/* Universal Add Task Form */}
        {isExpanded && (
          <div className={`${tasks.length > 0 ? 'mt-3' : 'mt-4'}`} data-no-clear>
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

              {/* Suggestions - ИСПРАВЛЕНО: убрано условие newTaskName && */}
              {filteredSuggestions.length > 0 && (
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