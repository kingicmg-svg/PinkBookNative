/**
 * useTier — resolves the owner's subscription tier from the settings API
 * and exposes a hasFeature() helper that mirrors pinkbook-subscription.js.
 *
 * Usage:
 *   const { tier, hasFeature, loading } = useTier();
 *   if (!hasFeature('stripeIntegration')) { ... show upgrade ... }
 */
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SettingsApi } from '../services/ApiService';

export type Tier = 'starter' | 'pro' | 'salon' | 'studio_elite' | 'owner';

const OWNER_FEATURES: Record<string, boolean> = {
  stripeIntegration:          true,
  emailNotifications:         true,
  smsNotifications:           true,
  customPoliciesDeposits:     true,
  smartSchedulingBuffers:     true,
  fullClientNotes:            true,
  csvImport:                  true,
  autoReceipts:               true,
  multiStylistProfiles:       true,
  teamAvailabilityManagement: true,
  prioritySupport:            true,
  brandStudio:                true,
  whiteLabelMode:             true,
};

const FEATURE_MATRIX: Record<Tier, Record<string, boolean>> = {
  starter: {
    stripeIntegration:       false,
    emailNotifications:      false,
    smsNotifications:        false,
    customPoliciesDeposits:  false,
    smartSchedulingBuffers:  false,
    fullClientNotes:         false,
    csvImport:               false,
    autoReceipts:            false,
    multiStylistProfiles:    false,
    teamAvailabilityManagement: false,
    prioritySupport:         false,
    brandStudio:             false,
    whiteLabelMode:          false,
  },
  pro: {
    stripeIntegration:       true,
    emailNotifications:      true,
    smsNotifications:        true,
    customPoliciesDeposits:  true,
    smartSchedulingBuffers:  true,
    fullClientNotes:         true,
    csvImport:               true,
    autoReceipts:            true,
    multiStylistProfiles:    false,
    teamAvailabilityManagement: false,
    prioritySupport:         false,
    brandStudio:             true,
    whiteLabelMode:          false,
  },
  salon: {
    stripeIntegration:       true,
    emailNotifications:      true,
    smsNotifications:        true,
    customPoliciesDeposits:  true,
    smartSchedulingBuffers:  true,
    fullClientNotes:         true,
    csvImport:               true,
    autoReceipts:            true,
    multiStylistProfiles:    true,
    teamAvailabilityManagement: true,
    prioritySupport:         true,
    brandStudio:             true,
    whiteLabelMode:          false,
  },
  studio_elite: {
    stripeIntegration:       true,
    emailNotifications:      true,
    smsNotifications:        true,
    customPoliciesDeposits:  true,
    smartSchedulingBuffers:  true,
    fullClientNotes:         true,
    csvImport:               true,
    autoReceipts:            true,
    multiStylistProfiles:    true,
    teamAvailabilityManagement: true,
    prioritySupport:         true,
    brandStudio:             true,
    whiteLabelMode:          true,
  },
  owner: OWNER_FEATURES,
};

const VALID_TIERS = new Set<string>(['starter', 'pro', 'salon', 'studio_elite', 'owner']);

function normalizeTier(raw: string | undefined | null): Tier {
  const t = String(raw || '').toLowerCase().trim();
  return VALID_TIERS.has(t) ? (t as Tier) : 'starter';
}

export function useTier() {
  const { token } = useAuth();
  const [tier, setTier]       = useState<Tier>('starter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    SettingsApi.get(token)
      .then(r => {
        if (!cancelled) setTier(normalizeTier(r?.subscriptionTier));
      })
      .catch(() => { /* default to starter on error */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  function hasFeature(featureName: string): boolean {
    if (tier === 'owner') return true;
    return Boolean(FEATURE_MATRIX[tier]?.[featureName]);
  }

  const monthlyBookingLimit = tier === 'starter' ? 20 : Infinity;

  return { tier, hasFeature, loading, monthlyBookingLimit };
}
