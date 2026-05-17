import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    // Request permissions from Android System
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        console.warn('Push notifications permission was denied by the user.');
      }
    });

    // Capture the registered FCM push token and register to database
    PushNotifications.addListener('registration', async (token) => {
      console.log('Mobile device FCM token generated successfully:', token.value);
      try {
        await fetch('/api/user/push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, pushToken: token.value })
        });
      } catch (err) {
        console.error('Failed to register FCM push token to workforce backend:', err);
      }
    });

    // Show native-looking Toast in-app when notification arrives in the foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      toast.info(notification.title || 'Workforce System Notification', {
        description: notification.body,
        duration: 5000,
      });
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId]);
}
