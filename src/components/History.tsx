import React, { useState } from 'react';
import { X, Download, Trash2, Search, Calendar, BarChart3, ArrowDownUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task, Session } from '../App';
import { useColorSystemContext } from '../contexts/ColorSystemContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { getAccentHex } from '../utils/colorSystem';
import DataManager from './DataManager';
import { exportToCSV, type DateRange } from '../utils/dataManager';
import { formatTime } from '../utils/timeUtils';

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
  
  const colorSystem = useColorSystemContext();
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());
  const [searchTask, setSearchTask] = useState('');

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
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

  // Force re-render when sessions change
  React.useEffect(() => {
    // This will trigger a re-render when sessions array changes
  }, [sessions]);

  const getDayStats = (date: string) => {
    const daySessions = sessions.filter(s => s.date === new Date(date).toDateString());
    const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
    
    const sessionCount = daySessions.length;
    const avgSession = sessionCount > 0 ? totalTime / sessionCount : 0;
    const longestSession = Math.max(...daySessions.map(s => s.duration), 0);
    
    return { totalTime, sessionCount, avgSession, longestSession, sessions: daySessions };
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(date.getDate() - daysFromMonday);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toDateString());
    }
    return week;
  };

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

  const handleQuickExport = () => {
    let dateRange: DateRange;
    
    if (view === 'day') {
      const date = new Date(selectedDate);
      dateRange = {
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999))
      };
    } else if (view === 'week') {
      const weekDates = getWeekDates(new Date(selectedDate));
      const startDate = new Date(weekDates[0]);
      const endDate = new Date(weekDates[6]);
      dateRange = {
        start: new Date(startDate.setHours(0, 0, 0, 0)),
        end: new Date(endDate.setHours(23, 59, 59, 999))
      };
    } else {
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

  const handleDeleteDay = async () => {
    const confirmed = await confirm(`Delete all sessions for ${selectedDate}? This cannot be undone.`);
    if (confirmed) {
      onDeleteDay(selectedDate);
      setSelectedDate(selectedDate);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = await confirm('Delete this session? This cannot be undone.');
    if (confirmed) {
      onDeleteSession(sessionId);
      setSelectedDate(selectedDate);
    }
  };

  const handleDeleteAllHistory = async () => {
    const confirmed = await confirm(
      `Delete ALL history? This will permanently remove all ${sessions.length} sessions and cannot be undone.`
    );
    if (confirmed) {
      onUpdateSessions([]);
    }
  };

  const dayStats = React.useMemo(() => getDayStats(selectedDate), [selectedDate, sessions]);
  const weekDates = React.useMemo(() => getWeekDates(new Date(selectedDate)), [selectedDate]);

  const taskSessions = searchTask
    ? sessions.filter(s => s.taskName.toLowerCase().includes(searchTask.toLowerCase()))
    : [];
  const taskTime = taskSessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <>
      <style>{`
        .history-modal {
          width: 800px !important;
          max-width: 95vw !important;
          min-width: 600px !important;
        }
        
        .history-tab-content {
          transition: all 0.3s ease-out;
        }
        
                 .history-tab-fade-in {
           animation: fadeIn 0.3s ease-out;
         }
         
         .history-text-fade {
           animation: textFade 0.4s ease-out;
         }
         
         @keyframes fadeIn {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
         }
         
         @keyframes textFade {
           0% { opacity: 0; transform: translateY(5px); }
           50% { opacity: 0.5; transform: translateY(2px); }
           100% { opacity: 1; transform: translateY(0); }
         }
        
        .history-accent-text {
          color: var(--accent-color) !important;
        }
        
        .history-accent-bg {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        
        .history-stat-card {
          background: linear-gradient(135deg, var(--accent-color), var(--accent-color-hover));
          color: white;
        }
        
        .history-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .history-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .history-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .history-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          className={`history-modal ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          } rounded-2xl shadow-2xl border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          } overflow-hidden`}
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
              <BarChart3 className="history-accent-text" size={24} />
              <h2 className="text-xl font-semibold">History</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg transition-colors ${
                  showSearch 
                    ? 'history-accent-bg' 
                    : theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Search Tasks"
              >
                <Search size={20} />
              </button>
              <button
                onClick={handleQuickExport}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title={`Export ${view === 'day' ? 'Day' : view === 'week' ? 'Week' : 'Month'}`}
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setShowDataManager(true)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Data Management"
              >
                <ArrowDownUp size={20} />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Panel */}
          {showSearch && (
            <div className={`px-6 py-4 border-b ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
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
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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

          {/* Main Content */}
          <div className="flex flex-col h-[600px]">
                                      {/* Navigation Tabs */}
             <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
               <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                 {['day', 'week', 'month'].map((v) => (
                   <button
                     key={v}
                     onClick={() => setView(v as any)}
                     className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                       view === v
                         ? 'history-accent-bg shadow-sm'
                         : theme === 'dark'
                           ? 'text-gray-300 hover:text-white'
                           : 'text-gray-600 hover:text-gray-900'
                     }`}
                   >
                     {v.charAt(0).toUpperCase() + v.slice(1)}
                   </button>
                 ))}
               </div>

                                {/* Navigation Controls */}
                 <div className={`flex items-center rounded-lg ${
                   theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                 } shadow-sm border ${
                   theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                 }`}>
                   <button
                     onClick={() => {
                       if (view === 'day') {
                         const currentDate = new Date(selectedDate);
                         currentDate.setDate(currentDate.getDate() - 1);
                         setSelectedDate(currentDate.toDateString());
                       } else if (view === 'week') {
                         navigateWeek('prev');
                       } else if (view === 'month') {
                         navigateMonth('prev');
                       }
                     }}
                     className={`p-2.5 transition-all duration-200 ${
                       theme === 'dark' 
                         ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                         : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                     }`}
                     title={`Previous ${view}`}
                   >
                     <ChevronLeft size={16} />
                   </button>

                   <div className="px-4 py-2.5 text-center min-w-[140px]">
                     {view === 'day' ? (
                       <input
                         type="date"
                         value={new Date(selectedDate).toISOString().split('T')[0]}
                         onChange={(e) => setSelectedDate(e.target.value)}
                         className={`w-full text-sm font-medium transition-all duration-200 ${
                           theme === 'dark'
                             ? 'bg-transparent text-white placeholder-gray-400'
                             : 'bg-transparent text-gray-900 placeholder-gray-500'
                         } focus:outline-none`}
                       />
                     ) : (
                       <span className="text-sm font-medium history-text-fade">
                         {getCurrentPeriodText()}
                       </span>
                     )}
                   </div>

                   <button
                     onClick={() => {
                       if (view === 'day') {
                         const currentDate = new Date(selectedDate);
                         currentDate.setDate(currentDate.getDate() + 1);
                         setSelectedDate(currentDate.toDateString());
                       } else if (view === 'week') {
                         navigateWeek('next');
                       } else if (view === 'month') {
                         navigateMonth('next');
                       }
                     }}
                     className={`p-2.5 transition-all duration-200 ${
                       theme === 'dark' 
                         ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                         : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                     }`}
                     title={`Next ${view}`}
                   >
                     <ChevronRight size={16} />
                   </button>
                 </div>
             </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto history-scrollbar">
              {view === 'day' && (
                                 <div className="history-tab-fade-in h-full flex flex-col">

                                     {/* Day Stats */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     <div className="p-4 rounded-lg text-white history-stat-card">
                       <div className="text-2xl font-bold history-text-fade">{formatTime(dayStats.totalTime)}</div>
                       <div className="text-sm opacity-80">Total Time</div>
                     </div>
                     <div className="p-4 rounded-lg text-white history-stat-card">
                       <div className="text-2xl font-bold history-text-fade">{dayStats.sessionCount}</div>
                       <div className="text-sm opacity-80">Sessions</div>
                     </div>
                     <div className="p-4 rounded-lg text-white history-stat-card">
                       <div className="text-2xl font-bold history-text-fade">{formatTime(Math.round(dayStats.avgSession))}</div>
                       <div className="text-sm opacity-80">Average</div>
                     </div>
                     <div className="p-4 rounded-lg text-white history-stat-card">
                       <div className="text-2xl font-bold history-text-fade">{formatTime(dayStats.longestSession)}</div>
                       <div className="text-sm opacity-80">Longest</div>
                     </div>
                   </div>

                  {/* Sessions List */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayStats.sessions.map((session, index) => (
                      <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                      } border ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
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
                            className={`p-1 rounded transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {dayStats.sessionCount === 0 && (
                      <div className={`text-center py-12 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No sessions recorded for this day</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'week' && (
                <div className="history-tab-fade-in h-full flex flex-col">
                                     {/* Week Stats */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     {(() => {
                       const weekStats = weekDates.map(date => getDayStats(date));
                       const weekTotal = weekStats.reduce((sum, s) => sum + s.totalTime, 0);
                       const weekSessions = weekStats.reduce((sum, s) => sum + s.sessionCount, 0);
                       const activeDays = weekStats.filter(s => s.totalTime > 0).length;
                       const avgDaily = activeDays > 0 ? weekTotal / activeDays : 0;
                       
                       return (
                         <>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{formatTime(weekTotal)}</div>
                             <div className="text-sm opacity-80">Week Total</div>
                           </div>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{weekSessions}</div>
                             <div className="text-sm opacity-80">Sessions</div>
                           </div>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{activeDays}</div>
                             <div className="text-sm opacity-80">Active Days</div>
                           </div>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{formatTime(Math.round(avgDaily))}</div>
                             <div className="text-sm opacity-80">Avg Daily</div>
                           </div>
                         </>
                       );
                     })()}
                   </div>

                  {/* Week Chart */}
                  <div className="flex-1 flex flex-col">
                    {/* Bar Chart */}
                    <div className="flex justify-between items-end mb-4" style={{ height: '160px' }}>
                      {weekDates.map((dateStr, index) => {
                        const dayStats = getDayStats(dateStr);
                        const isToday = dateStr === new Date().toDateString();
                        const isSelected = dateStr === selectedDate;
                        
                        const maxTime = Math.max(...weekDates.map(d => getDayStats(d).totalTime), 1);
                        const barHeight = Math.max(15, (dayStats.totalTime / maxTime) * 120);
                        
                        return (
                          <button
                            key={dateStr}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setView('day');
                            }}
                            className="transition-all duration-200 hover:scale-105 flex-1 max-w-[60px] group"
                          >
                            <div 
                              className={`rounded-lg transition-all duration-300 mx-auto ${
                                isSelected ? 'ring-2 ring-white shadow-lg' : ''
                              } ${
                                isToday ? 'ring-2 ring-white ring-opacity-60' : ''
                              }`}
                              style={{ 
                                width: '50px', 
                                height: `${barHeight}px`,
                                backgroundColor: dayStats.totalTime > 0 ? accentHex : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                                opacity: dayStats.totalTime > 0 ? 0.9 : 0.3,
                              }}
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
                             className={`text-center flex-1 max-w-[60px] p-3 rounded-lg transition-all hover:scale-105 h-20 flex flex-col justify-center ${
                               theme === 'dark' 
                                 ? 'hover:bg-gray-800' 
                                 : 'hover:bg-gray-100'
                             } border ${
                               isToday ? `2px solid ${accentHex}` : '1px solid transparent'
                             }`}
                             title={`View details for ${dayName}, ${date.toLocaleDateString()}${isToday ? ' (Today)' : ''}`}
                           >
                             <div className="text-xs mb-1 opacity-75">
                               {dayName}
                             </div>
                             <div className="text-base font-bold mb-1">
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
                <div className="history-tab-fade-in h-full flex flex-col">
                                     {/* Month Stats */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     {(() => {
                       const date = new Date(selectedDate);
                       const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                       const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                       const daysInMonth = endOfMonth.getDate();
                       
                       const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
                         const day = i + 1;
                         return new Date(date.getFullYear(), date.getMonth(), day);
                       });
                       
                       const monthSessions = monthDates.map(day => {
                         const dayString = day.toDateString();
                         const daySessions = sessions.filter(session => session.date === dayString);
                         return daySessions.reduce((sum, session) => sum + session.duration, 0);
                       });
                       
                       const monthTotal = monthSessions.reduce((sum, time) => sum + time, 0);
                       const activeDays = monthSessions.filter(time => time > 0).length;
                       const avgDaily = activeDays > 0 ? monthTotal / activeDays : 0;
                       const bestDay = Math.max(...monthSessions);
                       
                       return (
                         <>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{formatTime(monthTotal)}</div>
                             <div className="text-sm opacity-80">Month Total</div>
                           </div>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{activeDays}</div>
                             <div className="text-sm opacity-80">Active Days</div>
                           </div>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{formatTime(Math.round(avgDaily))}</div>
                             <div className="text-sm opacity-80">Avg Daily</div>
                           </div>
                           <div className="p-4 rounded-lg text-white history-stat-card">
                             <div className="text-2xl font-bold history-text-fade">{formatTime(bestDay)}</div>
                             <div className="text-sm opacity-80">Best Day</div>
                           </div>
                         </>
                       );
                     })()}
                   </div>

                  {/* Calendar */}
                  <div className="flex-1">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-xs text-center opacity-75 p-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const date = new Date(selectedDate);
                        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                        const daysInMonth = endOfMonth.getDate();
                        
                        const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          return new Date(date.getFullYear(), date.getMonth(), day);
                        });
                        
                        const monthSessions = monthDates.map(day => {
                          const dayString = day.toDateString();
                          const daySessions = sessions.filter(session => session.date === dayString);
                          return daySessions.reduce((sum, session) => sum + session.duration, 0);
                        });
                        const maxTime = Math.max(...monthSessions, 1);
                        
                        return (
                          <>
                            {Array.from({ length: (startOfMonth.getDay() + 6) % 7 }, (_, i) => (
                              <div key={`empty-${i}`} className="h-12"></div>
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
                                  className={`h-12 rounded font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg relative flex flex-col items-center justify-center p-1 ${
                                    isSelected
                                      ? 'ring-2 ring-white shadow-lg scale-105'
                                      : ''
                                  } ${
                                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                                  } border ${
                                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                  }`}
                                  style={{
                                    backgroundColor: totalTime > 0 
                                      ? `${accentHex}${Math.round(Math.max(0.2, intensity) * 255).toString(16).padStart(2, '0')}`
                                      : undefined,
                                  }}
                                  title={`${dayString}: ${formatTime(totalTime)} (${daySessions.length} sessions)`}
                                >
                                  {isToday && (
                                    <div className="absolute inset-0 border-2 border-white rounded"></div>
                                  )}
                                  <span className="text-white font-bold text-sm">
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
                          </>
                        );
                      })()}
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
              )}
            </div>
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
