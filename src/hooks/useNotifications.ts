import { useState, useCallback, useMemo } from 'react';
import { NotificationProps } from '../components/Notification';
import { soundManager } from '../utils/soundManager';

interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  message?: string;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface SoundSettings {
  audioNotifications?: boolean;
  soundVolume?: number;
  notificationSound?: string;
}

export const useNotifications = (soundSettings?: SoundSettings) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  // Memoize sound settings to avoid unnecessary re-renders
  const memoizedSoundSettings = useMemo(() => soundSettings, [
    soundSettings?.audioNotifications,
    soundSettings?.soundVolume,
    soundSettings?.notificationSound
  ]);

  const playNotificationSound = useCallback(async () => {
    if (!memoizedSoundSettings?.audioNotifications) return;
    
    const soundId = memoizedSoundSettings.notificationSound || 'default';
    const volume = memoizedSoundSettings.soundVolume ?? 0.5;
    
    const sound = soundManager.findSoundById(soundId);
    if (sound) {
      try {
        await soundManager.playNotificationSound(sound.url, volume);
      } catch (error) {
        console.warn('Failed to play notification sound:', error);
      }
    }
  }, [memoizedSoundSettings]);

  const addNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const notification: NotificationProps = {
      id,
      title,
      type: options.type || 'info',
      message: options.message,
      duration: options.duration,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      onClose: removeNotification,
    };

    setNotifications(prev => [...prev, notification]);
    
    // Play sound for non-confirm notifications
    if (options.type !== 'confirm') {
      playNotificationSound();
    }
    
    return id;
  }, [playNotificationSound]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'success', message, duration });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'error', message, duration });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'warning', message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification(title, { type: 'info', message, duration });
  }, [addNotification]);

  const showConfirm = useCallback((
    title: string, 
    message?: string, 
    onConfirm?: () => void, 
    onCancel?: () => void
  ) => {
    return addNotification(title, { 
      type: 'confirm', 
      message, 
      duration: 0, // Confirm notifications don't auto-close
      onConfirm, 
      onCancel 
    });
  }, [addNotification]);

  // Helper function to replace window.confirm
  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showConfirm(
        'Confirm',
        message,
        () => resolve(true),
        () => resolve(false)
      );
    });
  }, [showConfirm]);

  // Helper function to replace window.alert
  const alert = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        return showSuccess('Success', message);
      case 'error':
        return showError('Error', message);
      case 'warning':
        return showWarning('Warning', message);
      default:
        return showInfo('Info', message);
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    confirm,
    alert,
  };
};