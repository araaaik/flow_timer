import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Calendar, 
  FileText, 
  Settings,
  AlertTriangle,
  CheckCircle,
  X
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
    
    // Map preset to available ranges
    const presetMap: Record<DatePreset, keyof typeof presetRanges> = {
      'all': 'all',
      'today': 'today',
      'lastWeek': 'lastWeek',
      'lastMonth': 'lastMonth',
      'custom': 'all' // fallback
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

    // Warning about data replacement
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
      
      // Replace all sessions with imported ones
      onUpdateSessions(importedSessions);

      // Create tasks from imported sessions with correct timeSpent and creation date
      const taskNames = new Set(importedSessions.map(s => s.taskName));
      const newTasks = Array.from(taskNames).map(name => {
        const taskSessions = importedSessions.filter(s => s.taskName === name);
        const totalTimeSpent = taskSessions.reduce((sum, s) => sum + s.duration, 0);
        
        // Use the earliest session date as the task creation date
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

      // Count tasks that will be visible today
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

    // Reset input
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

  const getSessionCount = () => {
    if (activeTab !== 'export' && activeTab !== 'delete') return 0;
    const dateRange = getDateRange();
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime || session.date);
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    }).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
      <div className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden shadow-2xl`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Settings size={24} style={{ color: accentColor }} />
            <h2 className="text-xl font-semibold">Data Management</h2>
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
          {/* Tabs */}
          <div className={`flex rounded-lg p-1 mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {[
              { id: 'export', label: 'Export', icon: Download },
              { id: 'import', label: 'Import', icon: Upload },
              { id: 'delete', label: 'Delete', icon: X }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'export' | 'import' | 'delete')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'text-white'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === id ? { backgroundColor: accentColor } : undefined}
              >
                <Icon size={16} className="mr-2" />
                {label}
              </button>
            ))}
          </div>

          {/* Period Selection - For Export and Delete Tabs */}
          {(activeTab === 'export' || activeTab === 'delete') && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                {activeTab === 'export' ? 'Export Period' : 'Delete Period'}
              </label>
              
              {activeTab === 'export' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setDatePreset('all')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      datePreset === 'all'
                        ? 'text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    style={datePreset === 'all' ? { backgroundColor: accentColor } : undefined}
                  >
                    All Time
                  </button>
                  
                  <button
                    onClick={() => setDatePreset('custom')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      datePreset === 'custom'
                        ? 'text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    style={datePreset === 'custom' ? { backgroundColor: accentColor } : undefined}
                  >
                    <Calendar size={16} className="inline mr-2" />
                    Custom Period
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'lastWeek', label: 'Last Week' },
                    { id: 'lastMonth', label: 'Last Month' },
                    { id: 'all', label: 'All Time' }
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setDatePreset(id as DatePreset)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        datePreset === id
                          ? 'text-white'
                          : theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      style={datePreset === id ? { backgroundColor: accentColor } : undefined}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => setDatePreset('custom')}
                    className={`col-span-2 md:col-span-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      datePreset === 'custom'
                        ? 'text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    style={datePreset === 'custom' ? { backgroundColor: accentColor } : undefined}
                  >
                    <Calendar size={16} className="inline mr-2" />
                    Custom Period
                  </button>
                </div>
              )}

              {datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Sessions found: {getSessionCount()}
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <FileText size={20} style={{ color: accentColor }} />
                  <div>
                    <h3 className="font-medium">CSV Export</h3>
                    <p className="text-sm opacity-75">Excel-compatible format with summary and detailed data</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={getSessionCount() === 0}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium transition-colors ${
                  getSessionCount() === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'hover:opacity-90'
                }`}
                style={getSessionCount() > 0 ? { backgroundColor: accentColor } : undefined}
              >
                <Download size={20} className="mr-2" />
                Export Data
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 border-orange-200 ${
                theme === 'dark' ? 'bg-orange-900/10' : 'bg-orange-50'
              }`}>
                <div className="flex items-start space-x-3 mb-3">
                  <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-700 dark:text-orange-400 mb-2">
                      Complete Data Replacement
                    </h3>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mb-4">
                      Importing will completely replace all your current data. Your existing sessions and tasks will be permanently deleted and replaced with the imported data.
                    </p>
                  </div>
                </div>
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer text-white font-medium transition-colors hover:opacity-90`}
                  style={{ backgroundColor: accentColor }}
                >
                  <Upload size={16} className="mr-2" />
                  Choose File to Replace All Data
                </label>
              </div>

              {importStatus.type && (
                <div className={`p-4 rounded-lg flex items-start space-x-3 ${
                  importStatus.type === 'success'
                    ? theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'
                    : theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
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
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 border-red-200 ${
                theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">
                      Warning! Irreversible Action
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      Deleted data cannot be recovered. It's recommended to create a backup before deletion.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDeleteRange}
                  disabled={getSessionCount() === 0}
                  className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    getSessionCount() === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <X size={20} className="mr-2" />
                  Delete Selected Period ({getSessionCount()} sessions)
                </button>

                <button
                  onClick={deleteAllHistory}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                >
                  <X size={20} className="mr-2" />
                  Delete All History
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DataManager;