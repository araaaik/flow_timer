import React, { useState } from 'react';
import { X, Download, Trash2, Search, Calendar, BarChart3 } from 'lucide-react';
import type { Task, Session } from '../App';

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
  theme: 'light' | 'dark';
  accentColor: string;
}

function History({
  sessions,
  tasks,
  onClose,
  onDeleteSession,
  onDeleteDay,
  theme,
  accentColor
}: HistoryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [searchTask, setSearchTask] = useState('');

  /** formatTime() -> "H:MM" or "Xm" when under 1h */
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}m`;
  };

  /** formatDateTime() -> "HH:MM" 24h locale-agnostic */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  /**
   * getDayStats()
   * Aggregate metrics for a specific date (Date.toDateString key).
   */
  const getDayStats = (date: string) => {
    const daySessions = sessions.filter(s => s.date === date);
    const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionCount = daySessions.length;
    const avgSession = sessionCount > 0 ? totalTime / sessionCount : 0;
    const longestSession = Math.max(...daySessions.map(s => s.duration), 0);
    
    return { totalTime, sessionCount, avgSession, longestSession, sessions: daySessions };
  };

  /**
   * getWeekDates()
   * Returns Sun..Sat toDateString values for the week containing 'date'.
   */
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toDateString());
    }
    return week;
  };

  /**
   * handleExport()
   * Downloads JSON with day summary and session details for the selected date.
   */
  const handleExport = () => {
    const stats = getDayStats(selectedDate);
    const data = {
      date: selectedDate,
      stats: {
        totalTime: formatTime(stats.totalTime),
        sessionCount: stats.sessionCount,
        avgSession: formatTime(Math.round(stats.avgSession)),
        longestSession: formatTime(stats.longestSession)
      },
      sessions: stats.sessions.map(s => ({
        task: s.taskName,
        duration: formatTime(s.duration),
        startTime: formatDateTime(s.startTime),
        endTime: formatDateTime(s.endTime)
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-export-${selectedDate.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
        <div className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <BarChart3
              className={`${
                (() => {
                  const map: Record<string, string> = {
                    blue: 'text-blue-500',
                    red: 'text-red-500',
                    green: 'text-green-500',
                    purple: 'text-purple-500',
                    orange: 'text-orange-500',
                    pink: 'text-pink-500',
                    indigo: 'text-indigo-500',
                    yellow: 'text-yellow-500',
                    teal: 'text-teal-500',
                    cyan: 'text-cyan-500',
                    lime: 'text-lime-500',
                    emerald: 'text-emerald-500',
                    violet: 'text-violet-500',
                    rose: 'text-rose-500',
                    slate: 'text-slate-500',
                    black: 'text-black',
                  };
                  return map[accentColor] ?? 'text-blue-500';
                })()
              }`}
              style={accentColor === 'green' ? { color: '#266a5b' } : undefined}
              size={24}
            />
            <h2 className="text-xl font-semibold">Statistics & History</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
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
                      ? (() => {
                          const map: Record<string, string> = {
                            blue: 'bg-blue-500 text-white',
                            red: 'bg-red-500 text-white',
                            green: 'bg-green-500 text-white',
                            purple: 'bg-purple-500 text-white',
                            orange: 'bg-orange-500 text-white',
                            pink: 'bg-pink-500 text-white',
                            indigo: 'bg-indigo-500 text-white',
                            yellow: 'bg-yellow-500 text-white',
                            teal: 'bg-teal-500 text-white',
                            cyan: 'bg-cyan-500 text-white',
                            lime: 'bg-lime-500 text-white',
                            emerald: 'bg-emerald-500 text-white',
                            violet: 'bg-violet-500 text-white',
                            rose: 'bg-rose-500 text-white',
                            slate: 'bg-slate-500 text-white',
                            black: 'bg-black text-white',
                          };
                          return map[accentColor] ?? 'bg-blue-500 text-white';
                        })()
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={view === v && accentColor === 'green' ? { backgroundColor: '#266a5b', color: '#ffffff' } : undefined}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={new Date(selectedDate).toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value).toDateString())}
              className={`px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>

          {/* Task Search */}
          <div className="mb-6">
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
              />
            </div>
            {searchTask && (
              <div className={`mt-2 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="text-sm">
                  <strong>"{searchTask}"</strong> - {taskSessions.length} sessions, {formatTime(taskTime)} total
                </div>
              </div>
            )}
          </div>

          {view === 'day' && (
            <div>
              {/* Day Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div 
                  className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-1"
                  style={{
                    backgroundColor: (() => {
                      const accentHexMap: Record<string, string> = {
                        blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                        orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                        teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                        violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                      };
                      return accentHexMap[accentColor] ?? '#3b82f6';
                    })()
                  }}
                >
                  <div className="text-2xl font-bold text-white">
                    {formatTime(dayStats.totalTime)}
                  </div>
                  <div className="text-sm text-white/80">Total Time</div>
                </div>
                <div 
                  className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-2"
                  style={{
                    backgroundColor: (() => {
                      const accentHexMap: Record<string, string> = {
                        blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                        orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                        teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                        violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                      };
                      return accentHexMap[accentColor] ?? '#3b82f6';
                    })()
                  }}
                >
                  <div className="text-2xl font-bold text-white">
                    {dayStats.sessionCount}
                  </div>
                  <div className="text-sm text-white/80">Sessions</div>
                </div>
                <div 
                  className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-3"
                  style={{
                    backgroundColor: (() => {
                      const accentHexMap: Record<string, string> = {
                        blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                        orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                        teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                        violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                      };
                      return accentHexMap[accentColor] ?? '#3b82f6';
                    })()
                  }}
                >
                  <div className="text-2xl font-bold text-white">
                    {formatTime(Math.round(dayStats.avgSession))}
                  </div>
                  <div className="text-sm text-white/80">Average</div>
                </div>
                <div 
                  className="p-4 rounded-lg text-white animate-fade-in-up animate-stagger-4"
                  style={{
                    backgroundColor: (() => {
                      const accentHexMap: Record<string, string> = {
                        blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                        orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                        teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                        violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                      };
                      return accentHexMap[accentColor] ?? '#3b82f6';
                    })()
                  }}
                >
                  <div className="text-2xl font-bold text-white">
                    {formatTime(dayStats.longestSession)}
                  </div>
                  <div className="text-sm text-white/80">Longest</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={handleExport}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Download size={14} className="mr-1" />
                  Export
                </button>
                {dayStats.sessionCount > 0 && (
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
                )}
              </div>

              {/* Sessions List */}
              <div className="space-y-2">
                {dayStats.sessions.map((session) => (
                  <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div>
                      <div className="font-medium">{session.taskName}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`font-medium ${
                        (() => {
                          const map: Record<string, string> = {
                            blue: 'text-blue-500',
                            red: 'text-red-500',
                            green: 'text-green-500',
                            purple: 'text-purple-500',
                            orange: 'text-orange-500',
                            pink: 'text-pink-500',
                            indigo: 'text-indigo-500',
                            yellow: 'text-yellow-500',
                            teal: 'text-teal-500',
                            cyan: 'text-cyan-500',
                            lime: 'text-lime-500',
                            emerald: 'text-emerald-500',
                            violet: 'text-violet-500',
                            rose: 'text-rose-500',
                            slate: 'text-slate-500',
                            black: 'text-black',
                          };
                          return map[accentColor] ?? 'text-blue-500';
                        })()
                      }`}
                      style={accentColor === 'green' ? { color: '#266a5b' } : undefined}
                    >
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
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const stats = getDayStats(date);
                const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = new Date(date).getDate();
                
                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setView('day');
                    }}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      date === selectedDate
                        ? (() => {
                            const map: Record<string, string> = {
                              blue: 'bg-blue-100 border border-blue-300 dark:bg-blue-900/20',
                              red: 'bg-red-100 border border-red-300 dark:bg-red-900/20',
                              green: 'bg-green-100 border border-green-300 dark:bg-green-900/20',
                              purple: 'bg-purple-100 border border-purple-300 dark:bg-purple-900/20',
                              orange: 'bg-orange-100 border border-orange-300 dark:bg-orange-900/20',
                              pink: 'bg-pink-100 border border-pink-300 dark:bg-pink-900/20',
                              indigo: 'bg-indigo-100 border border-indigo-300 dark:bg-indigo-900/20',
                              yellow: 'bg-yellow-100 border border-yellow-300 dark:bg-yellow-900/20',
                              teal: 'bg-teal-100 border border-teal-300 dark:bg-teal-900/20',
                              cyan: 'bg-cyan-100 border border-cyan-300 dark:bg-cyan-900/20',
                              lime: 'bg-lime-100 border border-lime-300 dark:bg-lime-900/20',
                              emerald: 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-900/20',
                              violet: 'bg-violet-100 border border-violet-300 dark:bg-violet-900/20',
                              rose: 'bg-rose-100 border border-rose-300 dark:bg-rose-900/20',
                              slate: 'bg-slate-100 border border-slate-300 dark:bg-slate-900/20',
                              black: 'bg-black/10 border border-black/30 dark:bg-white/10',
                            };
                            return map[accentColor] ?? 'bg-blue-100 border border-blue-300 dark:bg-blue-900/20';
                          })()
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-medium">{dayName}</div>
                    <div className="text-lg font-bold">{dayNumber}</div>
                    <div className={`text-xs ${
                      (() => {
                        const map: Record<string, string> = {
                          blue: 'text-blue-500',
                          red: 'text-red-500',
                          green: 'text-green-500',
                          purple: 'text-purple-500',
                          orange: 'text-orange-500',
                          pink: 'text-pink-500',
                          indigo: 'text-indigo-500',
                          yellow: 'text-yellow-500',
                          teal: 'text-teal-500',
                          cyan: 'text-cyan-500',
                          lime: 'text-lime-500',
                          emerald: 'text-emerald-500',
                          violet: 'text-violet-500',
                          rose: 'text-rose-500',
                          slate: 'text-slate-500',
                          black: 'text-black',
                        };
                        return map[accentColor] ?? 'text-blue-500';
                      })()
                    }`}
                    style={accentColor === 'green' ? { color: '#266a5b' } : undefined}
                  >
                      {formatTime(stats.totalTime)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default History;