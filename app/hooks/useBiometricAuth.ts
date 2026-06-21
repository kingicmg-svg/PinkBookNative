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
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

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
      const hasHardware    = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled     = await LocalAuthentication.isEnrolledAsync();
      const supported      = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const isAvailable = hasHardware && isEnrolled;
      if (!mounted) return;
      setAvailable(isAvailable);

      // Determine label
      if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricLabel('Face ID');
      } else if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricLabel('Touch ID');
      } else {
        setBiometricLabel('Biometrics');
      }

      // Check if creds are already stored
      if (isAvailable) {
        const stored = await SecureStore.getItemAsync(CREDS_KEY).catch(() => null);
        if (mounted) setHasSavedCredentials(!!stored);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveCredentials = useCallback(async (email: string, password: string) => {
    await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify({ email, password }));
    setHasSavedCredentials(true);
  }, []);

  const authenticateAndGetCredentials = useCallback(async (): Promise<BiometricCredentials | null> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to PinkBook',
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    if (!result.success) return null;

    const stored = await SecureStore.getItemAsync(CREDS_KEY).catch(() => null);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as BiometricCredentials;
    } catch {
      return null;
    }
  }, []);

  const clearCredentials = useCallback(async () => {
    await SecureStore.deleteItemAsync(CREDS_KEY).catch(() => {});
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
