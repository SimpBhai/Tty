import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem } from '../types';
import { soundEngine } from '../audio/soundEffects';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  requestPermission: () => Promise<void>;
  permissionGranted: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aegiscord_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    soundEngine.setMuted(!soundEnabled);
    localStorage.setItem('aegiscord_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const status = await Notification.requestPermission();
        setPermissionGranted(status === 'granted');
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

    // Sound cues
    if (soundEnabled) {
      if (notif.type === 'mention') {
        soundEngine.playMentionAlert();
      } else if (notif.type === 'message') {
        soundEngine.playMessagePing();
      }
    }

    // System Desktop Notification
    if (permissionGranted && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(notif.title, {
          body: notif.body,
          icon: '/icon-192.png',
        });
      } catch {}
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        requestPermission,
        permissionGranted,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
