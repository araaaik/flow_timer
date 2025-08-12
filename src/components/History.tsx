import React, { useState } from 'react';
import { X, Download, Trash2, Search, Calendar, BarChart3, Settings, ChevronLeft, ChevronRight, TrendingUp, Activity } from 'lucide-react';
import type { Task, Session } from '../App';
import { useColorSystemContext } from '../contexts/ColorSystemContext';
import { getAccentHex } from '../utils/colorSystem';
import DataManager from './DataManager';
import { exportToCSV, getPresetDateRanges, type DateRange } from '../utils/dataManager';

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
  const [showQuickExport, setShowQuickExport] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'all' | 'custom'>('all');
  const [showSearch, setShowSearch] = useState(false);
  
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

  /** formatTime() -> "H:MM" or "Xm" when under 1h */
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}m`;
  };

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
   * Productivity Analysis Functions
   */
  const getProductivityData = () => {
    // Get last 30 days of data
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    
    const dailyData = [];
    const currentDate = new Date(thirtyDaysAgo);
    
    while (currentDate <= today) {
      const dateStr = currentDate.toDateString();
      const dayStats = getDayStats(dateStr);
      const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
      
      dailyData.push({
        date: dateStr,
        dateObj: new Date(currentDate),
        totalTime: dayStats.totalTime,
        sessionCount: dayStats.sessionCount,
        avgSession: dayStats.avgSession,
        dayOfWeek,
        isWeekend: dayOfWeek === 5 || dayOfWeek === 6 // Saturday and Sunday
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dailyData;
  };

  const getProductivityStats = () => {
    const data = getProductivityData();
    const workDays = data.filter(d => !d.isWeekend && d.totalTime > 0);
    const allDays = data.filter(d => d.totalTime > 0);
    
    if (allDays.length === 0) {
      return {
        avgDaily: 0,
        maxDaily: 0,
        totalDays: 0,
        streak: 0,
        bestDay: null,
        productivity: 'No data'
      };
    }
    
    const totalTime = allDays.reduce((sum, d) => sum + d.totalTime, 0);
    const avgDaily = totalTime / allDays.length;
    const maxDaily = Math.max(...allDays.map(d => d.totalTime));
    const bestDay = allDays.find(d => d.totalTime === maxDaily);
    
    // Calculate current streak
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].totalTime > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    // Productivity level based on consistency and volume
    const consistency = allDays.length / 30; // How many days out of 30
    const avgHours = avgDaily / 3600;
    let productivity = 'Low';
    
    if (consistency > 0.8 && avgHours > 4) productivity = 'Excellent';
    else if (consistency > 0.6 && avgHours > 3) productivity = 'Good';
    else if (consistency > 0.4 && avgHours > 2) productivity = 'Fair';
    
    return {
      avgDaily,
      maxDaily,
      totalDays: allDays.length,
      streak,
      bestDay,
      productivity,
      consistency: Math.round(consistency * 100)
    };
  };

  const getIntensityColor = (totalTime: number, maxTime: number) => {
    if (totalTime === 0) return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
    
    const intensity = totalTime / maxTime;
    const opacity = Math.max(0.2, Math.min(1, intensity));
    
    return `bg-current opacity-${Math.round(opacity * 10) * 10}`;
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
  const handleDeleteDay = () => {
    if (window.confirm(`Delete all sessions for ${selectedDate}? This cannot be undone.`)) {
      onDeleteDay(selectedDate);
    }
  };

  /** handleDeleteSession(): confirm and delegate single session deletion */
  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Delete this session? This cannot be undone.')) {
      onDeleteSession(sessionId);
    }
  };

  const dayStats = getDayStats(selectedDate);
  const weekDates = getWeekDates(new Date(selectedDate));

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

          {/* Task Search - Collapsible */}
          {showSearch && (
            <div className="mb-6 animate-fade-in-up">
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
                <div className={`mt-2 p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
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
                              : 'bg-white hover:bg-gray-50'
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



          {view === 'day' && (
            <div>
              {/* Day Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">
                  {getCurrentPeriodText()}
                </h3>
              </div>

              {/* Day Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-1 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(dayStats.totalTime)}
                  </div>
                  <div className="text-sm text-white/80">Total Time</div>
                </div>
                <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-2 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {dayStats.sessionCount}
                  </div>
                  <div className="text-sm text-white/80">Sessions</div>
                </div>
                <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-3 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(Math.round(dayStats.avgSession))}
                  </div>
                  <div className="text-sm text-white/80">Average</div>
                </div>
                <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-4 history-stat-card">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(dayStats.longestSession)}
                  </div>
                  <div className="text-sm text-white/80">Longest</div>
                </div>
              </div>

              {/* Actions */}
              {dayStats.sessionCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={handleDeleteDay}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                      theme === 'dark'
                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete Day
                  </button>
                </div>
              )}

              {/* Sessions List */}
              <div className="space-y-2">
                {dayStats.sessions.map((session) => (
                  <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
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
              {/* Weekly Pattern Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center mb-4">
                  <Activity size={20} className="mr-2 history-accent-text" />
                  Weekly Pattern Analysis
                </h3>
                
                {(() => {
                  const productivityData = getProductivityData();
                  const maxDayTime = Math.max(...productivityData.map(d => d.totalTime), 1);
                  
                  return (
                    <div className="space-y-6">
                      {/* Weekly Bar Chart */}
                      <div>
                        <h4 className="text-md font-medium mb-4">Average Time by Day of Week</h4>
                        <div className="grid grid-cols-7 gap-3" style={{ alignItems: 'end', display: 'flex' }}>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, dayIndex) => {
                            const dayData = productivityData.filter(d => d.dayOfWeek === dayIndex);
                            const avgTime = dayData.length > 0 
                              ? dayData.reduce((sum, d) => sum + d.totalTime, 0) / dayData.length 
                              : 0;
                            const height = Math.max(30, (avgTime / maxDayTime) * 120);
                            const isWeekend = dayIndex === 5 || dayIndex === 6; // Saturday and Sunday
                            
                            return (
                              <button
                                key={dayName}
                                onClick={() => {
                                  // Find a day of this weekday in current week and navigate to it
                                  const targetDate = weekDates.find(date => (new Date(date).getDay() + 6) % 7 === dayIndex);
                                  if (targetDate) {
                                    setSelectedDate(targetDate);
                                    setView('day');
                                  }
                                }}
                                className="text-center flex-1 transition-all hover:scale-105"
                              >
                                <div 
                                  className={`rounded-t mx-auto mb-3 transition-all ${
                                    isWeekend ? 'opacity-60' : ''
                                  }`}
                                  style={{ 
                                    width: '32px', 
                                    height: `${height}px`,
                                    backgroundColor: accentHex,
                                    opacity: avgTime > 0 ? 0.8 : 0.2
                                  }}
                                />
                                <div className="text-xs opacity-75 mb-1">{dayName.slice(0, 3)}</div>
                                <div className="text-sm font-medium">{formatTime(Math.round(avgTime))}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Week Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const weekStats = weekDates.map(date => getDayStats(date));
                          const weekTotal = weekStats.reduce((sum, s) => sum + s.totalTime, 0);
                          const weekSessions = weekStats.reduce((sum, s) => sum + s.sessionCount, 0);
                          const activeDays = weekStats.filter(s => s.totalTime > 0).length;
                          const avgDaily = activeDays > 0 ? weekTotal / activeDays : 0;
                          
                          return (
                            <>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-1 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(weekTotal)}
                                </div>
                                <div className="text-sm text-white/80">Week Total</div>
                              </div>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-2 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {weekSessions}
                                </div>
                                <div className="text-sm text-white/80">Sessions</div>
                              </div>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-3 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {activeDays}
                                </div>
                                <div className="text-sm text-white/80">Active Days</div>
                              </div>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-4 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(Math.round(avgDaily))}
                                </div>
                                <div className="text-sm text-white/80">Avg Daily</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}
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
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-1 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(monthTotal)}
                                </div>
                                <div className="text-sm text-white/80">Month Total</div>
                              </div>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-2 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {activeDays}
                                </div>
                                <div className="text-sm text-white/80">Active Days</div>
                              </div>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-3 history-stat-card">
                                <div className="text-2xl font-bold text-white">
                                  {formatTime(Math.round(avgDaily))}
                                </div>
                                <div className="text-sm text-white/80">Avg Daily</div>
                              </div>
                              <div className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-4 history-stat-card">
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
                          
                          {monthDates.map(day => {
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
                                className={`aspect-square rounded text-sm font-medium transition-all hover:scale-105 relative flex flex-col items-center justify-center group ${
                                  isSelected
                                    ? 'ring-2 ring-white'
                                    : ''
                                } ${
                                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                                }`}
                                style={{
                                  backgroundColor: totalTime > 0 
                                    ? `${accentHex}${Math.round(Math.max(0.2, intensity) * 255).toString(16).padStart(2, '0')}`
                                    : undefined
                                }}
                                title={`${dayString}: ${formatTime(totalTime)} (${daySessions.length} sessions)`}
                              >
                                {isToday && (
                                  <div className="absolute inset-0 border-2 border-white rounded"></div>
                                )}
                                <span className="text-white font-medium mb-1">
                                  {day.getDate()}
                                </span>
                                {totalTime > 0 && (
                                  <div className="text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
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
