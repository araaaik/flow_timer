# Timer and Tasks Documentation

## Overview

FLOW is a productivity timer application that implements the **Flowmodoro technique** with flexible task management. Unlike traditional Pomodoro with fixed 25-minute intervals, Flowmodoro allows you to work for as long as you're in flow state, then automatically calculates break time as 1/5 of your work time. The app features a drift-free timer, automatic break calculation, and comprehensive session tracking.

## Core Components

### Timer System

The timer is the heart of FLOW, implementing the Flowmodoro technique with accurate time tracking and automatic break calculation based on work duration.

#### Timer Features

- **Drift-free timing**: Uses `Date.now()` and `requestAnimationFrame` for precise timing that survives browser tab switching
- **Persistent state**: Timer state is saved to localStorage and resumes correctly after page reloads
- **Flowmodoro breaks**: Break time is automatically calculated as `floor(workedSeconds / 5)` (20% of work time)
- **Flexible work sessions**: No fixed time limits - work as long as you're in flow state
- **Visual feedback**: Large time display with status indicators (FOCUS/Task Name/RELAX)
- **Estimated break preview**: Shows calculated break time while working (after 60+ seconds)
- **Audio notifications**: Customizable sound alerts when breaks end
- **Visual notifications**: Browser notifications when breaks complete

#### Timer States

1. **Idle**: Timer is stopped, showing 00:00
2. **Running (Work)**: Counting up elapsed work time
3. **Running (Break)**: Counting down remaining break time
4. **Paused**: Work session paused (can be resumed)

#### Timer Controls

- **Start/Stop Button**: Primary control for starting work sessions and stopping to begin breaks
- **Reset Button**: Appears when timer is running or has time > 0, requires confirmation
- **Estimated Break Display**: Shows calculated break time after 60+ seconds of work

### Task Management

Tasks provide structure and tracking for work sessions, with flexible configuration options.

#### Task Features

- **Task Creation**: Add tasks with optional time estimates
- **Task Selection**: Choose active task before starting timer
- **Time Tracking**: Automatic accumulation of time spent per task
- **Progress Visualization**: Progress bars showing daily progress toward estimated time
- **Task History**: Autocomplete suggestions from previously used task names
- **Session Tracking**: All work sessions are recorded with task association

#### Task Properties

```typescript
interface Task {
  id: string;              // Unique identifier (timestamp)
  name: string;            // Display name (≤15 characters)
  timeSpent: number;       // Total accumulated seconds
  estimatedTime?: number;  // Optional daily goal in seconds
  createdAt: string;       // ISO creation timestamp
}
```

#### Task States

- **Active**: Currently selected task (highlighted in blue/accent color)
- **Inactive**: Available for selection
- **In Progress**: Task is selected and timer is running

## Settings and Configuration

### Task Settings

#### Show Tasks (`showTasks`)
- **Default**: `true`
- **Description**: Controls visibility of the task management panel
- **When disabled**: 
  - Task panel is hidden
  - Timer works in "Focus" mode only
  - Sessions are created with auto-generated names ("Focus #1", "Focus #2", etc.)

#### Require Task Selection (`requireTaskSelection`)
- **Default**: `true`
- **Description**: Controls whether a task must be selected before starting the timer
- **When disabled**:
  - Timer can start without selecting a task
  - Sessions are created as "Focus" sessions
  - Task panel remains visible (if `showTasks` is true)

### Timer Behavior Matrix

| showTasks | requireTaskSelection | Behavior |
|-----------|---------------------|----------|
| `true` | `true` | Full task mode - must select task to start |
| `true` | `false` | Optional task mode - can start with or without task |
| `false` | `true` | Focus-only mode - no tasks shown |
| `false` | `false` | Focus-only mode - no tasks shown |

### Other Settings

#### Visual Settings
- **Theme**: Light/Dark mode toggle
- **Accent Color**: 16 color options for UI elements
- **Flat Mode**: Removes card shadows for minimal design
- **Color Timer**: Timer surface adopts accent color background
- **Layout**: Compact (side-by-side) or Full (stacked) layout
- **Widget Mode**: Widget-style minimal interface

#### Background Options
- **Light Theme**: 8 background options (gray-50 to neutral-100)
- **Dark Theme**: 8 background options (gray-700 to neutral-950)

#### Notifications
- **Audio Notifications**: Sound alerts when breaks end
- **Visual Notifications**: Browser notifications (requires permission)

## Session Management

### Session Creation

Sessions are automatically created when stopping the timer:

