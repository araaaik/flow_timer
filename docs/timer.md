# FLOW Timer Documentation

## Overview

The FLOW timer is a versatile productivity tool designed to help you manage your time effectively. It supports three distinct modes: Flow Mode, Pomodoro Mode, and Timer Mode, each catering to different work styles and preferences.

## Timer Modes

### Flow Mode

Flow Mode is a flexible approach that adapts to your natural workflow. It allows you to work for as long as you're in a state of flow, with optional breaks that can be calculated proportionally or set to fixed durations.

#### How It Works

1.  **Start the timer** when you begin working.
2.  **Work freely** for as long as you're in a flow state (no time limits).
3.  **Stop the timer** when you naturally feel ready for a break.
4.  **Optional break** starts based on your settings:
    *   **Percentage-based**: Break duration = work\_time × percentage (10%, 15%, 20%, or 25%)
    *   **Fixed duration**: Break duration = fixed time (5, 10, 20, or 30 minutes)
    *   **Disabled**: No break - timer resets to 00:00 immediately
5.  **Take a break** until the notification sounds (if breaks are enabled).
6.  **Skip the break** anytime by clicking the SKIP button.
7.  **Repeat** the cycle.

#### Examples

**Percentage-based breaks (20% default):**

*   Work 20 minutes → Get a 4-minute break
*   Work 45 minutes → Get a 9-minute break
*   Work 75 minutes → Get a 15-minute break

**Fixed breaks (10 minutes):**

*   Work 20 minutes → Get a 10-minute break
*   Work 60 minutes → Get a 10-minute break

**No breaks:**

*   Work any duration → Timer resets immediately

### Pomodoro Mode

Pomodoro Mode is a classic time management technique that uses fixed work/break cycles to enhance focus and productivity.

#### How It Works

1.  **Configure** the work duration (default 25 min), break duration (default 5 min), and number of sessions (1-8).
2.  **Start the timer** - the countdown begins from the work duration.
3.  **Work session** counts down to zero (no pause - only stop, which resets).
4.  **Automatic break** starts when the work session completes.
5.  **Break countdown** runs for the configured break duration.
6.  **Next session** starts automatically after the break.
7.  **Skip the break** anytime by clicking the skip button.
8.  **Stop during work** resets the entire cycle (classic Pomodoro behavior).
9.  **Complete the cycle** when all sessions are finished.

#### Examples

**Default settings (25min work, 5min break, 4 sessions):**

*   Session 1: 25min work → 5min break
*   Session 2: 25min work → 5min break
*   Session 3: 25min work → 5min break
*   Session 4: 25min work → Complete!

**Custom settings (45min work, 10min break, 2 sessions):**

*   Session 1: 45min work → 10min break
*   Session 2: 45min work → Complete!

### Timer Mode

Timer Mode is a straightforward start-stop timer without any break functionality, ideal for basic time tracking or when you prefer to manage breaks manually.

#### How It Works

1.  **Start the timer** when you begin working.
2.  **Work freely** for as long as needed (the timer counts up).
3.  **Stop the timer** when you're done - no breaks are triggered.
4.  **Reset the timer** to start fresh.
5.  **Repeat** as needed.

#### Examples

**Basic time tracking:**

*   Start timer → Work 30 minutes → Stop timer → Session saved
*   Start timer → Work 2 hours → Stop timer → Session saved
*   No breaks, no interruptions, just pure time tracking

#### When to Use Timer Mode

*   **Simple time tracking**: When you just need to log work time.
*   **Manual break management**: When you prefer to take breaks on your own schedule.
*   **Flexible workflows**: When you don't want any automated break suggestions.
*   **Meeting time tracking**: For tracking time spent in meetings or calls.
*   **Billing/invoicing**: When you need precise time logs for client work.

## Timer Features

### Core Functionality

*   **Drift-free timing**: Uses `Date.now()` and `requestAnimationFrame` for precise timing.
*   **Persistent state**: The timer survives page reloads and browser tab switching.
*   **Configurable breaks**: Multiple break calculation options in Flow mode.
*   **Break skipping**: Skip any break with the SKIP button.
*   **Real-time preview**: Shows estimated/next break time while working.

### Visual Interface

*   **Large time display**: Clear mm:ss or h:mm:ss format.
*   **Status indicators**: Shows FOCUS/Task Name/RELAX.
*   **Session counter**: Shows current/total sessions in Pomodoro mode.
*   **Progress feedback**: Animated status dot with accent color.
*   **Break preview chip**: Live preview of upcoming break duration.
*   **Mode-aware display**: Count-up (Flow and Timer) or countdown (Pomodoro).

### Controls

*   **Start/Stop/Skip Button**:
    *   Shows Play icon when stopped.
    *   Shows Pause icon when running (work session).
    *   Shows "SKIP" text when in break mode.
*   **Reset Button**: Appears when the timer is running or has time > 0 (not during breaks).
*   **Smart behavior**: Button function adapts to the current timer state.

## Timer States

### 1. Idle State

