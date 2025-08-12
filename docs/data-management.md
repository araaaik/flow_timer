# Data Management in FLOW

The Flow app includes comprehensive data management features for backing up, restoring, and managing your work history with intelligent task filtering and historical data preservation.

## Accessing Functions

### Quick Export
Available directly in Statistics & History:
1. Open **Statistics & History** (button in TaskManager)
2. Click **"Quick Export"** button
3. Choose between:
   - **All Time** - export complete history
   - **Selected Day** - export only the currently selected day

### Full Data Management
For advanced operations:
1. Open **Statistics & History** (button in TaskManager)
2. Click the **"Data Management"** button
3. Access Export, Import, and Delete functions

## Data Export

### Export Formats

#### CSV (Excel-compatible)
- **Purpose**: For data analysis in Excel or Google Sheets
- **Content**: 
  - Summary information (total time, session count, average duration)
  - Detailed data for each session
- **File format**: `flow-export-YYYY-MM-DD-YYYY-MM-DD.csv`

### Export Options

#### Quick Export (from History view)
- **All Time** - Complete session history
- **Selected Day** - Only sessions from the currently selected day

#### Advanced Export (from Data Management)
Available export options:
- **All Time** - Complete session history
- **Custom Period** - Select specific date range

## Data Import

### ⚠️ Important Warning
**Import completely replaces all existing data!** Your current sessions and tasks will be permanently deleted and replaced with the imported data.

### Key Features
- **Smart Date Parsing**: Supports multiple date formats (DD-MM-YY, YYYY-MM-DD)
- **Historical Data Preservation**: Imported sessions maintain their original dates
- **Intelligent Task Creation**: Tasks created with correct timeSpent and historical creation dates
- **Task Visibility Logic**: Only tasks with today's activity or created today appear in task list

### Supported Formats
- CSV files previously exported from FLOW
- Supports both DD-MM-YY (01-07-25) and YYYY-MM-DD date formats

### Import Process
1. Click "Choose File to Replace All Data" button
2. Confirm the warning dialog about data replacement
3. Select CSV file
4. System validates data format and parses dates intelligently
5. Creates sessions with proper timestamps (startTime, endTime, date)
6. Generates tasks with correct timeSpent and historical creation dates
7. Shows import summary with task visibility information

### Task Visibility After Import
- **Visible in Task List**: Only tasks created today or with today's sessions
- **Hidden from Task List**: Historical tasks without today's activity
- **Always Accessible**: All tasks remain accessible in History view

### Error Handling
- Invalid file format detection
- Corrupted data validation
- Smart date parsing with fallback
- User cancellation of replacement warning
- Detailed error messages and import feedback

## Data Deletion

### Delete by Period
Available deletion periods:
- **Today** - current day sessions
- **Last Week** - sessions from last 7 days
- **Last Month** - sessions from last 30 days
- **All Time** - complete history deletion
- **Custom Period** - select specific date range

### Delete Process
1. Select deletion period from available options
2. System shows number of sessions to be deleted
3. Confirm deletion through security dialog
4. Sessions are permanently removed

### Additional Deletion Options
- Individual session deletion available in History view
- Complete data replacement via import functionality

## Key Improvements

### Smart Task Management
- **Clean Task List**: Historical tasks don't clutter today's task list
- **Dynamic Visibility**: Tasks automatically appear when they have today's activity
- **Accurate Time Tracking**: Proper time calculations across all imported sessions
- **Historical Access**: All tasks remain accessible in History view

### Robust Date Parsing
- **Multiple Formats**: Supports DD-MM-YY and YYYY-MM-DD formats
- **Intelligent Year Handling**: Two-digit years assumed as 20XX
- **Timezone Consistency**: Maintains UTC timestamps for accuracy

### Data Integrity
- **Proper Relationships**: Sessions maintain correct links with tasks
- **Accurate Calculations**: Time totals calculated from actual session data
- **Historical Preservation**: Original dates and times preserved
- **Complete Timestamps**: Both human-readable dates and ISO timestamps

## Data Security

### Recommendations
1. **Regular Backups**: Export data in CSV format regularly
2. **Pre-import Backup**: Always export current data before importing
3. **Import Verification**: Verify imported data after loading
4. **Test with Sample Data**: Use test files to understand import behavior

