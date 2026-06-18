import Anthropic from '@anthropic-ai/sdk';
import { CameraService } from './CameraService';
import { StorageService } from './StorageService';

export class AIService {
  private static client: Anthropic;
  private static conversationHistory: Array<{ role: string; content: string }> = [];

  static initialize(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      defaultHeaders: {
        'user-agent': 'pinkbook-native/1.0.0',
      },
    });
  }

  static async analyzeImage(imageUri: string, prompt: string): Promise<any> {
    if (!this.client) {
      throw new Error('AIService not initialized');
    }

    try {
      const base64Image = await CameraService.getBase64Photo(imageUri);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt || 'Analyze this image in detail.',
              },
            ],
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        analysis: text,
        model: response.model,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(`Image analysis failed: ${error}`);
    }
  }

  static async vision(imageUri: string): Promise<any> {
    return this.analyzeImage(
      imageUri,
      'Provide a detailed visual analysis of this image.'
    );
  }

  static async chat(messages: Array<{ role: string; content: string }>) {
    if (!this.client) {
      throw new Error('AIService not initialized');
    }

    try {
      // Add to conversation history
      this.conversationHistory.push(...messages);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: this.conversationHistory,
      });

      const assistantMessage =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Save conversation to storage
      await StorageService.set('conversation_history', this.conversationHistory);

      return {
        message: assistantMessage,
        model: response.model,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(`Chat failed: ${error}`);
    }
  }

  static async restoreConversation() {
    const history = await StorageService.get('conversation_history');
    if (history) {
      this.conversationHistory = JSON.parse(history);
    }
  }

  static clearConversation() {
    this.conversationHistory = [];
  }
}
