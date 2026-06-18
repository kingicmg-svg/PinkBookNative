import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function BookingCard({ item }: { item: any }) {
  const time  = item.appointment_time || item.time || item.start_time || '';
  const name  = item.client_name || item.clientName || 'Client';
  const svc   = item.service_name || item.service || '';
  const status: string = item.status || 'confirmed';

  const statusColor: Record<string, string> = {
    confirmed: Colors.success,
    pending:   '#F5A623',
    cancelled: Colors.error,
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.time}>{time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
        <Text style={styles.clientName}>{name}</Text>
        <Text style={styles.service}>{svc}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: (statusColor[status] || Colors.soft) + '20' }]}>
        <Text style={[styles.badgeText, { color: statusColor[status] || Colors.soft }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [bookings, setBookings]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await OwnerApi.bookings(token, `?date=${today}`);
      setBookings(Array.isArray(res.bookings) ? res.bookings : []);
    } catch (e: any) {
      setError(e.message || 'Could not load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, today]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.heading}>Calendar</Text>
        <Text style={styles.subheading}>{new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.rose} size="large" />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <BookingCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.rose} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No bookings today.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  header:      { paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading:     { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  subheading:  { fontSize: 13, color: Colors.soft, marginTop: 2 },
  list:        { padding: 16, gap: 12 },
  card:        { backgroundColor: Colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardLeft:    { flex: 1 },
  time:        { fontSize: 11, fontWeight: '700', color: Colors.rose, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  clientName:  { fontSize: 15, fontWeight: '700', color: Colors.charcoal },
  service:     { fontSize: 12, color: Colors.soft, marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText:   { color: Colors.soft, fontSize: 14 },
  retryBtn:    { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.rose, borderRadius: 100 },
  retryText:   { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
