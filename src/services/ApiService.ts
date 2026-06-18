'use strict';

const API_URL =
  process.env.EXPO_PUBLIC_PINKBOOK_API_URL?.replace(/\/$/, '') ||
  'https://www.pinkbook.app';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch {}
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

// ── Owner auth ─────────────────────────────────────────────────────────────
export const OwnerApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ user: any; token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: (token: string) =>
    request<{ user: any }>('/api/v1/auth/me', {}, token),

  bookings: (token: string, params?: string) =>
    request<{ bookings: any[] }>(`/api/v1/bookings${params || ''}`, {}, token),

  clients: (token: string) =>
    request<{ clients: any[] }>('/api/v1/clients', {}, token),

  services: (token: string) =>
    request<{ settings: any }>('/api/v1/settings/get', {}, token),

  settings: (token: string) =>
    request<{ settings: any }>('/api/v1/settings/get', {}, token),

  analytics: (token: string) =>
    request<any>('/api/v1/analytics/overview', {}, token),
};

// ── Client auth ────────────────────────────────────────────────────────────
export const ClientApi = {
  register: (body: {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
    request<{ client: any; token: string }>('/api/client/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ client: any; token: string }>('/api/client/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: (token: string) =>
    request<{ client: any }>('/api/client/auth/me', {}, token),

  bookings: (token: string) =>
    request<{ bookings: any[] }>('/api/client/auth/bookings', {}, token),
};

// ── Discovery (public, no auth) ────────────────────────────────────────────
export const DiscoverApi = {
  list: (params?: string) =>
    request<{ success: boolean; data: any[] }>(
      `/api/v1/public/discover${params || ''}`,
    ),

  trending: () =>
    request<{ success: boolean; data: any[] }>('/api/v1/public/discover/trending'),

  editorial: () =>
    request<{ success: boolean; data: any[] }>('/api/v1/public/discover/editorial'),

  business: (slug: string) =>
    request<{ success: boolean; data: any }>(`/api/v1/public/discover/${slug}`),
};
