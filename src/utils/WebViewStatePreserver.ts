import { WebView } from 'react-native-webview';
import { StorageService } from '../services/StorageService';

interface WebViewSnapshot {
  url: string;
  scrollPosition: { x: number; y: number };
  formData: Record<string, any>;
  timestamp: number;
}

export class WebViewStatePreserver {
  private static webViewRef: WebView | null = null;

  static setRef(ref: WebView | null) {
    this.webViewRef = ref;
  }

  static async captureState(currentUrl: string): Promise<void> {
    if (!this.webViewRef) return;

    try {
      // Inject script to capture page state
      const script = `
        (function() {
          const scrollPos = { x: window.scrollX, y: window.scrollY };
          const formData = {};
          document.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.id || el.name) {
              const key = el.id || el.name;
              if (el.type === 'checkbox' || el.type === 'radio') {
                formData[key] = el.checked;
              } else {
                formData[key] = el.value;
              }
            }
          });
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'webViewState',
            scrollPos,
            formData
          }));
        })();
      `;

      await this.webViewRef.injectJavaScript(script);

      // Save state
      const snapshot: WebViewSnapshot = {
        url: currentUrl,
        scrollPosition: { x: 0, y: 0 },
        formData: {},
        timestamp: Date.now(),
      };

      await StorageService.set('webview_snapshot', snapshot);
    } catch (error) {
      console.error('[WebViewStatePreserver] Capture failed:', error);
    }
  }

  static async restoreState(webViewRef: WebView): Promise<WebViewSnapshot | null> {
    try {
      const snapshot = await StorageService.get('webview_snapshot');
      if (!snapshot) return null;

      // Check if snapshot is fresh (< 1 hour old)
      if (Date.now() - snapshot.timestamp > 3600000) {
        await StorageService.remove('webview_snapshot');
        return null;
      }

      // Restore scroll position
      if (snapshot.scrollPosition) {
        const restoreScript = `
          window.scrollTo(${snapshot.scrollPosition.x}, ${snapshot.scrollPosition.y});
        `;
        await webViewRef.injectJavaScript(restoreScript);
      }

      // Restore form data
      if (Object.keys(snapshot.formData).length > 0) {
        const restoreFormScript = `
          (function() {
            const formData = ${JSON.stringify(snapshot.formData)};
            Object.entries(formData).forEach(([key, value]) => {
              const el = document.getElementById(key) || document.querySelector('[name="' + key + '"]');
              if (el) {
                if (el.type === 'checkbox' || el.type === 'radio') {
                  el.checked = value;
                } else {
                  el.value = value;
                }
              }
            });
          })();
        `;
        await webViewRef.injectJavaScript(restoreFormScript);
      }

      return snapshot;
    } catch (error) {
      console.error('[WebViewStatePreserver] Restore failed:', error);
      return null;
    }
  }

  static async clearSnapshot(): Promise<void> {
    await StorageService.remove('webview_snapshot');
  }
}