*   **Display**: `00:00`
*   **Status**: No active session
*   **Controls**: Start button enabled
*   **Behavior**: Ready to begin a new work session

### 2. Running (Work) State

*   **Flow Mode**:
    *   Display: Elapsed time counting up (00:00 → 25:30 → ...)
    *   Status: Shows the task name or "FOCUS"
    *   Controls: Stop button enabled, Reset available
    *   Behavior: Tracks work time, shows estimated break after 60s
*   **Timer Mode**:
    *   Display: Elapsed time counting up (00:00 → 25:30 → ...)
    *   Status: Shows the task name or "FOCUS"
    *   Controls: Stop button enabled, Reset available
    *   Behavior: Tracks work time, shows "Simple timer mode - no breaks" after 60s
*   **Pomodoro Mode**:
    *   Display: Remaining time counting down (25:00 → 24:59 → ... → 00:00)
    *   Status: Shows the task name or "FOCUS" + visual session progress dots
    *   Controls: Stop button enabled (no pause, no reset - stopping resets the cycle)
    *   Behavior: Auto-starts break when reaching 00:00, stop interrupts the session

### 3. Running (Break) State

*   **Display**: Remaining break time counting down
*   **Status**: "RELAX"
*   **Controls**: SKIP button enabled, Reset hidden
*   **Behavior**:
    *   Flow mode: Returns to idle when complete
    *   Pomodoro mode: Auto-starts the next session or completes the cycle

### 4. Paused State (Flow Mode Only)

*   **Display**: Current elapsed time (static)
*   **Status**: Shows the task name or "FOCUS"
*   **Controls**: Resume/Reset available
*   **Behavior**: Time preserved, can resume or reset

## Settings Integration

### Timer Mode Settings

*   **Timer Mode**: Choose between Flow, Timer, and Pomodoro modes

#### Flow Mode Settings

*   **Allow skip breaks**: Toggle whether breaks can be skipped or not
*   **Break Calculation**: Choose percentage-based or fixed duration
*   **Break Percentage**: 10%, 15%, 20%, or 25% of work time (when using percentage)
*   **Fixed Break Duration**: 5, 10, 20, or 30 minutes (when using fixed)

#### Pomodoro Mode Settings

*   **Work Duration**: 1-60 minutes (default: 25)
*   **Break Duration**: 1-30 minutes (default: 5)
*   **Number of Sessions**: 1-8 sessions (default: 4)

### Task Settings

*   **Show Tasks**: Controls the task panel visibility. When disabled, the timer works in "Focus" mode only, and sessions are created with auto-generated names ("Focus #1", "Focus #2", etc.).
*   **Require Task Selection**: Controls whether a task must be selected before starting the timer. When disabled, the timer can start without selecting a task, and sessions are created as "Focus" sessions.

### Other Settings

*   **Visual Settings**:
    *   Theme: Light/Dark mode toggle
    *   Accent Color: 16 color options for UI elements
    *   Flat Mode: Removes card shadows for a minimal design
    *   Color Timer: The timer surface adopts the accent color background
    *   Layout: Compact (side-by-side) or Full (stacked) layout
    *   Widget Mode: Widget-style minimal interface
*   **Background Options**:
    *   Light Theme: 8 background options (gray-50 to neutral-100)
    *   Dark Theme: 8 background options (gray-700 to neutral-950)
*   **Notifications**:
    *   Audio Notifications: Sound alerts when breaks end
    *   Visual Notifications: Browser notifications (requires permission)

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

1.  **Task Sessions**: Created when a task is selected
    *   `taskId`: Actual task ID
    *   `taskName`: Task name
    *   Updates the task's `timeSpent`
2.  **Focus Sessions**: Created when no task is selected
    *   `taskId`: Generated ID (`focus-${timestamp}`)
    *   `taskName`: Auto-generated ("Focus #1", "Focus #2", etc.)
    *   No task time update

### Daily Reset

The app performs a daily reset at midnight:

*   Clears the task list (but preserves history)
*   Resets the active task selection
*   Clears the timer state
*   Preserves session history and settings

## Layout Modes

### Full Mode (Default)

*   Complete interface with all features
*   Header with status dot, title, and controls
*   Timer and task panels
*   Settings and history access

### Widget Mode

*   Minimal interface for focused work
*   Small header with essential controls
*   Timer-only display
*   Reduced visual elements

### Layout Options

*   **Compact Layout**: Timer and tasks side-by-side (desktop), with the music player below the timer. Optimal for wide screens.
*   **Full Layout**: Stacked components, with the timer above the tasks. Better for narrow screens.

## Data Persistence

### localStorage Keys

*   `flow-settings`: User preferences and configuration
*   `flow-tasks`: Current day's task list
*   `flow-active-task`: Currently selected task ID
*   `flow-sessions`: Historical session data
*   `flow-task-history`: Autocomplete suggestions
*   `flow-timer-state`: Current timer state
*   `flow-layout`: Layout preference
*   `flow-last-reset`: Last daily reset date

### Data Lifecycle

