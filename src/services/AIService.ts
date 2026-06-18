/**
 * AIService - Native AI bridge (stub)
 *
 * The @anthropic-ai/sdk uses Node.js built-ins (node:fs) which don't exist in React Native.
 * AI is handled by the PinkBook web app (https://www.pinkbook.app) which runs in the WebView.
 * This stub exists to keep the NativeBridge API surface stable.
 */

export class AIService {
  static initialize(_apiKey: string) {
    console.warn('[AIService] Native AI disabled — use web app for AI features');
  }

  static async analyzeImage(_imageUri: string, _prompt: string): Promise<any> {
    throw new Error('AI not available natively — use web app for image analysis');
  }

  static async vision(_imageUri: string): Promise<any> {
    throw new Error('AI not available natively — use web app for vision');
  }

  static async chat(_messages: Array<{ role: string; content: string }>): Promise<any> {
    throw new Error('AI not available natively — use web app for chat');
  }

  static async restoreConversation() {
    // No-op
  }

  static clearConversation() {
    // No-op
  }
}