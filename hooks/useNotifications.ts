import { useUser } from '@/context/UserContext';
import { registerForPushNotificationsAsync } from '@/scripts/util';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,    
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { isLoggedIn, user } = useUser();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isLoggedIn && user) {
      setupNotificationListeners();
      initializePushNotifications();
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isLoggedIn, user]);

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received in foreground:', notification);
      
      const data = notification.request.content.data;
      if (data?.chatRoomId) {
        console.log('💬 New message in room:', data.chatRoomId);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User tapped notification:', response);
      
      const { data } = response.notification.request.content;
      if (data?.chatRoomId) {
        console.log('🔓 Opening chat room:', data.chatRoomId);
      }
    });
  };

  const initializePushNotifications = async () => {
    try {
      if (isLoggedIn && user) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('✅ Push notifications registered successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };

  return {

  };
}