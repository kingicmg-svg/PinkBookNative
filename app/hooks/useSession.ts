import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { StorageService } from '../services/StorageService';

interface SessionState {
  userId?: string;
  authToken?: string;
  lastActive: number;
  webViewState?: string;
}

export class SessionManager {
  private static instance: SessionManager;
  private appState: AppStateStatus = AppState.currentState;
  private sessionTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: SessionState) => void> = new Set();
  private currentSession: SessionState | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!this.instance) {
      this.instance = new SessionManager();
    }
    return this.instance;
  }

  async initialize() {
    // Restore session from storage
    this.currentSession = await StorageService.getSession();
    if (!this.currentSession) {
      this.currentSession = { lastActive: Date.now() };
    }

    // Subscribe to app state changes
    AppState.addEventListener('change', this.handleAppStateChange);

    // Start session heartbeat (every 30s)
    this.startSessionHeartbeat();
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (this.appState !== nextAppState) {
      if (nextAppState === 'background') {
        await this.onAppBackground();
      } else if (nextAppState === 'active') {
        await this.onAppResume();
      }

      this.appState = nextAppState;
    }
  };

  private async onAppBackground() {
    console.log('[SessionManager] App backgrounded');

    // Save session snapshot
    if (this.currentSession) {
      this.currentSession.lastActive = Date.now();
      await StorageService.saveSession(this.currentSession);
    }

    // Stop heartbeat during background
    this.stopSessionHeartbeat();
  }

  private async onAppResume() {
    console.log('[SessionManager] App resumed');

    // Restore session
    const session = await StorageService.getSession();
    if (session) {
      this.currentSession = session;
      this.notifyListeners();
    }

    // Restart heartbeat
    this.startSessionHeartbeat();
  }

  private startSessionHeartbeat() {
    this.sessionTimer = setInterval(async () => {
      if (this.currentSession) {
        this.currentSession.lastActive = Date.now();
        await StorageService.saveSession(this.currentSession);
      }
    }, 30000); // Every 30 seconds
  }

  private stopSessionHeartbeat() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  updateSession(partial: Partial<SessionState>) {
    if (!this.currentSession) {
      this.currentSession = { lastActive: Date.now() };
    }
    this.currentSession = { ...this.currentSession, ...partial };
    this.notifyListeners();
  }

  getSession(): SessionState | null {
    return this.currentSession;
  }

  subscribe(listener: (state: SessionState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    if (this.currentSession) {
      this.listeners.forEach((listener) => listener(this.currentSession!));
    }
  }

  async clearSession() {
    await StorageService.removeSession();
    this.currentSession = null;
    this.stopSessionHeartbeat();
  }

  destroy() {
    this.stopSessionHeartbeat();
    // @ts-ignore - AppState.removeEventListener exists at runtime
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
}

// Hook for React components
export function useSession() {
  const [session, setSession] = React.useState<SessionState | null>(null);

  React.useEffect(() => {
    const manager = SessionManager.getInstance();
    const unsubscribe = manager.subscribe(setSession);

    return unsubscribe;
  }, []);

  return session;
}