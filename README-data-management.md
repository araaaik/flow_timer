# FLOW Data Management Feature

## Overview
New data management functionality has been added to FLOW, providing comprehensive import, export, and deletion capabilities for session history.

## Features

### ✅ Export
- **CSV format** - Excel-compatible export with summary and detailed session data
- **Flexible date ranges** - Today, Yesterday, Last Week, Last Month, Last Year, All Time, or Custom period
- **Rich data structure** - Includes summary statistics and detailed session information

### ✅ Import  
- **CSV import** - Import previously exported CSV files
- **Complete replacement** - Replaces all existing data with imported data
- **Task creation** - Automatically creates new tasks from imported sessions
- **Safety warnings** - Multiple confirmation dialogs about data replacement

### ✅ Delete
- **Flexible periods** - Delete by day, week, month, custom period, or all time
- **Session counting** - Shows exact number of sessions to be deleted
- **Safety confirmations** - Multiple confirmation dialogs to prevent accidental deletion

## Access

### Quick Export
1. Open **Statistics & History** from the task manager
2. Click **"Quick Export"** button
3. Choose "All Time" or "Selected Day"

### Full Data Management
1. Open **Statistics & History** from the task manager
2. Click **"Data Management"** button
3. Choose Export, Import, or Delete tab

## File Formats

### CSV Export Structure
```
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
```

## Usage Examples

### Regular Backup
1. Select "All Time" period
2. Click "Export Data"
3. Save the CSV file as backup

### Data Migration
1. Export data from old installation
2. Import CSV file to new installation (replaces all data)
3. Verify imported sessions in history

### Cleanup Old Data
1. Select period for deletion (day, week, month, custom, or all time)
2. Use Delete tab to remove selected sessions
3. Confirm deletion with session count display

## Safety Features
- ⚠️ Data replacement warnings during import
- ⚠️ Import validation and error handling  
- ⚠️ Multiple confirmation dialogs for all destructive operations
- ⚠️ Session count display before deletion
- ⚠️ Backup recommendations before import/deletion

## Technical Implementation
- **Files**: `src/utils/dataManager.ts`, `src/components/DataManager.tsx`
- **Integration**: Seamlessly integrated into existing History modal
- **Storage**: Uses existing localStorage structure
- **Compatibility**: Works with current session and task data models