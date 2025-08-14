# Notification System

The application features a custom notification system that replaces native browser alerts and confirms with styled, consistent notifications that match the app's design.

## Architecture

The notification system consists of several components:

- **`Notification.tsx`** - Individual notification component
- **`NotificationContainer.tsx`** - Container that manages multiple notifications
- **`useNotifications.ts`** - Hook for notification state management
- **`NotificationContext.tsx`** - React context for global notification access

## Components

### Notification Component

The `Notification` component renders individual notifications with the following features:

- **5 notification types**: `success`, `error`, `warning`, `info`, `confirm`
- **Smooth animations**: Slide-in from right with fade and scale effects
- **Auto-dismiss**: Configurable duration (default 5 seconds, disabled for confirm)
- **Manual dismiss**: Close button for non-confirm notifications
- **Responsive design**: Works on all screen sizes

#### Props

```typescript
interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message?: string;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: (id: string) => void;
}
```

#### Visual Design

- **Icons**: Simple, colored icons without backgrounds for each type
- **Layout**: Icon and title on same line, message below
- **Buttons**: 
  - Regular notifications: Close button (×) in top-right
  - Confirm notifications: "Confirm" and "Cancel" buttons, no close button
- **Styling**: Rounded corners, subtle shadows, matches app theme

### Notification Container

Manages the positioning and stacking of multiple notifications:

- **Fixed positioning**: Top-right corner of screen
- **Stacking**: Multiple notifications stack vertically with slight offset
- **Z-index management**: Ensures proper layering

### useNotifications Hook

Provides notification management functionality:

```typescript
const {
  notifications,
  showSuccess,
  showError, 
  showWarning,
  showInfo,
  showConfirm,
  confirm,
  alert
} = useNotifications();
```

#### Methods

- **`showSuccess(title, message?, duration?)`** - Show success notification
- **`showError(title, message?, duration?)`** - Show error notification  
- **`showWarning(title, message?, duration?)`** - Show warning notification
- **`showInfo(title, message?, duration?)`** - Show info notification
- **`showConfirm(title, message?, onConfirm?, onCancel?)`** - Show confirmation dialog
- **`confirm(message)`** - Promise-based confirmation (replaces `window.confirm`)
- **`alert(message, type?)`** - Simple alert (replaces `window.alert`)

## Usage

### Basic Notifications

```typescript
import { useNotificationContext } from '../contexts/NotificationContext';

const { showSuccess, showError } = useNotificationContext();

// Success notification
showSuccess('Task completed', 'Your task has been saved successfully');

// Error notification  
showError('Save failed', 'Unable to save task. Please try again.');
```

### Confirmation Dialogs

```typescript
// Promise-based confirmation
const confirmed = await confirm('Delete this task? This cannot be undone.');
if (confirmed) {
  deleteTask();
}

// Or with custom handlers
showConfirm(
  'Delete task?',
  'This will remove all recorded time.',
  () => deleteTask(),
  () => console.log('Cancelled')
);
```

### Replacing Browser Dialogs

The system provides drop-in replacements for native browser dialogs:

```typescript
// Instead of: window.confirm('Delete item?')
const confirmed = await confirm('Delete item?');

// Instead of: window.alert('Operation complete')
alert('Operation complete', 'success');
```

## Integration

### App Setup

The notification system is integrated at the app root level:

```typescript
function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
```

### Component Usage

Components can access notifications through the context:

```typescript
const { confirm, showSuccess } = useNotificationContext();

const handleDelete = async () => {
  const confirmed = await confirm('Are you sure?');
  if (confirmed) {
    // Perform deletion
    showSuccess('Deleted successfully');
  }
};
```

## Styling

Notifications use Tailwind CSS classes and follow the app's design system:

- **Colors**: Match the app's color palette for each type
- **Typography**: Consistent with app fonts and sizes  
- **Spacing**: Uses app's spacing scale
- **Animations**: Smooth transitions using CSS transforms
- **Dark mode**: Full support with appropriate color adjustments

## Animation Details

- **Entrance**: Slide in from right with scale and opacity animation (300ms)
- **Exit**: Slide out to right with scale and opacity animation (300ms)
- **Timing**: Uses `ease-out-smooth` timing function for natural feel
- **Stacking**: Multiple notifications animate independently

## Accessibility

- **Keyboard navigation**: Buttons are focusable and keyboard accessible
- **Screen readers**: Proper ARIA labels and semantic HTML
- **Color contrast**: Meets WCAG guidelines for text contrast
- **Motion**: Respects `prefers-reduced-motion` setting

## Testing

Test notifications using the demo buttons in Settings panel:

- Success (✓) - Shows success notification
- Error (✗) - Shows error notification  
- Confirm (?) - Shows confirmation dialog

This allows developers and users to preview notification styles and behavior.