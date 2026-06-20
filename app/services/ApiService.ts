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
    request<{ user: any; token: string }>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  googleSignIn: (idToken: string) =>
    request<{ user: any; token: string }>('/api/v1/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),

  getConfig: () =>
    request<{ googleClientId: string | null }>('/api/v1/auth/config'),

  me: (token: string) =>
    request<{ user: any }>('/api/v1/auth/me', {}, token),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // ── Bookings ──
  bookings: (token: string, params?: string) =>
    request<{ bookings: any[] }>(`/api/v1/bookings${params || ''}`, {}, token),

  createBooking: (token: string, body: any) =>
    request<{ booking: any }>('/api/v1/bookings', { method: 'POST', body: JSON.stringify(body) }, token),

  updateBooking: (token: string, id: string, body: any) =>
    request<{ booking: any }>(`/api/v1/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),

  patchStatus: (token: string, id: string, status: string) =>
    request<{ booking: any }>(`/api/v1/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),

  getBooking: (token: string, id: string) =>
    request<{ booking: any }>(`/api/v1/bookings/${id}`, {}, token),

  // ── Clients ──
  clients: (token: string, params?: string) =>
    request<{ clients: any[] }>(`/api/v1/clients${params || ''}`, {}, token),

  createClient: (token: string, body: any) =>
    request<{ client: any }>('/api/v1/clients', { method: 'POST', body: JSON.stringify(body) }, token),

  updateClient: (token: string, id: string, body: any) =>
    request<{ client: any }>(`/api/v1/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),

  getClient: (token: string, id: string) =>
    request<{ client: any }>(`/api/v1/clients/${id}`, {}, token),

  clientStats: (token: string, id: string) =>
    request<{ stats: any }>(`/api/v1/clients/${id}/stats`, {}, token),

  upcomingBirthdays: (token: string) =>
    request<{ clients: any[] }>('/api/v1/clients/upcoming-birthdays', {}, token),

  // ── Settings ──
  settings: (token: string) =>
    request<{ settings: any }>('/api/v1/settings/get', {}, token),

  // ── Analytics ──
  analyticsOverview: (token: string) =>
    request<{ revenue: any; bookings: any; clients: any; averages: any }>('/api/v1/analytics/overview', {}, token),

  analyticsByService: (token: string) =>
    request<{ services: any[] }>('/api/v1/analytics/by-service', {}, token),

  analyticsByPeriod: (token: string, period: 'week' | 'month' | 'year') =>
    request<{ days: any[] }>(`/api/v1/analytics/by-period?period=${period}`, {}, token),

  analyticsRetention: (token: string) =>
    request<any>('/api/v1/analytics/retention', {}, token),

  // ── Promos ──
  listPromos: (token: string) =>
    request<{ codes: any[] }>('/api/v1/promos', {}, token),

  createPromo: (token: string, body: any) =>
    request<{ code: any }>('/api/v1/promos', { method: 'POST', body: JSON.stringify(body) }, token),

  deletePromo: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/v1/promos/${id}`, { method: 'DELETE' }, token),

  // ── Calendar export ──
  calendarExport: (token: string) =>
    `${API_URL}/api/calendar/pro-export?token=${encodeURIComponent(token)}`,

  // ── Brand profile (slug, colors, booking page) ──
  brandProfile: (token: string) =>
    request<{ success: boolean; data: any }>('/api/v1/brand-studio/profile', {}, token),

  brandProfileSave: (token: string, body: any) =>
    request<{ success: boolean; data: any }>('/api/v1/brand-studio/profile', { method: 'POST', body: JSON.stringify(body) }, token),

  // ── Gallery ──
  brandGallery: (token: string) =>
    request<{ gallery: any[] }>('/api/v1/brand-studio/gallery', {}, token),

  brandGalleryUpload: (token: string, body: { imageData: string; caption?: string; isBefore?: boolean; pairId?: string | null }) =>
    request<{ image: any }>('/api/v1/brand-studio/gallery/upload', { method: 'POST', body: JSON.stringify(body) }, token),

  brandGalleryDelete: (token: string, id: string) =>
    request<any>(`/api/v1/brand-studio/gallery/${id}`, { method: 'DELETE' }, token),

  brandGalleryPatch: (token: string, id: string, body: { caption?: string; isBefore?: boolean; pairId?: string | null }) =>
    request<any>(`/api/v1/brand-studio/gallery/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
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

  googleSignIn: (idToken: string) =>
    request<{ client: any; token: string }>('/api/client/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),

  getConfig: () =>
    request<{ googleClientId: string | null }>('/api/client/auth/config'),

  me: (token: string) =>
    request<{ client: any }>('/api/client/auth/me', {}, token),

  bookings: (token: string) =>
    request<{ bookings: any[] }>('/api/client/auth/bookings', {}, token),

  updateProfile: (token: string, body: { first_name?: string; last_name?: string; phone?: string }) =>
    request<{ client: any }>('/api/client/auth/update', { method: 'PATCH', body: JSON.stringify(body) }, token),
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
    request<{ success: boolean; data: any }>(`/api/v1/brand-studio/public/profile/slug/${encodeURIComponent(slug)}`),
};

// ── Public bookings ────────────────────────────────────────────────────────
export const BookingApi = {
  settings: (ownerId: string) =>
    request<any>(`/api/public/bookings/settings/${ownerId}`),

  submit: (body: any) =>
    request<{ booking: any; confirmationToken: string }>('/api/public/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getByToken: (token: string) =>
    request<{ booking: any }>(`/api/public/bookings/manage/${token}`),

  cancelByToken: (token: string, reason?: string) =>
    request<any>(`/api/public/bookings/manage/${token}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  reviews: (slug: string) =>
    request<{ stats: any; reviews: any[] }>(`/api/public/reviews/${slug}`),

  // ── Stripe payments ──
  getStripePaymentConfig: () =>
    request<{ enabled: boolean; publishableKey: string; paypal: any }>('/api/payments/config'),

  createStripeCheckoutSession: (body: {
    amountCents: number;
    serviceName: string;
    customerEmail: string;
    customerName: string;
    bookingRef: string;
    ownerId: string;
    successUrl: string;
    cancelUrl: string;
  }) =>
    request<{ id: string; url: string }>('/api/payments/checkout-session', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getStripeCheckoutSession: (sessionId: string) =>
    request<{
      id: string;
      status: string;
      paymentStatus: string;
      amountTotal: number;
      currency: string;
      paymentIntentId: string;
      paymentCard: { brand: string; last4: string; wallet: string };
    }>(`/api/payments/checkout-session/${sessionId}`),
};

// ── Owner settings save ────────────────────────────────────────────────────
export const SettingsApi = {
  get: (token: string) =>
    request<{ settings: any }>('/api/v1/settings/get', {}, token),

  save: (token: string, settings: any) =>
    request<{ settings: any }>('/api/v1/settings/save', { method: 'POST', body: JSON.stringify(settings) }, token),
};

// ── Notification preferences ───────────────────────────────────────────────
export const NotifPrefApi = {
  // Notification *preferences* live in settings (notifPrefs key)
  // We use SettingsApi.get / SettingsApi.save for prefs persistence
  // This namespace is for future dedicated endpoint
};

