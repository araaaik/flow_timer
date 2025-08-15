import React, { useState } from 'react';
import { X, Download, Trash2, Search, Calendar, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task, Session } from '../App';
import { useColorSystemContext } from '../contexts/ColorSystemContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { getAccentHex } from '../utils/colorSystem';
import DataManager from './DataManager';
import { exportToCSV, formatTime as formatTimeUtil, type DateRange } from '../utils/dataManager';

/**
 * History.tsx
 * Modal component for statistics and session history exploration.
 *
 * Props:
 * - sessions: all recorded sessions
 * - tasks: available tasks (not directly mutated here)
 * - onClose(): close modal
 * - onDeleteSession(id): delete a single session
 * - onDeleteDay(dateString): delete all sessions for a given day (Date.toDateString)
 * - theme: 'light' | 'dark' for surfaces/typography
 * - accentColor: accent token for emphasis
 *
 * State:
 * - selectedDate: focused day (Date.toDateString)
 * - view: 'day' | 'week' | 'month' (month placeholder handled by toggles; UI provided for day/week)
 * - searchTask: filter input for task search across sessions
 *
 * Notes:
 * - Export builds a JSON structure summarizing selected day stats and sessions.
 * - getWeekDates determines a calendar week from selectedDate (Sun..Sat).
 */
interface HistoryProps {
  sessions: Session[];
  tasks: Task[];
  onClose: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteDay: (date: string) => void;
  onUpdateSessions: (sessions: Session[]) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  theme: 'light' | 'dark';
  accentColor: string;
}

