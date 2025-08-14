# Public API Reference

This reference documents components, hooks, types, props, and storage keys so that changes can be made without searching the codebase. Each item links to its source file.

- App composition: [`src.App.tsx`](src/App.tsx)
- Hooks:
  - [`src.hooks.useLocalStorage()`](src/hooks/useLocalStorage.ts)
  - [`src.hooks.useTasks()`](src/hooks/useTasks.ts)
  - [`src.hooks.useTimer()`](src/hooks/useTimer.ts)
  - [`src.hooks.useTheme()`](src/hooks/useTheme.ts)
- Components:
  - [`src.components.Timer.tsx`](src/components/Timer.tsx)
  - [`src.components.TaskManager.tsx`](src/components/TaskManager.tsx)
  - [`src.components.History.tsx`](src/components/History.tsx)
  - [`src.components.SettingsPanel.tsx`](src/components/SettingsPanel.tsx)
  - [`src.components.MusicPlayer.tsx`](src/components/MusicPlayer.tsx)
  - [`src.components.ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx)

## Types

Declared centrally in [`src.App.tsx`](src/App.tsx).

- Task
  - id: string
  - name: string
  - timeSpent: number
  - estimatedTime?: number
  - createdAt: string
- Session
  - id: string
  - taskId: string
  - taskName: string
  - startTime: string
  - endTime: string
  - duration: number
  - date: string
- Settings
  - visualNotifications: boolean
  - audioNotifications: boolean
  - theme: 'light' | 'dark'
  - accentColor: string
  - flatMode?: boolean
  - colorTimer?: boolean
  - lightBg?: one of: gray-50 | gray-100 | gray-200 | gray-300 | gray-400 | gray-500 | slate-100 | neutral-100
  - darkBg?: one of: gray-700 | gray-800 | gray-900 | gray-950 | slate-900 | neutral-900 | black | neutral-950
  - flowBreakSkipEnabled?: boolean
## Storage Keys

- flow-settings: Settings JSON
- flow-layout: 'compact' | 'full' (legacy values 'horizontal'/'vertical' are migrated at runtime)
- flow-tasks: Task[] JSON
- flow-active-task: Task | null
- flow-sessions: Session[] JSON
- flow-timer-state: TimerState JSON (internal to useTimer)
- flow-task-history: string[] (names)

## Hooks

### useLocalStorage(key, initialValue) -> [value, setValue]
Source: [`src.hooks.useLocalStorage()`](src/hooks/useLocalStorage.ts)

- Purpose: React state persisted to localStorage under key.
- setValue: accepts value or updater function.
- Errors are caught and logged to console.

### useTasks() -> { tasks, activeTask, addTask, deleteTask, setActiveTask }
Source: [`src.hooks.useTasks()`](src/hooks/useTasks.ts)

- Storage:
  - flow-tasks, flow-active-task
- addTask(name, estimatedTime?)
  - estimatedTime is in seconds.
  - Creates Task with id=Date.now().toString()
- deleteTask(id)
  - Removes task, clears activeTask if matching
  - Prunes task name from flow-task-history
- setActiveTask(task)
  - Persists selected task
- Keeps activeTask object fresh when tasks array mutates.

### useTimer(activeTask, tasks, sessions, setSessions, settings)
Source: [`src.hooks.useTimer()`](src/hooks/useTimer.ts)

- State (persisted in flow-timer-state):
  - time: seconds (work elapsed or break remaining)
  - isRunning: boolean
  - isBreak: boolean
  - startTime: number (ms)
  - sessionId: string
  - targetTime?: number (ms, when break ends)
- Behavior:
  - Drift-free rAF ticker using wall clock.
  - On start: requires activeTask, sets sessionId/startTime.
  - On stop: appends Session, updates Task.timeSpent, computes breakSeconds = floor(workedSeconds/5), and enters break mode if > 0.
  - Break end: plays sound and optional Notification when time hits 0.
  - estimatedBreakTime: live hint during work = floor(elapsed/5).
- Returns:
  - time, isRunning, isBreak, startTimer(), stopTimer(), resetTimer(), estimatedBreakTime

### useTheme(theme, accentColor) -> { theme, accentColor, toggleTheme }
Source: [`src.hooks.useTheme()`](src/hooks/useTheme.ts)

- Applies data-theme attribute and toggles html.dark class.
- toggleTheme:
  - Persists new theme in flow-settings
  - Applies immediately to DOM
  - Dispatches 'flow-theme-changed' CustomEvent; App listens and updates state
- Requests Notification permission on mount when available.

## Components

### <Timer />
Source: [`src.components.Timer.tsx`](src/components/Timer.tsx)

Props:
- time: number — seconds to display
- isRunning: boolean
- isBreak: boolean
- onStart(): void — start work session
- onStop(): void — stop work session (records Session, starts break)
- onReset(): void — reset timer state (confirmation inside component)
- activeTask: Task | null — controls READY vs task name
- estimatedBreakTime: number — seconds; only shown during work
- theme: 'light' | 'dark'
- accentColor: string
- isWidget: boolean

Notes:
- Reads settings.colorTimer via localStorage to adjust visuals without prop drilling.
- Start/Stop single primary button; Reset appears when running or time > 0.

### <TaskManager />
Source: [`src.components.TaskManager.tsx`](src/components/TaskManager.tsx)

Props:
- tasks: Task[]
- activeTask: Task | null
- onAddTask(name: string, estimatedTime?: number)
- onDeleteTask(id: string)
- onSelectTask(task: Task) — disabled while work is running via static gate
- taskHistory: string[]
- theme: 'light' | 'dark'
- accentColor: string
- sessions?: Session[] — used to compute today's totals

Behavior:
- Quick add with optional goal (minutes).
- Goals are displayed as progress bars; today’s progress includes live seconds for the active running task using flow-timer-state.startTime.
- Maintains showSuggestions and showTimeInput UI states.

### <History />
Source: [`src.components.History.tsx`](src/components/History.tsx)

Props:
- sessions: Session[]
- tasks: Task[]
- onClose(): void
- onDeleteSession(sessionId: string): void
- onDeleteDay(date: string): void
- theme: 'light' | 'dark'
- accentColor: string

Behavior:
- Day view: shows total time, sessions count, average, longest; list of sessions with delete actions.
- Week view: Sun..Sat grid; clicking a day focuses Day view.
- Export selected day as JSON; filename includes date.

### <SettingsPanel />
Source: [`src.components.SettingsPanel.tsx`](src/components/SettingsPanel.tsx)

Props:
- settings: Settings
- onUpdateSettings(partial: Partial<Settings>)
- theme: 'light' | 'dark'

Controls:
- Shadows toggle (flatMode)
- Color Timer toggle (colorTimer)
- Allow skip breaks toggle (flowBreakSkipEnabled)
- Light/Dark background presets
- Accent color picker
- Visual and Audio notification toggles

### <MusicPlayer />
Source: [`src.components.MusicPlayer.tsx`](src/components/MusicPlayer.tsx)

Props:
- theme: 'light' | 'dark'
- layout?: 'compact' | 'full' (default 'full')

Notes:
- UI for choosing a YouTube stream and pseudo volume; reads accentColor from flow-settings.
- The iframe autoplay/mute logic is simplified; not a full-featured audio integration.

### <ErrorBoundary />
Source: [`src.components.ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx)

