import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookingApi, ClientApi } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', borderMid:'rgba(212,65,122,0.28)',
  white:'#FFFFFF', gold:'#C9A96E',
  success:'#1A9E4A', successBg:'rgba(26,158,74,0.12)',
  amber:'#F59E0B', amberBg:'rgba(245,158,11,0.12)',
  error:'#D32F2F', errorBg:'rgba(211,47,47,0.12)',
};

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: D.success, bg: D.successBg, label: 'Confirmed' },
  completed: { color: D.success, bg: D.successBg, label: 'Completed' },
  pending:   { color: D.amber,   bg: D.amberBg,   label: 'Pending' },
  cancelled: { color: D.error,   bg: D.errorBg,   label: 'Cancelled' },
  canceled:  { color: D.error,   bg: D.errorBg,   label: 'Cancelled' },
  rejected:  { color: D.error,   bg: D.errorBg,   label: 'Rejected' },
  no_show:   { color: D.textMuted, bg: 'rgba(92,74,82,0.2)', label: 'No Show' },
};

function fmt(iso: string, opts?: Intl.DateTimeFormatOptions) {
  try { return new Date(iso).toLocaleDateString('en-CA', opts || { weekday:'long', year:'numeric', month:'long', day:'numeric' }); } catch { return iso; }
}
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-CA', { hour:'numeric', minute:'2-digit' }); } catch { return ''; }
}
function isPast(iso: string) { try { return new Date(iso) < new Date(); } catch { return false; } }

