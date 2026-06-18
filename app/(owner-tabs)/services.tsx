import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function ServiceRow({ item }: { item: any }) {
  const name     = item.name || item.service_name || 'Service';
  const price    = item.price != null ? `$${Number(item.price).toFixed(2)}` : '';
  const duration = item.duration ? `${item.duration} min` : '';
  const category = item.category || '';
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowMeta}>{[category, duration].filter(Boolean).join(' · ')}</Text>
      </View>
      {!!price && (
        <Text style={styles.price}>{price}</Text>
      )}
    </View>
  );
}

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [services, setServices]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await OwnerApi.services(token);
      const catalog = res?.settings?.servicesCatalog || res?.settings?.services || [];
      setServices(Array.isArray(catalog) ? catalog : []);
    } catch (e: any) {
      setError(e.message || 'Could not load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Services</Text>
        <Text style={styles.count}>{services.length} active</Text>
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
          data={services}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <ServiceRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.rose} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No services yet.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header:    { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading:   { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  count:     { fontSize: 13, color: Colors.soft },
  list:      { padding: 16, gap: 10 },
  row:       { backgroundColor: Colors.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  rowLeft:   { flex: 1 },
  rowName:   { fontSize: 15, fontWeight: '700', color: Colors.charcoal },
  rowMeta:   { fontSize: 12, color: Colors.soft, marginTop: 2 },
  price:     { fontSize: 16, fontWeight: '800', color: Colors.rose },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: Colors.soft, fontSize: 14 },
  retryBtn:  { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.rose, borderRadius: 100 },
  retryText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
