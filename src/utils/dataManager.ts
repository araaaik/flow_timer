import type { Task, Session } from '../App';

/**
 * Data Manager Utilities
 * Functions for importing, exporting and managing history data
 */

export interface ExportData {
  exportDate: string;
  dateRange: {
    start: string;
    end: string;
  };
  sessions: Session[];
  tasks: Task[];
  summary: {
    totalSessions: number;
    totalTime: number;
    uniqueTasks: number;
    averageSessionTime: number;
    longestSession: number;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Formats time in readable format
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formats date and time for Excel
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Filters sessions by date range
 */
export const filterSessionsByDateRange = (sessions: Session[], dateRange: DateRange): Session[] => {
  return sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
  });
};

/**
 * Creates summary from sessions
 */
export const createSummary = (sessions: Session[]) => {
  const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
  const uniqueTasks = new Set(sessions.map(session => session.taskId)).size;
  const averageSessionTime = sessions.length > 0 ? totalTime / sessions.length : 0;
  const longestSession = Math.max(...sessions.map(session => session.duration), 0);

  return {
    totalSessions: sessions.length,
    totalTime,
    uniqueTasks,
    averageSessionTime,
    longestSession
  };
};

/**
 * Export to CSV format (Excel-compatible)
 */
export const exportToCSV = (sessions: Session[], _tasks: Task[], dateRange: DateRange): void => {
  const filteredSessions = filterSessionsByDateRange(sessions, dateRange);
  const summary = createSummary(filteredSessions);

  // Create CSV content
  const csvContent = [
    // Header with export information
    `FLOW Data Export,${formatDateTime(new Date().toISOString())}`,
    `Period,${dateRange.start.toLocaleDateString('en-US')} - ${dateRange.end.toLocaleDateString('en-US')}`,
    '',
    // Summary
    'SUMMARY',
    `Total Sessions,${summary.totalSessions}`,
    `Total Time,${formatTime(summary.totalTime)}`,
    `Unique Tasks,${summary.uniqueTasks}`,
    `Average Session Time,${formatTime(Math.round(summary.averageSessionTime))}`,
    `Longest Session,${formatTime(summary.longestSession)}`,
    '',
    // Headers for detailed data
    'DETAILED DATA',
    'Date,Task,Duration (sec),Duration (time)',
    // Session data
    ...filteredSessions.map(session => [
      new Date(session.date).toLocaleDateString('en-US'),
      `"${session.taskName}"`,
      session.duration,
      formatTime(session.duration)
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flow-export-${dateRange.start.toISOString().split('T')[0]}-${dateRange.end.toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import from CSV file
 */
export const importFromCSV = (file: File): Promise<Session[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        
        // Find the start of detailed data
        let dataStartIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('DETAILED DATA')) {
            dataStartIndex = i + 2; // Skip header line
            break;
          }
        }
        
        if (dataStartIndex === -1) {
          throw new Error('Invalid file format: DETAILED DATA section not found');
        }
        
        const sessions: Session[] = [];
        
        for (let i = dataStartIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(',');
          if (parts.length < 4) continue;
          
          try {
            const date = parts[0];
            const taskName = parts[1].replace(/"/g, ''); // Remove quotes
            const duration = parts[2];
            
            // Create date objects (assuming UTC)
            // Handle both DD-MM-YY and YYYY-MM-DD formats
            const dateParts = date.split('-');
            let startDateTime: Date;
            
            if (dateParts[0].length === 2) {
              // DD-MM-YY format (like 01-07-25)
              const day = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
              const year = 2000 + parseInt(dateParts[2]); // Assume 20XX
              startDateTime = new Date(Date.UTC(year, month, day));
            } else {
              // YYYY-MM-DD format
              const year = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
              const day = parseInt(dateParts[2]);
              startDateTime = new Date(Date.UTC(year, month, day));
            }
            
            if (isNaN(startDateTime.getTime()) || isNaN(Number(duration))) {
              continue; // Skip invalid rows
            }

            const session: Session = {
              id: `imported-${Date.now()}-${Math.random()}`,
              taskId: `task-${taskName.toLowerCase().replace(/\s+/g, '-')}`,
              taskName,
              duration: Number(duration),
              date: startDateTime.toDateString(),
              startTime: startDateTime.toISOString(),
              endTime: new Date(startDateTime.getTime() + Number(duration) * 1000).toISOString()
           };
           
           sessions.push(session);
           console.log('Parsed session:', session);
          } catch (error) {
            // Skip invalid rows
            continue;
          }
        }
        
        if (sessions.length === 0) {
          throw new Error('No valid session data found in file');
        }
        
        resolve(sessions);
      } catch (error) {
        reject(new Error(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

/**
 * Delete sessions by date range
 */
export const deleteSessionsByDateRange = (
  sessions: Session[], 
  dateRange: DateRange
): Session[] => {
  return sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate < dateRange.start || sessionDate > dateRange.end;
  });
};

/**
 * Delete all history
 */
export const deleteAllHistory = (): void => {
  if (window.confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
    localStorage.removeItem('flow-sessions');
    localStorage.removeItem('flow-task-history');
    window.location.reload();
  }
};

/**
 * Get preset date ranges
 */
export const getPresetDateRanges = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);
  
  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);

  return {
    today: { start: new Date(today.setHours(0, 0, 0, 0)), end: new Date(today.setHours(23, 59, 59, 999)) },
    yesterday: { start: new Date(yesterday.setHours(0, 0, 0, 0)), end: new Date(yesterday.setHours(23, 59, 59, 999)) },
    lastWeek: { start: weekAgo, end: today },
    lastMonth: { start: monthAgo, end: today },
    lastYear: { start: yearAgo, end: today },
    all: { start: new Date(2020, 0, 1), end: today }
  };
};