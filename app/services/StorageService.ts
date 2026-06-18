import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
  private static SESSION_KEY = '@pinkbook_session';
  private static CACHE_PREFIX = '@pinkbook_cache_';

  static async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(this.CACHE_PREFIX + key, jsonValue);
    } catch (error) {
      throw new Error(`Storage set failed: ${error}`);
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      throw new Error(`Storage get failed: ${error}`);
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      throw new Error(`Storage remove failed: ${error}`);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      throw new Error(`Storage clear failed: ${error}`);
    }
  }

  static async saveSession(sessionData: any): Promise<void> {
    try {
      const session = {
        data: sessionData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      throw new Error(`Session save failed: ${error}`);
    }
  }

  static async getSession(): Promise<any> {
    try {
      const session = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!session) return null;

      const parsed = JSON.parse(session);

      // Check expiration
      if (parsed.expiresAt < Date.now()) {
        await this.removeSession();
        return null;
      }

      return parsed.data;
    } catch (error) {
      throw new Error(`Session get failed: ${error}`);
    }
  }

  static async removeSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      throw new Error(`Session remove failed: ${error}`);
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter((k) => k.startsWith(this.CACHE_PREFIX));
    } catch (error) {
      throw new Error(`Get all keys failed: ${error}`);
    }
  }
}
