'use strict';
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint:         'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth(clientId: string | null) {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'pinkbook' });

  const [nonce, setNonce] = useState<string>('');
  useEffect(() => {
    Crypto.getRandomBytesAsync(16).then(bytes => {
      setNonce(Buffer.from(bytes).toString('hex'));
    });
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId:         clientId || '__placeholder__',
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

  return {
    ready:      !!request && !!clientId && !!nonce,
    promptAsync: () => promptAsync(),
    idToken,
    response,
  };
}
