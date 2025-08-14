# TaskManager and Suggestion System

## Overview

TaskManager is the core component for task management in the Flow Timer application. It handles task list display, new task creation, and provides intelligent suggestions based on task history.

## Architecture

### Core Components

1. **TaskManager.tsx** - main task management component
2. **App.tsx** - contains task history synchronization logic
3. **localStorage** - task and history data storage

### Data Structure

```typescript
interface Task {
  id: string;
  name: string;
  createdAt: string;
  estimatedTime?: number; // in seconds
}

// Task history for suggestions
taskHistory: string[] // array of task names
```

## Functionality

### 1. Task Display

TaskManager shows only relevant tasks:

```typescript
tasks.filter((task) => {
  const todayStr = new Date().toDateString();
  const createdToday = new Date(task.createdAt).toDateString() === todayStr;
  const hasTodaySessions = Array.isArray(sessions) && 
    sessions.some(s => s.taskId === task.id && s.date === todayStr);
  
  return createdToday || hasTodaySessions;
})
```

**Display Criteria:**
- Tasks created today
- Tasks worked on today (have sessions)

### 2. Task Creation

#### Interface
- **Empty state**: large "Add task" button with dashed border
- **With tasks**: small plus icon in corner

#### Add Form
- Task name input field
- Goal selection (30m, 1h, 1.5h, 2h, 3h, 4h, 5h, 6h)
- "Cancel" and "Add" buttons

### 3. Suggestion System

#### How It Works

Suggestions are based on the history of all previously created tasks:

```typescript
const filteredSuggestions = (taskHistory || [])
  .filter(task => {
    if (task === newTaskName) return false;
    
    const searchTerm = newTaskName.toLowerCase();
    const taskName = task.toLowerCase();
    
    // Search only at word beginnings
    const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    
    return regex.test(taskName);
  })
  .slice(0, 5);
```

#### Suggestion Display Rules

1. **Minimum characters**: suggestions appear only after typing 2+ characters
2. **Word-beginning search**: "in" will match "integrate site" but not "maintain site"
3. **Maximum suggestions**: shows up to 5 suggestions
4. **Duplicate exclusion**: current input is not shown in suggestions

#### Working Examples

| Input | Will Match | Won't Match |
|-------|------------|-------------|
| "in" | "**in**tegrate site", "site **in**tegrate" | "manta**in** site" |
| "si" | "**si**te integrate", "integrate **si**te" | "deci**si**on making" |
| "te" | "**te**st task", "integra**te** site" | "main**te**nance" |

### 4. History Synchronization

#### Problem
When importing data, tasks are added to localStorage, but suggestion history (`flow-task-history`) is not updated.

#### Solution
Automatic synchronization in App.tsx:

```typescript
useEffect(() => {
  const syncTaskHistory = () => {
    const existingTaskNames = tasks.map(task => task.name);
    const currentHistory = taskHistory || [];
    
    // Find tasks missing from history
    const missingFromHistory = existingTaskNames.filter(name => !currentHistory.includes(name));
    
    if (missingFromHistory.length > 0) {
      setTaskHistory(prev => [...(prev || []), ...missingFromHistory]);
    }
  };

  if (tasks.length > 0) {
    syncTaskHistory();
  }
}, [tasks, taskHistory, setTaskHistory]);
```

## Data Storage

### localStorage Keys

- `flow-tasks` - array of all tasks
- `flow-task-history` - array of task names for suggestions
- `flow-active-task` - current active task
- `flow-sessions` - work session history

### Data Lifecycle

1. **Task creation** → added to `flow-tasks` and `flow-task-history`
2. **Daily reset** → clears `flow-tasks`, `flow-active-task`, `flow-timer-state`
3. **History preserved** → `flow-task-history` and `flow-sessions` are not reset

## Styling

### Responsiveness
- **Full mode**: all elements in one row on wide screens
- **Compact mode**: two-row form on narrow screens

### Themes
- Light and dark theme support
- Dynamic accent colors
- Smooth transition animations

### CSS Variables
```css
.task-accent-ring {
  box-shadow: 0 0 0 2px var(--accent-color);
}

.task-accent-bg {
  background-color: var(--accent-color) !important;
  color: white !important;
}
```

## User Interaction

### Keyboard Shortcuts
- **Enter** - add task
- **Escape** - cancel addition
- **Click suggestion** - select suggested name

### Interface States
- **Empty state** - large add button
- **Task list** - compact plus button
- **Form expanded** - input fields and suggestions
- **Suggestions active** - suggestion list below form

## Performance

### Optimizations
- Suggestion limit of 5 items
- No debouncing used (instant response)
- No React.memo memoization (lightweight component)

### Regular Expressions
Safe escaping used to prevent injections:
```typescript
searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
```

## Possible Improvements

1. **Debouncing** - 200-300ms delay for suggestion search
2. **Caching** - save filtering results
3. **Fuzzy search** - approximate matching for typos
4. **Categories** - group suggestions by task types
5. **Usage frequency** - sort by task popularity