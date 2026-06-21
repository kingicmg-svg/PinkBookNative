/**
 * useBiometricAuth — Face ID / Touch ID helper
 *
 * Usage:
 *   const bio = useBiometricAuth();
 *
 *   // After a successful password login, offer to enable Face ID:
 *   await bio.saveCredentials(email, password);
 *
 *   // On login screen load, if credentials are saved show Face ID button:
 *   if (bio.available && bio.hasSavedCredentials) { ... }
 *
 *   // When the user taps "Sign in with Face ID":
 *   const creds = await bio.authenticateAndGetCredentials();
 *   if (creds) { // use creds.email + creds.password to log in
 *   }
 *
 *   // Remove saved credentials (e.g. on sign-out):
 *   await bio.clearCredentials();
 */
import { useState, useEffect, useCallback } from 'react';

// Lazy-require so the hook degrades gracefully if native module isn't linked yet
// (e.g. first build before pod install picks up expo-local-authentication)
let _LocalAuth: typeof import('expo-local-authentication') | null = null;
let _SecureStore: typeof import('expo-secure-store') | null = null;
try { _LocalAuth  = require('expo-local-authentication'); } catch { /* not linked yet */ }
try { _SecureStore = require('expo-secure-store'); } catch { /* not linked yet */ }

const CREDS_KEY = 'pinkbook_biometric_credentials';

export interface BiometricCredentials {
  email: string;
  password: string;
}

export interface UseBiometricAuthResult {
  /** Whether the device supports biometrics and has enrolled face/fingerprint. */
  available: boolean;
  /** Whether credentials are saved for biometric sign-in. */
  hasSavedCredentials: boolean;
  /** Human-readable label: 'Face ID', 'Touch ID', or 'Biometrics'. */
  biometricLabel: string;
  /** Save email+password in SecureStore for future biometric auth. */
  saveCredentials: (email: string, password: string) => Promise<void>;
  /** Prompt Face ID / Touch ID, then return saved credentials on success. */
  authenticateAndGetCredentials: () => Promise<BiometricCredentials | null>;
  /** Remove saved credentials (call on sign-out). */
  clearCredentials: () => Promise<void>;
}

export function useBiometricAuth(): UseBiometricAuthResult {
  const [available, setAvailable]                   = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [biometricLabel, setBiometricLabel]           = useState('Face ID');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!_LocalAuth || !_SecureStore) return; // native module not linked yet
      const hasHardware    = await _LocalAuth.hasHardwareAsync();
      const isEnrolled     = await _LocalAuth.isEnrolledAsync();
      const supported      = await _LocalAuth.supportedAuthenticationTypesAsync();

      const isAvailable = hasHardware && isEnrolled;
      if (!mounted) return;
      setAvailable(isAvailable);

      // Determine label
      if (supported.includes(_LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricLabel('Face ID');
      } else if (supported.includes(_LocalAuth.AuthenticationType.FINGERPRINT)) {
        setBiometricLabel('Touch ID');
      } else {
        setBiometricLabel('Biometrics');
      }

      // Check if creds are already stored
      if (isAvailable) {
        const stored = await _SecureStore.getItemAsync(CREDS_KEY).catch(() => null);
        if (mounted) setHasSavedCredentials(!!stored);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveCredentials = useCallback(async (email: string, password: string) => {
    if (!_SecureStore) return;
    await _SecureStore.setItemAsync(CREDS_KEY, JSON.stringify({ email, password }));
    setHasSavedCredentials(true);
  }, []);

  const authenticateAndGetCredentials = useCallback(async (): Promise<BiometricCredentials | null> => {
    if (!_LocalAuth || !_SecureStore) return null;
    const result = await _LocalAuth.authenticateAsync({
      promptMessage: 'Sign in to PinkBook',
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    if (!result.success) return null;

    const stored = await _SecureStore.getItemAsync(CREDS_KEY).catch(() => null);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as BiometricCredentials;
    } catch {
      return null;
    }
  }, []);

  const clearCredentials = useCallback(async () => {
    if (!_SecureStore) return;
    await _SecureStore.deleteItemAsync(CREDS_KEY).catch(() => {});
    setHasSavedCredentials(false);
  }, []);

  return {
    available,
    hasSavedCredentials,
    biometricLabel,
    saveCredentials,
    authenticateAndGetCredentials,
    clearCredentials,
  };
}
