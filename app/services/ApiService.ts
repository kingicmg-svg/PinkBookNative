'use strict';

export const API_URL =
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

  updateProfile: (token: string, body: { name?: string; phone?: string }) =>
    request<{ user: any }>('/api/v1/auth/update-profile', { method: 'PATCH', body: JSON.stringify(body) }, token),

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

  uploadBanner: (token: string, body: { imageData: string }) =>
    request<{ bannerImageUrl: string }>('/api/v1/brand-studio/upload/banner', { method: 'POST', body: JSON.stringify(body) }, token),

  // ── Gallery ──
  brandGallery: (token: string) =>
    request<{ gallery: any[] }>('/api/v1/brand-studio/gallery', {}, token),

  brandGalleryUpload: (token: string, body: { imageData: string; caption?: string; isBefore?: boolean; pairId?: string | null }) =>
    request<{ success: boolean; data: any }>('/api/v1/brand-studio/gallery/upload', { method: 'POST', body: JSON.stringify(body) }, token),

  brandGalleryDelete: (token: string, id: string) =>
    request<any>(`/api/v1/brand-studio/gallery/${id}`, { method: 'DELETE' }, token),

  brandGalleryPatch: (token: string, id: string, body: { caption?: string; isBefore?: boolean; pairId?: string | null }) =>
    request<any>(`/api/v1/brand-studio/gallery/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token),

  // ── Logo upload ──
  uploadLogo: (token: string, body: { imageData: string; backgroundColor?: string }) =>
    request<{ logoUrl: string; logoBackgroundColor: string }>('/api/v1/brand-studio/upload/profile-photo', { method: 'POST', body: JSON.stringify(body) }, token),

  deleteLogo: (token: string) =>
    request<{ success: boolean }>('/api/v1/brand-studio/logo', { method: 'DELETE' }, token),

  // ── Staff / Team (Salon+) ──
  listStaff: (token: string) =>
    request<{ staff: any[] }>('/api/v1/staff', {}, token),

  createStaff: (token: string, body: { name: string; role?: string; color_hex?: string; services?: string[]; schedule?: any }) =>
    request<{ staff: any }>('/api/v1/staff', { method: 'POST', body: JSON.stringify(body) }, token),

  updateStaff: (token: string, id: string, body: { name?: string; role?: string; color_hex?: string; services?: string[]; schedule?: any; active?: boolean }) =>
    request<{ staff: any }>(`/api/v1/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),

  deleteStaff: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/v1/staff/${id}`, { method: 'DELETE' }, token),

  // ── Subscription billing (Pro/Salon/Studio Elite) ──
  getSubscriptionStatus: (token: string) =>
    request<{ tier?: string; status?: string; active?: boolean; hasBilling?: boolean; cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string }>
    ('/api/payments/subscription/status', {}, token),

  createSubscriptionCheckout: (token: string, body: { tier: string; interval: string; currency: string; successUrl: string; cancelUrl: string }) =>
    request<{ url: string; id: string }>('/api/payments/subscription/checkout', { method: 'POST', body: JSON.stringify(body) }, token),

  createBillingPortal: (token: string, body: { returnUrl: string }) =>
    request<{ url: string }>('/api/payments/subscription/portal', { method: 'POST', body: JSON.stringify(body) }, token),

  // ── Stripe Connect onboarding (pro payout setup) ──
  createAccountLink: (token: string, body: { returnUrl: string }) =>
    request<{ url: string; accountId: string }>('/api/payments/connect/account-link', { method: 'POST', body: JSON.stringify(body) }, token),

  // ── Status Badges ──
  listBadges: (token: string) =>
    request<{ badges: any[] }>('/api/v1/status-badges/all', {}, token),

  addBadge: (token: string, body: { id: string; name: string; color: string; textColor?: string; emoji?: string }) =>
    request<{ badge: any }>('/api/v1/status-badges/add', { method: 'POST', body: JSON.stringify(body) }, token),

  deleteBadge: (token: string, badgeId: string) =>
    request<{ success: boolean }>(`/api/v1/status-badges/${badgeId}`, { method: 'DELETE' }, token),

  // ── QR Code (no auth needed) ──
  getQrCode: (url: string) =>
    request<{ qr: string; url: string }>(`/api/qr?url=${encodeURIComponent(url)}`),

  // ── Loyalty ──
  getLoyaltyConfig: (token: string) =>
    request<{ config: any }>('/api/v1/loyalty/config', {}, token),

  saveLoyaltyConfig: (token: string, body: { visits_required: number; reward_text: string; active: boolean }) =>
    request<{ config: any }>('/api/v1/loyalty/config', { method: 'PUT', body: JSON.stringify(body) }, token),

  getLoyaltyCards: (token: string) =>
    request<{ cards: any[] }>('/api/v1/loyalty/cards', {}, token),

  // ── Inventory ──
  listInventory: (token: string) =>
    request<{ items: any[] }>('/api/v1/inventory', {}, token),

  createInventoryItem: (token: string, body: { name: string; sku?: string; description?: string; price_cents?: number; stock_count?: number; category?: string }) =>
    request<{ item: any }>('/api/v1/inventory', { method: 'POST', body: JSON.stringify(body) }, token),

  updateInventoryItem: (token: string, id: string, body: Partial<{ name: string; sku: string; description: string; price_cents: number; stock_count: number; category: string; active: boolean }>) =>
    request<{ item: any }>(`/api/v1/inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),

  deleteInventoryItem: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/v1/inventory/${id}`, { method: 'DELETE' }, token),

  adjustStock: (token: string, id: string, body: { delta: number; reason?: string }) =>
    request<{ item: any }>(`/api/v1/inventory/${id}/stock`, { method: 'PATCH', body: JSON.stringify(body) }, token),

  // ── Memberships ──
  listMembershipPlans: (token: string) =>
    request<{ plans: any[] }>('/api/v1/memberships/plans', {}, token),

  createMembershipPlan: (token: string, body: { name: string; description?: string; price_cents?: number; interval?: string; included_services?: string[] }) =>
    request<{ plan: any }>('/api/v1/memberships/plans', { method: 'POST', body: JSON.stringify(body) }, token),

  deleteMembershipPlan: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/v1/memberships/plans/${id}`, { method: 'DELETE' }, token),

  listClientMemberships: (token: string) =>
    request<{ memberships: any[] }>('/api/v1/memberships/client-memberships', {}, token),

  listPackages: (token: string) =>
    request<{ packages: any[] }>('/api/v1/memberships/packages', {}, token),

  createPackage: (token: string, body: { name: string; description?: string; price_cents?: number; visit_count?: number; service_name?: string }) =>
    request<{ package: any }>('/api/v1/memberships/packages', { method: 'POST', body: JSON.stringify(body) }, token),

  deletePackage: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/v1/memberships/packages/${id}`, { method: 'DELETE' }, token),

  // ── Campaigns ──
  listCampaigns: (token: string) =>
    request<{ campaigns: any[] }>('/api/v1/campaigns', {}, token),

  createCampaign: (token: string, body: { name: string; channel?: string; audience?: string; subject?: string; body: string; scheduled_at?: string }) =>
    request<{ campaign: any }>('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(body) }, token),

  deleteCampaign: (token: string, id: string) =>
    request<{ ok: boolean }>(`/api/v1/campaigns/${id}`, { method: 'DELETE' }, token),

  sendCampaign: (token: string, id: string) =>
    request<{ ok: boolean; sent: number }>(`/api/v1/campaigns/${id}/send`, { method: 'POST' }, token),

  // ── Intake Forms ──
  listIntakeForms: (token: string) =>
    request<{ forms: any[] }>('/api/v1/intake/all', {}, token),

  getIntakeForm: (token: string, serviceName?: string) =>
    request<{ form: any }>(serviceName ? `/api/v1/intake?service=${encodeURIComponent(serviceName)}` : '/api/v1/intake', {}, token),

  saveIntakeForm: (token: string, body: { service_name?: string; fields: any[]; active?: boolean }) =>
    request<{ form: any }>('/api/v1/intake', { method: 'PUT', body: JSON.stringify(body) }, token),

  deleteIntakeForm: (token: string, serviceName?: string) =>
    request<{ ok: boolean }>('/api/v1/intake', { method: 'DELETE', body: JSON.stringify(serviceName ? { service_name: serviceName } : {}) }, token),

  getIntakeResponses: (token: string, bookingId: string) =>
    request<{ responses: any[] }>(`/api/v1/intake/responses/${bookingId}`, {}, token),

  // ── AI Intelligence & Smart Scheduling ──
  getScheduleInsights: (token: string) =>
    request<{
      busiestDay: string | null;
      busiestCount: number;
      atRiskCount: number;
      topService: string | null;
      topServiceCount: number;
      thisWeek: number;
      lastWeek: number;
      velocityChange: number | null;
      totalBookings: number;
    }>('/api/v1/schedule/insights', {}, token),

  getScheduleHeatmap: (token: string, start: string, days?: number) =>
    request<{ heatmap: any[] }>(`/api/v1/schedule/heatmap?start=${start}&days=${days || 42}`, {}, token),

  getScheduleGaps: (token: string, date: string) =>
    request<{ gaps: any[] }>(`/api/v1/schedule/gaps?date=${date}`, {}, token),

  getClientSignals: (token: string) =>
    request<{ signals: any[] }>('/api/v1/intelligence/signals', {}, token),

  getClientAIInsights: (token: string, clientId: string) =>
    request<{ signals: any[]; preferences: any }>(`/api/v1/intelligence/clients/${clientId}`, {}, token),
};

// ── Payments (booking deposits, native PaymentSheet) ─────────────────────
export const PinbookPaymentsApi = {
  getPaymentConfig: () =>
    request<{ enabled: boolean; publishableKey: string; paypal: any }>('/api/payments/config'),

  createPaymentIntent: (body: { amountCents: number; currency: string; description?: string; metadata?: any }) =>
    request<{ id: string; client_secret: string; amount: number; currency: string }>('/api/payments/payment-intent', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
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

  gallery: (slug: string) =>
    request<{ success: boolean; data: any[] }>(`/api/v1/brand-studio/public/gallery/${encodeURIComponent(slug)}`),
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
    request<{ settings: any; subscriptionTier?: string }>('/api/v1/settings/get', {}, token),

  save: (token: string, settings: any) =>
    request<{ settings: any }>('/api/v1/settings/save', { method: 'POST', body: JSON.stringify(settings) }, token),
};

// ── Support form ───────────────────────────────────────────────────────────
export const SupportApi = {
  submit: (payload: { issueType: string; email?: string; subject: string; message: string; platform?: string }) =>
    request<{ success: boolean }>('/api/support', { method: 'POST', body: JSON.stringify(payload) }),
};

// ── Notification preferences ───────────────────────────────────────────────
export const NotifPrefApi = {
  // Notification *preferences* live in settings (notifPrefs key)
  // We use SettingsApi.get / SettingsApi.save for prefs persistence
  // This namespace is for future dedicated endpoint
};

