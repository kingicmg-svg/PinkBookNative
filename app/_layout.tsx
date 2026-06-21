import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from '../components/AnimatedSplash';
import { NotificationService } from './services/NotificationService';
import { StorageService } from './services/StorageService';
import { SettingsApi } from './services/ApiService';

// Keep native splash visible until AnimatedSplash takes over
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => { if (error) throw error; }, [error]);

  // Initialize notifications and register push token with backend
  useEffect(() => {
    NotificationService.initialize();
    (async () => {
      try {
        const pushToken = await NotificationService.getPushToken();
        if (!pushToken) return;
        const stored = await StorageService.getToken();
        if (!stored?.token) return;
        await SettingsApi.save(stored.token, { expoPushToken: pushToken });
      } catch {
        // Non-critical — silently skip
      }
    })();
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(owner-tabs)" />
        <Stack.Screen name="(consumer-tabs)" />
        <Stack.Screen name="auth/owner-login"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/owner-register" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/client-login"   options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/client-register" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/forgot-password"  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="owner/brand-studio"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/upgrade"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/help"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/policies"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/reviews"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/edit-profile"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/notifications"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="owner/availability"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="consumer/manage-booking" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="consumer/policies"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/[slug]"        options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
      {!splashDone && <AnimatedSplash onDone={() => setSplashDone(true)} />}
    </SafeAreaProvider>
  );
}