### Warnings
- ⚠️ Import completely replaces all existing data
- ⚠️ Always create backup before importing or deleting
- ⚠️ Data replacement and deletion are irreversible
- ⚠️ Deletion confirmations show exact session counts
- ⚠️ Historical tasks may not appear in today's task list (by design)

## Technical Details

### Session Interface
```typescript
interface Session {
  id: string;
  taskId: string;
  taskName: string;
  duration: number;
  date: string;              // Human-readable date key (Date.toDateString)
  startTime?: string;        // ISO timestamp when session started
  endTime?: string;          // ISO timestamp when session ended
}
```

### CSV File Structure
```csv
FLOW Data Export,2025-08-11T15:14:33.433123
Period,2025-07-01 - 2025-08-10

SUMMARY
Total Sessions,15
Total Time,2:00:00
Unique Tasks,3
Average Session Time,0:08:00
Longest Session,0:30:00

DETAILED DATA
Date,Task,Duration (sec),Duration (time)
01-07-25,Deploy Docker,2829,0:47:39
01-07-25,Tune PostgreSQL,5303,1:28:48
02-07-25,Refactor code,4380,1:13:48
...
```

### Import Implementation

#### Smart Date Parsing
```typescript
// Handles both DD-MM-YY and YYYY-MM-DD formats
if (dateParts[0].length === 2) {
  // DD-MM-YY format (01-07-25 → July 1, 2025)
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const year = 2000 + parseInt(dateParts[2]);
  startDateTime = new Date(Date.UTC(year, month, day));
}
```

#### Session Creation with Timestamps
```typescript
const session: Session = {
  id: `imported-${Date.now()}-${Math.random()}`,
  taskId: `task-${taskName.toLowerCase().replace(/\s+/g, '-')}`,
  taskName,
  duration: Number(duration),
  date: startDateTime.toDateString(),
  startTime: startDateTime.toISOString(),
  endTime: new Date(startDateTime.getTime() + Number(duration) * 1000).toISOString()
};
```

#### Intelligent Task Creation
```typescript
const newTasks = Array.from(taskNames).map(name => {
  const taskSessions = importedSessions.filter(s => s.taskName === name);
  const totalTimeSpent = taskSessions.reduce((sum, s) => sum + s.duration, 0);
  
  // Use earliest session date as creation date
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
```

### Task Visibility Logic
```typescript
tasks.filter((task) => {
  const todayStr = new Date().toDateString();
  const createdToday = new Date(task.createdAt).toDateString() === todayStr;
  const hasTodaySessions = Array.isArray(sessions) && 
    (sessions as Session[]).some(s => s.taskId === task.id && s.date === todayStr);
  
  return createdToday || hasTodaySessions;
})
```

This ensures:
- Tasks created today always appear
- Tasks with today's activity appear  
- Historical tasks without today's activity remain hidden from task list
- All tasks remain accessible in History view

## Usage Examples

### Importing Historical Data
When importing a CSV file with historical sessions (e.g., from July 2025):

1. **Before Import**: Current task list shows today's active tasks
2. **Import Process**: 
   ```
   Successfully imported 245 sessions and 15 tasks. 
   0 tasks will be visible in today's task list, others are in history only.
   ```
3. **After Import**: 
   - Task list remains clean (no historical tasks shown)
   - All historical data accessible in History view
   - Sessions properly distributed across historical dates

### Working with Imported Tasks
- **Today's Work**: Create new tasks or work on existing ones normally
- **Historical Analysis**: Use History view to explore imported data
- **Task Reactivation**: If you work on a historical task today, it will automatically appear in task list

### Data Migration Workflow
1. **Export from old system**: Generate CSV with historical data
2. **Backup current data**: Export current Flow data as backup
3. **Import historical data**: Replace all data with historical CSV
4. **Verify import**: Check History view for proper date distribution
5. **Resume normal work**: Create today's tasks as needed

## Excel Integration

### Opening CSV Files
1. Open Excel
2. Select "Data" → "From Text/CSV"
3. Choose the exported file
4. Ensure encoding is set to UTF-8
5. Delimiter - comma

### Data Analysis
- Use pivot tables to analyze time by tasks
- Create productivity charts by days
- Filter data by specific tasks or periods
- Analyze historical productivity patterns

## Limitations

- Import completely replaces existing data (no merge option)
- CSV format must match the expected structure
- Date parsing assumes 20XX for two-digit years
- Maximum file size limited by browser memory
- Tasks without today's activity are hidden from main task list (accessible in History)