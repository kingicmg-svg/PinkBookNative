import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, ImageBackground,
  RefreshControl, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverApi, ClientApi } from '../services/ApiService';
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

function PortfolioCard({ item, onBook, savedSlugs, onToggleSave }:
  { item: any; onBook: (s: string) => void; savedSlugs: Set<string>; onToggleSave: (s: string, isSaved: boolean) => void }) {
  const name = item.business_name || 'Business';
  const city = item.city || '';
  const slug = item.booking_slug || '';
  const tier = item.subscription_tier || '';
  const cat  = item.service_category || item.category || '';
  const logo = item.logo_url || item.logo_data_url || item.profile_photo_url || null;
  const tags: string[] = Array.isArray(item.ai_tags) ? item.ai_tags : [];
  const isElite = tier === 'studio_elite' || tier === 'elite';
  const isSaved = savedSlugs.has(slug);

  const inner = (
    <>
      <TouchableOpacity
        style={[s.heart, isSaved && s.heartSaved]}
        onPress={() => slug && onToggleSave(slug, isSaved)}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={17} color={isSaved ? D.pink : D.textPrimary} />
      </TouchableOpacity>
      <View style={s.cardInfo}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            {!!cat && <Text style={s.catPill}>{cat.toUpperCase()}</Text>}
            {isElite && <View style={s.eliteBadge}><Text style={s.eliteText}>ELITE</Text></View>}
            {tags.slice(0, 2).map((t, i) => (
              <View key={i} style={s.aiTag}><Text style={s.aiTagTxt}>{t}</Text></View>
            ))}
          </View>
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
    <TouchableOpacity style={s.card} activeOpacity={0.92} onPress={() => slug && onBook(slug)}>
      {logo ? (
        <ImageBackground source={{ uri: logo }} style={s.cardBg} resizeMode="cover">
          <LinearGradient colors={['transparent','rgba(12,6,9,0.65)','rgba(8,3,6,0.94)']} locations={[0.3,0.65,1]} style={StyleSheet.absoluteFill} />
          {inner}
        </ImageBackground>
      ) : (
        <LinearGradient colors={['#2a0e1e','#1a0c16','#110A0E']} style={s.cardBg}>
          <View style={s.iniWrap}><Text style={s.iniTxt}>{ini(name)}</Text></View>
          {inner}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

function TrendBubble({ item, onBook }: { item: any; onBook: (s: string) => void }) {
  const logo = item.logo_url || item.logo_data_url || item.profile_photo_url || null;
  const name = item.business_name || '';
  return (
    <TouchableOpacity style={s.trendBubble} onPress={() => item.booking_slug && onBook(item.booking_slug)}>
      {logo ? (
        <ImageBackground source={{ uri: logo }} style={s.trendImg} resizeMode="cover">
          <LinearGradient colors={['transparent','rgba(8,3,6,0.7)']} style={StyleSheet.absoluteFill} />
        </ImageBackground>
      ) : (
        <LinearGradient colors={['#2a0e1e','#110A0E']} style={[s.trendImg, { alignItems:'center', justifyContent:'center' }]}>
          <Text style={{ fontSize:16, fontWeight:'700', color:D.pink }}>{ini(name)}</Text>
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
  const [savedSlugs, setSavedSlugs]   = useState<Set<string>>(new Set());
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = (p: number, q: string, cat: string) => {
    const parts = [`page=${p}`];
    if (q.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
    if (cat !== 'All') parts.push(`category=${cat.toLowerCase()}`);
    return `?${parts.join('&')}`;
  };

  const loadSaved = useCallback(async () => {
    if (!token) return;
    try {
      const r = await ClientApi.savedStylists(token);
      setSavedSlugs(new Set((r.stylists || []).map((s: any) => s.booking_slug).filter(Boolean)));
    } catch {}
  }, [token]);

  const loadTrend    = useCallback(async () => { try { const r = await DiscoverApi.trending(); setTrending(r.data || []); } catch {} }, []);
  const loadEditorial= useCallback(async () => { try { const r = await DiscoverApi.editorial(); setEditorial((r.data || []).slice(0, 12)); } catch {} }, []);

  const load = useCallback(async (p: number, q: string, cat: string, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const r = await DiscoverApi.list(buildParams(p, q, cat));
      const items = r.data || [];
      setResults(prev => append ? [...prev, ...items] : items);
      setHasMore(items.length >= 12);
    } catch {} finally { setLoading(false); setLoadingMore(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadTrend(); loadEditorial(); load(1, '', 'All'); loadSaved(); }, [loadSaved]);

  const onSearch = useCallback((q: string) => {
    setQuery(q);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setPage(1); load(1, q, category); }, 380);
  }, [category, load]);

  const onCat = useCallback((cat: string) => { setCategory(cat); setPage(1); load(1, query, cat); }, [query, load]);
  const onEnd = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const n = page + 1; setPage(n); load(n, query, category, true);
  }, [hasMore, loadingMore, page, query, category, load]);

  const onBook = useCallback((slug: string) => {
    if (!token) { router.push('/auth/client-login'); return; }
    router.push(`/booking/${encodeURIComponent(slug)}`);
  }, [token, router]);

  const onToggleSave = useCallback(async (slug: string, isSaved: boolean) => {
    if (!token) { router.push('/auth/client-login'); return; }
    // Optimistic update
    setSavedSlugs(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(slug) : next.add(slug);
      return next;
    });
    try {
      if (isSaved) await ClientApi.unsaveStylist(token, slug);
      else         await ClientApi.saveStylist(token, slug);
    } catch {
      // Revert on failure
      setSavedSlugs(prev => {
        const next = new Set(prev);
        isSaved ? next.add(slug) : next.delete(slug);
        return next;
      });
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  }, [token, router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    Promise.all([loadTrend(), loadEditorial(), load(1, query, category), loadSaved()]).finally(() => setRefreshing(false));
  }, [query, category, load, loadTrend, loadEditorial, loadSaved]);

  const Header = (
    <>
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.wordmark}>Pink<Text style={{ color: D.pink, fontStyle: 'italic' }}>book</Text></Text>
        <TouchableOpacity style={s.authBtn} onPress={() => router.push(token ? '/(consumer-tabs)/profile' : '/auth/client-login')}>
          <Ionicons name={token ? 'person' : 'person-outline'} size={18} color={D.pink} />
          <Text style={s.authBtnTxt}>{token ? 'Me' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.searchRow}>
        <Ionicons name="search" size={16} color={D.textSec} style={{ marginLeft: 14 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search stylists, services, cities..."
          placeholderTextColor={D.textMuted}
          value={query}
          onChangeText={onSearch}
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity onPress={() => { setQuery(''); setPage(1); load(1, '', category); }} style={{ paddingHorizontal: 12 }}>
            <Ionicons name="close-circle" size={16} color={D.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CATS.map(c => (
          <TouchableOpacity key={c} style={[s.catPillBtn, category === c && s.catPillBtnOn]} onPress={() => onCat(c)}>
            <Text style={[s.catPillTxt, category === c && s.catPillTxtOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending row */}
      {trending.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🔥 Trending Now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {trending.map((item, i) => <TrendBubble key={i} item={item} onBook={onBook} />)}
          </ScrollView>
        </View>
      )}

      {/* Editorial */}
      {editorial.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>✨ Featured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {editorial.map((art, i) => (
              <TouchableOpacity key={i} style={s.artCard} onPress={() => art.link && Linking.openURL(art.link)}>
                <LinearGradient colors={['#2a0e1e','#110A0E']} style={s.artBg}>
                  <Text style={s.artEmoji}>{art.emoji || '📖'}</Text>
                </LinearGradient>
                <Text style={s.artTitle} numberOfLines={2}>{art.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 }}>
        <Text style={s.sectionTitle}>
          {category === 'All' ? '🌸 All Pros' : `💅 ${category} Pros`}
          {query ? ` · "${query}"` : ''}
        </Text>
      </View>
    </>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {loading && results.length === 0 ? (
        <>
          {Header}
          <ActivityIndicator color={D.pink} size="large" style={{ marginTop: 60 }} />
        </>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
          ListHeaderComponent={Header}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.pink} />}
          onEndReached={onEnd}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <PortfolioCard item={item} onBook={onBook} savedSlugs={savedSlugs} onToggleSave={onToggleSave} />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
              <Text style={{ color: D.textSec, fontSize: 15 }}>No results found.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={D.pink} style={{ paddingVertical: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: D.bgBase },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  wordmark:     { fontSize: 22, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  authBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(212,65,122,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,65,122,0.3)' },
  authBtnTxt:   { fontSize: 13, fontWeight: '700', color: D.pink },
  searchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: D.bgCard, borderRadius: 14, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: D.border, height: 44 },
  searchInput:  { flex: 1, color: D.textPrimary, fontSize: 14, paddingHorizontal: 10, paddingVertical: 0 },
  catScroll:    { marginBottom: 14 },
  catPillBtn:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: D.bgCard, borderWidth: 1, borderColor: D.border },
  catPillBtnOn: { backgroundColor: D.pink, borderColor: D.pink },
  catPillTxt:   { fontSize: 13, fontWeight: '700', color: D.textSec },
  catPillTxtOn: { color: D.white },
  section:      { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: D.textPrimary, marginBottom: 12, paddingHorizontal: 16, fontFamily: 'Georgia' },
  // Trending
  trendBubble:  { width: 88, alignItems: 'center', gap: 6 },
  trendImg:     { width: 78, height: 78, borderRadius: 39, overflow: 'hidden', borderWidth: 2, borderColor: D.pink },
  trendName:    { fontSize: 11, fontWeight: '700', color: D.textSec, textAlign: 'center' },
  // Editorial
  artCard:      { width: 130, gap: 8 },
  artBg:        { width: 130, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  artEmoji:     { fontSize: 28 },
  artTitle:     { fontSize: 12, fontWeight: '600', color: D.textSec, lineHeight: 16 },
  // Portfolio cards
  card:         { flex: 1, borderRadius: 18, overflow: 'hidden', aspectRatio: 0.72, backgroundColor: D.bgCard, borderWidth: 1, borderColor: D.border },
  cardBg:       { flex: 1, justifyContent: 'flex-end' },
  iniWrap:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  iniTxt:       { fontSize: 32, fontWeight: '900', color: 'rgba(212,65,122,0.35)' },
  cardInfo:     { padding: 12, gap: 8 },
  catPill:      { fontSize: 9, fontWeight: '800', color: D.textMuted, letterSpacing: 0.8 },
  eliteBadge:   { backgroundColor: 'rgba(201,169,110,0.20)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(201,169,110,0.50)' },
  eliteText:    { fontSize: 8, fontWeight: '800', color: D.gold, letterSpacing: 0.5 },
  aiTag:        { backgroundColor: 'rgba(212,65,122,0.12)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  aiTagTxt:     { fontSize: 8, fontWeight: '700', color: D.pink },
  cardName:     { fontSize: 14, fontWeight: '900', color: D.textPrimary },
  cardCity:     { fontSize: 11, color: D.textSec, marginTop: 2 },
  bookBtn:      { backgroundColor: D.pink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', shadowColor: D.pink, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 5 },
  bookBtnTxt:   { color: D.white, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  heart:        { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(17,10,14,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heartSaved:   { backgroundColor: 'rgba(212,65,122,0.22)', borderColor: D.pink },
});
