import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function ClientRow({ item }: { item: any }) {
  const name  = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown';
  const email = item.email || '';
  const count = item.booking_count ?? item.bookings ?? '';
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(name)}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowSub}>{email}</Text>
      </View>
      {count !== '' && <Text style={styles.count}>{count} visits</Text>}
    </View>
  );
}

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [clients, setClients]       = useState<any[]>([]);
  const [filtered, setFiltered]     = useState<any[]>([]);
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await OwnerApi.clients(token);
      const list = Array.isArray(res.clients) ? res.clients : [];
      setClients(list);
      setFiltered(list);
    } catch (e: any) {
      setError(e.message || 'Could not load clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setFiltered(clients); return; }
    const lower = q.toLowerCase();
    setFiltered(clients.filter(c => {
      const name = (c.name || `${c.first_name || ''} ${c.last_name || ''}`).toLowerCase();
      return name.includes(lower) || (c.email || '').toLowerCase().includes(lower);
    }));
  }, [clients]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Clients</Text>
        <Text style={styles.count}>{clients.length} total</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name or email…"
          placeholderTextColor={Colors.soft}
          value={query}
          onChangeText={search}
        />
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
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <ClientRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.rose} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{query ? 'No results.' : 'No clients yet.'}</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.cream },
  header:     { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading:    { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  count:      { fontSize: 13, color: Colors.soft },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  search:     { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  list:       { padding: 16, gap: 10 },
  row:        { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 13, fontWeight: '700', color: Colors.rose },
  rowInfo:    { flex: 1 },
  rowName:    { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  rowSub:     { fontSize: 12, color: Colors.soft, marginTop: 1 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText:  { color: Colors.soft, fontSize: 14 },
  retryBtn:   { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.rose, borderRadius: 100 },
  retryText:  { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
