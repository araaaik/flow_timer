# Timer System Documentation

## Overview

The FLOW timer supports two productivity techniques:

1. **Flow Mode** - A flexible productivity method that respects your natural flow state. Unlike traditional Pomodoro with fixed intervals, Flow mode allows you to work for as long as you're productive, with optional breaks that can be calculated proportionally or set to fixed durations.

2. **Pomodoro Mode** - The classic Pomodoro technique with fixed work/break cycles and configurable session counts.

## Timer Modes

### Flow Mode

Flow mode is designed to respect your natural work rhythm without artificial interruptions.

#### How It Works
1. **Start timer** when you begin working
2. **Work freely** for as long as you're in flow state (no time limits)
3. **Stop timer** when you naturally feel ready for a break
4. **Optional break** starts based on your settings:
   - **Percentage-based**: Break duration = work_time × percentage (10%, 15%, 20%, or 25%)
   - **Fixed duration**: Break duration = fixed time (5, 10, 20, or 30 minutes)
   - **Disabled**: No break - timer resets to 00:00 immediately
5. **Take break** until notification sounds (if breaks enabled)
6. **Skip break** anytime by clicking the SKIP button
7. **Repeat** the cycle

#### Examples
**Percentage-based breaks (20% default):**
- Work 20 minutes → Get 4-minute break
- Work 45 minutes → Get 9-minute break  
- Work 75 minutes → Get 15-minute break

**Fixed breaks (10 minutes):**
- Work 20 minutes → Get 10-minute break
- Work 60 minutes → Get 10-minute break

**No breaks:**
- Work any duration → Timer resets immediately

### Pomodoro Mode

Classic Pomodoro technique with fixed work/break cycles.

#### How It Works
1. **Configure** work duration (default 25 min), break duration (default 5 min), and number of sessions (1-8)
2. **Start timer** - countdown begins from work duration
3. **Work session** counts down to zero
4. **Automatic break** starts when work session completes
5. **Break countdown** runs for configured break duration
6. **Next session** starts automatically after break
7. **Skip break** anytime by clicking the SKIP button
8. **Complete cycle** when all sessions are finished

#### Examples
**Default settings (25min work, 5min break, 4 sessions):**
- Session 1: 25min work → 5min break
- Session 2: 25min work → 5min break  
- Session 3: 25min work → 5min break
- Session 4: 25min work → Complete!

**Custom settings (45min work, 10min break, 2 sessions):**
- Session 1: 45min work → 10min break
- Session 2: 45min work → Complete!

## Timer Features

### Core Functionality
- **Drift-free timing**: Uses `Date.now()` and `requestAnimationFrame` for precise timing
- **Persistent state**: Timer survives page reloads and browser tab switching
- **Dual modes**: Flow mode (flexible) and Pomodoro mode (structured)
- **Configurable breaks**: Multiple break calculation options in Flow mode
- **Break skipping**: Skip any break with the SKIP button
- **Real-time preview**: Shows estimated/next break time while working

### Visual Interface
- **Large time display**: Clear mm:ss or h:mm:ss format
- **Status indicators**: Shows FOCUS/Task Name/RELAX
- **Session counter**: Shows current/total sessions in Pomodoro mode
- **Progress feedback**: Animated status dot with accent color
- **Break preview chip**: Live preview of upcoming break duration
- **Mode-aware display**: Count-up (Flow) or countdown (Pomodoro)

### Controls
- **Start/Stop/Skip Button**: 
  - Shows Play icon when stopped
  - Shows Pause icon when running (work session)
  - Shows "SKIP" text when in break mode
- **Reset Button**: Appears when timer is running or has time > 0 (not during breaks)
- **Smart behavior**: Button function adapts to current timer state

## Timer States

### 1. Idle State
- **Display**: `00:00`
- **Status**: No active session
- **Controls**: Start button enabled
- **Behavior**: Ready to begin new work session

### 2. Running (Work) State  
- **Flow Mode**:
  - Display: Elapsed time counting up (00:00 → 25:30 → ...)
  - Status: Shows task name or "FOCUS"
  - Controls: Stop button enabled, Reset available
  - Behavior: Tracks work time, shows estimated break after 60s
- **Pomodoro Mode**:
  - Display: Remaining time counting down (25:00 → 24:59 → ... → 00:00)
  - Status: Shows task name or "FOCUS" + session counter (1/4)
  - Controls: Stop button enabled, Reset available
  - Behavior: Auto-starts break when reaching 00:00

### 3. Running (Break) State
- **Display**: Remaining break time counting down
- **Status**: "RELAX"
- **Controls**: SKIP button enabled, Reset hidden
- **Behavior**: 
  - Flow mode: Returns to idle when complete
  - Pomodoro mode: Auto-starts next session or completes cycle

### 4. Paused State (Flow Mode Only)
- **Display**: Current elapsed time (static)
- **Status**: Shows task name or "FOCUS"
- **Controls**: Resume/Reset available
- **Behavior**: Time preserved, can resume or reset

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

