import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/StorageService';

export type AuthRole = 'owner' | 'client' | null;

export interface AuthState {
  token: string | null;
  role: AuthRole;
  isLoading: boolean;
}

/** Decode role from JWT payload without a library. */
export function decodeRole(token: string): AuthRole {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(padded));
    const role = decoded.role;
    if (role === 'owner' || role === 'client') return role;
    return null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: null,
    role: null,
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    const stored = await StorageService.getToken();
    if (stored?.token) {
      const role = decodeRole(stored.token);
      setState({ token: stored.token, role, isLoading: false });
    } else {
      setState({ token: null, role: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (token: string) => {
    const role = decodeRole(token);
    if (!role) throw new Error('Invalid token: no role');
    await StorageService.saveToken(token, role);
    setState({ token, role, isLoading: false });
    return role;
  }, []);

  const signOut = useCallback(async () => {
    await StorageService.removeToken();
    setState({ token: null, role: null, isLoading: false });
  }, []);

  return { ...state, signIn, signOut, refresh };
}
