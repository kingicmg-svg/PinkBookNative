import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ClientApi } from '../services/ApiService';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', pink:'#D4417A',
  textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF',
};
const STATUS_COLORS: Record<string, string> = { confirmed:'#1A9E4A', pending:'#F59E0B', cancelled:'#D32F2F' };

function BookingCard({ item, onManage }: { item: any; onManage: () => void }) {
  const biz     = item.business_name || item.owner_name || 'Appointment';
  const svc     = item.service_name  || item.service || '';
  const time    = item.appointment_time || item.time || '';
  const status  = item.status || 'confirmed';
  const statusColor = STATUS_COLORS[status] || D.pink;
  const formattedDate = time ? (() => {
    try { return new Date(time).toLocaleDateString('en-CA', { weekday:'short', month:'short', day:'numeric' }); } catch { return time; }
  })() : '';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardBiz}>{biz}</Text>
          {!!svc && <Text style={styles.cardSvc}>{svc}</Text>}
          {!!formattedDate && <Text style={styles.cardDate}>{formattedDate}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusTxt, { color: statusColor }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>
      {status !== 'cancelled' && (
        <TouchableOpacity style={styles.manageBtn} onPress={onManage}>
          <Text style={styles.manageBtnTxt}>Manage Booking →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyState({ onSignIn }: { onSignIn: () => void }) {
  return (
    <View style={styles.emptyCenter}>
      <Text style={{ fontSize: 40, marginBottom: 16 }}>📅</Text>
      <Text style={styles.emptyHeading}>No bookings yet</Text>
      <Text style={styles.emptySub}>Your upcoming and past appointments will appear here.</Text>
      <TouchableOpacity style={styles.signInBtn} onPress={onSignIn}>
        <Text style={styles.signInText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [bookings, setBookings]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await ClientApi.bookings(token);
      setBookings(Array.isArray(res.bookings) ? res.bookings : []);
    } catch (e: any) {
      setError(e.message || 'Could not load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!token && !loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.heading}>My Bookings</Text></View>
        <EmptyState onSignIn={() => router.push('/auth/client-login')} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.heading}>My Bookings</Text></View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={D.pink} size="large" />
      ) : error ? (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => load()}>
            <Text style={styles.signInText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <BookingCard item={item} onManage={() => {
              const t = item.confirmation_token || item.token || item.id;
              if (t) router.push(`/consumer/manage-booking?token=${t}`);
            }} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={D.pink} />}
          ListEmptyComponent={<View style={styles.emptyCenter}><Text style={styles.emptySub}>You have no bookings yet.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: D.bgBase },
  header:      { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  heading:     { fontSize: 24, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  list:        { padding: 16, gap: 12 },
  card:        { backgroundColor: D.bgCard, borderRadius: 16, borderWidth: 1, borderColor: D.border, overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  cardBiz:     { fontSize: 15, fontWeight: '800', color: D.textPrimary, marginBottom: 4 },
  cardSvc:     { fontSize: 13, color: D.textSec },
  cardDate:    { fontSize: 12, color: D.textMuted, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '800' },
  manageBtn:   { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: D.border },
  manageBtnTxt:{ fontSize: 13, fontWeight: '700', color: D.pink },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: 80 },
  emptyHeading:{ fontSize: 18, fontWeight: '700', color: D.textPrimary, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: D.textSec, textAlign: 'center', lineHeight: 20 },
  emptyText:   { color: D.textSec, fontSize: 14 },
  signInBtn:   { marginTop: 20, backgroundColor: D.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  signInText:  { color: D.textPrimary, fontWeight: '700', fontSize: 14 },
});
