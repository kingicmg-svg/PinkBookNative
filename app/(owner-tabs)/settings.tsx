import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi, API_URL } from '../services/ApiService';
import Colors from '../../constants/Colors';

const TIER_META: Record<string, { label: string; color: string; emoji: string }> = {
  starter:      { label: 'Starter',      color: Colors.soft,     emoji: '🌸' },
  pro:          { label: 'Pro',          color: Colors.rose,     emoji: '💜' },
  salon:        { label: 'Salon',        color: '#7C3AED',       emoji: '👑' },
  studio_elite: { label: 'Studio Elite', color: Colors.charcoal, emoji: '⭐' },
};

interface RowProps { icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean; badge?: string; }
function Row({ icon, label, sub, onPress, danger, badge }: RowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={s.rowContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[s.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
          {!!badge && <View style={s.badge}><Text style={s.badgeTxt}>{badge}</Text></View>}
        </View>
        {!!sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {!danger && <Text style={s.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, signOut } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [brandSlug, setBrandSlug] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      OwnerApi.me(token),
      SettingsApi.get(token),
      OwnerApi.brandProfile(token).catch(() => ({ success: false, data: null })),
    ]).then(([meRes, stRes, brandRes]) => {
      setUser(meRes.user || {});
      setSettings(stRes?.settings || {});
      const prof = brandRes?.data || {};
      setBrandSlug(prof.booking_slug || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const tier = user?.subscription_tier || user?.tier || settings?.subscriptionTier || settings?.subscription_tier || 'starter';
  const tierMeta = TIER_META[tier] || TIER_META.starter;
  const slug = brandSlug || settings?.bookingSlug || settings?.booking_slug || '';
  const bookingLink = slug ? `pinkbook.app/pinkbook-booking.html?name=${slug}` : null;
  const bookingUrl  = slug ? `https://pinkbook.app/pinkbook-booking.html?name=${encodeURIComponent(slug)}` : null;

  const shareLink = async () => {
    if (!bookingLink) return;
    await Share.share({ message: `Book with me on PinkBook: ${bookingUrl}` });
  };

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  const name = settings?.studioName || user?.name || 'My Studio';
  const email = user?.email || '';
  const city  = settings?.city || '';

  const handleConnectOnboarding = async () => {
    if (!token) return;
    try {
      Alert.alert('Setting up Stripe', 'Opening Stripe Connect onboarding...');
      const appUrl = API_URL.replace(/\/$/, '');
      const returnUrl = `${appUrl}/pinkbook-settings.html`;
      const accountLink = await OwnerApi.createAccountLink(token, { returnUrl });
      if (accountLink && accountLink.url) {
        await WebBrowser.openBrowserAsync(accountLink.url);
      } else {
        Alert.alert('Error', 'Could not start onboarding.');
      }
    } catch (err) {
      Alert.alert('Error', (err instanceof Error) ? err.message : 'Failed to setup Stripe.');
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}><Text style={s.pageTitle}>Settings</Text></View>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{(name[0] || '?').toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{name}</Text>
            {!!email && <Text style={s.profileEmail}>{email}</Text>}
            {!!city  && <Text style={s.profileCity}>📍 {city}</Text>}
          </View>
          <View style={[s.tierBadge, { backgroundColor: tierMeta.color + '15', borderColor: tierMeta.color + '40' }]}>
            <Text style={{ fontSize: 12 }}>{tierMeta.emoji}</Text>
            <Text style={[s.tierTxt, { color: tierMeta.color }]}>{tierMeta.label}</Text>
          </View>
        </View>

        {/* Booking link */}
        <View style={s.linkCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.linkLabel}>📅 My Booking Page</Text>
            <Text style={s.linkUrl} numberOfLines={1}>{bookingLink || 'Set up Brand Studio to get your link'}</Text>
          </View>
          <View style={{ gap: 6 }}>
            {!!slug && (
              <TouchableOpacity style={s.shareBtn} onPress={() => router.push(`/booking/${slug}`)}>
                <Text style={s.shareBtnTxt}>Preview</Text>
              </TouchableOpacity>
            )}
            {!!bookingLink && (
              <TouchableOpacity style={[s.shareBtn, { backgroundColor: Colors.charcoal }]} onPress={shareLink}>
                <Text style={[s.shareBtnTxt, { color: Colors.white }]}>Share</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account */}
        <Text style={s.section}>Account</Text>
        <View style={s.group}>
          <Row icon="✏️" label="Edit Profile"    sub="Name, bio, city, category"         onPress={() => router.push('/owner/edit-profile')} />
          <Row icon="🔑" label="Change Password" sub="Update your login password"         onPress={() => router.push('/auth/forgot-password')} />
        </View>

        {/* Brand */}
        <Text style={s.section}>Brand</Text>
        <View style={s.group}>
          <Row icon="🎨" label="Brand Studio"    sub="Identity, colors, fonts, voice"     onPress={() => router.push('/owner/brand-studio')}
            badge={tier === 'starter' ? 'Pro' : undefined} />
          <Row icon="⭐" label="Reviews"         sub="Your client reviews and rating"      onPress={() => router.push('/owner/reviews')} />
        </View>

        {/* Business */}
        <Text style={s.section}>Business</Text>
        <View style={s.group}>
          <Row icon="🕐" label="Working Hours"    sub="Set your availability by day"       onPress={() => router.push('/owner/availability')} />
          <Row icon="🔔" label="Notifications"    sub="Email and SMS preferences"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') { Alert.alert('Pro Feature', 'Email and SMS notifications are available on the Pro plan. Upgrade to configure notification channels and reminder timing.'); return; }
              router.push('/owner/notifications');
            }} />
          <Row icon="📋" label="Booking Policies" sub="Cancellation, late, no-show rules"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') { Alert.alert('Pro Feature', 'Custom booking policies are available on the Pro plan. Upgrade to set cancellation windows, late-arrival rules, and deposit requirements.'); return; }
              router.push('/owner/policies');
            }} />
        </View>

        {/* Plans */}
        <Text style={s.section}>Plans & Billing</Text>
        <View style={s.group}>
          <Row icon="💜" label="Plans & Pricing"  sub={`You're on ${tierMeta.label}`}     onPress={() => router.push('/owner/upgrade')} />
          <Row icon="💳" label="Stripe Connect"   sub="Accept client payments"           onPress={handleConnectOnboarding} />
        </View>

        {/* Support */}
        <Text style={s.section}>Support</Text>
        <View style={s.group}>
          <Row icon="❓" label="Help Center"     sub="FAQs and how-tos"                   onPress={() => router.push('/owner/help')} />
          <Row icon="📄" label="Terms & Privacy" sub="Legal policies"                     onPress={() => router.push('/owner/legal')} />
        </View>

        {/* Sign Out */}
        <View style={[s.group, { marginTop: 8 }]}>
          <Row icon="🚪" label="Sign Out" onPress={confirmSignOut} danger />
        </View>

        <Text style={s.version}>PinkBook v1.0  ·  pinkbook.app</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:      { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pageTitle:   { fontSize: 22, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  scroll:      { padding: 16, gap: 2 },
  profileCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 22, fontWeight: '800', color: Colors.rose },
  profileName: { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  profileEmail:{ fontSize: 12, color: Colors.soft, marginTop: 2 },
  profileCity: { fontSize: 12, color: Colors.soft, marginTop: 2 },
  tierBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  tierTxt:     { fontSize: 11, fontWeight: '800' },
  linkCard:    { backgroundColor: Colors.charcoal, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  linkLabel:   { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  linkUrl:     { fontSize: 13, fontWeight: '700', color: Colors.pink },
  shareBtn:    { backgroundColor: Colors.rose, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  shareBtnTxt: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  section:     { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: Colors.rose, paddingHorizontal: 4, marginTop: 20, marginBottom: 8 },
  group:       { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon:     { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.pinkLight + '50', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowContent:  { flex: 1 },
  rowLabel:    { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  rowSub:      { fontSize: 12, color: Colors.soft, marginTop: 2 },
  badge:       { backgroundColor: Colors.rose, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeTxt:    { fontSize: 10, fontWeight: '800', color: Colors.white },
  chevron:     { fontSize: 22, color: Colors.soft, fontWeight: '300' },
  version:     { textAlign: 'center', fontSize: 11, color: Colors.soft, marginTop: 24 },
});
