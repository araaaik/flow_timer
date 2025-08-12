# Accent Color System

This document describes how the accent color system works in the Flow Timer application.

## Overview

The accent color system provides a centralized, reactive way to manage and apply accent colors throughout the application. It supports both predefined Tailwind CSS colors and custom user-defined colors with real-time updates across all components.

## Architecture

### Core Components

1.  **ColorSystemContext.tsx** - React Context provider for global color state management
2.  **colorSystem.ts** - Central color definitions and utilities
3.  **SettingsPanel.tsx** - UI for color selection and customization

### Color Types

```typescript
interface AccentColor {
  name: string;           // Display name
  value: string;          // Unique identifier
  tailwindClass: string;  // Tailwind CSS class
  hexValue: string;       // Hex color value
  isCustom?: boolean;     // Whether it's a user-defined color
}
```

## Default Colors

The system includes 7 carefully selected default colors:

*   **Blue** (`blue-500`) - `#3b82f6`
*   **Purple** (`violet-500`) - `#8b5cf6`
*   **Green** (`teal-700`) - `#0f766e`
*   **Red** (`red-500`) - `#ef4444`
*   **Orange** (`orange-500`) - `#f97316`
*   **Pink** (`pink-500`) - `#ec4899`
*   **Black** (`gray-900`) - `#111827`

## Context-Based Architecture

The new system uses React Context for global state management, ensuring all components automatically update when colors change.

### Provider Setup

The entire application is wrapped in `ColorSystemProvider`:

```typescript
function App() {
  return (
    <ColorSystemProvider>
      <AppContent />
    </ColorSystemProvider>
  );
}
```

### Using the Context

```typescript
import { useColorSystemContext } from '../contexts/ColorSystemContext';
import { getAccentHex } from '../utils/colorSystem';

function MyComponent({ accentColor }) {
  const colorSystem = useColorSystemContext();

  // Get hex value for CSS - automatically reactive
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());

  return (
    <div style={{ backgroundColor: accentHex }}>
      Content
    </div>
  );
}
```

## Custom Colors

Users can add custom colors through the Settings panel with immediate application:

1.  Click the "+" button next to "Accent colors"
2.  Use the color picker or enter a hex value (# is automatically added)
3.  Provide a custom name (optional)
4.  Click "Add Color"
5.  **The color is immediately applied and available across all components**

### Custom Color Features

*   **Instant Application**: New colors are automatically set as active
*   **Real-time Updates**: All components update immediately without page refresh
*   **Smart Validation**: Hex values are normalized (# added automatically)
*   **Persistent Storage**: Colors are saved to localStorage
*   **Edit & Delete**: Custom colors can be edited or removed

## Implementation Details

### Reactive State Management

The Context provider manages state reactively:

```typescript
const [colorSystem, setColorSystem] = useState<ColorSystemState>(() => {
  // Load from localStorage on initialization
  const stored = localStorage.getItem('colorSystem');
  return stored ? JSON.parse(stored) : defaultState;
});

// Auto-save to localStorage on every change
useEffect(() => {
  localStorage.setItem('colorSystem', JSON.stringify(colorSystem));
}, [colorSystem]);
```

### Color Addition Flow

1.  User selects/enters color in Settings
2.  `addCustomAccentColor()` creates color object
3.  Context state updates immediately
4.  All subscribed components re-render automatically
5.  New color is set as active accent color

### Color Storage Format

```json
{
  "customAccentColors": [
    {
      "name": "Brand Blue",
      "value": "custom_brandblue_1234567890",
      "tailwindClass": "custom-brandblue_1234567890",
      "hexValue": "#1E40AF",
      "isCustom": true
    }
  ],
  "customLightBackgrounds": [],
  "customDarkBackgrounds": []
}
```

## Available Context Methods

```typescript
interface ColorSystemContextType {
  // State
  colorSystem: ColorSystemState;

  // Getters
  getAllAccentColors: () => AccentColor[];
  getAllLightBackgrounds: () => BackgroundColor[];
  getAllDarkBackgrounds: () => BackgroundColor[];

  // Actions
  addCustomAccentColor: (name: string, hexColor: string) => AccentColor | null;
  removeAccentColor: (value: string) => boolean;
  updateAccentColor: (value: string, name: string, hexColor?: string) => boolean;
  // ... background methods
}
```

## Usage Patterns

### Basic Color Usage

```typescript
function MyComponent({ accentColor }) {
  const colorSystem = useColorSystemContext();
  const accentHex = getAccentHex(accentColor, colorSystem.getAllAccentColors());

  return <div style={{ color: accentHex }}>Content</div>;
}
```

### Tailwind Classes

```typescript
function MyComponent({ accentColor }) {
  const colorSystem = useColorSystemContext();
  const classes = getAccentClasses(accentColor, colorSystem.getAllAccentColors());

  return <button className={`${classes.bg} ${classes.hover}`}>Button</button>;
}
```

### Adding Custom Colors Programmatically

```typescript
function MyComponent() {
  const colorSystem = useColorSystemContext();

  const addBrandColor = () => {
    const newColor = colorSystem.addCustomAccentColor('Brand Color', '#1E40AF');
    if (newColor) {
      // Color added successfully and available immediately
      console.log('Added:', newColor.value);
    }
  };

  return <button onClick={addBrandColor}>Add Brand Color</button>;
}
```

## Key Improvements

### Immediate Reactivity

*   No page refresh needed
*   All components update instantly
*   Real-time color preview

### Smart Input Handling

*   Automatic hex validation and normalization
*   User-friendly error handling
*   Flexible input formats (with or without #)

### Persistent State

*   Automatic localStorage synchronization
*   Cross-session persistence
*   Reliable state recovery

## Migration from Old System

If migrating from the old hook-based system:

1.  **Replace hook import**:

    ```typescript
    // Old
    import { useColorSystem } from '../hooks/useColorSystem';

    // New
    import { useColorSystemContext } from '../contexts/ColorSystemContext';
    ```
2.  **Update hook usage**:

    ```typescript
    // Old
    const colorSystem = useColorSystem();

    // New
    const colorSystem = useColorSystemContext();
    ```
3.  **Ensure Context provider** is wrapping your app
4.  **Remove any manual force update logic** - now automatic

## Best Practices

1.  **Always use the Context** - Don't bypass the color system
2.  **Pass custom colors to utilities** - Include `getAllAccentColors()` result
3.  **Handle edge cases** - System provides safe fallbacks
4.  **Test with custom colors** - Verify components work with user colors
5.  **Leverage reactivity** - Trust the automatic updates

## Troubleshooting

### Colors not updating immediately

*   Verify you're using `useColorSystemContext()`
*   Check that the Context provider wraps your component tree
*   Ensure you're passing `getAllAccentColors()` to utility functions

### Custom colors not persisting

*   Check localStorage permissions
*   Verify JSON serialization isn't failing
*   Look for console errors during save/load

### Performance concerns

*   The Context system is optimized for performance
*   Only components using colors re-render on changes
*   localStorage operations are batched and efficient

## History Screen - Week View

The current day should not be highlighted in the week view of the history screen. The accent color is used to highlight the total time spent on each day.