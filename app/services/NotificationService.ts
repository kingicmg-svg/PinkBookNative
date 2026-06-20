import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Native notification helper.
 *
 * NOTE ON DELIVERY: Remote (server-pushed) notifications require an EAS
 * projectId configured in app.json AND a backend delivery path that talks to
 * the Expo Push API. The PinkBook backend currently delivers via Web Push
 * (VAPID), which is consumed by the PWA service worker — not by Expo tokens.
 * Until an EAS projectId is configured, getPushToken() returns null and the
 * app falls back to local notifications + the in-WebView Web Push channel.
 */
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
          // expo-notifications SDK 51+ fields
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Notification setup skipped:', error);
    }
  }

  /** Requests permission and returns an Expo push token, or null if unavailable. */
  static async getPushToken(): Promise<string | null> {
    try {
      const existing = await Notifications.getPermissionsAsync();
      let granted = existing.granted;
      if (!granted) {
        const req = await Notifications.requestPermissionsAsync();
        granted = req.granted;
      }
      if (!granted) return null;

      // Remote push tokens require an EAS projectId. Without it, Expo cannot
      // mint a token, so we stay on local notifications only.
      const projectId =
        (Constants.expoConfig as any)?.extra?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId ||
        null;
      if (!projectId) {
        console.warn('Expo push token unavailable: no EAS projectId configured.');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch (error) {
      console.warn('Failed to get push token:', error);
      return null;
    }
  }

  static onNotificationReceived(
    callback: (notification: Notifications.Notification) => void,
  ) {
    return Notifications.addNotificationResponseReceivedListener(({ notification }) => {
      callback(notification);
    });
  }
}
