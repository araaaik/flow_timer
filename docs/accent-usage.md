# Accent Color Usage Documentation

Purpose: a single place to understand and change how the “accent color” affects UI elements, without searching through code.

Key principles:
- Source of truth: Settings in localStorage key `flow-settings` field `accentColor`.
- Do not recolor neutral container/card backgrounds (except the Timer surface when Color Timer is ON).
- Accent applies to interactive or emphasis elements (buttons, chips, indicators, progress, active rings, icons, selected states).
- Implementation uses Tailwind class maps for all accents. For any custom hex accent, a small number of inline style hooks are used in specific spots.

How to change the accent globally:
- Prefer updating the Tailwind-based maps (class maps) where present.
- If you need a custom hex for a given accent name (for example “green”), change the inline style hooks listed below.
- Keep hover/transition classes from Tailwind to preserve interactivity, and layer inline styles only for the final color.

Accent touchpoints by component

1) Timer ([src/components/Timer.tsx](src/components/Timer.tsx))
- Start/Stop button
  - Tailwind map for all accents; when Color Timer is OFF, a per-accent solid hex override is applied for all accent colors (not only green).
- Estimated Break chip (visible while working)
  - When Color Timer is OFF and in light theme, a per-accent tinted background and matching text color are applied for all accent colors.

2) Task Manager ([src/components/TaskManager.tsx](src/components/TaskManager.tsx))
- Add task button(s) (both at top when empty and in the add form below the list)
  - Tailwind map; optional inline style hook for custom hex background/border when button is enabled.
- Active task highlight
  - Tailwind ring map; optional inline style hook (boxShadow) for custom hex active ring.
  - Special case: when accent is "black" and theme is dark, the active task gets a subtle gray outline (#d1d5db) for better integration on dark surfaces.
- Today time badge (right side in each task row)
  - Tailwind map; optional inline style hook to set custom hex background and maintain readable text.
- Goal progress bar (inner bar)
  - Tailwind map; optional inline style hook to set custom hex for the progress segment.

Notes: Neutral task containers remain theme surfaces; only accent rings/badges/bars change.

3) History ([src/components/History.tsx](src/components/History.tsx))
Accent applies to:
- Header icon
- Active period tabs (Day/Week/Month)
- **Statistics cards background** (Total Time, Sessions, Average, Longest)
  - Cards use accent color as background with white text
  - Labels use semi-transparent white (`text-white/80`)
- Session duration text
- Selected day tiles in week view
Implementation: Tailwind class maps for all accents + optional inline style hooks for a custom hex.

4) Music Player ([src/components/MusicPlayer.tsx](src/components/MusicPlayer.tsx))
- Left indicators
  - Animated equalizer:
    - When playing: 3-bar equalizer animates continuously with staggered keyframes (eq-bounce-a/b/c) and uses the current accent color (green uses #266a5b).
    - When paused: bars are static in neutral gray (gray-400).
  - Status dot:
    - When playing: dot is colored with the current accent (green uses #266a5b) and may pulse.
    - When paused: dot remains neutral gray (dark: #9ca3af, light: #9ca3af).
  - Implementation: inline per-accent color map and conditional styles based on player state; accent is read from `flow-settings`.
  - Volume control:
    - The slider track active segment and thumb use the current accent color.
    - Implemented via CSS variable `--slider-accent` set on the player root and used in slider thumb styles.
    - The background gradient of the slider uses the resolved accent HEX for the filled portion.
  - Stream tiles (selection states):
    - Active tile border uses the accent color and increased thickness.
    - An accent-colored translucent overlay is applied over the thumbnail when active.
    - The “Active” badge uses the accent background.

5) App ([src/App.tsx](src/App.tsx))
- Header status dot (left of FLOW)
Implementation:
- When timer is running (work or break), dot uses the current accent color (project green #266a5b for green).
- When timer is not running, dot is gray (light: #d1d5db, dark: #4b5563).

5) App ([src/App.tsx](src/App.tsx))
- Timer surface when Color Timer is ON
Implementation: Tailwind map for backgrounds; optional inline style hook for custom hex background and white text.

Non-accent containers (unchanged)
- Page background (controlled by per-theme settings lightBg/darkBg)
- Card/container surfaces for Task Manager, History, Music Player

Inline style hooks inventory (centralized reference)
These are the exact code locations where custom per-accent hex overrides are applied (all accents supported; adjust values to change final rendering without touching Tailwind maps):
- Timer
  - Start/Stop button style override map (solidHex) in [src/components/Timer.tsx](src/components/Timer.tsx)
  - Estimated Break chip tint/text map (chipHex) in [src/components/Timer.tsx](src/components/Timer.tsx)
- Task Manager
  - Add task button (enabled) background/border in [src/components/TaskManager.tsx](src/components/TaskManager.tsx)
  - Active task ring (boxShadow) in [src/components/TaskManager.tsx](src/components/TaskManager.tsx) — includes special case: black accent on dark theme uses white ring for visibility.
  - Today time badge background in [src/components/TaskManager.tsx](src/components/TaskManager.tsx)
  - Progress bar inner segment background in [src/components/TaskManager.tsx](src/components/TaskManager.tsx)
- History
  - Header icon color, active tab background, statistics cards background, session duration, selected day accents in [src/components/History.tsx](src/components/History.tsx)
- Music Player
  - Playing indicator dot in [src/components/MusicPlayer.tsx](src/components/MusicPlayer.tsx)
  - Volume slider accent (track + thumb) in [src/components/MusicPlayer.tsx](src/components/MusicPlayer.tsx)
- App
  - Timer surface background (Color Timer ON) in [src/App.tsx](src/App.tsx)

Recommended customization workflow
1) Choose an accent name (e.g., “green”) or add a new one if extending the palette.
2) Update Tailwind class maps where accents are mapped to classes (keeps hover/active states consistent).
3) If you need a custom hex different from Tailwind’s, adjust the inline style hooks listed above for your accent name only.
4) Verify contrast (white text on dark backgrounds) and keep hover/transition classes unchanged.

Maintenance checklist
- Keep accent changes scoped to accent elements; avoid changing neutral containers.
- Preserve Tailwind hover/focus/transition classes; layer inline styles for color only.
- Centralize any new inline hooks by updating this document with file references to maintain a single source of truth.