```typescript
interface Session {
  id: string;           // Unique identifier
  taskId: string;       // Associated task ID or generated ID
  taskName: string;     // Task name or "Focus #N"
  startTime: string;    // ISO start timestamp
  endTime: string;      // ISO end timestamp
  duration: number;     // Duration in seconds
  date: string;         // Human-readable date for grouping
}
```

### Session Types

1. **Task Sessions**: Created when a task is selected
   - `taskId`: Actual task ID
   - `taskName`: Task name
   - Updates task's `timeSpent`

2. **Focus Sessions**: Created when no task is selected
   - `taskId`: Generated ID (`focus-${timestamp}`)
   - `taskName`: Auto-generated ("Focus #1", "Focus #2", etc.)
   - No task time update

### Daily Reset

The app performs a daily reset at midnight:
- Clears task list (but preserves history)
- Resets active task selection
- Clears timer state
- Preserves session history and settings

## Layout Modes

### Full Mode (Default)
- Complete interface with all features
- Header with status dot, title, and controls
- Timer and task panels
- Settings and history access

### Widget Mode
- Minimal interface for focused work
- Small header with essential controls
- Timer-only display
- Reduced visual elements

### Layout Options

#### Compact Layout (formerly Horizontal)
- Timer and tasks side-by-side (desktop)
- Music player below timer
- Optimal for wide screens

#### Full Layout (formerly Vertical)
- Stacked components
- Timer above tasks
- Better for narrow screens

## Data Persistence

### localStorage Keys

- `flow-settings`: User preferences and configuration
- `flow-tasks`: Current day's task list
- `flow-active-task`: Currently selected task ID
- `flow-sessions`: Historical session data
- `flow-task-history`: Autocomplete suggestions
- `flow-timer-state`: Current timer state
- `flow-layout`: Layout preference
- `flow-last-reset`: Last daily reset date

### Data Lifecycle

1. **Session Start**: Timer state saved continuously
2. **Session End**: Session created, task time updated
3. **Daily Reset**: Tasks and timer state cleared, history preserved
4. **Settings Changes**: Immediately persisted to localStorage

## Integration Features

### Music Player
- YouTube-based background music
- Persistent playback across page reloads
- Widget mode controls
- Optional display panel

### History and Analytics
- Session history with filtering
- Daily/weekly time summaries
- Task performance tracking
- Export capabilities

### Notifications
- Browser notification API integration
- Custom audio generation
- Configurable notification preferences

## Technical Implementation

### Timer Accuracy
- Uses `requestAnimationFrame` for smooth updates
- Wall-clock time calculation prevents drift
- Handles browser tab switching and page reloads
- Microsecond precision with second-level display

### State Management
- React hooks for component state
- Custom hooks for complex logic (`useTimer`, `useTasks`)
- localStorage for persistence
- Automatic state reconciliation on mount

### Performance Optimizations
- Minimal re-renders through careful state design
- Efficient localStorage usage
- Lazy loading of non-critical features
- Optimized animation and transitions

## Usage Patterns

### Basic Flowmodoro
1. Select or create a task
2. Start timer
3. Work for as long as you're in flow state (no fixed time limit)
4. Stop timer when you naturally feel ready for a break
5. Automatic break starts (duration = work_time ÷ 5)
6. Take break until notification
7. Repeat

**Example**: Work for 50 minutes → Get 10-minute break

### Focus Sessions
1. Disable "Require task selection" in settings
2. Start timer without selecting task
3. Work in "Focus" mode
4. Sessions automatically named "Focus #1", etc.

### Task-Only Mode
1. Enable tasks but disable task requirement
2. Optionally select tasks for tracking
3. Can start timer with or without task selection
4. Flexible workflow adaptation

### Widget Mode
1. Enable widget mode
2. Minimal interface for distraction-free work
3. Essential controls only
4. Perfect for secondary monitors or small screens

## Flowmodoro vs Traditional Pomodoro

| Aspect | Traditional Pomodoro | Flowmodoro (FLOW) |
|--------|---------------------|-------------------|
| **Work Duration** | Fixed 25 minutes | Flexible - work until natural break point |
| **Break Calculation** | Fixed 5 minutes | Dynamic - 20% of work time (work_time ÷ 5) |
| **Flow State** | May interrupt flow | Respects natural flow state |
| **Flexibility** | Rigid schedule | Adaptive to your rhythm |
| **Break Examples** | Always 5 min | 10 min work → 2 min break<br>60 min work → 12 min break |

### Benefits of Flowmodoro
- **Preserves flow state**: No artificial interruptions when you're productive
- **Natural breaks**: Break duration matches your effort level
- **Flexible scheduling**: Adapts to different types of work
- **Reduced context switching**: Fewer forced interruptions
- **Sustainable productivity**: Breaks scale with work intensity