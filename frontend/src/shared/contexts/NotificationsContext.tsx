import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Notification } from '@/shared/types';
import { apiClient } from '@/shared/services/api';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.get<Notification[]>('/notifications')
        .then((data) => {
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Auto-update notifications every 12 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 12000);

    // Refresh immediately when window or tab regains focus
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.patch(`/notifications/${id}/read`, {}).catch(() => {});
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.patch('/notifications/read-all', {}).catch(() => {});
    }
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `NOT-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification, refresh: fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}
