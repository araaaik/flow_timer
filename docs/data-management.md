# Data Management in FLOW

The new data management functionality allows you to import, export, and delete session history with flexible period settings.

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

### Supported Formats
- CSV files previously exported from FLOW

### Import Process
1. Click "Choose File to Replace All Data" button
2. Confirm the warning dialog about data replacement
3. Select CSV file
4. System validates data format and replaces all existing data
5. New tasks are automatically created from imported sessions

### Error Handling
- Invalid file format
- Corrupted data
- User cancellation of replacement warning

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

## Data Security

### Recommendations
1. **Regular Backups**: Export data in CSV format regularly
2. **Pre-import Backup**: Always export current data before importing
3. **Import Verification**: Verify imported data after loading

### Warnings
- ⚠️ Import completely replaces all existing data
- ⚠️ Always create backup before importing or deleting
- ⚠️ Data replacement and deletion are irreversible
- ⚠️ Deletion confirmations show exact session counts

## Technical Details

### CSV File Structure
```csv
FLOW Data Export,01/11/2025, 10:30:00 AM
Period,01/04/2025 - 01/11/2025

SUMMARY
Total Sessions,15
Total Time,2:00:00
Unique Tasks,3
Average Session Time,0:08:00
Longest Session,0:30:00

DETAILED DATA
Date,Start Time,End Time,Task,Duration (sec),Duration (time)
01/11/2025,09:00:00 AM,09:30:00 AM,"Development",1800,0:30:00
...
```

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