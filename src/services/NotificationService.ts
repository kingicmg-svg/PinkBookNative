import * as Notifications from 'expo-notifications';

export class NotificationService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      this.initialized = true;
    } catch (error) {
      console.warn('Notification setup skipped:', error);
    }
  }

  static async getPushToken(): Promise<string> {
    return 'expo-push-token-mock';
  }

  static async subscribeToWaitlist(email: string, expoToken: string) {
    console.log('Waitlist subscription (Firebase not configured):', email);
  }

  static onNotificationReceived(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationResponseListener(({ notification }) => {
      callback(notification);
    });
  }
}
