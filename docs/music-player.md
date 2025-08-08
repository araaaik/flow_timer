# Music Player Documentation

## Overview

The FLOW music player provides background music functionality with YouTube-based streaming stations. It features a customizable station list, persistent playback across page reloads, and an intuitive editing system for managing visible stations.

## Core Features

### Background Music Streaming
- **YouTube Integration**: Streams music from curated YouTube channels
- **Persistent Playback**: Continues playing across page reloads and tab switches
- **Hidden iframe**: Uses invisible YouTube embed for uninterrupted audio
- **Volume Control**: Adjustable volume with mute functionality

### Station Management
- **Curated Stations**: Pre-configured music stations for different moods
- **Station Editing**: Hide/show stations based on preferences
- **Visual Thumbnails**: YouTube video thumbnails for easy identification
- **Persistent Settings**: Station visibility saved between sessions

## User Interface

### Compact Header
The music player starts in a compact state showing:
- **Status Indicator**: Animated dot showing play state with accent color
- **Play/Pause Button**: Primary control for music playback
- **Current Station**: Name of currently playing station
- **Expand/Collapse**: Toggle to show/hide detailed controls

### Expanded Controls
When expanded, the player reveals:
- **Station Selection**: Grid of available stations with thumbnails
- **Volume Control**: Slider with mute button and numeric display
- **Station Editing**: Interface for customizing visible stations

## Station Editing System

### Edit Mode Access
- **Location**: Edit button appears in the STATION header row (top right)
- **Visibility**: Only shown when player is expanded
- **Design**: Compact button with pencil icon and "Edit" text
- **Activation**: Click to enter/exit edit mode

### Edit Mode Interface
```
STATION                           Edit
[station1] [station2] [station3]
```

In edit mode:
```
STATION                           Done
[station1] [station2] [station3]
```

### Station States

#### Normal Mode (Station Selection)
- **Visible Stations Only**: Shows only stations marked as visible
- **Active Highlighting**: Current station highlighted with accent color border
- **Click Action**: Selects station for playback
- **Visual Feedback**: Active station shows "Active" badge

#### Edit Mode (Station Management)
- **All Stations Shown**: Displays both visible and hidden stations
- **Visual Distinction**:
  - **Visible Stations**: Full color, accent color border
  - **Hidden Stations**: Grayscale, 50% opacity, gray border
- **Click Action**: Toggles station visibility
- **No Icons**: Clean interface without eye/visibility icons

### Station Visibility Logic
- **Default State**: All stations visible by default
- **Hide Station**: Click station in edit mode to hide it
- **Show Station**: Click hidden (grayscale) station to make it visible
- **Active Station Protection**: If active station is hidden, automatically switches to first visible station
- **Persistent Storage**: Visibility preferences saved to localStorage

## Available Stations

The player includes these pre-configured stations:

1. **Lofi Hip Hop Radio** - Relaxing beats for focus
2. **Chillhop Radio** - Chill electronic music
3. **Jazz Radio** - Smooth jazz for concentration
4. **Study Music** - Ambient music for studying
5. **Ambient Focus** - Atmospheric soundscapes
6. **Deep Focus** - Minimal ambient for deep work

## Settings Integration

### Music Player Visibility
- **Setting**: `showMusicPlayer` in app settings
- **Default**: Enabled (true)
- **When Disabled**: 
  - All music player UI elements hidden
  - Music buttons removed from headers
  - Player panels not rendered

### Theme Integration
- **Accent Colors**: Player controls use app's accent color
- **Dark/Light Mode**: Player surfaces adapt to current theme
- **Consistent Styling**: Matches app's overall design language

## Layout Modes

### Compact Layout
- **Grid**: 2-column station grid for compact display
- **Placement**: Below timer in side-by-side layout
- **Card Style**: White card matching timer design

### Full Layout
- **Grid**: Auto-fit grid with minimum 88px station tiles
- **Placement**: Separate section below timer and tasks
- **Full Width**: Utilizes available horizontal space

