'use strict';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint:         'https://oauth2.googleapis.com/token',
};

/**
 * Google OAuth hook.
 *
 * For native iOS/Android: pass `iosClientId` (created in GCP as an iOS-type
 * OAuth client with bundle ID com.pinkbook.app). The redirect URI is derived
 * from the reverse client ID automatically.
 *
 * If only a web `clientId` is available, Google will reject the pinkbook://
 * redirect — `ready` will be false so the Google button is hidden.
 *
 * To enable Google Sign-In on native:
 *  1. Go to console.cloud.google.com → Credentials → Create OAuth Client → iOS
 *  2. Bundle ID: com.pinkbook.app
 *  3. Add the generated client ID to EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env
 *  4. Add the reverse client ID (e.g. com.googleusercontent.apps.NUMBERS) to
 *     app.json under expo.ios.bundleIdentifier and as a URL scheme.
 */
export function useGoogleAuth(clientId: string | null, iosClientId?: string | null) {
  // On native, prefer the iOS client ID which generates a valid native redirect URI.
  const activeClientId = (Platform.OS === 'ios' || Platform.OS === 'android')
    ? (iosClientId || null)
    : clientId;

  // For iOS clients the redirect URI must be the reverse-DNS of the client ID.
  // e.g. com.googleusercontent.apps.REVERSE_CLIENT_ID:/oauth2redirect
  const redirectUri = activeClientId
    ? AuthSession.makeRedirectUri({
        native: `${activeClientId.split('.').reverse().join('.')}:/oauth2redirect`,
      })
    : AuthSession.makeRedirectUri({ scheme: 'pinkbook' });

  const [nonce, setNonce] = useState<string>('');
  useEffect(() => {
    Crypto.getRandomBytesAsync(16).then(bytes => {
      setNonce(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    });
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId:         activeClientId || '__placeholder__',
      responseType:     AuthSession.ResponseType.IdToken,
      scopes:           ['openid', 'email', 'profile'],
      redirectUri,
      extraParams:      nonce ? { nonce } : {},
      usePKCE:          false,
    },
    DISCOVERY,
  );

  const idToken: string | null =
    response?.type === 'success' ? (response.params?.id_token ?? null) : null;

  // Only signal ready when we have a working native client ID on native platforms.
  // Without an iOS client ID, Google rejects pinkbook:// redirects (Error 400).
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const hasWorkingClientId = isNative ? !!activeClientId : !!clientId;

  return {
    ready:       !!request && hasWorkingClientId && !!nonce,
    promptAsync: () => promptAsync(),
    idToken,
    response,
  };
}
