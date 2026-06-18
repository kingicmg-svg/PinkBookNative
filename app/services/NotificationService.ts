import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import firebase from 'firebase/app';
import 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export class NotificationService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Request push notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    this.initialized = true;
  }

  static async getPushToken(): Promise<string> {
    if (!Device.isDevice) {
      throw new Error('Push notifications only work on physical devices');
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  }

  static async subscribeToWaitlist(email: string, expoToken: string) {
    try {
      const messaging = firebase.messaging();
      // Subscribe to waitlist topic
      await fetch(
        `https://iid.googleapis.com/iid/v1/${expoToken}/rel/topics/waitlist`,
        {
          method: 'POST',
          headers: {
            Authorization: `key=${process.env.EXPO_PUBLIC_FIREBASE_SERVER_KEY}`,
          },
        }
      );

      // Store subscription in Firestore
      const db = firebase.firestore();
      await db.collection('waitlist_subscribers').add({
        email,
        expoToken,
        subscribedAt: new Date(),
        platform: 'ios',
        appVersion: Constants.expoConfig?.version,
      });
    } catch (error) {
      throw new Error(`Failed to subscribe to waitlist: ${error}`);
    }
  }

  static onNotificationReceived(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationResponseListener(({ notification }) => {
      callback(notification);
    });
  }
}
