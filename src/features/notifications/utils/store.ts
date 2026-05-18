import { create } from 'zustand';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notifications) {
          const mapped: Notification[] = data.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.message,
            status: n.isRead ? ('read' as const) : ('unread' as const),
            createdAt: n.createdAt,
            actions: [
              {
                id: 'open-chat',
                label: 'Open chat',
                type: 'redirect',
                style: 'primary'
              }
            ]
          }));
          set({ notifications: mapped });
        }
      }
    } catch (err) {
      console.error('Failed to fetch backend notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    // 1. Update state locally for instant UI responsiveness
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'read' as const } : n
      )
    }));

    // 2. Persist to backend database
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationId: id })
      });
    } catch (err) {
      console.error('Failed to mark notification as read on backend:', err);
    }
  },

  markAllAsRead: async () => {
    // 1. Update state locally
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        status: 'read' as const
      }))
    }));

    // 2. Persist to database
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read on backend:', err);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
    })),

  unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
}));
