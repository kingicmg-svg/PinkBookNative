export class NotificationService {
  static async getPushToken(): Promise<string> {
    return '';
  }

  static async subscribeToWaitlist(email: string, expoToken: string) {
    console.log('Waitlist subscription (Firebase not configured):', email);
  }

  static onNotificationReceived() {
    return { remove() {} };
  }
}
