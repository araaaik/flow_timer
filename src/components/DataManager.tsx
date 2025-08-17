import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Calendar, 
  FileText, 
  Settings,
  AlertTriangle,
  CheckCircle,
  X,
  Database,
  Trash2,
  ChevronRight,
  Clock,
  Archive
} from 'lucide-react';
import type { Session, Task } from '../App';
import { useNotificationContext } from '../contexts/NotificationContext';
import {
  exportToCSV,
  importFromCSV,
  deleteSessionsByDateRange,
  deleteAllHistory,
  getPresetDateRanges,
  type DateRange
} from '../utils/dataManager';

interface DataManagerProps {
  sessions: Session[];
  tasks: Task[];
  onUpdateSessions: (sessions: Session[]) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  theme: 'light' | 'dark';
  accentColor: string;
  onClose: () => void;
}

type DatePreset = 'custom' | 'today' | 'lastWeek' | 'lastMonth' | 'all';

const DataManager: React.FC<DataManagerProps> = ({
  sessions,
  tasks,
  onUpdateSessions,
  onUpdateTasks,
  theme,
  accentColor,
  onClose
}) => {
  const { confirm, alert } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'delete'>('export');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const presetRanges = getPresetDateRanges();

  const getDateRange = (): DateRange => {
    if (datePreset === 'custom') {
      return {
        start: new Date(customDateRange.start),
        end: new Date(customDateRange.end + 'T23:59:59')
      };
    }
    
    const presetMap: Record<DatePreset, keyof typeof presetRanges> = {
      'all': 'all',
      'today': 'today',
      'lastWeek': 'lastWeek',
      'lastMonth': 'lastMonth',
      'custom': 'all'
    };
    
    return presetRanges[presetMap[datePreset]];
  };

  const handleExport = () => {
    const dateRange = getDateRange();
    exportToCSV(sessions, tasks, dateRange);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmReplace = await confirm(
      `WARNING: This will completely replace all your current data with the imported data. Your existing ${sessions.length} sessions will be permanently deleted.\n\nAre you sure you want to continue?`
    );
    
    if (!confirmReplace) {
      event.target.value = '';
      return;
    }

    try {
      setImportStatus({ type: null, message: '' });
      const importedSessions = await importFromCSV(file);
      
      onUpdateSessions(importedSessions);

      const taskNames = new Set(importedSessions.map(s => s.taskName));
      const newTasks = Array.from(taskNames).map(name => {
        const taskSessions = importedSessions.filter(s => s.taskName === name);
        const totalTimeSpent = taskSessions.reduce((sum, s) => sum + s.duration, 0);
        
        const earliestSession = taskSessions.reduce((earliest, current) => {
          const currentDate = new Date(current.startTime || current.date);
          const earliestDate = new Date(earliest.startTime || earliest.date);
          return currentDate < earliestDate ? current : earliest;
        });
        
        return {
          id: `task-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          timeSpent: totalTimeSpent,
          createdAt: new Date(earliestSession.startTime || earliestSession.date).toISOString()
        };
      });
      
      onUpdateTasks(newTasks);

      const todayStr = new Date().toDateString();
      const visibleTasks = newTasks.filter(task => {
        const createdToday = new Date(task.createdAt).toDateString() === todayStr;
        const hasTodaySessions = importedSessions.some(s => s.taskName === task.name && s.date === todayStr);
        return createdToday || hasTodaySessions;
      });

      setImportStatus({ 
        type: 'success', 
        message: `Successfully imported ${importedSessions.length} sessions and ${newTasks.length} tasks. ${visibleTasks.length} tasks will be visible in today's task list, others are in history only.`
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error importing file' 
      });
    }

    event.target.value = '';
  };

  const handleDeleteRange = async () => {
    const dateRange = getDateRange();
    const sessionsToDelete = sessions.filter(session => {
      const sessionDate = new Date(session.startTime || session.date);
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    });

    if (sessionsToDelete.length === 0) {
      alert('No sessions found in the selected date range', 'warning');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${sessionsToDelete.length} sessions from ${dateRange.start.toLocaleDateString('en-US')} to ${dateRange.end.toLocaleDateString('en-US')}? This action cannot be undone.`;
    
    const confirmed = await confirm(confirmMessage);
    if (confirmed) {
      const updatedSessions = deleteSessionsByDateRange(sessions, dateRange);
      onUpdateSessions(updatedSessions);
    }
  };

  const deleteAllHistory = async () => {
    const confirmed = await confirm(
      `Are you sure you want to delete ALL history? This will permanently remove all ${sessions.length} sessions and cannot be undone.`
    );
    if (confirmed) {
      onUpdateSessions([]);
    }
  };

  const getSessionCount = () => {
    if (activeTab !== 'export' && activeTab !== 'delete') return 0;
    const dateRange = getDateRange();
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime || session.date);
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    }).length;
  };

  const getTotalTime = () => {
    if (activeTab !== 'export' && activeTab !== 'delete') return 0;
    const dateRange = getDateRange();
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime || session.date);
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    }).reduce((sum, session) => sum + session.duration, 0);
  };

  return (
    <>
      <style>{`
        .data-manager-modal {
          width: 850px !important;
          max-width: 95vw !important;
          min-width: 600px !important;
        }
        
        .data-manager-tab-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .data-manager-accent-text {
          color: var(--accent-color) !important;
        }
        
        .data-manager-accent-bg {
          background-color: var(--accent-color) !important;
          color: white !important;
        }
        
        .data-manager-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .data-manager-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .data-manager-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .data-manager-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          className={`data-manager-modal ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          } rounded-2xl shadow-2xl border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          } overflow-hidden`}
          style={{
            '--accent-color': accentColor,
          } as React.CSSProperties}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Database className="data-manager-accent-text" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Data Management</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Export, import, and manage your data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex flex-col">
            {/* Top Navigation */}
            <div className={`border-b ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="p-6">
                <h3 className="text-sm font-medium uppercase tracking-wide mb-4 opacity-75">
                  Operations
                </h3>
                <nav className="flex space-x-3">
                  {[
                    { id: 'export', label: 'Export Data', icon: Download, desc: 'Download your data' },
                    { id: 'import', label: 'Import Data', icon: Upload, desc: 'Restore from backup' },
                    { id: 'delete', label: 'Delete Data', icon: Trash2, desc: 'Remove data' }
                  ].map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as 'export' | 'import' | 'delete')}
                      className={`flex-1 flex items-center space-x-3 px-6 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === id
                          ? 'data-manager-accent-bg shadow-sm'
                          : theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} />
                      <div className="font-medium text-sm">{label}</div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">


              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'export' && (
                  <div className="data-manager-tab-fade-in flex flex-col">
                                         {/* Period Selection */}
                     <div className="mb-4">
                       <h4 className="text-sm font-semibold mb-3">Select Export Period</h4>
                       
                       <div className="grid grid-cols-5 gap-3 mb-2">
                         {[
                           { id: 'all', label: 'All Time', icon: Archive },
                           { id: 'today', label: 'Today', icon: Clock },
                           { id: 'lastWeek', label: 'Last Week', icon: Calendar },
                           { id: 'lastMonth', label: 'Last Month', icon: Calendar },
                           { id: 'custom', label: 'Custom', icon: Calendar }
                         ].map(({ id, label, icon: Icon }) => (
                           <button
                             key={id}
                             onClick={() => setDatePreset(id as DatePreset)}
                             className={`p-3 rounded-lg text-center transition-all duration-200 h-14 ${
                               datePreset === id
                                 ? 'data-manager-accent-bg'
                                 : theme === 'dark'
                                   ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                                   : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                             }`}
                           >
                             <div className="flex flex-col items-center space-y-1">
                               <Icon size={14} />
                               <div className="text-xs font-medium">{label}</div>
                             </div>
                           </button>
                         ))}
                       </div>

                      {datePreset === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">From</label>
                            <input
                              type="date"
                              value={customDateRange.start}
                              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                                  : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400'
                              } focus:outline-none`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">To</label>
                            <input
                              type="date"
                              value={customDateRange.end}
                              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                                  : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400'
                              } focus:outline-none`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Export Summary */}
                    <div className="mt-2 flex flex-col">
                      <div className={`p-4 rounded-lg mb-4 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <FileText size={16} className="data-manager-accent-text" />
                          <div className="text-sm font-semibold">Export Summary</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-3 rounded ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                          }`}>
                            <div className="text-sm opacity-75">Sessions</div>
                            <div className="text-xl font-bold data-manager-accent-text">{getSessionCount()}</div>
                          </div>
                          <div className={`p-3 rounded ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                          }`}>
                            <div className="text-sm opacity-75">Total Time</div>
                            <div className="text-xl font-bold data-manager-accent-text">
                              {Math.floor(getTotalTime() / 3600)}h {Math.floor((getTotalTime() % 3600) / 60)}m
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleExport}
                        disabled={getSessionCount() === 0}
                        className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                          getSessionCount() === 0
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'data-manager-accent-bg hover:opacity-90'
                        }`}
                      >
                        <Download size={20} className="mr-2" />
                        Export Data
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'import' && (
                  <div className="data-manager-tab-fade-in flex flex-col">
                    {/* Warning */}
                    <div className={`max-w-lg mx-auto p-4 rounded-lg border-2 mb-6 ${
                      theme === 'dark' 
                        ? 'border-gray-500/30 bg-gray-500/10' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <AlertTriangle size={18} className="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Complete Data Replacement
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Importing will completely replace all your current data. Your existing sessions and tasks will be permanently deleted and replaced with the imported data. Make sure you have a backup before proceeding.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Import Zone */}
                    <div className="flex flex-col justify-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        className="hidden"
                        id="import-file"
                      />
                      <label
                        htmlFor="import-file"
                        className={`max-w-md mx-auto w-full flex items-center justify-center px-6 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${
                          theme === 'dark'
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-center">
                          <Upload size={32} className="mx-auto mb-3 data-manager-accent-text" />
                          <div className="text-base font-medium mb-1">Choose CSV File</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Click to select file for import</div>
                        </div>
                      </label>
                    </div>

                    {/* Status */}
                    {importStatus.type && (
                      <div className={`p-4 rounded-lg flex items-start space-x-3 mt-6 ${
                        importStatus.type === 'success'
                          ? theme === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'
                          : theme === 'dark' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {importStatus.type === 'success' ? (
                          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm">{importStatus.message}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'delete' && (
                  <div className="data-manager-tab-fade-in flex flex-col">


                                         {/* Period Selection */}
                     <div className="mb-4">
                       <h4 className="text-sm font-semibold mb-2">Select Delete Period</h4>
                       
                       <div className="grid grid-cols-5 gap-2 mb-3">
                         {[
                           { id: 'today', label: 'Today', icon: Clock },
                           { id: 'lastWeek', label: 'Last Week', icon: Calendar },
                           { id: 'lastMonth', label: 'Last Month', icon: Calendar },
                           { id: 'all', label: 'All Time', icon: Archive },
                           { id: 'custom', label: 'Custom', icon: Calendar }
                         ].map(({ id, label, icon: Icon }) => (
                           <button
                             key={id}
                             onClick={() => setDatePreset(id as DatePreset)}
                             className={`p-2 rounded-lg text-center transition-all duration-200 h-12 ${
                               datePreset === id
                                 ? 'data-manager-accent-bg'
                                 : theme === 'dark'
                                   ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                                   : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                             }`}
                           >
                             <div className="flex flex-col items-center space-y-1">
                               <Icon size={14} />
                               <div className="text-xs font-medium">{label}</div>
                             </div>
                           </button>
                         ))}
                       </div>

                      {datePreset === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">From</label>
                            <input
                              type="date"
                              value={customDateRange.start}
                              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                                  : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400'
                              } focus:outline-none`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">To</label>
                            <input
                              type="date"
                              value={customDateRange.end}
                              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                              className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                                  : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400'
                              } focus:outline-none`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete Summary */}
                    <div className="mt-4 flex flex-col">
                      <div className={`p-4 rounded-lg mb-4 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <Trash2 size={16} className="text-red-800" />
                          <div className="text-sm font-semibold">Delete Summary</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-3 rounded ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                          }`}>
                            <div className="text-sm opacity-75">Sessions</div>
                            <div className="text-xl font-bold text-red-800">{getSessionCount()}</div>
                          </div>
                          <div className={`p-3 rounded ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                          }`}>
                            <div className="text-sm opacity-75">Total Time</div>
                            <div className="text-xl font-bold text-red-800">
                              {Math.floor(getTotalTime() / 3600)}h {Math.floor((getTotalTime() % 3600) / 60)}m
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleDeleteRange}
                          disabled={getSessionCount() === 0}
                          className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            getSessionCount() === 0
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-red-800 hover:bg-red-900 text-white'
                          }`}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete Selected
                        </button>

                        <button
                          onClick={deleteAllHistory}
                          className="flex items-center justify-center px-4 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white font-medium transition-all duration-200"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataManager;