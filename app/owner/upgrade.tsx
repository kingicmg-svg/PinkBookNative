import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, API_URL } from '../services/ApiService';
import Colors from '../../constants/Colors';

const TIER_ORDER = ['starter', 'pro', 'salon', 'studio_elite'];

const PLANS = [
  {
    id: 'starter', name: 'Starter', emoji: '🌸', price: 'Free', sub: 'Forever free',
    color: Colors.soft, badge: null, dark: false,
    features: ['Up to 20 bookings/month','Basic service catalog','Client profiles & database','Full 5-step booking flow','E-transfer payment processing','Instagram & Facebook links','Month-view booking calendar','In-app notification center'],
  },
  {
    id: 'pro', name: 'Pro', emoji: '💜', price: '$24', sub: '/month', badge: 'Most Popular',
    color: Colors.rose, dark: false,
    features: ['Unlimited bookings & clients','Stripe payment integration','CSV client import','Auto receipts & invoices','Smart scheduling & buffer controls','Full client notes & history','Google Calendar sync','Branded email notifications','SMS reminders via Twilio','Custom policies & deposits','Brand Studio (colors, fonts, link)'],
  },
  {
    id: 'salon', name: 'Salon', emoji: '👑', price: '$79', sub: '/month', badge: 'Multi-Stylist',
    color: '#7C3AED', dark: false,
    features: ['Everything in Pro, plus:','Multiple stylist profiles','Team availability management','Shared team calendar','Priority support','Banner image & gradient themes','Announcement banners','Advanced email & SMS tone settings'],
  },
  {
    id: 'studio_elite', name: 'Studio Elite', emoji: '⭐', price: '$149', sub: '/month', badge: 'White-Label',
    color: Colors.charcoal, dark: true,
    features: ['Everything in Salon, plus:','Custom domain (yourstudio.com)','White-label mode (no PinkBook branding)','Custom email domain','Branded app name & icon','Service gallery (full portfolio)','Dedicated account support'],
  },
];

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('starter');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    OwnerApi.me(token)
      .then(res => setCurrentTier(res.user?.subscription_tier || res.user?.tier || 'starter'))
      .catch(() => {});
  }, [token]);

  const getPlanLabel = (planId: string) => {
    const planName = PLANS.find(p => p.id === planId)?.name || planId;
    const currentRank = TIER_ORDER.indexOf(currentTier);
    const planRank = TIER_ORDER.indexOf(planId);
    if (planRank > currentRank) return `Upgrade to ${planName}`;
    if (planRank < currentRank) return `Downgrade to ${planName}`;
    return 'Current Plan';
  };

  const handlePlanAction = async (planId: string) => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to upgrade your plan.');
      return;
    }

    const currentRank = TIER_ORDER.indexOf(currentTier);
    const planRank = TIER_ORDER.indexOf(planId);

    // Downgrade: open Stripe Customer Portal
    if (planRank < currentRank) {
      try {
        setLoading(true);
        const appUrl = API_URL.replace(/\/$/, '');
        const returnUrl = `${appUrl}/pinkbook-settings.html`;
        const portal = await OwnerApi.createBillingPortal(token, { returnUrl });
        if (portal && portal.url) {
          await WebBrowser.openBrowserAsync(portal.url);
        } else {
          Alert.alert('Error', 'Could not open billing portal.');
        }
      } catch (err) {
        Alert.alert('Error', (err instanceof Error) ? err.message : 'Failed to open billing portal.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Upgrade: open Stripe Checkout
    if (planRank > currentRank) {
      try {
        setLoading(true);
        setSelected(planId);

        const appUrl = API_URL.replace(/\/$/, '');
        const successUrl = `${appUrl}/pinkbook-upgrade.html?upgrade_success=1&tier=${encodeURIComponent(planId)}`;
        const cancelUrl = `${appUrl}/pinkbook-upgrade.html?upgrade_cancel=1`;

        const checkout = await OwnerApi.createSubscriptionCheckout(token, {
          tier: planId,
          interval: 'month',
          currency: 'cad',
          successUrl,
          cancelUrl,
        });

        if (checkout && checkout.url) {
          const result = await WebBrowser.openBrowserAsync(checkout.url);

          if (result.type === 'success') {
            // Poll for subscription status
            let activated = false;
            for (let i = 0; i < 6; i++) {
              await new Promise(r => setTimeout(r, 2000));
              try {
                const status = await OwnerApi.getSubscriptionStatus(token);
                if (status && status.active && status.tier === planId) {
                  activated = true;
                  break;
                }
              } catch (e) {
                // continue polling
              }
            }

            if (activated) {
              Alert.alert('Success!', 'Your plan is now active.');
              setCurrentTier(planId);
            } else {
              Alert.alert('Pending', 'Your payment is processing. Please check back in a moment.');
            }
          }
        } else {
          Alert.alert('Error', 'Could not start checkout.');
        }
      } catch (err) {
        Alert.alert('Error', (err instanceof Error) ? err.message : 'Failed to upgrade.');
      } finally {
        setLoading(false);
        setSelected(null);
      }
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Plans & Pricing</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.hero}>
          <Text style={s.heroEye}>CHOOSE YOUR PLAN</Text>
          <Text style={s.heroTitle}>Built for beauty professionals</Text>
          <Text style={s.heroSub}>Starter is free forever. Upgrade anytime to unlock more power.</Text>
        </View>
        {PLANS.map(plan => (
          <View key={plan.id} style={[s.card, plan.dark && s.cardDark, plan.id === 'pro' && s.cardFeatured]}>
            {plan.badge && <View style={[s.badge, plan.dark && { backgroundColor: Colors.rose }]}><Text style={s.badgeTxt}>{plan.badge}</Text></View>}
            <View style={s.planHeader}>
              <Text style={s.planEmoji}>{plan.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.planName, plan.dark && { color: '#FDE8EF' }]}>{plan.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={[s.price, { color: plan.dark ? '#F2A7BB' : plan.color }]}>{plan.price}</Text>
                  <Text style={[s.priceSub, plan.dark && { color: 'rgba(255,255,255,0.5)' }]}>{plan.sub}</Text>
                </View>
              </View>
            </View>
            {plan.features.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <Text style={[s.featureCheck, plan.dark && { color: '#F2A7BB' }]}>✓</Text>
                <Text style={[s.featureTxt, plan.dark && { color: 'rgba(255,255,255,0.75)' }]}>{f}</Text>
              </View>
            ))}
            {plan.id !== 'starter' && plan.id !== currentTier && (
              <TouchableOpacity
                style={[s.cta, { backgroundColor: plan.dark ? Colors.rose : plan.color }, plan.id === 'pro' && s.ctaGlow]}
                onPress={() => handlePlanAction(plan.id)}
                disabled={loading}
              >
                <Text style={s.ctaTxt}>{loading && selected === plan.id ? '⏳ Opening...' : getPlanLabel(plan.id)}</Text>
              </TouchableOpacity>
            )}
            {plan.id === currentTier && (
              <View style={[s.cta, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={[s.ctaTxt, { color: plan.dark ? 'rgba(255,255,255,0.5)' : Colors.soft }]}>✓ Current Plan</Text>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Plans & Pricing</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.hero}>
          <Text style={s.heroEye}>CHOOSE YOUR PLAN</Text>
          <Text style={s.heroTitle}>Built for beauty professionals</Text>
          <Text style={s.heroSub}>Starter is free forever. Upgrade anytime to unlock more power.</Text>
        </View>
        {PLANS.map(plan => (
          <View key={plan.id} style={[s.card, plan.dark && s.cardDark, plan.id === 'pro' && s.cardFeatured]}>
            {plan.badge && <View style={[s.badge, plan.dark && { backgroundColor: Colors.rose }]}><Text style={s.badgeTxt}>{plan.badge}</Text></View>}
            <View style={s.planHeader}>
              <Text style={s.planEmoji}>{plan.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.planName, plan.dark && { color: '#FDE8EF' }]}>{plan.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={[s.price, { color: plan.dark ? '#F2A7BB' : plan.color }]}>{plan.price}</Text>
                  <Text style={[s.priceSub, plan.dark && { color: 'rgba(255,255,255,0.5)' }]}>{plan.sub}</Text>
                </View>
              </View>
            </View>
            {plan.features.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <Text style={[s.featureCheck, plan.dark && { color: '#F2A7BB' }]}>✓</Text>
                <Text style={[s.featureTxt, plan.dark && { color: 'rgba(255,255,255,0.75)' }]}>{f}</Text>
              </View>
            ))}
            {plan.id !== 'starter' && plan.id !== currentTier && (
              <TouchableOpacity
                style={[s.cta, { backgroundColor: plan.dark ? Colors.rose : plan.color }, plan.id === 'pro' && s.ctaGlow]}
                onPress={() => handlePlanAction(plan.id)}
              >
                <Text style={s.ctaTxt}>{getPlanLabel(plan.id)}</Text>
              </TouchableOpacity>
            )}
            {plan.id === currentTier && (
              <View style={[s.cta, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={[s.ctaTxt, { color: plan.dark ? 'rgba(255,255,255,0.5)' : Colors.soft }]}>✓ Current Plan</Text>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:        { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:       { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  scroll:      { padding: 16, gap: 14 },
  hero:        { backgroundColor: Colors.charcoal, borderRadius: 20, padding: 24, marginBottom: 4 },
  heroEye:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: Colors.pink, marginBottom: 8 },
  heroTitle:   { fontSize: 22, fontWeight: '900', color: Colors.white, fontFamily: 'Georgia', marginBottom: 8 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  card:        { backgroundColor: Colors.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, position: 'relative', paddingTop: 28 },
  cardFeatured:{ borderColor: 'rgba(200,93,122,0.35)', shadowColor: Colors.rose, shadowOpacity: 0.15 },
  cardDark:    { backgroundColor: Colors.charcoal, borderColor: 'rgba(200,93,122,0.4)' },
  badge:       { position: 'absolute', top: -11, alignSelf: 'center', backgroundColor: Colors.rose, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  badgeTxt:    { fontSize: 10, fontWeight: '800', color: Colors.white, letterSpacing: 0.8, textTransform: 'uppercase' },
  planHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  planEmoji:   { fontSize: 28 },
  planName:    { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  price:       { fontSize: 28, fontWeight: '900' },
  priceSub:    { fontSize: 14, color: Colors.soft, fontWeight: '500' },
  featureRow:  { flexDirection: 'row', gap: 8, marginBottom: 7 },
  featureCheck:{ fontSize: 13, color: Colors.rose, fontWeight: '700', width: 16 },
  featureTxt:  { flex: 1, fontSize: 13, color: Colors.mid, lineHeight: 19 },
  cta:         { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  ctaGlow:     { shadowColor: Colors.rose, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  ctaTxt:      { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
