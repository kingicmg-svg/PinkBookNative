import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, ImageBackground, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ClientApi } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF', gold:'#C9A96E',
};

const ini = (n: string) => (n || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2);

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [stylists, setStylists] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const r = await ClientApi.savedStylists(token);
      setStylists(r.stylists || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const unsave = async (slug: string, name: string) => {
    Alert.alert(`Remove ${name}?`, 'This will remove them from your saved list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setStylists(prev => prev.filter(s => s.booking_slug !== slug));
        try { await ClientApi.unsaveStylist(token!, slug); } catch {
          load();
          Alert.alert('Error', 'Could not unsave. Please try again.');
        }
      }},
    ]);
  };

  if (!token) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}><Text style={s.heading}>Saved</Text></View>
        <View style={s.empty}>
          <Text style={{ fontSize: 44, marginBottom: 16 }}>❤️</Text>
          <Text style={s.emptyH}>Save your favourite stylists</Text>
          <Text style={s.emptySub}>Sign in to save pros and book them instantly.</Text>
          <TouchableOpacity style={s.cta} onPress={() => router.push('/auth/client-login')}>
            <Text style={s.ctaTxt}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.heading}>Saved ❤️</Text>
        <Text style={s.subCount}>{stylists.length} stylist{stylists.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={D.pink} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={stylists}
          keyExtractor={item => item.booking_slug}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 10, paddingTop: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={D.pink} />}
          renderItem={({ item }) => {
            const logo = item.logo_url || item.profile_photo_url || null;
            const name = item.business_name || item.booking_slug || 'Stylist';
            const slug = item.booking_slug || '';
            const tags: string[] = Array.isArray(item.ai_tags) ? item.ai_tags : [];
            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.9}
                onPress={() => router.push(`/booking/${encodeURIComponent(slug)}`)}
              >
                {logo ? (
                  <ImageBackground source={{ uri: logo }} style={s.cardImg} resizeMode="cover">
                    <LinearGradient colors={['transparent','rgba(8,3,6,0.90)']} locations={[0.4,1]} style={StyleSheet.absoluteFill} />
                  </ImageBackground>
                ) : (
                  <LinearGradient colors={['#2a0e1e','#1a0c16']} style={s.cardImg}>
                    <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: 'rgba(212,65,122,0.4)' }}>{ini(name)}</Text>
                    </View>
                  </LinearGradient>
                )}
                <View style={s.cardBody}>
                  <Text style={s.cardName} numberOfLines={1}>{name}</Text>
                  {!!item.city && <Text style={s.cardCity}>{item.city}</Text>}
                  {tags.length > 0 && (
                    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {tags.slice(0,2).map((t, i) => (
                        <View key={i} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
                      ))}
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                    <TouchableOpacity style={s.bookBtn} onPress={() => router.push(`/booking/${encodeURIComponent(slug)}`)}>
                      <Text style={s.bookBtnTxt}>Book Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.unsaveBtn} onPress={() => unsave(slug, name)}>
                      <Ionicons name="heart-dislike-outline" size={14} color={D.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 44, marginBottom: 16 }}>🌸</Text>
              <Text style={s.emptyH}>No saved stylists yet</Text>
              <Text style={s.emptySub}>Tap the ♡ on any stylist card in Discover to save them here.</Text>
              <TouchableOpacity style={s.cta} onPress={() => router.push('/(consumer-tabs)/discover')}>
                <Text style={s.ctaTxt}>Explore Stylists</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: D.bgBase },
  header:     { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  heading:    { fontSize: 24, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia', flex: 1 },
  subCount:   { fontSize: 12, color: D.textMuted, fontWeight: '600' },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10, marginTop: 60 },
  emptyH:     { fontSize: 17, fontWeight: '800', color: D.textPrimary, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: D.textSec, textAlign: 'center', lineHeight: 20 },
  cta:        { backgroundColor: D.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 8 },
  ctaTxt:     { color: D.white, fontWeight: '800', fontSize: 14 },
  card:       { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: D.bgCard, borderWidth: 1, borderColor: D.border },
  cardImg:    { width: '100%', aspectRatio: 1.1 },
  cardBody:   { padding: 12 },
  cardName:   { fontSize: 14, fontWeight: '900', color: D.textPrimary, marginBottom: 2 },
  cardCity:   { fontSize: 11, color: D.textSec },
  tag:        { backgroundColor: 'rgba(212,65,122,0.12)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tagTxt:     { fontSize: 9, fontWeight: '700', color: D.pink },
  bookBtn:    { flex: 1, backgroundColor: D.pink, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  bookBtnTxt: { color: D.white, fontSize: 12, fontWeight: '800' },
  unsaveBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: D.border, alignItems: 'center', justifyContent: 'center' },
});
