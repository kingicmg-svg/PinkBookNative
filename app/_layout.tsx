import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

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
      </Stack>
    </SafeAreaProvider>
  );
}

