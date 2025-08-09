# Timer and Tasks Documentation

## Overview

FLOW is a productivity timer application that supports both **Flow mode** and **Pomodoro mode** with flexible task management. Flow mode allows you to work for as long as you're in flow state with configurable break options, while Pomodoro mode provides structured work/break cycles. The app features a drift-free timer, flexible break calculation, session counting, and comprehensive session tracking.

## Core Components

### Timer System

The timer is the heart of FLOW, supporting both Flow and Pomodoro modes with accurate time tracking and flexible break management.

#### Timer Features

- **Dual modes**: Flow mode (flexible timing) and Pomodoro mode (structured cycles)
- **Drift-free timing**: Uses `Date.now()` and `requestAnimationFrame` for precise timing that survives browser tab switching
- **Persistent state**: Timer state is saved to localStorage and resumes correctly after page reloads
- **Configurable breaks**: Multiple break calculation options (percentage, fixed, or disabled)
- **Break skipping**: Skip any break with the SKIP button when in flow state
- **Session management**: Automatic session counting in Pomodoro mode
- **Visual feedback**: Large time display with status indicators and session counters
- **Break preview**: Shows upcoming break duration while working
- **Audio notifications**: Customizable sound alerts when breaks end
- **Visual notifications**: Browser notifications when breaks complete

#### Timer States

1. **Idle**: Timer is stopped, showing 00:00
2. **Running (Work)**: 
   - Flow mode: Counting up elapsed work time
   - Pomodoro mode: Counting down from work duration
3. **Running (Break)**: Counting down remaining break time (both modes)
4. **Paused**: Work session paused (Flow mode only, can be resumed)

#### Timer Controls

- **Start/Stop/Skip Button**: 
  - Start: Begin work session (Play icon)
  - Stop: End work session and start break (Pause icon)
  - Skip: Skip current break (SKIP text)
- **Reset Button**: Appears when timer is running or has time > 0 (hidden during breaks)
- **Break Preview Display**: Shows upcoming break duration while working

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

### Timer Mode Settings

#### Timer Mode (`timerMode`)
- **Default**: `'flow'`
- **Options**: `'flow'` | `'pomodoro'`
- **Description**: Selects between Flow mode (flexible timing) and Pomodoro mode (structured cycles)

#### Flow Mode Settings

##### Enable Breaks (`flowBreakEnabled`)
- **Default**: `true`
- **Description**: Controls whether breaks are taken after work sessions in Flow mode
- **When disabled**: Timer resets to 00:00 immediately after stopping

##### Break Calculation Type (`flowBreakType`)
- **Default**: `'percentage'`
- **Options**: `'percentage'` | `'fixed'`
- **Description**: How break duration is calculated

##### Break Percentage (`flowBreakPercentage`)
- **Default**: `20`
- **Options**: `10` | `15` | `20` | `25`
- **Description**: Percentage of work time used for break (when using percentage calculation)

##### Fixed Break Duration (`flowBreakFixed`)
- **Default**: `10`
- **Options**: `5` | `10` | `20` | `30`
- **Description**: Fixed break duration in minutes (when using fixed calculation)

#### Pomodoro Mode Settings

##### Work Duration (`pomodoroWorkDuration`)
- **Default**: `25`
- **Range**: `1-60` minutes
- **Description**: Duration of each work session

##### Break Duration (`pomodoroBreakDuration`)
- **Default**: `5`
- **Range**: `1-30` minutes
- **Description**: Duration of breaks between work sessions

##### Number of Sessions (`pomodoroSessions`)
- **Default**: `4`
- **Range**: `1-8` sessions
- **Description**: Total number of work sessions in a Pomodoro cycle

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

| timerMode | showTasks | requireTaskSelection | Behavior |
|-----------|-----------|---------------------|----------|
| `flow` | `true` | `true` | Flow mode with full task integration |
| `flow` | `true` | `false` | Flow mode with optional task selection |
| `flow` | `false` | any | Flow mode, focus-only sessions |
| `pomodoro` | `true` | `true` | Pomodoro mode with full task integration |
| `pomodoro` | `true` | `false` | Pomodoro mode with optional task selection |
| `pomodoro` | `false` | any | Pomodoro mode, focus-only sessions |

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

### Flow Mode Usage

#### Basic Flow with Percentage Breaks
1. Select or create a task
2. Start timer
3. Work for as long as you're in flow state (no fixed time limit)
4. Stop timer when you naturally feel ready for a break
5. Automatic break starts (duration = work_time × percentage)
6. Take break until notification or skip if still in flow
7. Repeat

**Example**: Work for 50 minutes → Get 10-minute break (20% setting)

#### Flow with No Breaks
1. Disable breaks in timer settings
2. Start timer and work naturally
3. Stop timer when ready - immediately resets to 00:00
4. Take breaks manually when needed
5. Good for deep work sessions

#### Flow with Fixed Breaks
1. Set break type to "fixed" with desired duration
2. Work for any duration
3. Always get consistent break time
4. Predictable recovery periods

### Pomodoro Mode Usage

#### Classic Pomodoro
1. Set 25-minute work, 5-minute breaks, 4 sessions
2. Start timer - countdown begins
3. Work until timer reaches 00:00
4. Automatic break starts
5. Repeat for all sessions
6. Complete notification after final session

**Example**: 25min work → 5min break → 25min work → 5min break → repeat

#### Custom Pomodoro Cycles
1. Configure work/break durations and session count
2. Start structured work cycle
3. Follow automatic transitions
4. Skip breaks when in flow state
5. Complete full cycle

### Focus Sessions (Both Modes)
1. Disable "Require task selection" in settings
2. Start timer without selecting task
3. Work in "Focus" mode
4. Sessions automatically named "Focus #1", etc.

### Task Integration (Both Modes)
1. Enable tasks and require task selection
2. Create and select tasks for tracking
3. Timer updates task time spent
4. View progress and history

### Widget Mode (Both Modes)
1. Enable widget mode
2. Minimal interface for distraction-free work
3. Essential controls only
4. Perfect for secondary monitors or small screens

## Flow Mode vs Pomodoro Mode Comparison

| Aspect | Flow Mode | Pomodoro Mode |
|--------|-----------|---------------|
| **Work Duration** | Flexible - work until natural break point | Fixed duration (configurable 1-60 min) |
| **Break Calculation** | Configurable (percentage/fixed/disabled) | Fixed duration (configurable 1-30 min) |
| **Flow State** | Respects natural flow state | May interrupt flow at fixed intervals |
| **Structure** | Self-directed, flexible | Time-boxed, structured |
| **Session Management** | Individual sessions | Planned cycles with counting |
| **Break Control** | Optional, always skippable | Automatic, skippable |
| **Time Display** | Count up (00:00 → 25:30) | Count down (25:00 → 00:00) |

### Benefits of Flow Mode
- **Preserves flow state**: No artificial interruptions when you're productive
- **Flexible breaks**: Choose percentage, fixed, or no breaks
- **Natural rhythm**: Work duration adapts to task complexity
- **Break skipping**: Skip breaks when still in flow
- **Sustainable productivity**: Breaks scale with work intensity (percentage mode)

### Benefits of Pomodoro Mode
- **Time structure**: Fixed work periods create urgency and focus
- **Predictable breaks**: Regular recovery periods prevent fatigue
- **Session tracking**: Clear progress through planned cycles
- **Habit formation**: Consistent timing builds work rhythms
- **External accountability**: Timer creates commitment to work periods
- **Break skipping**: Skip breaks when in flow while maintaining structure