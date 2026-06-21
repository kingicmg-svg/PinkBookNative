'use strict';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [config, setConfig]   = useState<{ visits_required: number; reward_text: string; active: boolean }>({
    visits_required: 10, reward_text: 'Free service of your choice', active: false,
  });
  const [cards, setCards]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState<'config' | 'cards'>('config');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cfgRes, cardsRes] = await Promise.allSettled([
        OwnerApi.getLoyaltyConfig(token),
        OwnerApi.getLoyaltyCards(token),
      ]);
      if (cfgRes.status === 'fulfilled' && cfgRes.value.config) {
        const c = cfgRes.value.config;
        setConfig({
          visits_required: c.visits_required ?? 10,
          reward_text: c.reward_text ?? 'Free service of your choice',
          active: c.active ?? false,
        });
      }
      if (cardsRes.status === 'fulfilled') setCards(cardsRes.value.cards || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load loyalty data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveConfig = async () => {
    if (!token) return;
    if (config.visits_required < 1 || config.visits_required > 100) {
      Alert.alert('Invalid', 'Visits required must be between 1 and 100.'); return;
    }
    if (!config.reward_text.trim()) {
      Alert.alert('Required', 'Enter a reward description.'); return;
    }
    setSaving(true);
    try {
      await OwnerApi.saveLoyaltyConfig(token, config);
      Alert.alert('Saved', 'Loyalty program updated!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.rose} size="large" />
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Loyalty Program</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'config' && s.tabBtnActive]} onPress={() => setTab('config')}>
          <Text style={[s.tabTxt, tab === 'config' && s.tabTxtActive]}>Program Setup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'cards' && s.tabBtnActive]} onPress={() => setTab('cards')}>
          <Text style={[s.tabTxt, tab === 'cards' && s.tabTxtActive]}>Client Cards ({cards.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'config' && (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Hero explainer */}
          <View style={s.heroBanner}>
            <Text style={s.heroEmoji}>⭐</Text>
            <Text style={s.heroTitle}>Punch-Card Loyalty</Text>
            <Text style={s.heroSub}>
              Clients earn a punch for every completed visit. When they reach your target, they earn their reward automatically.
            </Text>
          </View>

          <View style={s.card}>
            {/* Active toggle */}
            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Program Active</Text>
                <Text style={s.fieldSub}>Clients will earn punches on completed bookings when active.</Text>
              </View>
              <Switch
                value={config.active}
                onValueChange={v => setConfig(c => ({ ...c, active: v }))}
                trackColor={{ true: Colors.rose }}
              />
            </View>

            {/* Visits required */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Visits Required for Reward</Text>
            <Text style={s.fieldSub}>How many completed visits before the client earns their reward?</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={s.stepBtn}
                onPress={() => setConfig(c => ({ ...c, visits_required: Math.max(1, c.visits_required - 1) }))}
              >
                <Ionicons name="remove" size={20} color={Colors.rose} />
              </TouchableOpacity>
              <View style={s.stepValue}>
                <Text style={s.stepValueTxt}>{config.visits_required}</Text>
                <Text style={s.stepValueSub}>visits</Text>
              </View>
              <TouchableOpacity
                style={s.stepBtn}
                onPress={() => setConfig(c => ({ ...c, visits_required: Math.min(100, c.visits_required + 1) }))}
              >
                <Ionicons name="add" size={20} color={Colors.rose} />
              </TouchableOpacity>
            </View>

            {/* Reward text */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Reward Description</Text>
            <Text style={s.fieldSub}>What reward do clients receive when they complete their punch card?</Text>
            <TextInput
              style={s.input}
              value={config.reward_text}
              onChangeText={v => setConfig(c => ({ ...c, reward_text: v }))}
              placeholder="e.g. Free service of your choice, 50% off next visit"
              placeholderTextColor={Colors.soft}
              multiline
            />
          </View>

          {/* Preview card */}
          <View style={s.previewCard}>
            <Text style={s.previewTitle}>Preview: Client Punch Card</Text>
            <View style={s.punchGrid}>
              {Array.from({ length: config.visits_required }).map((_, i) => (
                <View key={i} style={[s.punch, i < 3 && s.punchFilled]}>
                  {i < 3 && <Ionicons name="star" size={14} color={Colors.white} />}
                </View>
              ))}
            </View>
            <Text style={s.previewReward}>🎁 Reward: {config.reward_text}</Text>
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={saveConfig} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.saveTxt}>Save Loyalty Program</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {tab === 'cards' && (
        <ScrollView contentContainerStyle={s.scroll}>
          {cards.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyEmoji}>🎴</Text>
              <Text style={s.emptyTitle}>No Punch Cards Yet</Text>
              <Text style={s.emptySub}>Cards are created automatically when clients complete their first booking after you activate the loyalty program.</Text>
            </View>
          ) : (
            cards.map((card: any) => {
              const filled = card.punch_count || 0;
              const total = card.visits_required || config.visits_required;
              const pct = Math.min(100, Math.round((filled / total) * 100));
              return (
                <View key={card.id} style={s.clientCard}>
                  <View style={s.clientCardHeader}>
                    <View style={s.clientAvatar}>
                      <Text style={s.clientAvatarTxt}>{(card.client_name || 'C')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.clientName}>{card.client_name || 'Client'}</Text>
                      <Text style={s.clientEmail}>{card.client_email || ''}</Text>
                    </View>
                    <View style={s.punchBadge}>
                      <Text style={s.punchBadgeTxt}>{filled}/{total}</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${pct}%` as any }]} />
                  </View>
                  {card.redeemed_at && (
                    <Text style={s.redeemedTxt}>✅ Redeemed {new Date(card.redeemed_at).toLocaleDateString()}</Text>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle:    { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  tabRow:       { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.rose },
  tabTxt:       { fontSize: 13, fontWeight: '700', color: Colors.soft },
  tabTxtActive: { color: Colors.rose },
  scroll:       { padding: 16, gap: 12 },
  heroBanner:   { backgroundColor: Colors.rose, borderRadius: 18, padding: 20, alignItems: 'center', gap: 6, marginBottom: 4 },
  heroEmoji:    { fontSize: 36 },
  heroTitle:    { fontSize: 18, fontWeight: '900', color: Colors.white, fontFamily: 'Georgia' },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },
  card:         { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  switchRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldLabel:   { fontSize: 14, fontWeight: '800', color: Colors.charcoal, marginBottom: 2 },
  fieldSub:     { fontSize: 12, color: Colors.soft, marginBottom: 4 },
  stepperRow:   { flexDirection: 'row', alignItems: 'center', gap: 0, marginTop: 8 },
  stepBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  stepValue:    { flex: 1, alignItems: 'center' },
  stepValueTxt: { fontSize: 36, fontWeight: '900', color: Colors.charcoal },
  stepValueSub: { fontSize: 12, color: Colors.soft },
  input:        { backgroundColor: Colors.cream, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  previewCard:  { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  previewTitle: { fontSize: 14, fontWeight: '800', color: Colors.charcoal, marginBottom: 12 },
  punchGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  punch:        { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  punchFilled:  { backgroundColor: Colors.rose, borderColor: Colors.rose },
  previewReward:{ fontSize: 13, color: Colors.soft, fontStyle: 'italic' },
  saveBtn:      { backgroundColor: Colors.rose, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveTxt:      { color: Colors.white, fontWeight: '800', fontSize: 15 },
  emptyBox:     { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji:   { fontSize: 48 },
  emptyTitle:   { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  emptySub:     { fontSize: 14, color: Colors.soft, textAlign: 'center' },
  clientCard:   { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  clientCardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  clientAvatarTxt:{ fontSize: 18, fontWeight: '800', color: Colors.rose },
  clientName:   { fontSize: 14, fontWeight: '800', color: Colors.charcoal },
  clientEmail:  { fontSize: 12, color: Colors.soft },
  punchBadge:   { backgroundColor: Colors.rose, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  punchBadgeTxt:{ fontSize: 13, fontWeight: '800', color: Colors.white },
  progressBar:  { height: 8, backgroundColor: Colors.pinkLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: Colors.rose, borderRadius: 4 },
  redeemedTxt:  { fontSize: 12, color: Colors.success, fontWeight: '700' },
});
