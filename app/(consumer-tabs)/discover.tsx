import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, ImageBackground,
  RefreshControl, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DiscoverApi } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', pinkGlow:'rgba(212,65,122,0.45)',
  gold:'#C9A96E', goldBg:'rgba(201,169,110,0.20)', goldBorder:'rgba(201,169,110,0.50)',
  textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.12)', white:'#FFFFFF',
};

const API_URL = (process.env.EXPO_PUBLIC_PINKBOOK_API_URL || 'https://www.pinkbook.app').replace(/\/$/, '');
const CATS = ['All','Hair','Nails','Lashes','Brows','Skin','Makeup','Waxing'];
const ini = (n: string) => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function PortfolioCard({ item, onBook }: { item: any; onBook: (s: string) => void }) {
  const name = item.business_name || 'Business';
  const city = item.city || '';
  const slug = item.booking_slug || '';
  const tier = item.subscription_tier || '';
  const cat  = item.category || '';
  const logo = item.logo_data_url || null;
  const isElite = tier === 'studio_elite' || tier === 'elite';
  const [saved, setSaved] = useState(false);

  const inner = (
    <>
      <TouchableOpacity
        style={[s.heart, saved && s.heartSaved]}
        onPress={() => setSaved(!saved)}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Text style={{ fontSize: 16, color: saved ? D.pink : D.textPrimary }}>{saved ? '\u2665' : '\u2661'}</Text>
      </TouchableOpacity>
      <View style={s.cardInfo}>
        <View style={{ flex: 1 }}>
          {!!cat && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Text style={s.catPill}>{cat.toUpperCase()}</Text>
              {isElite && <View style={s.eliteBadge}><Text style={s.eliteText}>ELITE</Text></View>}
            </View>
          )}
          <Text style={s.cardName} numberOfLines={1}>{name}</Text>
          {!!city && <Text style={s.cardCity}>{city}</Text>}
        </View>
        {!!slug && (
          <TouchableOpacity style={s.bookBtn} onPress={() => onBook(slug)} activeOpacity={0.85}>
            <Text style={s.bookBtnTxt}>Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.95} onPress={() => slug && onBook(slug)}>
      {logo ? (
        <ImageBackground source={{ uri: logo }} style={s.cardBg} resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(12,6,9,0.65)', 'rgba(8,3,6,0.94)']}
            locations={[0.3, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
          {inner}
        </ImageBackground>
      ) : (
        <LinearGradient colors={['#2a0e1e', '#1a0c16', '#110A0E']} style={s.cardBg}>
          <View style={s.iniWrap}><Text style={s.iniTxt}>{ini(name)}</Text></View>
          {inner}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

function TrendBubble({ item, onBook }: { item: any; onBook: (s: string) => void }) {
  const logo = item.logo_data_url || null;
  const name = item.business_name || '';
  return (
    <TouchableOpacity style={s.trendBubble} onPress={() => item.booking_slug && onBook(item.booking_slug)}>
      {logo ? (
        <ImageBackground source={{ uri: logo }} style={s.trendImg} resizeMode="cover">
          <LinearGradient colors={['transparent', 'rgba(8,3,6,0.7)']} style={StyleSheet.absoluteFill} />
        </ImageBackground>
      ) : (
        <LinearGradient colors={['#2a0e1e', '#110A0E']} style={[s.trendImg, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: D.pink }}>{ini(name)}</Text>
        </LinearGradient>
      )}
      <Text style={s.trendName} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [trending, setTrending]       = useState<any[]>([]);
  const [editorial, setEditorial]     = useState<any[]>([]);
  const [results, setResults]         = useState<any[]>([]);
  const [query, setQuery]             = useState('');
  const [category, setCategory]       = useState('All');
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const params = (p: number, q: string, cat: string) => {
    const parts = [`page=${p}`];
    if (q.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
    if (cat !== 'All') parts.push(`category=${cat.toLowerCase()}`);
    return `?${parts.join('&')}`;
  };

  const loadTrend = useCallback(async () => {
    try { const r = await DiscoverApi.trending(); setTrending(r.data || []); } catch {}
  }, []);

  const loadEditorial = useCallback(async () => {
    try { const r = await DiscoverApi.editorial(); setEditorial((r.data || []).slice(0, 12)); } catch {}
  }, []);

  const load = useCallback(async (p: number, q: string, cat: string, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const r = await DiscoverApi.list(params(p, q, cat));
      const items = r.data || [];
      setResults(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length >= 12);
    } catch {} finally {
      setLoading(false); setLoadingMore(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTrend(); loadEditorial(); load(1, '', 'All'); }, []);

  const onSearch = useCallback((q: string) => {
    setQuery(q);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setPage(1); load(1, q, category); }, 400);
  }, [category, load]);

  const onCat = useCallback((cat: string) => {
    setCategory(cat); setPage(1); load(1, query, cat);
  }, [query, load]);

  const onEnd = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const n = page + 1; setPage(n); load(n, query, category, true);
  }, [hasMore, loadingMore, page, query, category, load]);

  const onBook = useCallback((slug: string) => {
    if (!token) { router.push('/auth/client-login'); return; }
    router.push(`/booking/${encodeURIComponent(slug)}`);
  }, [token, router]);

  const Header = (
    <>
      {trending.length > 0 && (
        <View style={{ paddingTop: 18, paddingBottom: 4 }}>
          <Text style={s.sectionLabel}>&#x2736; Trending</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}>
            {trending.map((item, i) => <TrendBubble key={i} item={item} onBook={onBook} />)}
          </ScrollView>
        </View>
      )}
      <Text style={[s.sectionLabel, { marginTop: 16 }]}>&#x2736; All Pros</Text>
    </>
  );

  const EditorialFooter = editorial.length === 0 ? null : (
    <View style={{ paddingTop: 24, paddingBottom: 8 }}>
      <Text style={s.sectionLabel}>&#x2736; Beauty News</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}>
        {editorial.map((art, i) => (
          <TouchableOpacity key={i} style={s.editCard} activeOpacity={0.88}
            onPress={() => art.link && Linking.openURL(art.link)}>
            {art.heroImage ? (
              <ImageBackground source={{ uri: art.heroImage }} style={s.editImg} resizeMode="cover">
                <LinearGradient colors={['transparent', 'rgba(8,3,6,0.90)']} style={StyleSheet.absoluteFill} />
                <View style={s.editInfo}>
                  {!!art.source && <Text style={s.editSource} numberOfLines={1}>{art.source}</Text>}
                  <Text style={s.editTitle} numberOfLines={2}>{art.title}</Text>
                </View>
              </ImageBackground>
            ) : (
              <LinearGradient colors={['#2a0e1e', '#110A0E']} style={s.editImg}>
                <View style={s.editInfo}>
                  {!!art.source && <Text style={s.editSource} numberOfLines={1}>{art.source}</Text>}
                  <Text style={s.editTitle} numberOfLines={3}>{art.title}</Text>
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.topBar}>
        <Text style={s.wordmark}>Pink<Text style={{ color: D.pink, fontStyle: 'italic' }}>book</Text></Text>
        <TouchableOpacity style={s.authBtn} onPress={() => router.push(token ? '/(consumer-tabs)/profile' : '/auth/client-login')}>
          <Text style={s.authBtnTxt}>{token ? 'Profile' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
        <TextInput style={s.search} placeholder="Search salons, city, style..." placeholderTextColor={D.textMuted} value={query} onChangeText={onSearch} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ maxHeight: 44 }}>
        {CATS.map(cat => (
          <TouchableOpacity key={cat} style={[s.chip, category === cat && s.chipActive]} onPress={() => onCat(cat)}>
            <Text style={[s.chipTxt, category === cat && s.chipTxtActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? (
        <ActivityIndicator color={D.pink} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <PortfolioCard item={item} onBook={onBook} />}
          contentContainerStyle={s.feed}
          ListHeaderComponent={Header}
          onEndReached={onEnd}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={D.pink} onRefresh={() => { setRefreshing(true); loadTrend(); load(1, query, category); }} />}
          ListFooterComponent={<>{loadingMore ? <ActivityIndicator color={D.pink} style={{ margin: 20 }} /> : null}{EditorialFooter}</>}
          ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 60 }}><Text style={{ color: D.textSec, fontSize: 16, fontWeight: '700' }}>No pros found</Text><Text style={{ color: D.textMuted, fontSize: 13, marginTop: 6 }}>Try a different category</Text></View>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: D.bgBase },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: D.border },
  wordmark:     { fontSize: 22, fontWeight: '700', color: D.textPrimary, fontFamily: 'Georgia' },
  authBtn:      { borderWidth: 1, borderColor: D.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: D.bgElevated },
  authBtnTxt:   { color: D.textPrimary, fontSize: 11, fontWeight: '600' },
  search:       { backgroundColor: D.bgElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: D.textPrimary, borderWidth: 1, borderColor: D.border },
  chips:        { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: D.bgElevated, borderWidth: 1, borderColor: D.border },
  chipActive:   { backgroundColor: D.pink, borderColor: D.pink },
  chipTxt:      { fontSize: 12, fontWeight: '600', color: D.textSec },
  chipTxtActive:{ color: D.white, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: D.pink, paddingHorizontal: 16, marginBottom: 12 },
  trendBubble:  { width: 74, alignItems: 'center' },
  trendImg:     { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', marginBottom: 6, borderWidth: 1.5, borderColor: D.border },
  trendName:    { fontSize: 10, fontWeight: '600', color: D.textSec, textAlign: 'center' },
  feed:         { paddingHorizontal: 12, paddingBottom: 100, gap: 14, paddingTop: 8 },
  card:         { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 20, elevation: 10 },
  cardBg:       { width: '100%', aspectRatio: 0.75, justifyContent: 'flex-end' },
  iniWrap:      { position: 'absolute', top: '35%', alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,65,122,0.15)', borderWidth: 1, borderColor: D.border, alignItems: 'center', justifyContent: 'center' },
  iniTxt:       { fontSize: 28, fontWeight: '700', color: D.pink },
  heart:        { position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(17,10,14,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heartSaved:   { backgroundColor: 'rgba(212,65,122,0.25)', borderColor: D.pink },
  cardInfo:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  catPill:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: D.white, backgroundColor: D.pink, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  eliteBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: D.goldBg, borderWidth: 1, borderColor: D.goldBorder },
  eliteText:    { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: D.gold },
  cardName:     { fontSize: 22, fontWeight: '700', color: D.textPrimary, fontFamily: 'Georgia', lineHeight: 26, marginBottom: 4 },
  cardCity:     { fontSize: 12, color: D.textSec },
  bookBtn:      { backgroundColor: D.pink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, shadowColor: D.pink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  bookBtnTxt:   { color: D.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  editCard:     { width: 200, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: D.border },
  editImg:      { width: 200, height: 250, justifyContent: 'flex-end' },
  editInfo:     { padding: 12 },
  editSource:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: D.pink, textTransform: 'uppercase', marginBottom: 4 },
  editTitle:    { fontSize: 13, fontWeight: '600', color: D.textPrimary, lineHeight: 18 },
});
