import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  mealRemindersEnabled: boolean;
  reminderTime: string;
  timezone: string;
}

export interface NotificationHistory {
  id: number;
  title: string;
  body: string;
  status: string;
  sentAt: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions and register device
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo push token and register with backend
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '8f33b5e3-1234-5678-9abc-def012345678', // This should be your Expo project ID
      });

      this.expoPushToken = token.data;

      // Register token with backend
      await api.post('/api/notifications/register-device', {
        token: token.data,
        deviceType: Platform.OS,
        isActive: true
      });

      console.log('Successfully registered for push notifications:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDevice(): Promise<void> {
    try {
      if (this.expoPushToken) {
        await api.delete(`/api/notifications/unregister-device/${this.expoPushToken}`);
        this.expoPushToken = null;
        console.log('Successfully unregistered device');
      }
    } catch (error) {
      console.error('Error unregistering device:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await api.get('/api/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    try {
      const response = await api.put('/api/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return null;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limit: number = 20): Promise<NotificationHistory[]> {
    try {
      const response = await api.get(`/api/notifications/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, seconds: number = 5): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { source: 'local' },
        },
        trigger: { seconds },
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  handleNotificationTap(notification: Notifications.NotificationResponse, navigation: any): void {
    const data = notification.notification.request.content.data;
    
    if (data?.type === 'meal_reminder') {
      // Navigate to meal plans screen
      navigation.navigate('MealPlanRequest');
    } else if (data?.type === 'grocery_reminder') {
      // Navigate to grocery lists screen
      navigation.navigate('GroceryLists');
    } else {
      // Default navigation to home
      navigation.navigate('Home');
    }
  }
}

export const notificationService = new NotificationService();