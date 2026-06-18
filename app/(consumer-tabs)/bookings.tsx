import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ClientApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function BookingRow({ item }: { item: any }) {
  const business = item.business_name || item.owner_name || 'Business';
  const service  = item.service_name  || item.service  || '';
  const time     = item.appointment_time || item.time  || '';
  const status: string = item.status || 'confirmed';
  const statusColor: Record<string, string> = {
    confirmed: Colors.success,
    pending:   '#F5A623',
    cancelled: Colors.error,
  };
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowBusiness}>{business}</Text>
        {!!service && <Text style={styles.rowService}>{service}</Text>}
        {!!time && <Text style={styles.rowTime}>{new Date(time).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>}
      </View>
      <View style={[styles.badge, { backgroundColor: (statusColor[status] || Colors.soft) + '20' }]}>
        <Text style={[styles.badgeText, { color: statusColor[status] || Colors.soft }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({ onSignIn }: { onSignIn: () => void }) {
  return (
    <View style={styles.emptyCenter}>
      <Text style={styles.emptyHeading}>Track your bookings</Text>
      <Text style={styles.emptySub}>Sign in to view your upcoming and past appointments.</Text>
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
        <View style={styles.header}><Text style={styles.heading}>Bookings</Text></View>
        <EmptyState onSignIn={() => router.push('/auth/client-login')} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.heading}>Bookings</Text></View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.rose} size="large" />
      ) : error ? (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <BookingRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.rose} />}
          ListEmptyComponent={<View style={styles.emptyCenter}><Text style={styles.emptyText}>No bookings yet.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  header:       { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading:      { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  list:         { padding: 16, gap: 10 },
  row:          { backgroundColor: Colors.white, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  rowLeft:      { flex: 1 },
  rowBusiness:  { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  rowService:   { fontSize: 12, color: Colors.soft, marginTop: 2 },
  rowTime:      { fontSize: 12, color: Colors.mid, marginTop: 3 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  emptyCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: 80 },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: Colors.charcoal, marginBottom: 8 },
  emptySub:     { fontSize: 14, color: Colors.soft, textAlign: 'center', lineHeight: 20 },
  emptyText:    { color: Colors.soft, fontSize: 14 },
  signInBtn:    { marginTop: 20, backgroundColor: Colors.rose, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 100 },
  signInText:   { color: Colors.white, fontWeight: '700', fontSize: 14 },
  retryBtn:     { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.rose, borderRadius: 100 },
  retryText:    { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
