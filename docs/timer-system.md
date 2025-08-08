# Timer System Documentation

## Overview

The FLOW timer implements the **Flowmodoro technique** - a flexible productivity method that respects your natural flow state. Unlike traditional Pomodoro with fixed 25-minute intervals, Flowmodoro allows you to work for as long as you're productive, then automatically calculates break time as 1/5 of your work duration.

## Core Concept: Flowmodoro

### How It Works
1. **Start timer** when you begin working
2. **Work freely** for as long as you're in flow state (no time limits)
3. **Stop timer** when you naturally feel ready for a break
4. **Automatic break** starts with duration = `floor(work_time ÷ 5)`
5. **Take break** until notification sounds
6. **Repeat** the cycle

### Examples
- Work 20 minutes → Get 4-minute break
- Work 45 minutes → Get 9-minute break  
- Work 75 minutes → Get 15-minute break

## Timer Features

### Core Functionality
- **Drift-free timing**: Uses `Date.now()` and `requestAnimationFrame` for precise timing
- **Persistent state**: Timer survives page reloads and browser tab switching
- **Flowmodoro breaks**: Automatic break calculation (20% of work time)
- **Flexible sessions**: No fixed time limits - work until natural break point
- **Real-time preview**: Shows estimated break time while working (after 60+ seconds)

### Visual Interface
- **Large time display**: Clear mm:ss or h:mm:ss format
- **Status indicators**: Shows FOCUS/Task Name/RELAX
- **Progress feedback**: Animated status dot with accent color
- **Estimated break chip**: Live preview of upcoming break duration

### Controls
- **Start/Stop Button**: Primary control with visual state feedback
- **Reset Button**: Appears when timer has time, requires confirmation
- **Keyboard shortcuts**: Space bar for start/stop (when focused)

## Timer States

### 1. Idle State
- Display: `00:00`
- Status: No active session
- Controls: Start button enabled
- Behavior: Ready to begin new work session

### 2. Running (Work) State  
- Display: Elapsed time counting up
- Status: Shows task name or "FOCUS"
- Controls: Stop button enabled, Reset available
- Behavior: Tracks work time, shows estimated break

### 3. Running (Break) State
- Display: Remaining break time counting down
- Status: "RELAX"
- Controls: All disabled (break must complete)
- Behavior: Automatic countdown to zero

### 4. Paused State
- Display: Current elapsed time (static)
- Status: Shows task name or "FOCUS"
- Controls: Resume/Reset available
- Behavior: Time preserved, can resume or reset

## Technical Implementation

### Accuracy & Performance
```typescript
// Drift-free timing using wall clock
const elapsedSec = Math.floor((Date.now() - startTime) / 1000);

// Smooth updates with requestAnimationFrame
const tick = () => {
  updateTime();
  requestAnimationFrame(tick);
};
```

### State Persistence
```typescript
interface TimerState {
  time: number;           // Current display time
  isRunning: boolean;     // Timer active state
  isBreak: boolean;       // Break mode flag
  startTime: number;      // Wall clock reference
  sessionId: string;      // Unique session identifier
  targetTime?: number;    // Break end time
}
```

### Break Calculation
```typescript
// Flowmodoro formula
const breakSeconds = Math.floor(workedSeconds / 5);

// Examples:
// 300 seconds (5 min) work → 60 seconds (1 min) break
// 1800 seconds (30 min) work → 360 seconds (6 min) break
// 3600 seconds (60 min) work → 720 seconds (12 min) break
```

## Notifications

### Audio Notifications
- **Custom tone generation**: Uses Web Audio API
- **Three-tone sequence**: 800Hz → 600Hz → 800Hz over 3 seconds
- **Configurable**: Can be disabled in settings
- **Break completion**: Plays when break countdown reaches zero

### Visual Notifications
- **Browser notifications**: Uses Notification API
- **Permission-based**: Requests user permission on first use
- **Break alerts**: "Break time is over! Ready to get back to work?"
- **Persistent**: Shows even when tab is not active

## Timer Modes

### Focus Mode
- **When**: No task selected or tasks disabled
- **Display**: Shows "FOCUS" as status
- **Sessions**: Auto-named "Focus #1", "Focus #2", etc.
- **Tracking**: Creates sessions but doesn't update task time

### Task Mode  
- **When**: Task is selected
- **Display**: Shows task name as status
- **Sessions**: Named after selected task
- **Tracking**: Updates task's total time spent

### Widget Mode
- **Minimal interface**: Reduced visual elements
- **Essential controls**: Start/stop and basic info only
- **Small footprint**: Perfect for secondary monitors
- **Same functionality**: Full timer features in compact form

## Settings Integration

### Timer Behavior Settings
- **Show Tasks**: Controls task panel visibility
- **Require Task Selection**: Whether task must be selected to start
- **Audio Notifications**: Enable/disable break sounds
- **Visual Notifications**: Enable/disable browser alerts

### Visual Settings
- **Color Timer**: Timer surface adopts accent color
- **Theme**: Light/dark mode affects timer appearance
- **Accent Color**: 16 colors for status indicators and buttons
- **Flat Mode**: Removes shadows for minimal design

## Data Storage

### localStorage Keys
- `flow-timer-state`: Current timer state and session info
- `flow-sessions`: Historical session data
- `flow-settings`: User preferences affecting timer behavior

### Session Creation
```typescript
interface Session {
  id: string;           // Unique identifier
  taskId: string;       // Associated task or generated ID
  taskName: string;     // Task name or "Focus #N"
  startTime: string;    // ISO timestamp
  endTime: string;      // ISO timestamp  
  duration: number;     // Work duration in seconds
  date: string;         // Date string for grouping
}
```

## Flowmodoro vs Traditional Pomodoro

| Aspect | Traditional Pomodoro | Flowmodoro (FLOW) |
|--------|---------------------|-------------------|
| **Work Duration** | Fixed 25 minutes | Flexible - until natural break |
| **Break Duration** | Fixed 5 minutes | Dynamic - 20% of work time |
| **Flow Respect** | May interrupt flow | Preserves flow state |
| **Flexibility** | Rigid schedule | Adapts to work rhythm |
| **Context Switching** | Frequent forced breaks | Natural break points |

### Benefits of Flowmodoro
- **Flow preservation**: No artificial interruptions during productive periods
- **Proportional recovery**: Break time matches effort intensity  
- **Natural rhythm**: Respects your body's energy cycles
- **Reduced stress**: No pressure to finish within fixed time
- **Sustainable productivity**: Prevents burnout through adaptive breaks

## Usage Patterns

### Deep Work Sessions
1. Start timer for complex task
2. Work uninterrupted for 60-90 minutes
3. Stop when mental fatigue sets in
4. Enjoy 12-18 minute break
5. Return refreshed for next session

### Quick Tasks
1. Start timer for small task
2. Work for 15-20 minutes
3. Complete task and stop timer
4. Take 3-4 minute break
5. Move to next task

### Mixed Workflow
1. Combine different task types
2. Let natural energy guide session length
3. Use break time for physical movement
4. Maintain sustainable pace throughout day