# Architecture Overview

This document provides a high-level map of the application with pointers into source files and the runtime data model so future changes can be made without grepping the codebase.

## Tech Stack

- Vite + React 18 + TypeScript
- TailwindCSS for styling
- lucide-react for icons
- LocalStorage for persistence (no backend)

## Runtime Data Model

- Task
  - id: string (ms timestamp)
  - name: string
  - timeSpent: number (seconds, historical total)
  - estimatedTime?: number (seconds, optional goal used for today’s progress)
  - createdAt: string (ISO)
- Session
  - id: string
  - taskId: string
  - taskName: string (copied for durability)
  - startTime: string (ISO)
  - endTime: string (ISO)
  - duration: number (seconds)
  - date: string (Date.toDateString) — used for grouping by day
- Settings
  - visualNotifications: boolean
  - audioNotifications: boolean
  - theme: 'light' | 'dark'
  - accentColor: string (tailwind-safe mapping used in UI)
  - flatMode?: boolean (disables card shadows)
  - colorTimer?: boolean (timer surface adopts accent background)
  - lightBg?: enum of light background tokens
  - darkBg?: enum of dark background tokens

These interfaces are declared in [`src.App.tsx`](src/App.tsx).

## Storage Keys

- flow-settings: Settings (JSON)
- flow-layout: 'horizontal' | 'vertical'
- flow-tasks: Task[] (JSON)
- flow-active-task: Task | null
- flow-sessions: Session[] (JSON)
- flow-timer-state: TimerState (internal to hook, see below)
- flow-task-history: string[] (names previously added)

## App Composition

- Root: [`src.main.tsx`](src/main.tsx) mounts React tree with [`src.components.ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx)
- Composition root: [`src.App.tsx`](src/App.tsx)
  - Holds: layout, settings, sessions, history toggles
  - Hooks:
    - [`src.hooks.useTheme()`](src/hooks/useTheme.ts) for theme toggling + DOM class management
    - [`src.hooks.useTasks()`](src/hooks/useTasks.ts) for persistent tasks + active task pointer
    - [`src.hooks.useTimer()`](src/hooks/useTimer.ts) for drift-free work timer and break countdown
    - [`src.hooks.useLocalStorage()`](src/hooks/useLocalStorage.ts) generic state persistence
  - Children:
    - [`src.components.Timer.tsx`](src/components/Timer.tsx) — purely presentational timer surface and controls
    - [`src.components.TaskManager.tsx`](src/components/TaskManager.tsx) — task list, add/delete, goals, today badges
    - [`src.components.History.tsx`](src/components/History.tsx) — modal for daily/weekly stats
    - [`src.components.SettingsPanel.tsx`](src/components/SettingsPanel.tsx) — visual and notification preferences
    - [`src.components.MusicPlayer.tsx`](src/components/MusicPlayer.tsx) — optional embedded YouTube audio UI

## Timer Flow

- Start
  - Guard: requires activeTask
  - Sets a new sessionId, startTime = Date.now(), isRunning=true, isBreak=false
  - State persisted to localStorage under flow-timer-state
- Ticking
  - Uses requestAnimationFrame and wall clock deltas to avoid setInterval drift
  - Work mode: time = floor((now - startTime) / 1000)
  - Break mode: time = ceil((targetTime - now) / 1000)
- Stop (ends work, begins break)
  - Computes workedSeconds using wall clock (Date.now - startTime)
  - Appends Session to flow-sessions via setSessions
  - Updates task timeSpent in flow-tasks
  - Computes breakSeconds = floor(workedSeconds / 5)
  - If breakSeconds > 0, enters break mode with targetTime = now + breakSeconds*1000
  - When break hits 0, plays audio and optional visual notification via Notifications API
- Reset
  - Clears timer state, stops run/break

All logic documented inline in [`src.hooks.useTimer()`](src/hooks/useTimer.ts).

## Theme and Accent

- useTheme applies data-theme attribute and toggles 'dark' class on html element for Tailwind dark mode
- toggleTheme updates flow-settings, dispatches CustomEvent 'flow-theme-changed'; App listens and updates state
- Accent color is a token mapped to tailwind-safe classes in App/children; green uses inline overrides for a custom hex when necessary

See [`src.hooks.useTheme.ts`](src/hooks/useTheme.ts) and class maps in [`src.App.tsx`](src/App.tsx), [`src.components.Timer.tsx`](src/components/Timer.tsx), [`src.components.TaskManager.tsx`](src/components/TaskManager.tsx), [`src.components.History.tsx`](src/components/History.tsx).

## Layout

- App manages:
  - isCompact: toggles a single-column dense layout
  - layout: 'horizontal' or 'vertical' grid controlled via flow-layout
  - Conditional MusicPlayer placement:
    - In horizontal layout: below Timer inside the left column card
    - In vertical: own block or hidden in compact

## Notifications

- Audio: WebAudio oscillator tri-tone played when break ends (gated by settings.audioNotifications)
- Visual: Notification API permission requested on first mount; if granted, shows notification when break ends
- Both implemented in [`src.hooks.useTimer.ts`](src/hooks/useTimer.ts)

## History and Today Computations

- Today key: new Date().toDateString()
- Today’s time by task:
  - Base from flow-sessions filtered by date and task
  - TaskManager augments live time for the active task when work is in progress by reading flow-timer-state.startTime
- History modal:
  - Day view: aggregates total, count, average, longest
  - Week view: Sun..Sat navigation and totals; clicking a day opens that day view

## Styling System

- Tailwind with index-level transition smoothing for colors and borders: [`src.index.css`](src/index.css)
- Card shadows globally disabled when settings.flatMode = true

## Error Handling

- Top-level runtime errors are caught by [`src.components.ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx), which renders a readable message on failure.

## Build and Scripts

- Dev: npm run dev
- Prod build: npm run build
- Preview: npm run preview
- Lint: npm run lint
