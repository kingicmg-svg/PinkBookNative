import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export default function FinancesScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await OwnerApi.analytics(token);
      setData(res.data || res);
    } catch (e: any) {
      setError(e.message || 'Could not load finances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => n != null ? `$${Number(n).toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Finances</Text>
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.rose} />}
        >
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.grid}>
            <StatCard label="Revenue" value={fmt(data?.revenue_this_month)} />
            <StatCard label="Bookings" value={String(data?.bookings_this_month ?? '—')} />
          </View>
          <View style={styles.grid}>
            <StatCard label="Deposits Collected" value={fmt(data?.deposits_collected)} />
            <StatCard label="Cancellations" value={String(data?.cancellations ?? '—')} />
          </View>
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.grid}>
            <StatCard label="Total Revenue" value={fmt(data?.revenue_total)} />
            <StatCard label="Total Bookings" value={String(data?.bookings_total ?? '—')} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  header:       { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading:      { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  scroll:       { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  grid:         { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard:     { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 18, shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  statLabel:    { fontSize: 11, fontWeight: '600', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statValue:    { fontSize: 22, fontWeight: '800', color: Colors.charcoal },
  statSub:      { fontSize: 11, color: Colors.soft, marginTop: 2 },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText:    { color: Colors.soft, fontSize: 14 },
  retryBtn:     { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.rose, borderRadius: 100 },
  retryText:    { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