function DetailRow({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  if (!value) return null;
  return (
    <View style={s.detailRow}>
      <Text style={s.detailIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={[s.detailValue, accent && { color: D.pink, fontWeight: '800' }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token: authToken } = useAuth();
  const { token: bookingToken, slug } = useLocalSearchParams<{ token?: string; slug?: string }>();

  const [booking,      setBooking]     = useState<any>(null);
  const [myReview,     setMyReview]    = useState<any>(null);
  const [loading,      setLoading]     = useState(true);
  const [cancelling,   setCancelling]  = useState(false);
  const [showReview,   setShowReview]  = useState(false);
  const [rating,       setRating]      = useState(5);
  const [comment,      setComment]     = useState('');
  const [submitting,   setSubmitting]  = useState(false);
  const [reviewResult, setReviewResult]= useState<string | null>(null);

  useEffect(() => {
    if (!bookingToken) { setLoading(false); return; }
    BookingApi.getByToken(bookingToken)
      .then(r => setBooking(r.booking || r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingToken]);

  // Load existing review if slug + auth token available
  useEffect(() => {
    const bookSlug = slug || booking?.booking_slug || booking?.owner_slug;
    if (!authToken || !bookSlug) return;
    ClientApi.getMyReview(authToken, bookSlug).then(r => setMyReview(r.review)).catch(() => {});
  }, [authToken, slug, booking]);

  const addToCalendar = (provider: 'google' | 'apple') => {
    const time = booking?.starts_at || booking?.appointment_time || booking?.time;
    if (!time) { Alert.alert('No date', 'No appointment time found.'); return; }
    const biz = booking?.business_name || booking?.owner_name || 'Appointment';
    const svc = booking?.service_name  || booking?.service || '';
    const title = [biz, svc].filter(Boolean).join(' — ');
    const start = new Date(time);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);
    const toICS = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    if (provider === 'google') {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toICS(start)}/${toICS(end)}`;
      Linking.openURL(url);
    } else {
      // Apple Calendar / iCal
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PinkBook//EN',
        'BEGIN:VEVENT',
        `DTSTART:${toICS(start)}`, `DTEND:${toICS(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:Booked via PinkBook`,
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const url = `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open calendar. Try Google Calendar instead.'));
    }
  };

  const cancel = () => {
    const within24 = (() => {
      const t = booking?.starts_at || booking?.appointment_time;
      if (!t) return false;
      return new Date(t).getTime() - Date.now() < 24 * 60 * 60 * 1000;
    })();
    Alert.alert(
      'Cancel Booking',
      within24
        ? 'This appointment is within 24 hours. Cancelling may forfeit your deposit per the salon policy.'
        : 'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        { text: 'Cancel Booking', style: 'destructive', onPress: async () => {
          setCancelling(true);
          try {
            await BookingApi.cancelByToken(bookingToken!, 'Cancelled by client');
            setBooking((b: any) => ({ ...b, status: 'cancelled' }));
            Alert.alert('Cancelled', 'Your booking has been cancelled. A confirmation has been sent to your email.');
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not cancel. Please contact the studio directly.');
          } finally { setCancelling(false); }
        }},
      ],
    );
  };

  const submitReview = async () => {
    const bookSlug = slug || booking?.booking_slug || booking?.owner_slug;
    if (!authToken || !bookSlug) { Alert.alert('Sign in', 'You need to be signed in to leave a review.'); return; }
    setSubmitting(true);
    try {
      const res = await ClientApi.submitReview(authToken, { slug: bookSlug, rating, comment });
      const status = res.moderation?.status;
      setMyReview(res.review);
      setReviewResult(status === 'approved'
        ? '✅ Your review has been posted. Thank you!'
        : '⏳ Review submitted. It will be posted after verification (usually within minutes).');
    } catch (e: any) {
      Alert.alert('Error', e.message?.includes('booked') ? 'Only clients with a verified booking can review this pro.' : (e.message || 'Could not submit review.'));
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={D.pink} size="large" />
      <Text style={{ color: D.textSec, marginTop: 12, fontSize: 14 }}>Loading booking…</Text>
    </View>
  );

  if (!booking) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
      <Text style={s.emptyTitle}>Booking Not Found</Text>
      <Text style={s.emptySub}>This booking may have expired or is no longer available.</Text>
      <TouchableOpacity style={s.ctaBtn} onPress={() => router.back()}><Text style={s.ctaBtnTxt}>Go Back</Text></TouchableOpacity>
    </View>
  );

  const time = booking.starts_at || booking.appointment_time || booking.time;
  const status = (booking.status || 'confirmed').toLowerCase();
  const statusMeta = STATUS[status] || { color: D.pink, bg: 'rgba(212,65,122,0.12)', label: status };
  const past = isPast(time);
  const canCancel = !past && !['cancelled','canceled','rejected'].includes(status);
  const canReview = past && !['cancelled','canceled','rejected'].includes(status);
  const bookSlug = slug || booking.booking_slug || booking.owner_slug;
  const price = booking.price_cents ? `$${(booking.price_cents / 100).toFixed(0)}` : (booking.total ? `$${booking.total}` : '');
  const deposit = booking.deposit_amount ? `$${(Number(booking.deposit_amount) / 100).toFixed(0)} paid` : '';
  const ref = booking.booking_ref || booking.reference || booking.id?.slice(0,8).toUpperCase();

  return (
    <>
      <View style={[s.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={D.textPrimary} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Booking Details</Text>
          {!!bookSlug && (
            <TouchableOpacity onPress={() => router.push(`/booking/${encodeURIComponent(bookSlug)}`)} style={s.bookAgainPill}>
              <Text style={s.bookAgainTxt}>Book Again</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Status banner */}
          <View style={[s.statusBanner, { backgroundColor: statusMeta.bg, borderColor: statusMeta.color + '40' }]}>
            <View style={[s.statusDot, { backgroundColor: statusMeta.color }]} />
            <Text style={[s.statusTxt, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            {!!ref && <Text style={s.refTxt}>Ref: {ref}</Text>}
          </View>

          {/* Receipt card */}
          <View style={s.receiptCard}>
            <Text style={s.receiptBiz}>{booking.business_name || booking.owner_name || 'Appointment'}</Text>
            {!!(booking.service_name || booking.service) && (
              <Text style={s.receiptSvc}>{booking.service_name || booking.service}</Text>
            )}
            <View style={s.divider} />
            <DetailRow icon="📅" label="Date"     value={time ? fmt(time) : ''} />
            <DetailRow icon="🕐" label="Time"     value={time ? fmtTime(time) : ''} />
            {!!(booking.duration_minutes || booking.duration) && (
              <DetailRow icon="⏱" label="Duration" value={`${booking.duration_minutes || booking.duration} min`} />
            )}
            {!!price   && <DetailRow icon="💳" label="Total"   value={price} accent />}
            {!!deposit && <DetailRow icon="✅" label="Deposit"  value={deposit} />}
            {!!(booking.notes || booking.client_notes) && (
              <DetailRow icon="📝" label="Notes" value={booking.notes || booking.client_notes} />
            )}
            {!!(booking.contact_name || booking.owner_name) && (
              <DetailRow icon="💅" label="Stylist" value={booking.stylist_name || booking.contact_name || ''} />
            )}
          </View>

          {/* Calendar export */}
          {!past && canCancel && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ADD TO CALENDAR</Text>
              <View style={s.calRow}>
                <TouchableOpacity style={s.calBtn} onPress={() => addToCalendar('google')}>
                  <Text style={{ fontSize: 20 }}>📆</Text>
                  <Text style={s.calBtnTxt}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.calBtn} onPress={() => addToCalendar('apple')}>
                  <Text style={{ fontSize: 20 }}>🍎</Text>
                  <Text style={s.calBtnTxt}>Apple</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Review section */}
          {canReview && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>YOUR REVIEW</Text>
              {myReview ? (
                <View style={s.reviewCard}>
                  <View style={s.starsRow}>
                    {[1,2,3,4,5].map(n => (
                      <Text key={n} style={{ fontSize: 20 }}>{n <= (myReview.rating || 0) ? '★' : '☆'}</Text>
                    ))}
                    <Text style={s.reviewStatus}>
                      {myReview.status === 'approved' ? ' · ✅ Published' : ' · ⏳ Pending'}
                    </Text>
                  </View>
                  {!!myReview.comment && <Text style={s.reviewComment}>{myReview.comment}</Text>}
                </View>
              ) : (
                <TouchableOpacity style={s.leaveReviewBtn} onPress={() => setShowReview(true)}>
                  <Ionicons name="star-outline" size={16} color={D.gold} />
                  <Text style={s.leaveReviewTxt}>Leave a Review</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={s.actionsSection}>
            {canCancel && (
              <TouchableOpacity
                style={[s.cancelBtn, cancelling && { opacity: 0.5 }]}
                onPress={cancel}
                disabled={cancelling}
              >
                {cancelling ? <ActivityIndicator color={D.error} size="small" /> : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color={D.error} />
                    <Text style={s.cancelBtnTxt}>Cancel Booking</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {!!bookSlug && (
              <TouchableOpacity style={s.ctaBtn} onPress={() => router.push(`/booking/${encodeURIComponent(bookSlug)}`)}>
                <Ionicons name="refresh-outline" size={16} color={D.white} />
                <Text style={s.ctaBtnTxt}>Book Again</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Review modal */}
      <Modal visible={showReview} transparent animationType="slide" onRequestClose={() => setShowReview(false)}>
        <View style={rm.overlay}>
          <View style={rm.sheet}>
            <Text style={rm.title}>How was your experience?</Text>
            <Text style={rm.sub}>
              Only clients with a verified booking can review. Your review helps other clients find great stylists.
            </Text>
            {reviewResult ? (
              <>
                <Text style={rm.result}>{reviewResult}</Text>
                <TouchableOpacity style={rm.btn} onPress={() => { setShowReview(false); setReviewResult(null); }}>
                  <Text style={rm.btnTxt}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={rm.stars}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                      <Text style={{ fontSize: 36 }}>{n <= rating ? '★' : '☆'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={rm.ratingLabel}>{['','Poor','Fair','Good','Great','Excellent!'][rating]}</Text>
                <TextInput
                  style={rm.input}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Tell others about your experience... (optional)"
                  placeholderTextColor={D.textMuted}
                  multiline
                  maxLength={500}
                />
                <Text style={[rm.charCount, comment.length > 450 && { color: D.amber }]}>{comment.length}/500</Text>
                <TouchableOpacity style={[rm.btn, submitting && { opacity: 0.5 }]} onPress={submitReview} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={D.white} /> : <Text style={rm.btnTxt}>Submit Review</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowReview(false)} style={{ alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ color: D.textMuted, fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: D.bgBase },
  center:         { flex: 1, backgroundColor: D.bgBase, alignItems: 'center', justifyContent: 'center', padding: 24 },
  topBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border, gap: 12 },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212,65,122,0.1)', alignItems: 'center', justifyContent: 'center' },
  topTitle:       { flex: 1, fontSize: 17, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  bookAgainPill:  { backgroundColor: D.pink, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  bookAgainTxt:   { fontSize: 12, fontWeight: '800', color: D.white },
  scroll:         { padding: 16, gap: 14 },
  statusBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1 },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  statusTxt:      { fontSize: 14, fontWeight: '800', flex: 1 },
  refTxt:         { fontSize: 11, color: D.textMuted, fontWeight: '600' },
  receiptCard:    { backgroundColor: D.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: D.border },
  receiptBiz:     { fontSize: 20, fontWeight: '900', color: D.textPrimary, marginBottom: 4, fontFamily: 'Georgia' },
  receiptSvc:     { fontSize: 14, color: D.pink, fontWeight: '700', marginBottom: 14 },
  divider:        { height: 1, backgroundColor: D.border, marginBottom: 14 },
  detailRow:      { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(212,65,122,0.06)' },
  detailIcon:     { fontSize: 18, width: 26, textAlign: 'center' },
  detailLabel:    { fontSize: 11, color: D.textMuted, fontWeight: '600', marginBottom: 2 },
  detailValue:    { fontSize: 14, color: D.textPrimary, fontWeight: '600' },
  section:        { gap: 10 },
  sectionLabel:   { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 1.2, paddingHorizontal: 2 },
  calRow:         { flexDirection: 'row', gap: 10 },
  calBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: D.bgCard, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: D.border },
  calBtnTxt:      { fontSize: 13, fontWeight: '700', color: D.textPrimary },
  reviewCard:     { backgroundColor: D.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: D.border },
  starsRow:       { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 6 },
  reviewStatus:   { fontSize: 11, color: D.textMuted, fontWeight: '600' },
  reviewComment:  { fontSize: 13, color: D.textSec, lineHeight: 20 },
  leaveReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(201,169,110,0.10)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(201,169,110,0.30)' },
  leaveReviewTxt: { fontSize: 14, fontWeight: '700', color: D.gold },
  actionsSection: { gap: 10, marginTop: 6 },
  ctaBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: D.pink, borderRadius: 14, paddingVertical: 14 },
  ctaBtnTxt:      { color: D.white, fontWeight: '800', fontSize: 15 },
  cancelBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: D.errorBg, borderRadius: 14, paddingVertical: 13, borderWidth: 1, borderColor: D.error + '40' },
  cancelBtnTxt:   { color: D.error, fontWeight: '800', fontSize: 14 },
  emptyTitle:     { fontSize: 18, fontWeight: '800', color: D.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptySub:       { fontSize: 13, color: D.textSec, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});

const rm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: D.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 36 },
  title:      { fontSize: 20, fontWeight: '900', color: D.textPrimary, marginBottom: 8, fontFamily: 'Georgia' },
  sub:        { fontSize: 12, color: D.textSec, marginBottom: 20, lineHeight: 18 },
  stars:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  ratingLabel:{ textAlign: 'center', fontSize: 14, fontWeight: '700', color: D.gold, marginBottom: 16, minHeight: 20 },
  input:      { backgroundColor: D.bgBase, borderRadius: 14, padding: 14, color: D.textPrimary, fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: D.border, marginBottom: 6 },
  charCount:  { fontSize: 11, color: D.textMuted, textAlign: 'right', marginBottom: 14 },
  btn:        { backgroundColor: D.pink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnTxt:     { color: D.white, fontWeight: '800', fontSize: 15 },
  result:     { fontSize: 14, color: D.textSec, textAlign: 'center', lineHeight: 22, marginVertical: 24, paddingHorizontal: 8 },
});
