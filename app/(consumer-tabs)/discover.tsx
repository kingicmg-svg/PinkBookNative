import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { DiscoverApi } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';
import Colors from '../../constants/Colors';

const API_URL = process.env.EXPO_PUBLIC_PINKBOOK_API_URL?.replace(/\/$/, '') || 'https://www.pinkbook.app';

const CATEGORIES = ['All', 'Hair', 'Nails', 'Lashes', 'Brows', 'Skin', 'Makeup', 'Waxing'];

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function BusinessCard({ item, onBook }: { item: any; onBook: (slug: string) => void }) {
  const name     = item.business_name || 'Business';
  const city     = item.city || '';
  const tagline  = item.tagline || '';
  const slug     = item.booking_slug || '';
  const tier     = item.subscription_tier || '';
  const logo     = item.logo_data_url || null;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitials}>{initials(name)}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
            {tier === 'elite' && (
              <View style={styles.eliteBadge}><Text style={styles.eliteText}>Elite</Text></View>
            )}
          </View>
          {!!city && <Text style={styles.cardCity}>{city}</Text>}
          {!!tagline && <Text style={styles.cardTagline} numberOfLines={1}>{tagline}</Text>}
        </View>
      </View>
      {!!slug && (
        <TouchableOpacity style={styles.bookBtn} onPress={() => onBook(slug)} activeOpacity={0.85}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DiscoverScreen() {
  const insets    = useSafeAreaInsets();
  const router    = useRouter();
  const { token } = useAuth();

  const [trending, setTrending]   = useState<any[]>([]);
  const [results, setResults]     = useState<any[]>([]);
  const [query, setQuery]         = useState('');
  const [category, setCategory]   = useState('All');
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = useCallback((p: number, q: string, cat: string) => {
    const parts: string[] = [`page=${p}`];
    if (q.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
    if (cat !== 'All') parts.push(`category=${cat.toLowerCase()}`);
    return `?${parts.join('&')}`;
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      const res = await DiscoverApi.trending();
      setTrending(res.data || []);
    } catch {}
  }, []);

  const loadResults = useCallback(async (p: number, q: string, cat: string, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await DiscoverApi.list(buildParams(p, q, cat));
      const items = res.data || [];
      setResults(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length === 24);
    } catch {}
    finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadTrending();
    loadResults(1, '', 'All');
  }, []);

  const onSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadResults(1, q, category);
    }, 400);
  }, [category, loadResults]);

  const onCategory = useCallback((cat: string) => {
    setCategory(cat);
    setPage(1);
    loadResults(1, query, cat);
  }, [query, loadResults]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    loadResults(next, query, category, true);
  }, [hasMore, loadingMore, page, query, category, loadResults]);

  const onBook = useCallback(async (slug: string) => {
    if (!token) {
      router.push('/auth/client-login');
      return;
    }
    await WebBrowser.openBrowserAsync(
      `${API_URL}/pinkbook-booking.html?owner=${encodeURIComponent(slug)}`,
    );
  }, [token, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Discover</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search salons, city…"
          placeholderTextColor={Colors.soft}
          value={query}
          onChangeText={onSearch}
        />
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => onCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending strip */}
      {trending.length > 0 && (
        <View style={styles.trendingSection}>
          <Text style={styles.sectionLabel}>Trending</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
            {trending.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.trendingCard}
                onPress={() => item.booking_slug && onBook(item.booking_slug)}
              >
                {item.logo_data_url ? (
                  <Image source={{ uri: item.logo_data_url }} style={styles.trendingLogo} />
                ) : (
                  <View style={styles.trendingLogoPlaceholder}>
                    <Text style={styles.trendingInitials}>{initials(item.business_name || '?')}</Text>
                  </View>
                )}
                <Text style={styles.trendingName} numberOfLines={1}>{item.business_name}</Text>
                <Text style={styles.trendingCity} numberOfLines={1}>{item.city || ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main grid */}
      {loading ? (
        <ActivityIndicator color={Colors.rose} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <BusinessCard item={item} onBook={onBook} />}
          contentContainerStyle={styles.list}
          numColumns={1}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.rose} onRefresh={() => { setRefreshing(true); loadTrending(); loadResults(1, query, category); }} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.rose} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No businesses found.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: Colors.cream },
  header:                { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 10 },
  heading:               { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  searchWrap:            { paddingHorizontal: 16, marginBottom: 8 },
  search:                { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  chips:                 { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  chip:                  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive:            { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipText:              { fontSize: 12, fontWeight: '600', color: Colors.mid },
  chipTextActive:        { color: Colors.white },
  trendingSection:       { marginBottom: 8 },
  sectionLabel:          { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 18, marginBottom: 8 },
  trendingList:          { paddingHorizontal: 16, gap: 12 },
  trendingCard:          { width: 90, alignItems: 'center' },
  trendingLogo:          { width: 54, height: 54, borderRadius: 27, marginBottom: 6 },
  trendingLogoPlaceholder: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  trendingInitials:      { fontSize: 14, fontWeight: '700', color: Colors.rose },
  trendingName:          { fontSize: 11, fontWeight: '600', color: Colors.charcoal, textAlign: 'center' },
  trendingCity:          { fontSize: 10, color: Colors.soft, textAlign: 'center' },
  list:                  { padding: 16, gap: 12 },
  card:                  { backgroundColor: Colors.white, borderRadius: 18, padding: 16, shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardTop:               { flexDirection: 'row', marginBottom: 12 },
  logo:                  { width: 52, height: 52, borderRadius: 14, marginRight: 12 },
  logoPlaceholder:       { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoInitials:          { fontSize: 16, fontWeight: '700', color: Colors.rose },
  cardInfo:              { flex: 1, justifyContent: 'center' },
  nameRow:               { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName:              { fontSize: 15, fontWeight: '700', color: Colors.charcoal, flex: 1 },
  eliteBadge:            { backgroundColor: Colors.gold + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  eliteText:             { fontSize: 10, fontWeight: '700', color: Colors.gold },
  cardCity:              { fontSize: 12, color: Colors.soft, marginTop: 2 },
  cardTagline:           { fontSize: 12, color: Colors.mid, marginTop: 2 },
  bookBtn:               { backgroundColor: Colors.rose, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  bookBtnText:           { color: Colors.white, fontWeight: '700', fontSize: 14 },
  empty:                 { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText:             { color: Colors.soft, fontSize: 14 },
});
