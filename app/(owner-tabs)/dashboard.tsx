'use strict';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi, API_URL } from '../services/ApiService';
import Colors from '../../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import type { AppTheme } from '../../constants/Colors';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function today() { return isoDate(new Date()); }
function getBookingTime(b: any) {
  return b.appointmentTime || b.appointment_time || b.time || b.date || '';
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
}
function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return ''; }
}
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function greeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${g}, ${name.split(' ')[0]} 👋` : `${g} 👋`;
}
function buildBookingUrl(ownerId: string, slug: string, name: string) {
  if (slug) return `https://pinkbook.app/book/${slug}`;
  const base = 'https://pinkbook.app/pinkbook-booking.html';
  const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'stylist';
  return `${base}?owner=${ownerId}&name=${handle}&display=${encodeURIComponent(name)}`;
}
function uid() { return Math.random().toString(36).slice(2, 10); }

const BADGE_COLORS = ['#C85D7A', '#7C3AED', '#1A9E4A', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#1C1C1E', '#F2A7BB'];
const BADGE_EMOJIS = ['✨', '💅', '💜', '🔥', '⭐', '🌸', '👑', '🎉', '🙌', '💎', '🌟', '🏅', '✅', '🎀', '🦋'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!action && <TouchableOpacity onPress={onAction}><Text style={s.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

function BookingRow({ booking, showDate }: { booking: any; showDate?: boolean }) {
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);
  const t = getBookingTime(booking);
  const client = booking.clientName || booking.client_name || booking.contactName || 'Client';
  const service = booking.serviceName || booking.service_name || booking.service || '';
  const st = booking.status || 'pending';
  const statusColor = st === 'confirmed' ? Colors.success : st === 'cancelled' ? Colors.error : Colors.gold;
  return (
    <View style={s.bookingRow}>
      <View style={[s.bookingDot, { backgroundColor: statusColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.bookingClient}>{client}</Text>
        <Text style={s.bookingMeta}>{service}{showDate && t ? ' · ' + formatShortDate(t) : t ? ' · ' + formatTime(t) : ''}</Text>
      </View>
      <View style={[s.statusPill, { backgroundColor: statusColor + '20' }]}>
        <Text style={[s.statusPillTxt, { color: statusColor }]}>{st}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);

  // Data state
  const [user, setUser]           = useState<any>(null);
  const [settings, setSettings]   = useState<any>(null);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [overview, setOverview]   = useState<any>(null);
  const [byService, setByService] = useState<any[]>([]);
  const [badges, setBadges]       = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Badge creator state
  const [badgeName, setBadgeName]   = useState('');
  const [badgeColor, setBadgeColor] = useState(BADGE_COLORS[0]);
  const [badgeTextColor, setBadgeTextColor] = useState('#FFFFFF');
  const [badgeEmoji, setBadgeEmoji] = useState('✨');
  const [badgeAdding, setBadgeAdding] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoading(true);
    try {
      const [meRes, stRes, bookRes] = await Promise.allSettled([
        OwnerApi.me(token),
        SettingsApi.get(token),
        OwnerApi.bookings(token),
      ]);
      const u = meRes.status === 'fulfilled' ? meRes.value.user : null;
      const st = stRes.status === 'fulfilled' ? (stRes.value as any)?.settings : null;
      const bk = bookRes.status === 'fulfilled' ? bookRes.value.bookings : [];

      setUser(u);
      setSettings(st);
      setBookings(bk || []);

      const ownerId = u?.id || u?.owner_id || '';
      const slug = st?.bookingSlug || st?.booking_slug || '';
      const displayName = st?.studioName || u?.name || '';
      const url = buildBookingUrl(ownerId, slug, displayName);
      setBookingUrl(url);

      // Load analytics, badges, AI insights in parallel
      const [analyticsRes, serviceRes, badgesRes, aiRes] = await Promise.allSettled([
        OwnerApi.analyticsOverview(token),
        OwnerApi.analyticsByService(token),
        OwnerApi.listBadges(token),
        OwnerApi.getScheduleInsights(token),
      ]);
      if (analyticsRes.status === 'fulfilled') setOverview(analyticsRes.value);
      if (serviceRes.status === 'fulfilled') setByService(serviceRes.value.services || []);
      if (badgesRes.status === 'fulfilled') setBadges(badgesRes.value.badges || []);
      if (aiRes.status === 'fulfilled') setAiInsights(aiRes.value);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Reload whenever the screen comes into focus so name/settings changes made
  // in Edit Profile are immediately reflected here.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(true); };

  // ── Derived data ──
  const todayISO = today();
  const todayBookings = bookings
    .filter(b => { try { return isoDate(new Date(getBookingTime(b))) === todayISO; } catch { return false; } })
    .sort((a, b) => getBookingTime(a).localeCompare(getBookingTime(b)));

  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const upcomingBookings = bookings
    .filter(b => {
      try {
        const d = new Date(getBookingTime(b));
        return d > new Date() && d <= weekEnd && isoDate(d) !== todayISO;
      } catch { return false; }
    })
    .sort((a, b) => getBookingTime(a).localeCompare(getBookingTime(b)))
    .slice(0, 8);

  const tier = user?.subscription_tier || user?.tier || settings?.subscriptionTier || settings?.subscription_tier || 'starter';
  const TIER_META: Record<string, { label: string; color: string; emoji: string }> = {
    starter: { label: 'Starter', color: T.textSec, emoji: '🌸' },
    pro: { label: 'Pro', color: T.rose, emoji: '💜' },
    salon: { label: 'Salon', color: '#7C3AED', emoji: '👑' },
    studio_elite: { label: 'Studio Elite', color: T.textPrimary, emoji: '⭐' },
    owner: { label: 'Owner', color: Colors.gold, emoji: '🔑' },
  };
  const tierMeta = TIER_META[tier] || TIER_META.starter;
  const displayName = settings?.studioName || user?.name || '';

  // Smart Insights
  const revenueMonth = overview?.revenue?.month ?? 0;
  const bookingsMonth = overview?.bookings?.month ?? 0;
  const topService = byService.length > 0 ? byService.sort((a, b) => (b.count || 0) - (a.count || 0))[0] : null;
  const busiestDay = (() => {
    const days: Record<string, number> = {};
    bookings.forEach(b => {
      try {
        const d = new Date(getBookingTime(b));
        const day = d.toLocaleDateString('en-US', { weekday: 'long' });
        days[day] = (days[day] || 0) + 1;
      } catch {}
    });
    const sorted = Object.entries(days).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  })();

  // ── Badge CRUD ──
  const handleAddBadge = async () => {
    if (!token || !badgeName.trim()) return;
    setBadgeAdding(true);
    try {
      const res = await OwnerApi.addBadge(token, {
        id: uid(),
        name: badgeName.trim().slice(0, 30),
        color: badgeColor,
        textColor: badgeTextColor,
        emoji: badgeEmoji,
      });
      setBadges(prev => [...prev, res.badge || { id: uid(), name: badgeName.trim(), color: badgeColor, textColor: badgeTextColor, emoji: badgeEmoji }]);
      setBadgeName('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add badge');
    } finally {
      setBadgeAdding(false);
    }
  };

  const handleDeleteBadge = (id: string) => {
    Alert.alert('Remove Badge', 'Remove this status badge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await OwnerApi.deleteBadge(token!, id);
            setBadges(prev => prev.filter(b => b.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not remove badge');
          }
        },
      },
    ]);
  };

  const copyBookingLink = async () => {
    if (!bookingUrl) return;
    try {
      await Clipboard.setString(bookingUrl);
      Alert.alert('Copied!', 'Booking link copied to clipboard.');
    } catch {
      await Share.share({ message: bookingUrl });
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.rose} size="large" />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.greetingTxt}>{greeting(displayName)}</Text>
          <Text style={s.dateTxt}>{todayLabel()}</Text>
        </View>
        <View style={[s.tierPill, { backgroundColor: tierMeta.color + '18', borderColor: tierMeta.color + '40' }]}>
          <Text style={{ fontSize: 11 }}>{tierMeta.emoji}</Text>
          <Text style={[s.tierPillTxt, { color: tierMeta.color }]}>{tierMeta.label}</Text>
        </View>
        <TouchableOpacity
          style={s.bellBtn}
          onPress={() => {
            if (tier === 'starter') {
              Alert.alert('Pro Feature', 'Email and SMS notifications are available on the Pro plan. Upgrade to configure notification channels and reminder timing.');
              return;
            }
            router.push('/owner/notifications');
          }}
        >
          <Ionicons name="notifications-outline" size={22} color={T.textPrimary} />
          {notifCount > 0 && (
            <View style={s.bellBadge}><Text style={s.bellBadgeTxt}>{notifCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.rose} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TODAY'S SCHEDULE ── */}
        <View style={s.card}>
          <SectionHeader
            title={`Today's Schedule (${todayBookings.length})`}
            action="View Calendar →"
            onAction={() => router.push('/(owner-tabs)/calendar')}
          />
          {todayBookings.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyEmoji}>🌸</Text>
              <Text style={s.emptyTxt}>No appointments today. Enjoy your day!</Text>
            </View>
          ) : (
            todayBookings.slice(0, 5).map((b, i) => (
              <BookingRow key={b.id || i} booking={b} />
            ))
          )}
          {todayBookings.length > 5 && (
            <TouchableOpacity onPress={() => router.push('/(owner-tabs)/calendar')}>
              <Text style={s.moreLink}>+{todayBookings.length - 5} more — View Calendar →</Text>
            </TouchableOpacity>
          )}
        </View>

                {/* ── SMART INSIGHTS ── */}
        <View style={s.card}>
          <SectionHeader title="Smart Insights ✨" action="Full Report →" onAction={() => router.push('/(owner-tabs)/finances')} />
          <View style={s.insightGrid}>
            {/* Booking velocity */}
            <View style={[s.insightItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 2, minWidth: '100%' }]}>
              <View>
                <Text style={s.insightValue}>
                  {aiInsights?.thisWeek ?? bookingsMonth ?? 0} bookings this week
                </Text>
                <Text style={s.insightLabel}>
                  {aiInsights?.velocityChange != null
                    ? `${aiInsights.velocityChange > 0 ? '↑' : '↓'} ${Math.abs(aiInsights.velocityChange)}% vs last week`
                    : 'Booking velocity'}
                </Text>
              </View>
              {aiInsights?.velocityChange != null && (
                <Text style={{ fontSize: 28, color: aiInsights.velocityChange >= 0 ? Colors.success : Colors.error }}>
                  {aiInsights.velocityChange >= 0 ? '📈' : '📉'}
                </Text>
              )}
            </View>
            {/* Revenue */}
            <View style={s.insightItem}>
              <Text style={s.insightValue}>${(revenueMonth / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}</Text>
              <Text style={s.insightLabel}>Revenue (month)</Text>
            </View>
            {/* Total bookings */}
            <View style={s.insightItem}>
              <Text style={s.insightValue}>{aiInsights?.totalBookings ?? bookingsMonth ?? 0}</Text>
              <Text style={s.insightLabel}>Total bookings (all time)</Text>
            </View>
            {/* Busiest day */}
            {(aiInsights?.busiestDay || busiestDay) && (
              <View style={s.insightItem}>
                <Text style={s.insightValue}>📅 {aiInsights?.busiestDay ?? busiestDay}</Text>
                <Text style={s.insightLabel}>Busiest day{aiInsights?.busiestCount ? ` (${aiInsights.busiestCount} avg)` : ''}</Text>
              </View>
            )}
            {/* Top service */}
            {(aiInsights?.topService || topService) && (
              <View style={s.insightItem}>
                <Text style={s.insightValue} numberOfLines={1}>
                  💅 {aiInsights?.topService ?? (topService?.serviceName || topService?.service_name || topService?.name)}
                </Text>
                <Text style={s.insightLabel}>
                  Top service{aiInsights?.topServiceCount ? ` (${aiInsights.topServiceCount} bookings)` : ''}
                </Text>
              </View>
            )}
          </View>
          {/* At-risk client warning */}
          {aiInsights?.atRiskCount > 0 && (
            <View style={s.atRiskBanner}>
              <Text style={s.atRiskEmoji}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.atRiskTitle}>{aiInsights.atRiskCount} client{aiInsights.atRiskCount > 1 ? 's' : ''} may need re-engagement</Text>
                <Text style={s.atRiskSub}>These clients haven't booked recently. Consider sending a campaign.</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/owner/campaigns')}>
                <Text style={s.atRiskCta}>Send →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

{/* ── QUICK ACTIONS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '📅', label: 'New Appointment', onPress: () => router.push('/(owner-tabs)/calendar') },
              { icon: '👥', label: 'Add Client',       onPress: () => router.push('/(owner-tabs)/clients') },
              { icon: '✂️', label: 'Edit Services',    onPress: () => router.push('/(owner-tabs)/services') },
              { icon: '📋', label: 'Update Policies',  onPress: () => router.push('/owner/policies') },
            ].map(a => (
              <TouchableOpacity key={a.label} style={s.quickBtn} onPress={a.onPress}>
                <Text style={s.quickIcon}>{a.icon}</Text>
                <Text style={s.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── UPCOMING THIS WEEK ── */}
        {upcomingBookings.length > 0 && (
          <View style={s.card}>
            <SectionHeader
              title="Upcoming This Week"
              action="Calendar →"
              onAction={() => router.push('/(owner-tabs)/calendar')}
            />
            {upcomingBookings.map((b, i) => (
              <BookingRow key={b.id || i} booking={b} showDate />
            ))}
          </View>
        )}

        {/* ── STATUS & BADGES ── */}
        <View style={s.card}>
          <SectionHeader title="Status & Badges" />
          <Text style={s.cardSub}>Show clients what you offer or your current status.</Text>

          {/* Badge preview */}
          <View style={s.badgePreviewRow}>
            <View style={[s.badgePreview, { backgroundColor: badgeColor }]}>
              <Text style={{ fontSize: 14 }}>{badgeEmoji}</Text>
              <Text style={[s.badgePreviewTxt, { color: badgeTextColor }]}>{badgeName || 'Badge Preview'}</Text>
            </View>
          </View>

          {/* Badge name input */}
          <View style={s.badgeInputRow}>
            <TextInput
              style={s.badgeInput}
              value={badgeName}
              onChangeText={setBadgeName}
              placeholder="Badge name (e.g. Accepting New Clients)"
              placeholderTextColor={T.textMuted}
              maxLength={30}
            />
            <TouchableOpacity style={s.emojiPickerBtn} onPress={() => setShowEmojiPicker(true)}>
              <Text style={{ fontSize: 20 }}>{badgeEmoji}</Text>
            </TouchableOpacity>
          </View>

          {/* Color picker */}
          <Text style={s.pickerLabel}>Badge Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={s.colorRow}>
              {BADGE_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.colorDot, { backgroundColor: c }, badgeColor === c && s.colorDotActive]}
                  onPress={() => setBadgeColor(c)}
                />
              ))}
            </View>
          </ScrollView>

          {/* Text color */}
          <Text style={s.pickerLabel}>Text Color</Text>
          <View style={s.colorRow}>
            {['#FFFFFF', '#1C1C1E', '#C85D7A', '#F2A7BB', '#7C3AED'].map(c => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c, borderWidth: 1, borderColor: T.border }, badgeTextColor === c && s.colorDotActive]}
                onPress={() => setBadgeTextColor(c)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[s.addBadgeBtn, (!badgeName.trim() || badgeAdding) && { opacity: 0.5 }]}
            onPress={handleAddBadge}
            disabled={!badgeName.trim() || badgeAdding}
          >
            {badgeAdding ? <ActivityIndicator color={T.white} size="small" /> : <Text style={s.addBadgeTxt}>+ Add Badge</Text>}
          </TouchableOpacity>

          {/* Existing badges */}
          {badges.length > 0 && (
            <View style={s.badgeList}>
              {badges.map(b => (
                <View key={b.id} style={[s.badgeChip, { backgroundColor: b.color || T.rose }]}>
                  <Text style={{ fontSize: 13 }}>{b.emoji || ''}</Text>
                  <Text style={[s.badgeChipTxt, { color: b.textColor || '#FFF' }]}>{b.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteBadge(b.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={14} color={b.textColor || '#FFF'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

                <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Emoji Picker Modal ── */}
      <Modal visible={showEmojiPicker} transparent animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowEmojiPicker(false)}>
          <View style={s.emojiModal}>
            <Text style={s.emojiModalTitle}>Pick an Emoji</Text>
            <View style={s.emojiGrid}>
              {BADGE_EMOJIS.map(e => (
                <TouchableOpacity key={e} style={s.emojiOption} onPress={() => { setBadgeEmoji(e); setShowEmojiPicker(false); }}>
                  <Text style={{ fontSize: 28 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

// styles are dynamic via makeStyles — no global stub needed
function makeStyles(T: AppTheme) { return StyleSheet.create({
  container:   { flex: 1, backgroundColor: T.bgBase },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bgBase },
  topBar:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.bgCard },
  greetingTxt: { fontSize: 18, fontWeight: '900', color: T.textPrimary, fontFamily: 'Georgia' },
  dateTxt:     { fontSize: 12, color: T.textSec, marginTop: 2 },
  tierPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  tierPillTxt: { fontSize: 11, fontWeight: '800' },
  bellBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: T.bgElevated, alignItems: 'center', justifyContent: 'center' },
  bellBadge:   { position: 'absolute', top: -2, right: -2, backgroundColor: T.rose, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bellBadgeTxt:{ fontSize: 9, fontWeight: '800', color: T.white },
  scroll:      { padding: 16, gap: 12 },
  card:        { backgroundColor: T.bgCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: T.border },
  cardTitle:   { fontSize: 15, fontWeight: '900', color: T.textPrimary, marginBottom: 12, fontFamily: 'Georgia' },
  cardSub:     { fontSize: 12, color: T.textSec, marginBottom: 12 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: T.textPrimary, fontFamily: 'Georgia' },
  sectionAction:{ fontSize: 13, fontWeight: '700', color: T.rose, fontFamily: 'Georgia', fontStyle: 'italic' },
  bookingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.border },
  bookingDot:  { width: 8, height: 8, borderRadius: 4 },
  bookingClient:{ fontSize: 14, fontWeight: '700', color: T.textPrimary },
  bookingMeta: { fontSize: 12, color: T.textSec, marginTop: 1 },
  statusPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusPillTxt:{ fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  emptyBox:    { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyEmoji:  { fontSize: 28 },
  emptyTxt:    { fontSize: 13, color: T.textSec, textAlign: 'center' },
  moreLink:    { fontSize: 13, fontWeight: '700', color: T.rose, textAlign: 'center', marginTop: 8 },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn:    { flex: 1, minWidth: '45%', backgroundColor: T.bgElevated, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  quickIcon:   { fontSize: 26 },
  quickLabel:  { fontSize: 12, fontWeight: '800', color: T.textPrimary, textAlign: 'center' },
  badgePreviewRow: { alignItems: 'center', marginBottom: 12 },
  badgePreview:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  badgePreviewTxt: { fontSize: 14, fontWeight: '800' },
  badgeInputRow:   { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badgeInput:      { flex: 1, backgroundColor: T.bgInput, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: T.textPrimary, borderWidth: 1, borderColor: T.border },
  emojiPickerBtn:  { width: 44, height: 44, backgroundColor: T.bgInput, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  pickerLabel:     { fontSize: 11, fontWeight: '700', color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  colorRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  colorDot:        { width: 28, height: 28, borderRadius: 14 },
  colorDotActive:  { borderWidth: 3, borderColor: T.textPrimary },
  addBadgeBtn:     { backgroundColor: T.rose, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  addBadgeTxt:     { color: T.white, fontWeight: '800', fontSize: 14 },
  badgeList:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badgeChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeChipTxt:    { fontSize: 12, fontWeight: '700' },
  insightGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insightItem:  { flex: 1, minWidth: '45%', backgroundColor: T.bgElevated, borderRadius: 12, padding: 12 },
  insightValue: { fontSize: 18, fontWeight: '900', color: T.textPrimary, marginBottom: 2 },
  insightLabel: { fontSize: 11, color: T.textSec, fontWeight: '600' },
  atRiskBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#FFD54F' },
  atRiskEmoji:  { fontSize: 22 },
  atRiskTitle:  { fontSize: 13, fontWeight: '800', color: '#795548', marginBottom: 2 },
  atRiskSub:    { fontSize: 11, color: '#A1887F' },
  atRiskCta:    { fontSize: 13, fontWeight: '900', color: T.rose },
  growSection:  { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: T.border },
  growLabel:    { fontSize: 14, fontWeight: '900', color: T.textPrimary, marginBottom: 4 },
  growSub:      { fontSize: 12, color: T.textSec, marginBottom: 10 },
  qrBox:        { backgroundColor: T.bgElevated, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10, minHeight: 180 },
  qrImage:      { width: 160, height: 160 },
  growBtn:      { backgroundColor: T.rose, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  growBtnTxt:   { color: T.white, fontWeight: '800', fontSize: 13 },
  growLinkBox:  { backgroundColor: T.bgElevated, borderRadius: 10, padding: 12, marginBottom: 10 },
  growLinkTxt:  { fontSize: 13, color: T.textPrimary, fontWeight: '600' },
  widgetCodeBox:{ backgroundColor: T.bgElevated, borderRadius: 10, padding: 12, marginBottom: 10 },
  widgetCodeTxt:{ fontSize: 10, color: T.textMuted, fontFamily: 'monospace' },
  widgetTap:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  widgetTapTxt: { fontSize: 12, fontWeight: '700', color: T.rose },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  emojiModal:      { backgroundColor: T.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  emojiModalTitle: { fontSize: 16, fontWeight: '900', color: T.textPrimary, marginBottom: 16, fontFamily: 'Georgia' },
  emojiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption:     { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  widgetModal:     { backgroundColor: T.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  widgetModalHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  widgetFullCode:  { fontSize: 11, color: T.textMuted, fontFamily: 'monospace', lineHeight: 18, backgroundColor: T.bgElevated, borderRadius: 10, padding: 12 },
}); }