#### Flow Mode
```typescript
// Percentage-based (default 20%)
const breakSeconds = Math.floor(workedSeconds * percentage / 100);

// Fixed duration
const breakSeconds = fixedMinutes * 60;

// Examples (20% percentage):
// 300 seconds (5 min) work → 60 seconds (1 min) break
// 1800 seconds (30 min) work → 360 seconds (6 min) break
// 3600 seconds (60 min) work → 720 seconds (12 min) break

// Examples (10 min fixed):
// Any work duration → 600 seconds (10 min) break
```

#### Pomodoro Mode
```typescript
// Fixed durations from settings
const workSeconds = workMinutes * 60;
const breakSeconds = breakMinutes * 60;

// Example (25min work, 5min break):
// Each session: 1500 seconds work → 300 seconds break
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

### Timer Mode Settings
- **Timer Mode**: Choose between Flow and Pomodoro modes

#### Flow Mode Settings
- **Enable Breaks**: Toggle break functionality on/off
- **Break Calculation**: Choose percentage-based or fixed duration
- **Break Percentage**: 10%, 15%, 20%, or 25% of work time (when using percentage)
- **Fixed Break Duration**: 5, 10, 20, or 30 minutes (when using fixed)

#### Pomodoro Mode Settings
- **Work Duration**: 1-60 minutes (default: 25)
- **Break Duration**: 1-30 minutes (default: 5)
- **Number of Sessions**: 1-8 sessions (default: 4)

### Other Timer Settings
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

## Flow Mode vs Pomodoro Mode

| Aspect | Flow Mode | Pomodoro Mode |
|--------|-----------|---------------|
| **Work Duration** | Flexible - until natural break | Fixed duration (configurable) |
| **Break Duration** | Configurable (percentage/fixed/none) | Fixed duration (configurable) |
| **Flow Respect** | Preserves flow state | May interrupt flow at fixed intervals |
| **Structure** | Flexible, self-directed | Structured, time-boxed |
| **Session Management** | Individual sessions | Planned cycles with session counting |
| **Break Control** | Optional, skippable | Automatic, skippable |

### When to Use Flow Mode
- **Deep work sessions**: Complex tasks requiring sustained focus
- **Creative work**: Writing, design, programming where interruptions break flow
- **Variable task complexity**: When work duration naturally varies
- **Flexible schedule**: When you can work at your own pace
- **Flow state priority**: When maintaining focus is more important than time structure

### When to Use Pomodoro Mode  
- **Structured work**: Tasks that benefit from time constraints
- **Procrastination management**: When you need external time pressure
- **Energy management**: Regular breaks to prevent fatigue
- **Meeting schedules**: When you need predictable work/break timing
- **Habit building**: Creating consistent work rhythms
- **Collaborative work**: When coordinating with others' schedules

### Benefits of Both Modes
- **Break skipping**: Skip any break when you're in flow
- **Task integration**: Both modes work with task tracking
- **Persistent state**: Timers survive page reloads and tab switches
- **Notifications**: Audio and visual alerts for break completion
- **Customization**: Extensive settings for personal preferences

## Usage Patterns

### Flow Mode Patterns

#### Deep Work Sessions
1. Select complex task
2. Start timer and work uninterrupted for 60-90 minutes
3. Stop when mental fatigue sets in
4. Take proportional break (12-18 minutes for 20% setting)
5. Return refreshed for next session

#### Quick Tasks with No Breaks
1. Disable breaks in settings
2. Start timer for small task
3. Work for 15-20 minutes
4. Stop timer - immediately ready for next task
5. Take breaks manually when needed

#### Mixed Workflow with Fixed Breaks
1. Set fixed 10-minute breaks
2. Work on various tasks of different lengths
3. Always get consistent 10-minute recovery time
4. Maintain predictable break schedule

### Pomodoro Mode Patterns

#### Classic Pomodoro (25/5/4)
1. Set 25-minute work, 5-minute breaks, 4 sessions
2. Work through structured cycles
3. Take longer break after completing all sessions
4. Repeat cycle for full work day

#### Extended Focus Sessions (45/10/2)
1. Set 45-minute work, 10-minute breaks, 2 sessions
2. Longer work periods for complex tasks
3. Substantial breaks for recovery
4. Fewer interruptions while maintaining structure

#### Sprint Sessions (15/5/6)
1. Set 15-minute work, 5-minute breaks, 6 sessions
2. Short bursts for high-intensity work
3. Frequent breaks to maintain energy
4. Good for tasks requiring high concentration

### Hybrid Approaches

#### Flow with Break Limits
1. Use Flow mode with fixed breaks
2. Work naturally but ensure consistent recovery
3. Best of both flexibility and structure

#### Pomodoro with Skip Option
1. Use Pomodoro mode but skip breaks when in flow
2. Structure when needed, flexibility when flowing
3. Maintains session counting while respecting flow state