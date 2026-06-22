import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share, Linking, Image, Clipboard, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../hooks/useAuth';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { OwnerApi, SettingsApi, API_URL } from '../services/ApiService';
import Colors from '../../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import type { AppTheme } from '../../constants/Colors';

function makeTierMeta(T: AppTheme): Record<string, { label: string; color: string; emoji: string }> {
  return {
    starter:      { label: 'Starter',      color: T.textSec, emoji: '🌸' },
    pro:          { label: 'Pro',          color: T.rose, emoji: '💜' },
    salon:        { label: 'Salon',        color: '#7C3AED',       emoji: '👑' },
    studio_elite: { label: 'Studio Elite', color: T.textPrimary, emoji: '⭐' },
    owner:        { label: 'Owner',        color: Colors.gold,     emoji: '🔑' },
  };
}

interface RowProps { icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean; badge?: string; }
function Row({ icon, label, sub, onPress, danger, badge }: RowProps) {
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);
  const handlePress = () => { Haptics.selectionAsync(); onPress(); };
  return (
    <TouchableOpacity style={s.row} onPress={handlePress}>
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
  const bio = useBiometricAuth();
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [brandSlug, setBrandSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showWidget, setShowWidget] = useState(false);

  const loadData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      OwnerApi.me(token),
      SettingsApi.get(token),
      OwnerApi.brandProfile(token).catch(() => ({ success: false, data: null })),
    ]).then(([meRes, stRes, brandRes]) => {
      const u = meRes.user || {};
      const st = (stRes as any)?.settings || {};
      const prof = (brandRes as any)?.data || {};
      setUser(u);
      setSettings(st);
      const sl = prof.booking_slug || '';
      setBrandSlug(sl);
      // Build booking URL and fetch QR
      const ownerId = u?.id || u?.owner_id || '';
      const displayName = st?.studioName || st?.businessName || u?.name || '';
      const handle = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'stylist';
      const url = sl
        ? `https://pinkbook.app/book/${sl}`
        : `https://pinkbook.app/pinkbook-booking.html?owner=${ownerId}&name=${handle}&display=${encodeURIComponent(displayName)}`;
      OwnerApi.getQrCode(url).then(r => setQrDataUrl(r.qr || '')).catch(() => {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  // Reload on every screen focus so edits made in Edit Profile are immediately
  // reflected (name, booking link, etc.).
  useFocusEffect(loadData);

  const tier = user?.subscription_tier || user?.tier || settings?.subscriptionTier || settings?.subscription_tier || 'starter';
  const TIER_META = makeTierMeta(T);
  const tierMeta = TIER_META[tier] || TIER_META.starter;
  const slug = brandSlug || settings?.bookingSlug || settings?.booking_slug || '';
  const bookingLink = slug ? `pinkbook.app/pinkbook-booking.html?name=${slug}` : null;
  const bookingUrl  = slug ? `https://pinkbook.app/pinkbook-booking.html?name=${encodeURIComponent(slug)}` : null;

  const shareLink = async () => {
    if (!bookingLink) return;
    await Share.share({ message: `Book with me on PinkBook: ${bookingUrl}` });
  };

  const copyLink = async () => {
    if (!bookingUrl) return;
    try { await Clipboard.setString(bookingUrl); Alert.alert('Copied!', 'Booking link copied to clipboard.'); }
    catch { await Share.share({ message: bookingUrl }); }
  };

  const copyInstagramCaption = async () => {
    const caption = `Book your appointment with me!\n👇 Tap the link in my bio to book\n\n${bookingUrl}\n\n#beauty #bookinglink #pinkbook`;
    try { await Clipboard.setString(caption); Alert.alert('Copied!', 'Instagram caption copied. Paste it in your bio or story.'); }
    catch { await Share.share({ message: caption }); }
  };

  const widgetCode = `<!-- PinkBook Booking Widget -->
<div style="text-align:center;margin:20px 0;">
  <a href="${bookingUrl}" target="_blank" rel="noopener"
    style="display:inline-block;background:linear-gradient(135deg,#C85D7A,#F2A7BB);
    color:#fff;padding:14px 32px;border-radius:30px;text-decoration:none;
    font-family:sans-serif;font-weight:600;font-size:16px;
    box-shadow:0 4px 14px rgba(200,93,122,0.35);">
    Book Now
  </a>
</div>`;

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={T.rose} size="large" /></View>;

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

        {/* Grow Your Business card */}
        <View style={s.growCard}>
          <Text style={s.growCardTitle}>📲 Grow Your Business</Text>
          {/* QR Code */}
          <View style={s.qrRow}>
            <View style={s.qrBox}>
              {qrDataUrl
                ? <Image source={{ uri: qrDataUrl }} style={s.qrImage} resizeMode="contain" />
                : <ActivityIndicator color={T.rose} />}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={s.qrLabel}>Your booking QR</Text>
              <Text style={s.qrSub} numberOfLines={2}>{bookingLink || 'Complete your Brand Studio profile to activate your booking link.'}</Text>
              {!!bookingUrl && (
                <TouchableOpacity style={s.qrCopyBtn} onPress={copyLink}>
                  <Text style={s.qrCopyTxt}>📋 Copy Link</Text>
                </TouchableOpacity>
              )}
              {!!slug && (
                <TouchableOpacity style={[s.qrCopyBtn, { backgroundColor: T.bgElevated }]} onPress={() => router.push(`/booking/${slug}`)}>
                  <Text style={[s.qrCopyTxt, { color: T.white }]}>👁 Preview</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Actions row */}
          {!!bookingUrl && (
            <View style={s.growActions}>
              <TouchableOpacity style={s.growAction} onPress={shareLink}>
                <Text style={s.growActionIcon}>🔗</Text>
                <Text style={s.growActionTxt}>Share Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.growAction} onPress={copyInstagramCaption}>
                <Text style={s.growActionIcon}>📸</Text>
                <Text style={s.growActionTxt}>Instagram Bio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.growAction} onPress={() => setShowWidget(true)}>
                <Text style={s.growActionIcon}>🌐</Text>
                <Text style={s.growActionTxt}>Website Widget</Text>
              </TouchableOpacity>
            </View>
          )}
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
          <Row icon="🎨" label="Brand Studio"    sub="Identity, colors, fonts, voice"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') {
                Alert.alert('Pro Feature', 'Brand Studio is available on the Pro plan and above.\n\nCustomise your booking page colours, fonts, tagline, booking link, and client communication tone.\n\nUpgrade to unlock.');
                return;
              }
              router.push('/owner/brand-studio');
            }} />
          <Row icon="⭐" label="Reviews"         sub="Your client reviews and rating"      onPress={() => router.push('/owner/reviews')} />
        </View>

        {/* Business */}
        <Text style={s.section}>Business</Text>
        <View style={s.group}>
          <Row icon="🕐" label="Working Hours"    sub="Set your availability by day"       onPress={() => router.push('/owner/availability')} />
          <Row icon="�" label="Team Members"     sub="Stylists, roles & schedules"
            badge={!['salon','studio_elite','owner'].includes(tier) ? 'Salon' : undefined}
            onPress={() => router.push('/owner/team')} />
          <Row icon="�🔔" label="Notifications"    sub="Email and SMS preferences"
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
          <Row icon="🗒️" label="Intake Forms"     sub="Collect client info before appointments"
            onPress={() => router.push('/owner/intake-forms')} />
        </View>

        {/* Client Programs */}
        <Text style={s.section}>Client Programs</Text>
        <View style={s.group}>
          <Row icon="⭐" label="Loyalty Program"  sub="Punch-card rewards for returning clients"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') { Alert.alert('Pro Feature', 'Loyalty punch cards are available on the Pro plan.'); return; }
              router.push('/owner/loyalty');
            }} />
          <Row icon="💳" label="Memberships"      sub="Monthly plans & pre-paid visit packages"
            badge={!['salon','studio_elite','owner'].includes(tier) ? 'Salon' : undefined}
            onPress={() => {
              if (!['salon','studio_elite','owner'].includes(tier)) { Alert.alert('Salon Feature', 'Memberships and service packages are available on the Salon plan and above.'); return; }
              router.push('/owner/memberships');
            }} />
          <Row icon="📣" label="Campaigns"        sub="Email & SMS marketing to clients"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') { Alert.alert('Pro Feature', 'Marketing campaigns are available on the Pro plan.'); return; }
              router.push('/owner/campaigns');
            }} />
          <Row icon="📥" label="Import Clients"    sub="Switch from Vagaro, GlossGenius, Square & more"
            onPress={() => router.push('/owner/import-clients')} />
        </View>

        {/* Operations */}
        <Text style={s.section}>Operations</Text>
        <View style={s.group}>
          <Row icon="📦" label="Inventory"        sub="Track retail products and supplies"
            badge={!['salon','studio_elite','owner'].includes(tier) ? 'Salon' : undefined}
            onPress={() => {
              if (!['salon','studio_elite','owner'].includes(tier)) { Alert.alert('Salon Feature', 'Inventory management is available on the Salon plan.'); return; }
              router.push('/owner/inventory');
            }} />
          <Row icon="🏛️" label="Salon Ops"        sub="Multi-chair, team & commission management"
            badge={!['salon','studio_elite','owner'].includes(tier) ? 'Salon' : undefined}
            onPress={() => {
              if (!['salon','studio_elite','owner'].includes(tier)) { Alert.alert('Salon Feature', 'Salon Ops is available on the Salon plan.'); return; }
              router.push('/owner/team');
            }} />
        </View>

        {/* Integrations */}
        <Text style={s.section}>Integrations</Text>
        <View style={s.group}>
          <Row icon="🔌" label="Integrations"     sub="Calendar sync, payments, analytics, social"
            onPress={() => router.push('/owner/integrations')} />
          <Row icon="🔗" label="Booking Widget"   sub="QR code, Instagram link, website embed"
            onPress={() => router.push('/owner/integrations')} />
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
          {bio.available && bio.hasSavedCredentials && (
            <Row
              icon="🔓"
              label={`Disable ${bio.biometricLabel}`}
              sub={`Remove saved ${bio.biometricLabel} credentials from this device`}
              onPress={() => Alert.alert(
                `Disable ${bio.biometricLabel}?`,
                'You will need to enter your password next time.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disable', style: 'destructive', onPress: async () => { await bio.clearCredentials(); Alert.alert('Done', `${bio.biometricLabel} disabled.`); } },
                ],
              )}
            />
          )}
          <Row icon="🚪" label="Sign Out" onPress={confirmSignOut} danger />
        </View>

        <Text style={s.version}>PinkBook v1.0  ·  pinkbook.app</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Website Widget Modal */}
      <Modal visible={showWidget} transparent animationType="slide" onRequestClose={() => setShowWidget(false)}>
        <View style={s.modalOverlay}>
          <View style={s.widgetModal}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={s.growCardTitle}>Website Widget Code</Text>
              <TouchableOpacity onPress={() => setShowWidget(false)}>
                <Text style={{ fontSize: 22, color: T.textSec }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              <Text style={s.widgetCode}>{widgetCode}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[s.qrCopyBtn, { alignSelf: 'stretch', alignItems: 'center', marginTop: 12, paddingVertical: 12 }]}
              onPress={async () => {
                try { await Clipboard.setString(widgetCode); Alert.alert('Copied!', 'Embed code copied to clipboard.'); }
                catch { await Share.share({ message: widgetCode }); }
              }}
            >
              <Text style={s.qrCopyTxt}>📋 Copy Embed Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(T: AppTheme) { return StyleSheet.create({
  container:   { flex: 1, backgroundColor: T.bgBase },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bgBase },
  topBar:      { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  pageTitle:   { fontSize: 22, fontWeight: '900', color: T.textPrimary, fontFamily: 'Georgia' },
  scroll:      { padding: 16, gap: 2 },
  profileCard: { backgroundColor: T.bgCard, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.border, marginBottom: 10 },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: T.bgElevated, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 22, fontWeight: '800', color: T.rose },
  profileName: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  profileEmail:{ fontSize: 12, color: T.textSec, marginTop: 2 },
  profileCity: { fontSize: 12, color: T.textSec, marginTop: 2 },
  tierBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  tierTxt:     { fontSize: 11, fontWeight: '800' },
  linkCard:    { backgroundColor: T.bgElevated, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  linkLabel:   { fontSize: 10, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  linkUrl:     { fontSize: 13, fontWeight: '700', color: T.rose },
  shareBtn:    { backgroundColor: T.rose, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  shareBtnTxt: { color: T.white, fontWeight: '800', fontSize: 13 },
  section:     { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: T.rose, paddingHorizontal: 4, marginTop: 20, marginBottom: 8 },
  group:       { backgroundColor: T.bgCard, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  rowIcon:     { width: 34, height: 34, borderRadius: 10, backgroundColor: T.bgElevated, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowContent:  { flex: 1 },
  rowLabel:    { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  rowSub:      { fontSize: 12, color: T.textSec, marginTop: 2 },
  badge:       { backgroundColor: T.rose, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeTxt:    { fontSize: 10, fontWeight: '800', color: T.white },
  chevron:     { fontSize: 22, color: T.textSec, fontWeight: '300' },
  version:     { textAlign: 'center', fontSize: 11, color: T.textSec, marginTop: 24 },
  growCard:    { backgroundColor: T.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, marginBottom: 4 },
  growCardTitle:{ fontSize: 15, fontWeight: '900', color: T.textPrimary, fontFamily: 'Georgia', marginBottom: 12 },
  qrRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  qrBox:       { width: 90, height: 90, backgroundColor: T.bgElevated, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qrImage:     { width: 82, height: 82 },
  qrLabel:     { fontSize: 13, fontWeight: '800', color: T.textPrimary },
  qrSub:       { fontSize: 11, color: T.textSec, lineHeight: 16 },
  qrCopyBtn:   { backgroundColor: T.rose, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  qrCopyTxt:   { fontSize: 12, fontWeight: '800', color: T.white },
  growActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  growAction:  { flex: 1, backgroundColor: T.bgElevated, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
  growActionIcon:{ fontSize: 20 },
  growActionTxt: { fontSize: 11, fontWeight: '700', color: T.textPrimary, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  widgetModal:  { backgroundColor: T.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '65%' },
  widgetCode:   { fontSize: 11, color: T.textMuted, fontFamily: 'monospace', lineHeight: 18, backgroundColor: T.bgElevated, borderRadius: 10, padding: 12 },
}); }
