import React, { useState } from 'react';
import { X, Download, Trash2, Search, Calendar, BarChart3 } from 'lucide-react';
import type { Task, Session } from '../App';

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getDayStats = (date: string) => {
    const daySessions = sessions.filter(s => s.date === date);
    const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionCount = daySessions.length;
    const avgSession = sessionCount > 0 ? totalTime / sessionCount : 0;
    const longestSession = Math.max(...daySessions.map(s => s.duration), 0);
    
    return { totalTime, sessionCount, avgSession, longestSession, sessions: daySessions };
  };

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

  const handleDeleteDay = () => {
    if (window.confirm(`Delete all sessions for ${selectedDate}? This cannot be undone.`)) {
      onDeleteDay(selectedDate);
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <BarChart3 className={`text-${accentColor}-500`} size={24} />
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {['day', 'week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === v
                      ? `bg-${accentColor}-500 text-white`
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
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold text-${accentColor}-500`}>
                    {formatTime(dayStats.totalTime)}
                  </div>
                  <div className="text-sm text-gray-500">Total Time</div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold text-${accentColor}-500`}>
                    {dayStats.sessionCount}
                  </div>
                  <div className="text-sm text-gray-500">Sessions</div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold text-${accentColor}-500`}>
                    {formatTime(Math.round(dayStats.avgSession))}
                  </div>
                  <div className="text-sm text-gray-500">Average</div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold text-${accentColor}-500`}>
                    {formatTime(dayStats.longestSession)}
                  </div>
                  <div className="text-sm text-gray-500">Longest</div>
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
                    className="flex items-center px-3 py-2 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white"
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
                      <span className={`font-medium text-${accentColor}-500`}>
                        {formatTime(session.duration)}
                      </span>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50"
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
                        ? `bg-${accentColor}-100 border-${accentColor}-300 dark:bg-${accentColor}-900/20`
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-medium">{dayName}</div>
                    <div className="text-lg font-bold">{dayNumber}</div>
                    <div className={`text-xs text-${accentColor}-500`}>
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
  );
}

export default History;