### Widget Mode
- **Music Controls**: Play/pause button in widget header
- **Minimal Interface**: Essential controls only
- **Status Indicator**: Animated dot showing play state

## Technical Implementation

### State Management
```typescript
interface MusicState {
  isPlaying: boolean;        // Playback state
  currentStream: number;     // Active station index
  volume: number;           // Volume level (0-100)
  isMuted: boolean;         // Mute state
  hiddenStreams: number[];  // Array of hidden station indices
}
```

### Persistence
- **localStorage Key**: `flow-music-state`
- **Saved Data**: Playback state, volume, current station, hidden stations
- **Auto-restore**: State restored on page load

### YouTube Integration
- **Embed API**: Uses YouTube embed with JavaScript API
- **Parameters**: Autoplay, mute, controls disabled, modest branding
- **Commands**: Play, pause, volume control via postMessage

## Data Storage

### Station Configuration
```typescript
const streams = [
  { name: 'Station Name', url: 'https://youtube.com/watch?v=...' },
  // ... more stations
];
```

### Hidden Stations Storage
- **Format**: Array of station indices `[0, 2, 4]`
- **Persistence**: Saved to localStorage with music state
- **Default**: Empty array (all stations visible)

## Usage Patterns

### Basic Music Playback
1. **Enable Music Player**: Ensure setting is enabled
2. **Open Player**: Click Music button in header
3. **Expand Controls**: Click down arrow to show stations
4. **Select Station**: Click desired station thumbnail
5. **Control Playback**: Use play/pause and volume controls

### Customizing Station List
1. **Open Player**: Access music player interface
2. **Expand Player**: Click to show detailed controls
3. **Enter Edit Mode**: Click "Edit" button next to STATION label
4. **Hide Stations**: Click stations to make them grayscale (hidden)
5. **Show Stations**: Click grayscale stations to make them visible
6. **Exit Edit Mode**: Click "Done" button to save changes

### Widget Mode Usage
1. **Enable Widget Mode**: Use minimize button in header
2. **Music Controls**: Use play/pause button in widget header
3. **Status Feedback**: Watch animated status dot
4. **Quick Access**: Essential controls without full interface

## Keyboard Shortcuts

Currently, the music player is controlled via mouse/touch interactions. Keyboard shortcuts are handled at the application level for play/pause functionality.

## Accessibility Features

- **ARIA Labels**: Buttons include descriptive titles
- **Visual Feedback**: Clear state indicators for all controls
- **Color Independence**: Functionality doesn't rely solely on color
- **Focus Management**: Proper tab order for keyboard navigation

## Performance Considerations

- **Lazy Loading**: Station thumbnails loaded on demand
- **Efficient Updates**: State changes trigger minimal re-renders
- **Memory Management**: Single YouTube iframe reused for all stations
- **Smooth Transitions**: CSS transitions for visual state changes

## Troubleshooting

### Common Issues

**Music Not Playing**
- Check browser autoplay policies
- Ensure volume is not muted
- Verify internet connection
- Try refreshing the page

**Stations Not Loading**
- Check YouTube accessibility
- Verify station URLs are valid
- Clear browser cache if needed

**Settings Not Saving**
- Ensure localStorage is enabled
- Check browser storage limits
- Try clearing and reconfiguring

### Browser Compatibility

- **Modern Browsers**: Full functionality in Chrome, Firefox, Safari, Edge
- **YouTube Embed**: Requires JavaScript enabled
- **localStorage**: Required for state persistence
- **CSS Grid**: Used for station layout (IE11+ support)

## Future Enhancements

Potential improvements for the music player:

- **Custom Stations**: Allow users to add their own YouTube URLs
- **Playlists**: Create custom station groups
- **Keyboard Shortcuts**: Direct keyboard control for music functions
- **Equalizer**: Audio enhancement controls
- **Sleep Timer**: Auto-stop functionality
- **Station Categories**: Organize stations by genre or mood