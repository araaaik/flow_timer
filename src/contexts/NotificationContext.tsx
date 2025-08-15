import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationContainer } from '../components/NotificationContainer';

interface NotificationContextType {
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  showConfirm: (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void) => string;
  confirm: (message: string) => Promise<boolean>;
  alert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  settings?: {
    audioNotifications?: boolean;
    soundVolume?: number;
    notificationSound?: string;
  };
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, settings }) => {
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    confirm,
    alert,
  } = useNotifications(settings);

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    confirm,
    alert,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
};