function History({
  sessions,
  tasks,
  onClose,
  onDeleteSession,
  onDeleteDay,
  onUpdateSessions,
  onUpdateTasks,
  theme,
  accentColor
}: HistoryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [showDataManager, setShowDataManager] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { confirm } = useNotificationContext();
  
  // Get hex value for current accent
  const colorSystem = useColorSystemContext();
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());
  const [searchTask, setSearchTask] = useState('');

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (view === 'week') navigateWeek('prev');
        else if (view === 'month') navigateMonth('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (view === 'week') navigateWeek('next');
        else if (view === 'month') navigateMonth('next');
      } else if (e.key === 'Escape' && showSearch) {
        e.preventDefault();
        setShowSearch(false);
        setSearchTask('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, showSearch]);

  // Auto-hide search when view changes
  React.useEffect(() => {
    setShowSearch(false);
    setSearchTask('');
  }, [view]);

  // Use unified formatTime from utils
  const formatTime = formatTimeUtil;

  /**
   * getDayStats()
   * Aggregate metrics for a specific date (Date.toDateString key).
   */
  const getDayStats = (date: string) => {
    const daySessions = sessions.filter(s => s.date === new Date(date).toDateString());
    const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
    
    const sessionCount = daySessions.length;
    const avgSession = sessionCount > 0 ? totalTime / sessionCount : 0;
    const longestSession = Math.max(...daySessions.map(s => s.duration), 0);
    
    return { totalTime, sessionCount, avgSession, longestSession, sessions: daySessions };
  };

  /**
   * getWeekDates()
   * Returns Mon..Sun toDateString values for the week containing 'date'.
   */
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    // Get Monday as first day (0=Sunday, 1=Monday, etc.)
    const dayOfWeek = date.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
    startOfWeek.setDate(date.getDate() - daysFromMonday);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toDateString());
    }
    return week;
  };

  /**
   * Navigation functions for week and month views
   */
  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const daysToAdd = direction === 'next' ? 7 : -7;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    setSelectedDate(currentDate.toDateString());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const monthsToAdd = direction === 'next' ? 1 : -1;
    currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
    setSelectedDate(currentDate.toDateString());
  };

  /**
   * Get current period display text
   */
  const getCurrentPeriodText = () => {
    const date = new Date(selectedDate);
    
    if (view === 'week') {
      const weekDates = getWeekDates(date);
      const startDate = new Date(weekDates[0]);
      const endDate = new Date(weekDates[6]);
      
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${startDate.getDate()}-${endDate.getDate()}`;
      } else {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else if (view === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };



  /**
   * handleQuickExport()
   * Export current view (day, week, or month)
   */
  const handleQuickExport = () => {
    let dateRange: DateRange;
    
    if (view === 'day') {
      // Export selected day
      const date = new Date(selectedDate);
      dateRange = {
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999))
      };
    } else if (view === 'week') {
      // Export current week
      const weekDates = getWeekDates(new Date(selectedDate));
      const startDate = new Date(weekDates[0]);
      const endDate = new Date(weekDates[6]);
      dateRange = {
        start: new Date(startDate.setHours(0, 0, 0, 0)),
        end: new Date(endDate.setHours(23, 59, 59, 999))
      };
    } else {
      // Export current month
      const date = new Date(selectedDate);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      dateRange = {
        start: new Date(startOfMonth.setHours(0, 0, 0, 0)),
        end: new Date(endOfMonth.setHours(23, 59, 59, 999))
      };
    }
    
    exportToCSV(sessions, tasks, dateRange);
  };

  /** handleDeleteDay(): confirm and delegate day deletion */
  const handleDeleteDay = async () => {
    const confirmed = await confirm(`Delete all sessions for ${selectedDate}? This cannot be undone.`);
    if (confirmed) {
      onDeleteDay(selectedDate);
    }
  };

  /** handleDeleteSession(): confirm and delegate single session deletion */
  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = await confirm('Delete this session? This cannot be undone.');
    if (confirmed) {
      onDeleteSession(sessionId);
    }
  };

  const dayStats = getDayStats(selectedDate);
  const weekDates = React.useMemo(() => getWeekDates(new Date(selectedDate)), [selectedDate]);

  // Task search
  const taskSessions = searchTask
    ? sessions.filter(s => s.taskName.toLowerCase().includes(searchTask.toLowerCase()))
    : [];
  const taskTime = taskSessions.reduce((sum, s) => sum + s.duration, 0);


  return (
    <>
      <style>{`
        .history-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .history-scrollbar::-webkit-scrollbar-button {
          display: none;
          height: 0;
          width: 0;
        }
        .history-scrollbar::-webkit-scrollbar-button:start:decrement,
        .history-scrollbar::-webkit-scrollbar-button:end:increment {
          display: none;
          height: 0;
          width: 0;
        }
        .history-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .history-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .history-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* History accent color styles */
        .history-accent-text {
          color: var(--accent-color) !important;
        }
        
        .history-accent-bg {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        
        .history-accent-bg-light {
          background-color: var(--accent-color);
          opacity: 0.1;
        }
        
        .history-accent-border {
          border-color: var(--accent-color);
        }
        
        .history-stat-card {
          background: linear-gradient(135deg, var(--accent-color), var(--accent-color-hover));
          color: white;
        }
        
        .history-week-selected {
          background-color: var(--accent-color);
          opacity: 0.1;
          border: 1px solid var(--accent-color);
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
        <div 
          className={`${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden shadow-2xl`}
          style={{
            '--accent-color': accentHex,
            '--accent-color-hover': accentHex + 'dd',
          } as React.CSSProperties}
        >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
                        <BarChart3 
              className="history-accent-text"
              size={24}
            />
            <h2 className="text-xl font-semibold">Statistics & History</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch 
                  ? 'history-accent-bg' 
                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Search Tasks"
            >
              <Search size={20} />
            </button>
            <button
              onClick={handleQuickExport}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title={`Export ${view === 'day' ? 'Day' : view === 'week' ? 'Week' : 'Month'}`}
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => setShowDataManager(true)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="Data Management"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Task Search - Collapsible under header */}
        {showSearch && (
          <div className={`px-6 py-4 border-b animate-slide-in-down ${
            theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="relative">
              <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                placeholder="Search tasks..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                } focus:outline-none`}
                autoFocus
              />
            </div>
            {searchTask && (
              <div className={`mt-3 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="text-sm mb-3">
                  <strong>"{searchTask}"</strong> - {taskSessions.length} sessions, {formatTime(taskTime)} total
                </div>
                {taskSessions.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {taskSessions.slice(0, 10).map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setSelectedDate(session.date);
                          setView('day');
                          setShowSearch(false);
                          setSearchTask('');
                        }}
                        className={`w-full flex justify-between items-center p-2 rounded transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-600 hover:bg-gray-500' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">{session.taskName}</div>
                          <div className="text-xs opacity-75">{session.date}</div>
                        </div>
                        <div className="text-sm history-accent-text">
                          {formatTime(session.duration)}
                        </div>
                      </button>
                    ))}
                    {taskSessions.length > 10 && (
                      <div className="text-xs text-center opacity-75 pt-2">
                        ... and {taskSessions.length - 10} more sessions
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] history-scrollbar">
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {['day', 'week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === v
                      ? 'history-accent-bg'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={new Date(selectedDate).toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>

          {/* Period Navigation - Show for week and month views */}
          {(view === 'week' || view === 'month') && (
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => view === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title={`Previous ${view}`}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {getCurrentPeriodText()}
                </h3>
              </div>

              <button
                onClick={() => view === 'week' ? navigateWeek('next') : navigateMonth('next')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title={`Next ${view}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {view === 'day' && (
            <div>
              {/* Day Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-lg font-semibold">
                    {getCurrentPeriodText()}
                  </h3>
                </div>
                {dayStats.sessionCount > 0 && (
                  <button
                    onClick={handleDeleteDay}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'
                    }`}
                    title="Delete all sessions for this day"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Day Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg text-white animate-card-1 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(dayStats.totalTime)}
                  </div>
                  <div className="text-sm text-white/80">Total Time</div>
                </div>
                <div className="p-4 rounded-lg text-white animate-card-2 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {dayStats.sessionCount}
                  </div>
                  <div className="text-sm text-white/80">Sessions</div>
                </div>
                <div className="p-4 rounded-lg text-white animate-card-3 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(Math.round(dayStats.avgSession))}
                  </div>
                  <div className="text-sm text-white/80">Average</div>
                </div>
                <div className="p-4 rounded-lg text-white animate-card-4 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(dayStats.longestSession)}
                  </div>
                  <div className="text-sm text-white/80">Longest</div>
                </div>
              </div>



              {/* Sessions List */}
              <div className="space-y-2">
                {dayStats.sessions.map((session, index) => (
                  <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg animate-slide-in-up ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}>
                    <div>
                      <div className="font-medium">{session.taskName}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium history-accent-text">
                        {formatTime(session.duration)}
                      </span>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className={`p-1 rounded ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {dayStats.sessionCount === 0 && (
                  <div className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Calendar size={24} className="mx-auto mb-2 opacity-50" />
                    <p>No sessions recorded for this day</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div>
              {/* Week Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {(() => {
                  const weekStats = weekDates.map(date => getDayStats(date));
                  const weekTotal = weekStats.reduce((sum, s) => sum + s.totalTime, 0);
                  const weekSessions = weekStats.reduce((sum, s) => sum + s.sessionCount, 0);
                  const activeDays = weekStats.filter(s => s.totalTime > 0).length;
                  const avgDaily = activeDays > 0 ? weekTotal / activeDays : 0;
                  
                  return (
                    <>
                      <div className="p-4 rounded-lg text-white history-stat-card">
                        <div className="text-2xl font-bold">{formatTime(weekTotal)}</div>
                        <div className="text-sm opacity-80">Week Total</div>
                      </div>
                      <div className="p-4 rounded-lg text-white history-stat-card">
                        <div className="text-2xl font-bold">{weekSessions}</div>
                        <div className="text-sm opacity-80">Sessions</div>
                      </div>
                      <div className="p-4 rounded-lg text-white history-stat-card">
                        <div className="text-2xl font-bold">{activeDays}</div>
                        <div className="text-sm opacity-80">Active Days</div>
                      </div>
                      <div className="p-4 rounded-lg text-white history-stat-card">
                        <div className="text-2xl font-bold">{formatTime(Math.round(avgDaily))}</div>
                        <div className="text-sm opacity-80">Avg Daily</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Week Bar Chart */}
              <div className="w-full px-4">
                <div className="flex justify-between items-end mb-4" style={{ height: '120px' }}>
                  {weekDates.map((dateStr, index) => {
                    const dayStats = getDayStats(dateStr);
                    const isToday = dateStr === new Date().toDateString();
                    const isSelected = dateStr === selectedDate;
                    
                    // Calculate height based on time (max 100px for bars)
                    const maxTime = Math.max(...weekDates.map(d => getDayStats(d).totalTime), 1);
                    const barHeight = Math.max(15, (dayStats.totalTime / maxTime) * 100);
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setView('day');
                        }}
                        className="transition-all duration-300 hover:scale-105 flex-1 max-w-[60px] group"
                      >
                        <div 
                          className={`rounded-t-lg transition-all duration-500 mx-auto animate-bar-grow hover:brightness-110 ${
                            isSelected ? 'ring-2 ring-white shadow-lg' : ''
                          } ${
                            isToday ? 'ring-2 ring-white ring-opacity-60' : ''
                          }`}
                          style={{ 
                            width: '50px', 
                            height: `${barHeight}px`,
                            backgroundColor: dayStats.totalTime > 0 ? accentHex : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                            opacity: dayStats.totalTime > 0 ? 0.9 : 0.3,
                            animationDelay: `${index * 100}ms`,
                            transformOrigin: 'bottom'
                          } as React.CSSProperties}
                        />
                      </button>
                    );
                  })}
                </div>
                
                {/* Day Labels */}
                <div className="flex justify-between">
                  {weekDates.map((dateStr, index) => {
                    const date = new Date(dateStr);
                    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
                    const dayStats = getDayStats(dateStr);
                    const isToday = dateStr === new Date().toDateString();
                    
                    return (
                      <button
                        key={`label-${dateStr}`}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setView('day');
                        }}
                        className={`text-center flex-1 max-w-[60px] p-2 rounded-lg transition-all hover:scale-105 h-20 flex flex-col justify-center border-2 ${
                          isToday
                            ? theme === 'dark' 
                              ? 'history-accent-border hover:bg-gray-700'
                              : 'history-accent-border hover:bg-gray-100'
                            : theme === 'dark' 
                              ? 'border-transparent hover:bg-gray-700' 
                              : 'border-transparent hover:bg-gray-100'
                        }`}
                        title={`View details for ${dayName}, ${date.toLocaleDateString()}${isToday ? ' (Today)' : ''}`}
                      >
                        <div className="text-xs mb-1 opacity-75">
                          {dayName}
                        </div>
                        <div className="text-lg font-bold mb-1">
                          {date.getDate()}
                        </div>
                        <div className="text-sm font-medium history-accent-text">
                          {dayStats.totalTime > 0 ? formatTime(dayStats.totalTime) : '0m'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {view === 'month' && (
            <div>
              {/* Monthly Heatmap */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <Calendar size={20} className="mr-2 history-accent-text" />
                  Monthly Activity Heatmap ({getCurrentPeriodText()})
                </h3>
                
                {(() => {
                  const date = new Date(selectedDate);
                  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                  const daysInMonth = endOfMonth.getDate();
                  
                  // Generate array of dates for the month
                  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    return new Date(date.getFullYear(), date.getMonth(), day);
                  });
                  
                  // Calculate max time for intensity
                  const monthSessions = monthDates.map(day => {
                    const dayString = day.toDateString();
                    const daySessions = sessions.filter(session => session.date === dayString);
                    return daySessions.reduce((sum, session) => sum + session.duration, 0);
                  });
                  const maxTime = Math.max(...monthSessions, 1);
                  
                  return (
                    <div className="space-y-6">
                      {/* Month Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const monthTotal = monthSessions.reduce((sum, time) => sum + time, 0);
                          const activeDays = monthSessions.filter(time => time > 0).length;
                          const avgDaily = activeDays > 0 ? monthTotal / activeDays : 0;
                          const bestDay = Math.max(...monthSessions);
                          
                          return (
                            <>
                              <div className="p-4 rounded-lg text-white history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(monthTotal)}
                                </div>
                                <div className="text-sm text-white/80">Month Total</div>
                              </div>
                              <div className="p-4 rounded-lg text-white history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {activeDays}
                                </div>
                                <div className="text-sm text-white/80">Active Days</div>
                              </div>
                              <div className="p-4 rounded-lg text-white history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(Math.round(avgDaily))}
                                </div>
                                <div className="text-sm text-white/80">Avg Daily</div>
                              </div>
                              <div className="p-4 rounded-lg text-white history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(bestDay)}
                                </div>
                                <div className="text-sm text-white/80">Best Day</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Calendar Grid */}
                      <div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-xs text-center opacity-75 p-2">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Add empty cells for days before month starts */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: (startOfMonth.getDay() + 6) % 7 }, (_, i) => (
                            <div key={`empty-${i}`} className="aspect-square"></div>
                          ))}
                          
                          {monthDates.map((day, index) => {
                            const dayString = day.toDateString();
                            const daySessions = sessions.filter(session => session.date === dayString);
                            const totalTime = daySessions.reduce((sum, session) => sum + session.duration, 0);
                            const intensity = totalTime / maxTime;
                            const isToday = dayString === new Date().toDateString();
                            const isSelected = dayString === selectedDate;

                            return (
                              <button
                                key={dayString}
                                onClick={() => {
                                  setSelectedDate(dayString);
                                  setView('day');
                                }}
                                className={`aspect-square rounded font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg relative flex flex-col items-center justify-center p-1 animate-scale-in ${
                                  isSelected
                                    ? 'ring-2 ring-white shadow-lg scale-105'
                                    : ''
                                } ${
                                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                                }`}
                                style={{
                                  backgroundColor: totalTime > 0 
                                    ? `${accentHex}${Math.round(Math.max(0.2, intensity) * 255).toString(16).padStart(2, '0')}`
                                    : undefined,
                                  animationDelay: `${index * 20}ms`
                                }}
                                title={`${dayString}: ${formatTime(totalTime)} (${daySessions.length} sessions)`}
                              >
                                {isToday && (
                                  <div className="absolute inset-0 border-2 border-white rounded"></div>
                                )}
                                <span className="text-white font-bold text-base mb-1">
                                  {day.getDate()}
                                </span>
                                {totalTime > 0 && (
                                  <div className="text-xs text-white/90 font-medium">
                                    {formatTime(totalTime)}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex items-center justify-between mt-4 text-xs opacity-75">
                          <span>Less active</span>
                          <div className="flex space-x-1">
                            {[0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => (
                              <div
                                key={opacity}
                                className="w-3 h-3 rounded"
                                style={{
                                  backgroundColor: `${accentHex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
                                }}
                              />
                            ))}
                          </div>
                          <span>More active</span>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Data Manager Modal */}
      {showDataManager && (
        <DataManager
          sessions={sessions}
          tasks={tasks}
          onUpdateSessions={onUpdateSessions}
          onUpdateTasks={onUpdateTasks}
          theme={theme}
          accentColor={accentHex}
          onClose={() => setShowDataManager(false)}
        />
      )}
    </div>
    </>
  );
}

export default History;
