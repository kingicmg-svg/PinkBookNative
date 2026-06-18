import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookingApi } from '../services/ApiService';

const D = { bgBase:'#110A0E', bgCard:'#1A1014', pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52', border:'rgba(212,65,122,0.15)', white:'#FFFFFF', error:'rgba(211,47,47,0.15)', errorText:'#D32F2F' };

const STATUS_COLORS: Record<string,string> = { confirmed:'#1A9E4A', pending:'#F59E0B', cancelled:'#D32F2F' };

export default function ManageBookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token: bookingToken } = useLocalSearchParams<{ token: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingToken) return;
    BookingApi.getByToken(bookingToken as string).then(r => setBooking(r.booking || r)).catch(() => {}).finally(() => setLoading(false));
  }, [bookingToken]);

  const cancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this appointment?', [
      { text: 'Keep Booking', style: 'cancel' },
      { text: 'Cancel Booking', style: 'destructive', onPress: async () => {
        setCancelling(true);
        try {
          await BookingApi.cancelByToken(bookingToken as string, 'Cancelled by client');
          Alert.alert('Cancelled', 'Your booking has been cancelled.');
          router.back();
        } catch (e: any) { Alert.alert('Error', e.message || 'Could not cancel booking.'); }
        finally { setCancelling(false); }
      }},
    ]);
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={D.pink} size="large" /></View>;

  const status = booking?.status || 'confirmed';
  const statusColor = STATUS_COLORS[status] || D.pink;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Manage Booking</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusTxt, { color: statusColor }]}>{status.toUpperCase()}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.bizName}>{booking?.business_name || booking?.studioName || 'Appointment'}</Text>
          {!!booking?.service_name && <View style={s.row}><Text style={s.key}>Service</Text><Text style={s.val}>{booking.service_name}</Text></View>}
          {!!booking?.date && <View style={s.row}><Text style={s.key}>Date</Text><Text style={s.val}>{new Date(booking.date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</Text></View>}
          {!!booking?.time && <View style={s.row}><Text style={s.key}>Time</Text><Text style={s.val}>{booking.time}</Text></View>}
          {!!booking?.price && <View style={s.row}><Text style={s.key}>Price</Text><Text style={s.val}>${booking.price}</Text></View>}
          {!!booking?.payment_method && <View style={s.row}><Text style={s.key}>Payment</Text><Text style={s.val}>{booking.payment_method}</Text></View>}
        </View>
        {status !== 'cancelled' && (
          <TouchableOpacity style={[s.cancelBtn, cancelling && { opacity: 0.5 }]} onPress={cancel} disabled={cancelling}>
            {cancelling ? <ActivityIndicator color={D.errorText} size="small" /> : <Text style={s.cancelTxt}>Cancel This Booking</Text>}
          </TouchableOpacity>
        )}
        <Text style={s.note}>To reschedule, please cancel and rebook, or contact the studio directly.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: D.bgBase },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: D.bgBase },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  back:       { color: D.pink, fontWeight: '700', fontSize: 14, width: 60 },
  title:      { fontSize: 16, fontWeight: '800', color: D.textPrimary },
  scroll:     { padding: 20, gap: 16 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusTxt:  { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  card:       { backgroundColor: D.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: D.border, gap: 2 },
  bizName:    { fontSize: 20, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia', marginBottom: 14 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: D.border },
  key:        { fontSize: 13, color: D.textSec, fontWeight: '600' },
  val:        { fontSize: 13, color: D.textPrimary, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
  cancelBtn:  { backgroundColor: D.error, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(211,47,47,0.3)' },
  cancelTxt:  { color: D.errorText, fontWeight: '800', fontSize: 15 },
  note:       { fontSize: 12, color: D.textMuted, textAlign: 'center', lineHeight: 18 },
});
