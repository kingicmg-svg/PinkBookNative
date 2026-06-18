import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator, View, Text } from 'react-native';
import { PinkBookWebView } from './components/PinkBookWebView';
import { CameraService } from './services/CameraService';
import { AIService } from './services/AIService';
import { NotificationService } from './services/NotificationService';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Request camera permissions
        const cameraAllowed = await CameraService.requestPermissions();
        if (!cameraAllowed) {
          throw new Error('Camera permission denied');
        }

        // Initialize AI service
        const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY not set');
        }
        AIService.initialize(anthropicKey);

        // Initialize notifications
        await NotificationService.initialize();

        // Set up notification listener
        NotificationService.onNotificationReceived((notification) => {
          console.log('Notification received:', notification);
        });

        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ padding: 20 }}>
          <View
            style={{
              padding: 16,
              backgroundColor: '#fee',
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#f44',
            }}
          >
            <Text style={{ color: '#c00', fontSize: 16, fontWeight: 'bold' }}>
              Initialization Error
            </Text>
            <Text style={{ color: '#c00', marginTop: 8 }}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!initialized) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </SafeAreaView>
    );
  }

  const pinkbookUrl =
    process.env.EXPO_PUBLIC_PINKBOOK_API_URL || 'https://www.pinkbook.app';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PinkBookWebView url={pinkbookUrl} />
    </SafeAreaView>
  );
}
