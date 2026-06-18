import React, { useRef, useEffect, useState } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StyleSheet, View, useSafeAreaInsets } from 'react-native';
import { CameraService } from '../services/CameraService';
import { AIService } from '../services/AIService';
import { StorageService } from '../services/StorageService';

interface NativeMessage {
  type: 'camera' | 'file' | 'ai' | 'storage' | 'notification';
  action: string;
  data?: any;
  id?: string;
}

interface NativeResponse {
  id?: string;
  success: boolean;
  data?: any;
  error?: string;
}

export const PinkBookWebView: React.FC<{ url: string }> = ({ url }) => {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Restore session from storage on load
    (async () => {
      const session = await StorageService.getSession();
      setSessionReady(!!session);
    })();
  }, []);

  const sendMessageToWeb = (message: NativeResponse) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const message: NativeMessage = JSON.parse(event.nativeEvent.data);
      const response: NativeResponse = {
        id: message.id,
        success: false,
      };

      switch (message.type) {
        case 'camera':
          if (message.action === 'capture') {
            const photoUri = await CameraService.capturePhoto();
            response.success = true;
            response.data = { uri: photoUri };
          } else if (message.action === 'stream') {
            // Real-time camera stream for processing
            const stream = await CameraService.getVideoStream();
            response.success = true;
            response.data = { stream };
          }
          break;

        case 'ai':
          if (message.action === 'analyze-photo') {
            const { imageUri, prompt } = message.data;
            const result = await AIService.analyzeImage(imageUri, prompt);
            response.success = true;
            response.data = result;
          } else if (message.action === 'chat') {
            const { messages } = message.data;
            const result = await AIService.chat(messages);
            response.success = true;
            response.data = result;
          } else if (message.action === 'vision') {
            const { imageUri } = message.data;
            const analysis = await AIService.vision(imageUri);
            response.success = true;
            response.data = analysis;
          }
          break;

        case 'storage':
          if (message.action === 'set') {
            const { key, value } = message.data;
            await StorageService.set(key, value);
            response.success = true;
          } else if (message.action === 'get') {
            const { key } = message.data;
            const value = await StorageService.get(key);
            response.success = true;
            response.data = { value };
          } else if (message.action === 'saveSession') {
            const { sessionData } = message.data;
            await StorageService.saveSession(sessionData);
            response.success = true;
          }
          break;

        case 'notification':
          if (message.action === 'registerForPush') {
            // Handled by NotificationService
            response.success = true;
            response.data = { registered: true };
          }
          break;

        default:
          response.error = `Unknown message type: ${message.type}`;
      }

      sendMessageToWeb(response);
    } catch (error) {
      const response: NativeResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      sendMessageToWeb(response);
    }
  };

  // Bridge script injected into WebView
  const bridgeScript = `
    window.NativeBridge = {
      send: (type, action, data = {}) => {
        return new Promise((resolve, reject) => {
          const id = Math.random().toString(36).slice(2);
          const handler = (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message.id === id) {
                document.removeEventListener('message', handler);
                if (message.success) {
                  resolve(message.data);
                } else {
                  reject(new Error(message.error || 'Native call failed'));
                }
              }
            } catch (e) {}
          };
          document.addEventListener('message', handler);
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type, action, data, id })
          );
          setTimeout(() => reject(new Error('Native call timeout')), 30000);
        });
      },
      camera: {
        capture: () => window.NativeBridge.send('camera', 'capture'),
        stream: () => window.NativeBridge.send('camera', 'stream'),
      },
      ai: {
        analyzePhoto: (uri, prompt) =>
          window.NativeBridge.send('ai', 'analyze-photo', { imageUri: uri, prompt }),
        chat: (messages) =>
          window.NativeBridge.send('ai', 'chat', { messages }),
        vision: (uri) =>
          window.NativeBridge.send('ai', 'vision', { imageUri: uri }),
      },
      storage: {
        get: (key) => window.NativeBridge.send('storage', 'get', { key }),
        set: (key, value) => window.NativeBridge.send('storage', 'set', { key, value }),
        saveSession: (data) => window.NativeBridge.send('storage', 'saveSession', { sessionData: data }),
      },
      notification: {
        register: () => window.NativeBridge.send('notification', 'registerForPush'),
      },
    };
  `;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={handleWebViewMessage}
        injectedJavaScript={bridgeScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        originWhitelist={['*']}
        startInLoadingState={true}
        scalePageToFit={true}
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
