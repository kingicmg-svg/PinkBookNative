import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, BookingApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize: 14, color: i <= rating ? Colors.gold : Colors.border }}>{i <= rating ? '★' : '☆'}</Text>
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { token } = useAuth();
  const [slug, setSlug]         = useState<string | null>(null);
  const [stats, setStats]       = useState<any>(null);
  const [reviews, setReviews]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s: string) => {
    try {
      const r = await BookingApi.reviews(s);
      setStats(r.stats || {});
      setReviews(r.reviews || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    OwnerApi.settings(token).then(r => {
      const s = r?.settings?.bookingSlug || r?.settings?.booking_slug;
      if (s) { setSlug(s); load(s); }
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, [token, load]);

  const avg = stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '—';
  const count = stats?.review_count || 0;

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Reviews</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.statsCard}>
        <View style={s.statItem}>
          <Text style={s.statNum}>{avg}</Text>
          <Text style={s.statLabel}>Average Rating</Text>
          {stats?.average_rating ? <Stars rating={Math.round(Number(stats.average_rating))} /> : null}
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNum}>{count}</Text>
          <Text style={s.statLabel}>Total Reviews</Text>
        </View>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.rose} onRefresh={() => { if (slug) { setRefreshing(true); load(slug); } }} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{(item.reviewer || '?')[0].toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.reviewer}>{item.reviewer || 'Anonymous'}</Text>
                <Text style={s.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <Stars rating={item.rating || 0} />
            </View>
            {!!item.comment && <Text style={s.comment}>{item.comment}</Text>}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>⭐</Text>
            <Text style={s.emptyTitle}>No reviews yet</Text>
            <Text style={s.emptySub}>Reviews from clients will appear here after their appointments.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.cream },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:       { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:      { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  statsCard:  { flexDirection: 'row', backgroundColor: Colors.white, margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  statItem:   { flex: 1, alignItems: 'center', gap: 4 },
  statDivider:{ width: 1, backgroundColor: Colors.border, marginHorizontal: 12 },
  statNum:    { fontSize: 32, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  statLabel:  { fontSize: 11, color: Colors.soft, fontWeight: '600' },
  list:       { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
  card:       { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 16, fontWeight: '700', color: Colors.rose },
  reviewer:   { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  date:       { fontSize: 11, color: Colors.soft },
  comment:    { fontSize: 13, color: Colors.mid, lineHeight: 20, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.charcoal },
  emptySub:   { fontSize: 13, color: Colors.soft, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});