Props:
- children: React.ReactNode

Behavior:
- Catches runtime errors and renders a readable screen with message. Logs the full error to console.

## App Wiring

Source: [`src.App.tsx`](src/App.tsx)

- useLocalStorage for:
  - settings (flow-settings)
  - layout (flow-layout)
  - sessions (flow-sessions)
  - taskHistory (flow-task-history)
- useTasks for tasks and activeTask
- useTimer for timing and break logic
- useTheme for theme toggling and accent token
- Renders:
  - Timer with time/isRunning/isBreak/handlers/activeTask/estimatedBreakTime/theme/accentColor/isWidget
  - TaskManager with tasks/activeTask/handlers/taskHistory/theme/accentColor/sessions
  - History modal with sessions/tasks/delete handlers/theme/accentColor
  - SettingsPanel with settings and updater
  - MusicPlayer placement depends on layout and compact mode

## UI State Conventions

- Layout:
  - isWidget: single dense column when true
  - layout: 'compact' places Timer and TaskManager side-by-side on >= sm; 'full' stacks them
- Card shadow policy:
  - settings.flatMode true => shadows disabled globally; components compute cardShadow accordingly
- Accent:
  - Class maps provide tailwind-safe colors; 'green' also uses inline hex (#0f766e) in specific places

## Change Log Pointers

- Add props or new storage keys:
  - Update interfaces in [`src.App.tsx`](src/App.tsx)
  - Extend relevant hooks/components and class maps
- Modify timer/break mechanics:
  - Update logic and documentation in [`src.hooks.useTimer()`](src/hooks/useTimer.ts)
  - Adjust Timer UI copy if needed in [`src.components.Timer.tsx`](src/components/Timer.tsx)
- Extend statistics:
  - Aggregation functions live in [`src.components.History.tsx`](src/components/History.tsx)
  - Consider normalizing dates and timezones as needed

## Utilities

### formatTime(seconds: number): string
Source: [`src/utils/dataManager.ts`](src/utils/dataManager.ts)

Converts seconds to unified H:MM display format used throughout the application.

**Parameters:**
- `seconds: number` - Duration in seconds

**Returns:**
- `string` - Formatted time string in H:MM format

**Examples:**
```typescript
formatTime(900)   // "0:15" (15 minutes)
formatTime(1800)  // "0:30" (30 minutes) 
formatTime(3600)  // "1:00" (1 hour)
formatTime(5400)  // "1:30" (1 hour 30 minutes)
formatTime(18000) // "5:00" (5 hours)
formatTime(20700) // "5:45" (5 hours 45 minutes)
```

**Usage:**
- **Statistics & History**: All time displays in day/week/month views
- **Task Manager**: Time spent on tasks
- **Export Data**: CSV files use this format in "Duration (time)" column
- **Main Interface**: Today's total time display

**Format Rules:**
- Always shows hours and minutes in H:MM format
- Minutes under 60 show as "0:MM"
- Hours 1+ show as "H:MM" with zero-padded minutes
- Seconds are truncated (not rounded)

**Note:** The active timer uses a different format (`MM:SS` or `H:MM:SS`) for precision during work sessions, but completed sessions always display in H:MM format.

## Time Format Standards

### Display Format
FLOW uses a unified **H:MM** time format throughout the application:

| Context | Format | Example | Description |
|---------|--------|---------|-------------|
| History Views | H:MM | `1:30` | Completed sessions |
| Task Manager | H:MM | `0:45` | Time spent on tasks |
| Statistics | H:MM | `5:15` | Aggregated time data |
| Export Data | H:MM | `2:30` | CSV duration column |
| Active Timer | MM:SS or H:MM:SS | `25:30` | Live timer display |

### Data Storage
- **Internal**: Time stored as seconds (number) for accuracy
- **Display**: Converted to H:MM format using `formatTime()` utility
- **Export**: Both seconds and H:MM format included in CSV files

### Consistency Benefits
- **Unified Experience**: Same format across all views and exports
- **Easy Scanning**: Quick comparison of time values
- **Professional Output**: Clean appearance for reports and analysis
- **Locale Independent**: Works across different regions and languages