import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookingApi } from '../services/ApiService';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#21131A',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90',
  textMuted:'#5C4A52', border:'rgba(212,65,122,0.15)',
  borderMid:'rgba(212,65,122,0.25)', white:'#FFFFFF',
  error:'rgba(211,47,47,0.12)', errorText:'#EF5350',
  success:'#1A9E4A', warning:'#F59E0B',
};

const STATUS_COLORS: Record<string,string> = {
  confirmed: '#1A9E4A', pending:'#F59E0B', cancelled:'#9CA3AF',
  completed: '#6366F1', noshow:'#EF4444',
};

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  if (!value) return null;
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{label}</Text>
      <Text style={[s.rowVal, accent && { color: D.pink, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}
function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

export default function ManageBookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token: bookingToken } = useLocalSearchParams<{ token: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingToken) { setLoading(false); return; }
    BookingApi.getByToken(bookingToken as string)
      .then(r => setBooking(r.booking || r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingToken]);

  const cancel = () => {
    Alert.alert(
      'Cancel Booking',
      booking?.within24Hours
        ? 'This appointment is within 24 hours. Cancelling may forfeit your deposit. Are you sure?'
        : 'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking', style: 'destructive', onPress: async () => {
            setCancelling(true);
            try {
              await BookingApi.cancelByToken(bookingToken as string, 'Cancelled by client');
              setBooking((b: any) => ({ ...b, status: 'cancelled' }));
              Alert.alert('Cancelled', 'Your booking has been cancelled. A confirmation will be sent to your email.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not cancel. Please contact the studio.');
            } finally { setCancelling(false); }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={D.pink} size="large" />
        <Text style={{ color: D.textSec, marginTop: 12, fontSize: 14 }}>Loading your booking…</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
        <Text style={s.emptyTitle}>Booking Not Found</Text>
        <Text style={s.emptySub}>This booking link may have expired or is invalid.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
          <Text style={s.primaryBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status     = booking.status || 'confirmed';
  const statusColor = STATUS_COLORS[status] || D.pink;
  const isCancelled = status === 'cancelled';
  const isHair      = !!(booking.hairTexture || booking.hairType || booking.hairColors?.length);
  const hasAddons   = booking.addons?.length > 0;
  const hasIntake   = booking.intakeAnswers && Object.keys(booking.intakeAnswers).length > 0;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>My Booking</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Status */}
        <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusTxt, { color: statusColor }]}>{status.toUpperCase()}</Text>
        </View>

        <Text style={s.bizName}>{booking.businessName || booking.business_name || 'Appointment'}</Text>
        {!!booking.id && (
          <Text style={s.refTxt}>Ref #{String(booking.id).slice(0, 8).toUpperCase()}</Text>
        )}

        {/* Appointment card */}
        <View style={s.card}>
          <SectionHeader title="APPOINTMENT" />
          <Row label="Service"  value={booking.serviceName || booking.service_name || ''} />
          <Row label="Date"     value={booking.date || (booking.startsAt ? new Date(booking.startsAt).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }) : '')} />
          <Row label="Time"     value={booking.time || (booking.startsAt ? new Date(booking.startsAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '')} />
          <Row label="Payment"  value={booking.paymentMethod || ''} />
          {booking.price != null && <Row label="Total"   value={`$${Number(booking.price).toFixed(2)}`} accent />}
          {booking.deposit > 0    && <Row label="Deposit" value={`$${Number(booking.deposit).toFixed(2)}`} />}
        </View>

        {/* Add-ons */}
        {hasAddons && (
          <View style={s.card}>
            <SectionHeader title="ADD-ONS" />
            {booking.addons.map((a: string, i: number) => (
              <View key={i} style={s.row}>
                <Text style={s.rowKey}>✓</Text>
                <Text style={s.rowVal}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Hair details */}
        {isHair && (
          <View style={s.card}>
            <SectionHeader title="HAIR DETAILS" />
            <Row label="Texture"   value={booking.hairTexture || ''} />
            <Row label="Hair Type" value={booking.hairType    || ''} />
            {booking.hairColors?.length > 0 && (
              <Row label="Colour(s)" value={booking.hairColors.join(', ')} />
            )}
          </View>
        )}

        {/* Intake form answers */}
        {hasIntake && (
          <View style={s.card}>
            <SectionHeader title="INTAKE FORM" />
            {Object.entries(booking.intakeAnswers).map(([q, a]: [string, any]) => (
              <View key={q} style={[s.row, { flexDirection: 'column', gap: 3 }]}>
                <Text style={s.rowKey}>{q}</Text>
                <Text style={[s.rowVal, { textAlign: 'left' }]}>{String(a)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Client notes */}
        {!!booking.clientNotes && (
          <View style={s.card}>
            <SectionHeader title="YOUR NOTES" />
            <Text style={[s.rowVal, { textAlign: 'left', marginTop: 4 }]}>{booking.clientNotes}</Text>
          </View>
        )}

        {/* Within 24h warning */}
        {!isCancelled && booking.within24Hours && (
          <View style={[s.alertBox, { backgroundColor: D.warning + '18', borderColor: D.warning + '44' }]}>
            <Text style={{ color: D.warning, fontSize: 13, fontWeight: '700' }}>⚠️ Within 24 Hours</Text>
            <Text style={{ color: D.textSec, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
              Cancellations within 24 hours may forfeit your deposit per studio policy.
            </Text>
          </View>
        )}

        {/* Cancel */}
        {!isCancelled && (
          <TouchableOpacity
            style={[s.cancelBtn, cancelling && { opacity: 0.5 }]}
            onPress={cancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator color={D.errorText} size="small" />
              : <Text style={s.cancelTxt}>Cancel This Booking</Text>
            }
          </TouchableOpacity>
        )}

        {isCancelled && (
          <View style={[s.alertBox, { backgroundColor: '#9CA3AF18', borderColor: '#9CA3AF44' }]}>
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
              This booking has been cancelled.
            </Text>
          </View>
        )}

        <Text style={s.helpNote}>Need to reschedule? Cancel and rebook, or contact the studio.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: D.bgBase },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: D.bgBase, padding: 24 },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  back:          { color: D.pink, fontWeight: '700', fontSize: 14, width: 60 },
  title:         { fontSize: 16, fontWeight: '800', color: D.textPrimary },
  scroll:        { padding: 20, gap: 14 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  statusDot:     { width: 8, height: 8, borderRadius: 4 },
  statusTxt:     { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  bizName:       { fontSize: 22, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  refTxt:        { fontSize: 12, color: D.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  card:          { backgroundColor: D.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: D.border, gap: 2 },
  sectionHeader: { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: D.border },
  rowKey:        { fontSize: 13, color: D.textSec, fontWeight: '600', flex: 0.45 },
  rowVal:        { fontSize: 13, color: D.textPrimary, fontWeight: '600', textAlign: 'right', flex: 0.55 },
  alertBox:      { borderRadius: 14, padding: 16, borderWidth: 1 },
  cancelBtn:     { backgroundColor: D.error, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(211,47,47,0.3)' },
  cancelTxt:     { color: D.errorText, fontWeight: '800', fontSize: 15 },
  helpNote:      { fontSize: 12, color: D.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: D.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptySub:      { fontSize: 14, color: D.textSec, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  primaryBtn:    { backgroundColor: D.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  primaryBtnTxt: { color: D.white, fontWeight: '700', fontSize: 14 },
});