1.  **Session Start**: Timer state saved continuously
2.  **Session End**: Session created, task time updated
3.  **Daily Reset**: Tasks and timer state cleared, history preserved
4.  **Settings Changes**: Immediately persisted to localStorage

## Integration Features

### Music Player

*   YouTube-based background music
*   Persistent playback across page reloads
*   Widget mode controls
*   Optional display panel

### History and Analytics

*   Session history with filtering
*   Daily/weekly time summaries
*   Task performance tracking
*   Export capabilities

### Notifications

*   Browser notification API integration
*   Custom audio generation
*   Configurable notification preferences

## Technical Implementation

### Timer Accuracy

*   Uses `requestAnimationFrame` for smooth updates
*   Wall-clock time calculation prevents drift
*   Handles browser tab switching and page reloads
*   Microsecond precision with second-level display

### State Management

*   React hooks for component state
*   Custom hooks for complex logic (`useTimer`, `useTasks`)
*   localStorage for persistence
*   Automatic state reconciliation on mount

### Performance Optimizations

*   Minimal re-renders through careful state design
*   Efficient localStorage usage
*   Lazy loading of non-critical features
*   Optimized animation and transitions

## Usage Patterns

### Flow Mode Usage

#### Basic Flow with Percentage Breaks

1.  Select or create a task
2.  Start the timer
3.  Work for as long as you're in a flow state (no fixed time limit)
4.  Stop the timer when you naturally feel ready for a break
5.  Automatic break starts (duration = work\_time × percentage)
6.  Take the break until notification or skip if still in flow
7.  Repeat

**Example**: Work for 50 minutes → Get a 10-minute break (20% setting)

#### Flow with No Breaks

1.  Disable breaks in the timer settings
2.  Start the timer and work naturally
3.  Stop the timer when ready - immediately resets to 00:00
4.  Take breaks manually when needed
5.  Good for deep work sessions

#### Flow with Fixed Breaks

1.  Set the break type to "fixed" with the desired duration
2.  Work for any duration
3.  Always get consistent break time
4.  Predictable recovery periods

### Pomodoro Mode Usage

#### Classic Pomodoro

1.  Set 25-minute work, 5-minute breaks, 4 sessions
2.  Start the timer - the countdown begins
3.  Work until the timer reaches 00:00
4.  Automatic break starts
5.  Repeat for all sessions
6.  Complete notification after the final session

**Example**: 25min work → 5min break → 25min work → 5min break → repeat

#### Custom Pomodoro Cycles

1.  Configure work/break durations and session count
2.  Start the structured work cycle
3.  Follow the automatic transitions
4.  Skip breaks when in a flow state
5.  Complete the full cycle

### Timer Mode Usage

#### Simple Time Tracking

1.  Start the timer when beginning work
2.  Work without any interruptions or break suggestions
3.  Stop the timer when the task is complete or when taking a break
4.  Review logged time in history
5.  Perfect for billing, invoicing, or basic productivity tracking

#### Meeting Time Logging

1.  Start the timer at the beginning of the meeting
2.  Let the timer run for the entire meeting duration
3.  Stop the timer when the meeting ends
4.  The session is automatically saved with the precise duration
5.  Great for tracking billable meeting time

#### Flexible Work Sessions

1.  Start the timer for any work activity
2.  Work as long as needed without break pressure
3.  Take breaks manually when you feel the need
4.  Stop the timer only when completely done
5.  Ideal for creative work or deep focus sessions

## Timer Mode Comparison

| Aspect            | Flow Mode                       | Timer Mode                    | Pomodoro Mode                     |
| ----------------- | ------------------------------- | ----------------------------- | --------------------------------- |
| Work Duration     | Flexible - until natural break  | Flexible - until manual stop  | Fixed duration (configurable)     |
| Break Duration    | Configurable                    | None (manual breaks only)     | Fixed duration (configurable)     |
| Flow Respect      | Preserves flow state            | Preserves flow state          | May interrupt flow at fixed intervals |
| Structure         | Flexible with optional breaks   | Completely flexible           | Structured, time-boxed            |
| Session Management| Individual sessions             | Individual sessions           | Planned cycles with session counting|
| Break Control     | Optional, skippable             | No automatic breaks           | Automatic, skippable              |
| Interruption Handling | Pause and resume                | Manual stop only              | Stop resets cycle                 |
| Best For          | Deep work with smart breaks      | Simple time tracking          | Structured productivity           |

## Troubleshooting

### Common Issues

**Timer doesn't start**

*   Check if task selection is required in settings
*   Ensure you're not in break mode from another session
*   Try refreshing the page if the state seems corrupted

**Time not saving**

*   Make sure you click stop (not just close the browser)
*   Check that localStorage is enabled in your browser
*   Verify sessions appear in history after stopping

### Performance Tips

*   **Keep the browser tab active**: The timer continues in the background but may slow down.
*   **Regular history cleanup**: Clear old sessions if performance degrades.
*   **Stable internet**: Not required for timer function, but needed for any online features.