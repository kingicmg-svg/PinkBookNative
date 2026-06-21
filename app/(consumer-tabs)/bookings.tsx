import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Linking, Alert, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ClientApi } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF', gold:'#C9A96E',
  success:'#1A9E4A', amber:'#F59E0B', error:'#D32F2F',
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: D.success, completed: D.success, pending: D.amber,
  cancelled: D.error, canceled: D.error, rejected: D.error,
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-CA', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
  } catch { return iso; }
}
function isPast(iso: string) { try { return new Date(iso) < new Date(); } catch { return false; } }

function LoyaltyBar({ punches, required, reward }: { punches: number; required: number; reward: string }) {
  const pct = Math.min(punches / required, 1);
  return (
    <View style={lb.wrap}>
      <View style={lb.row}>
        <Text style={lb.label}>☕ Loyalty: {punches}/{required}</Text>
        <Text style={lb.reward}>{reward}</Text>
      </View>
      <View style={lb.track}>
        <View style={[lb.fill, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
      {punches >= required && (
        <Text style={lb.ready}>🎉 Reward ready! Mention this at your next appointment.</Text>
      )}
    </View>
  );
}

const lb = StyleSheet.create({
  wrap:   { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(212,65,122,0.10)' },
  row:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label:  { fontSize: 11, color: D.textSec, fontWeight: '600' },
  reward: { fontSize: 11, color: D.gold, fontWeight: '700' },
  track:  { height: 5, backgroundColor: 'rgba(212,65,122,0.15)', borderRadius: 999, overflow: 'hidden' },
  fill:   { height: '100%', backgroundColor: D.pink, borderRadius: 999 },
  ready:  { fontSize: 11, color: D.gold, fontWeight: '700', marginTop: 6 },
});

function ReviewModal({ visible, slug, bizName, onClose, token }:
  { visible: boolean; slug: string; bizName: string; onClose: () => void; token: string }) {
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);
  const [result, setResult]   = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await ClientApi.submitReview(token, { slug, rating, comment });
      const status = res.moderation?.status;
      setResult(status === 'approved'
        ? '✅ Review posted! Thank you for your feedback.'
        : '⏳ Your review is pending verification and will be posted shortly.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit review.');
    } finally { setSaving(false); }
  };

  const close = () => { setRating(5); setComment(''); setResult(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={rm.overlay}>
        <View style={rm.sheet}>
          <Text style={rm.title}>Review {bizName}</Text>
          <Text style={rm.sub}>Your review helps other clients find great stylists. Only clients with a verified booking can review.</Text>

          {result ? (
            <>
              <Text style={rm.resultTxt}>{result}</Text>
              <TouchableOpacity style={rm.btn} onPress={close}><Text style={rm.btnTxt}>Done</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <View style={rm.stars}>
                {[1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                    <Text style={{ fontSize: 32 }}>{n <= rating ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={rm.input}
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience (optional)..."
                placeholderTextColor={D.textMuted}
                multiline
                maxLength={500}
              />
              <TouchableOpacity style={[rm.btn, saving && { opacity: 0.5 }]} onPress={submit} disabled={saving}>
                {saving ? <ActivityIndicator color={D.white} /> : <Text style={rm.btnTxt}>Submit Review</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={close} style={{ marginTop: 10, alignItems: 'center' }}>
                <Text style={{ color: D.textMuted, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: D.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  title:     { fontSize: 18, fontWeight: '900', color: D.textPrimary, marginBottom: 6, fontFamily: 'Georgia' },
  sub:       { fontSize: 12, color: D.textSec, marginBottom: 18, lineHeight: 18 },
  stars:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  input:     { backgroundColor: D.bgBase, borderRadius: 12, padding: 14, color: D.textPrimary, fontSize: 14, minHeight: 90, borderWidth: 1, borderColor: D.border, marginBottom: 16 },
  btn:       { backgroundColor: D.pink, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTxt:    { color: D.white, fontWeight: '800', fontSize: 15 },
  resultTxt: { fontSize: 14, color: D.textSec, textAlign: 'center', lineHeight: 22, marginVertical: 20 },
});

function BookingCard({ item, loyaltyMap, token, onReviewDone }:
  { item: any; loyaltyMap: Record<string, any>; token: string; onReviewDone: () => void }) {
  const router = useRouter();
  const biz    = item.business_name || item.owner_name || 'Appointment';
  const svc    = item.service_name  || item.service || '';
  const price  = item.price_cents   ? `$${(item.price_cents / 100).toFixed(0)}` : '';
  const time   = item.appointment_time || item.starts_at || item.time || '';
  const slug   = item.booking_slug  || item.owner_slug  || '';
  const token_ = item.confirmation_token || item.manage_token || item.token || '';
  const status = (item.status || 'confirmed').toLowerCase();
  const statusColor = STATUS_COLOR[status] || D.pink;
  const past   = isPast(time);
  const completed = status === 'completed' || (past && !['cancelled','canceled','rejected'].includes(status));
  const loyalty = slug ? loyaltyMap[slug] : null;
  const [showReview, setShowReview] = useState(false);

  const addToCalendar = () => {
    if (!time) return;
    const start = new Date(time);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    const url   = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${biz} - ${svc}`)}&dates=${fmt(start)}/${fmt(end)}`;
    Linking.openURL(url);
  };

  return (
    <>
      <ReviewModal visible={showReview} slug={slug} bizName={biz} token={token} onClose={() => { setShowReview(false); onReviewDone(); }} />
      <TouchableOpacity
        style={bc.card}
        activeOpacity={0.85}
        onPress={() => token_ ? router.push(`/consumer/booking-detail?token=${token_}${slug ? `&slug=${encodeURIComponent(slug)}` : ''}`) : undefined}
      >
        {/* Header row */}
        <View style={bc.row}>
          <View style={{ flex: 1 }}>
            <Text style={bc.biz}>{biz}</Text>
            {!!svc  && <Text style={bc.svc}>{svc}{price ? ` · ${price}` : ''}</Text>}
            {!!time && <Text style={bc.date}>{fmt(time)}</Text>}
          </View>
          <View style={[bc.pill, { backgroundColor: statusColor + '20' }]}>
            <View style={[bc.dot, { backgroundColor: statusColor }]} />
            <Text style={[bc.pillTxt, { color: statusColor }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Loyalty progress if available */}
        {loyalty && (
          <LoyaltyBar punches={loyalty.punch_count || 0} required={loyalty.visits_required || 10} reward={loyalty.reward_text || 'Loyalty Reward'} />
        )}

        {/* Action bar */}
        <View style={bc.actions}>
          {!past && status !== 'cancelled' && !!time && (
            <TouchableOpacity style={bc.actionBtn} onPress={addToCalendar}>
              <Ionicons name="calendar-outline" size={13} color={D.pink} />
              <Text style={bc.actionTxt}>Add to Calendar</Text>
            </TouchableOpacity>
          )}
          {!!slug && (
            <TouchableOpacity style={bc.actionBtn} onPress={() => router.push(`/booking/${encodeURIComponent(slug)}`)}>
              <Ionicons name="refresh-outline" size={13} color={D.pink} />
              <Text style={bc.actionTxt}>Book Again</Text>
            </TouchableOpacity>
          )}
          {completed && !!slug && (
            <TouchableOpacity style={bc.actionBtn} onPress={() => setShowReview(true)}>
              <Ionicons name="star-outline" size={13} color={D.gold} />
              <Text style={[bc.actionTxt, { color: D.gold }]}>Leave Review</Text>
            </TouchableOpacity>
          )}
          {!past && !!token_ && (
            <TouchableOpacity style={bc.actionBtn} onPress={() => router.push(`/consumer/manage-booking?token=${token_}`)}>
              <Ionicons name="ellipsis-horizontal-circle-outline" size={13} color={D.textSec} />
              <Text style={[bc.actionTxt, { color: D.textSec }]}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </>
  );
}

const bc = StyleSheet.create({
  card:    { backgroundColor: D.bgCard, borderRadius: 18, borderWidth: 1, borderColor: D.border, padding: 16, marginBottom: 12 },
  row:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  biz:     { fontSize: 15, fontWeight: '800', color: D.textPrimary, marginBottom: 3 },
  svc:     { fontSize: 13, color: D.textSec },
  date:    { fontSize: 12, color: D.textMuted, marginTop: 3 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  dot:     { width: 6, height: 6, borderRadius: 3 },
  pillTxt: { fontSize: 10, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(212,65,122,0.08)' },
  actionBtn:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(212,65,122,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  actionTxt:{ fontSize: 11, fontWeight: '700', color: D.pink },
});

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [bookings, setBookings]     = useState<any[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<any[]>([]);
  const [tab, setTab]               = useState<'upcoming'|'past'>('upcoming');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [br, lr] = await Promise.allSettled([
        ClientApi.bookings(token),
        ClientApi.loyaltyCards(token),
      ]);
      if (br.status === 'fulfilled') setBookings(Array.isArray(br.value.bookings) ? br.value.bookings : []);
      if (lr.status === 'fulfilled') setLoyaltyCards(Array.isArray(lr.value.cards) ? lr.value.cards : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const loyaltyMap: Record<string, any> = {};
  loyaltyCards.forEach(c => { if (c.booking_slug) loyaltyMap[c.booking_slug] = c; });

  const now = new Date();
  const upcoming = bookings.filter(b => {
    const t = b.appointment_time || b.starts_at || b.time;
    if (!t) return true;
    return new Date(t) >= now && !['cancelled','canceled','rejected'].includes((b.status||'').toLowerCase());
  }).sort((a,b) => new Date(a.appointment_time||a.starts_at||a.time||0).getTime() - new Date(b.appointment_time||b.starts_at||b.time||0).getTime());
  const past = bookings.filter(b => {
    const t = b.appointment_time || b.starts_at || b.time;
    if (!t) return false;
    return new Date(t) < now || ['cancelled','canceled','rejected'].includes((b.status||'').toLowerCase());
  }).sort((a,b) => new Date(b.appointment_time||b.starts_at||b.time||0).getTime() - new Date(a.appointment_time||a.starts_at||a.time||0).getTime());
  const visible = tab === 'upcoming' ? upcoming : past;

  if (!token) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}><Text style={s.heading}>My Bookings</Text></View>
        <View style={s.empty}>
          <Text style={{ fontSize: 44, marginBottom: 16 }}>📅</Text>
          <Text style={s.emptyH}>Track all your appointments</Text>
          <Text style={s.emptySub}>Sign in to view upcoming and past bookings, loyalty progress, and leave reviews.</Text>
          <TouchableOpacity style={s.cta} onPress={() => router.push('/auth/client-login')}>
            <Text style={s.ctaTxt}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}><Text style={s.heading}>My Bookings</Text></View>

      {/* Segmented control */}
      <View style={s.seg}>
        {(['upcoming','past'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.segBtn, tab===t && s.segBtnOn]} onPress={() => setTab(t)}>
            <Text style={[s.segTxt, tab===t && s.segTxtOn]}>
              {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={D.pink} size="large" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={D.pink} />}
        >
          {visible.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 38, marginBottom: 12 }}>{tab==='upcoming' ? '📅' : '🕐'}</Text>
              <Text style={s.emptySub}>{tab==='upcoming' ? 'No upcoming appointments.' : 'No past appointments yet.'}</Text>
              {tab === 'upcoming' && (
                <TouchableOpacity style={s.cta} onPress={() => router.push('/(consumer-tabs)/discover')}>
                  <Text style={s.ctaTxt}>Find a Stylist</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            visible.map((item, i) => (
              <BookingCard key={item.id || i} item={item} loyaltyMap={loyaltyMap} token={token} onReviewDone={() => load(true)} />
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bgBase },
  header:    { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  heading:   { fontSize: 24, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  seg:       { flexDirection: 'row', margin: 16, backgroundColor: D.bgCard, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: D.border },
  segBtn:    { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  segBtnOn:  { backgroundColor: D.pink },
  segTxt:    { fontSize: 13, fontWeight: '700', color: D.textMuted },
  segTxtOn:  { color: D.white },
  scroll:    { paddingHorizontal: 16, paddingBottom: 40 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 10, paddingHorizontal: 24 },
  emptyH:    { fontSize: 17, fontWeight: '800', color: D.textPrimary, textAlign: 'center' },
  emptySub:  { fontSize: 13, color: D.textSec, textAlign: 'center', lineHeight: 20 },
  cta:       { backgroundColor: D.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 8 },
  ctaTxt:    { color: D.white, fontWeight: '800', fontSize: 14 },
});
