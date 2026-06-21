import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { API_URL } from '../services/ApiService';

const { width } = Dimensions.get('window');

const D = {
  bgBase:'#0F0A0D', bgCard:'#1A1014', bgElevated:'#251822',
  pink:'#C85D7A', pinkLight:'rgba(200,93,122,0.12)', textPrimary:'#F5EEF0',
  textSec:'#9E8A90', textMuted:'#5C4A52', border:'rgba(200,93,122,0.15)',
  white:'#FFFFFF', gold:'#C9A96E', success:'#1A9E4A', cream:'#FDF6F0',
};

const PLATFORMS = [
  { id: 'vagaro',      icon: '💜', name: 'Vagaro',        tip: 'Clients → Export → CSV' },
  { id: 'glossgenius', icon: '✨', name: 'GlossGenius',   tip: 'Settings → Export Client List' },
  { id: 'square',      icon: '⬛', name: 'Square',        tip: 'Customers → Export' },
  { id: 'booksy',      icon: '📅', name: 'Booksy',        tip: 'Clients → Export CSV' },
  { id: 'spreadsheet', icon: '📊', name: 'Spreadsheet',   tip: 'Copy & paste columns directly' },
  { id: 'manual',      icon: '✍️', name: 'Manual / Text', tip: 'Type or paste a list of names and contacts' },
];

type ParsedClient = {
  name: string; contactEmail: string; contactPhone: string; notes: string; birthday: string;
};

export default function ImportClientsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<1|2|3>(1);
  const [platform, setPlatform] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedClient[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  async function getToken() {
    return AsyncStorage.getItem('@owner_token');
  }

  const stepParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/clients/import/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');
      if (!data.clients?.length) {
        Alert.alert('No clients found', 'Could not detect any client records in that input. Try a different format or check for column headers.');
        return;
      }
      setParsed(data.clients);
      setSelected(new Set(data.clients.map((_: any, i: number) => i)));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(3);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('AI Parse Error', e.message);
    } finally {
      setParsing(false);
    }
  };

  const stepConfirm = async () => {
    const toImport = parsed.filter((_, i) => selected.has(i));
    if (!toImport.length) { Alert.alert('Select at least one client'); return; }
    setImporting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/clients/import/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clients: toImport }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Import Complete!',
        `${data.created} client${data.created !== 1 ? 's' : ''} added to your book${data.skipped ? ` · ${data.skipped} skipped (duplicates/invalid)` : ''}.`,
        [{ text: 'Go to Clients', onPress: () => router.replace('/(owner-tabs)/clients') }],
      );
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Import Error', e.message);
    } finally {
      setImporting(false);
    }
  };

  const toggleSelect = (i: number) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
    Haptics.selectionAsync();
  };

  const selAll = () => { setSelected(new Set(parsed.map((_, i) => i))); Haptics.selectionAsync(); };
  const selNone = () => { setSelected(new Set()); Haptics.selectionAsync(); };

  // ── Step 1: platform picker ───────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Text style={s.stepTitle}>Where are your clients coming from?</Text>
      <Text style={s.stepSub}>PinkBook AI will handle the rest — no formatting required.</Text>
      <View style={s.platformGrid}>
        {PLATFORMS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[s.platformCard, platform === p.id && s.platformCardActive]}
            onPress={() => { setPlatform(p.id); Haptics.selectionAsync(); }}
            activeOpacity={0.8}
          >
            <Text style={s.platformIcon}>{p.icon}</Text>
            <Text style={[s.platformName, platform === p.id && { color: D.pink }]}>{p.name}</Text>
            <Text style={s.platformTip}>{p.tip}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[s.cta, !platform && { opacity: 0.4 }]}
        disabled={!platform}
        onPress={() => { setStep(2); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        activeOpacity={0.85}
      >
        <Text style={s.ctaTxt}>Next: Paste Data</Text>
        <Ionicons name="arrow-forward" size={18} color={D.white} />
      </TouchableOpacity>
    </>
  );

  // ── Step 2: paste raw data ────────────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Text style={s.stepTitle}>Paste your client data</Text>
      <Text style={s.stepSub}>
        {platform === 'manual'
          ? 'Type names and contacts, one per line — any format works.'
          : `Export from ${PLATFORMS.find(p=>p.id===platform)?.name} and paste the full content here.`}
      </Text>
      <View style={s.exampleBox}>
        <Text style={s.exampleLabel}>EXAMPLE FORMAT</Text>
        <Text style={s.exampleText}>{
          platform === 'manual'
            ? 'Sarah Johnson, sarah@email.com, 555-1234\nMia Williams 07700 900123\nKate Brown — birthday Jan 5'
            : 'Name,Email,Phone,Birthday\nSarah Johnson,sarah@email.com,555-1234,1990-01-05\nMia Williams,mia@email.com,07700 900123,'
        }</Text>
      </View>
      <TextInput
        style={s.pasteInput}
        value={rawText}
        onChangeText={setRawText}
        placeholder="Paste here..."
        placeholderTextColor={D.textMuted}
        multiline
        maxLength={30000}
        autoCorrect={false}
        spellCheck={false}
      />
      <Text style={s.charCount}>{rawText.length.toLocaleString()} / 30,000 chars</Text>
      <View style={s.rowBtns}>
        <TouchableOpacity style={s.ctaSecondary} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={16} color={D.pink} />
          <Text style={s.ctaSecondaryTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.cta, { flex: 1 }, (!rawText.trim() || parsing) && { opacity: 0.5 }]}
          disabled={!rawText.trim() || parsing}
          onPress={stepParse}
          activeOpacity={0.85}
        >
          {parsing ? <ActivityIndicator color={D.white} size="small" /> : (
            <>
              <Ionicons name="sparkles" size={16} color={D.white} />
              <Text style={s.ctaTxt}>AI Parse Clients</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {parsing && (
        <View style={s.parsingBanner}>
          <ActivityIndicator color={D.pink} />
          <Text style={s.parsingTxt}>Claude AI is parsing your client list…</Text>
        </View>
      )}
    </>
  );

  // ── Step 3: preview + confirm ─────────────────────────────────────────────
  const renderStep3 = () => (
    <>
      <View style={s.parseResult}>
        <Ionicons name="checkmark-circle" size={22} color={D.success} />
        <Text style={s.parseResultTxt}>{parsed.length} clients detected by AI</Text>
      </View>
      <Text style={s.stepSub}>Review and deselect any you don't want to import.</Text>
      <View style={s.selectRow}>
        <TouchableOpacity onPress={selAll}><Text style={s.selectLink}>Select all</Text></TouchableOpacity>
        <Text style={s.textMuted}> · </Text>
        <TouchableOpacity onPress={selNone}><Text style={s.selectLink}>Deselect all</Text></TouchableOpacity>
        <Text style={[s.textMuted, { marginLeft: 'auto' as any }]}>{selected.size} selected</Text>
      </View>
      <FlatList
        data={parsed}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const on = selected.has(index);
          return (
            <TouchableOpacity
              style={[s.clientRow, !on && s.clientRowDim]}
              onPress={() => toggleSelect(index)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, on && s.checkboxOn]}>
                {on && <Ionicons name="checkmark" size={12} color={D.white} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.clientName}>{item.name}</Text>
                {!!item.contactEmail && <Text style={s.clientSub}>{item.contactEmail}</Text>}
                {!!item.contactPhone && <Text style={s.clientSub}>{item.contactPhone}</Text>}
              </View>
              {!!item.birthday && (
                <Text style={s.clientBday}>🎂 {item.birthday}</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={s.divider} />}
        style={s.clientList}
      />
      <View style={s.rowBtns}>
        <TouchableOpacity style={s.ctaSecondary} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={16} color={D.pink} />
          <Text style={s.ctaSecondaryTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.cta, { flex: 1 }, (!selected.size || importing) && { opacity: 0.5 }]}
          disabled={!selected.size || importing}
          onPress={stepConfirm}
          activeOpacity={0.85}
        >
          {importing ? <ActivityIndicator color={D.white} size="small" /> : (
            <>
              <Ionicons name="cloud-upload-outline" size={16} color={D.white} />
              <Text style={s.ctaTxt}>Import {selected.size} Client{selected.size !== 1 ? 's' : ''}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={D.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Import Clients</Text>
          <Text style={s.headerSub}>Switch from Vagaro, GlossGenius, Square & more</Text>
        </View>
        <View style={s.aiBadge}>
          <Ionicons name="sparkles" size={12} color={D.gold} />
          <Text style={s.aiBadgeTxt}>AI</Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={s.steps}>
        {(['Source', 'Paste', 'Review'] as const).map((label, i) => (
          <React.Fragment key={label}>
            <View style={[s.stepDot, step > i + 1 && s.stepDotDone, step === i + 1 && s.stepDotActive]}>
              {step > i + 1
                ? <Ionicons name="checkmark" size={12} color={D.white} />
                : <Text style={[s.stepDotTxt, step === i + 1 && { color: D.white }]}>{i+1}</Text>}
            </View>
            <Text style={[s.stepLabel, step === i + 1 && { color: D.pink }]}>{label}</Text>
            {i < 2 && <View style={[s.stepLine, step > i + 1 && { backgroundColor: D.pink }]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: D.bgBase },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: D.border, gap: 12 },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(200,93,122,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 17, fontWeight: '900', color: D.textPrimary },
  headerSub:        { fontSize: 11, color: D.textMuted, marginTop: 1 },
  aiBadge:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,169,110,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  aiBadgeTxt:       { fontSize: 11, fontWeight: '800', color: D.gold },
  steps:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 6 },
  stepDot:          { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: D.textMuted, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:    { borderColor: D.pink, backgroundColor: D.pink },
  stepDotDone:      { borderColor: D.success, backgroundColor: D.success },
  stepDotTxt:       { fontSize: 11, fontWeight: '700', color: D.textMuted },
  stepLabel:        { fontSize: 11, fontWeight: '600', color: D.textMuted },
  stepLine:         { flex: 1, height: 1.5, backgroundColor: D.border },
  scroll:           { padding: 20, gap: 16 },
  stepTitle:        { fontSize: 20, fontWeight: '900', color: D.textPrimary },
  stepSub:          { fontSize: 13, color: D.textSec, lineHeight: 19 },
  platformGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  platformCard:     { width: (width - 50) / 2, backgroundColor: D.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: D.border, gap: 4 },
  platformCardActive:{ borderColor: D.pink, backgroundColor: D.pinkLight },
  platformIcon:     { fontSize: 22 },
  platformName:     { fontSize: 14, fontWeight: '800', color: D.textPrimary },
  platformTip:      { fontSize: 10, color: D.textMuted, lineHeight: 14 },
  cta:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: D.pink, borderRadius: 14, paddingVertical: 14 },
  ctaTxt:           { color: D.white, fontWeight: '800', fontSize: 15 },
  ctaSecondary:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: D.pink, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  ctaSecondaryTxt:  { color: D.pink, fontWeight: '700', fontSize: 14 },
  rowBtns:          { flexDirection: 'row', gap: 10 },
  exampleBox:       { backgroundColor: D.bgElevated, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: D.border },
  exampleLabel:     { fontSize: 9, fontWeight: '800', color: D.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  exampleText:      { fontSize: 11, color: D.textSec, fontFamily: 'Courier', lineHeight: 18 },
  pasteInput:       { backgroundColor: D.bgCard, borderRadius: 14, padding: 14, color: D.textPrimary, fontSize: 13, minHeight: 200, borderWidth: 1, borderColor: D.border, fontFamily: 'Courier', lineHeight: 20 },
  charCount:        { fontSize: 10, color: D.textMuted, textAlign: 'right' },
  parsingBanner:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: D.border },
  parsingTxt:       { fontSize: 13, color: D.textSec },
  parseResult:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(26,158,74,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(26,158,74,0.3)' },
  parseResultTxt:   { fontSize: 14, fontWeight: '700', color: D.success },
  selectRow:        { flexDirection: 'row', alignItems: 'center' },
  selectLink:       { fontSize: 13, color: D.pink, fontWeight: '600' },
  textMuted:        { fontSize: 13, color: D.textMuted },
  clientList:       { backgroundColor: D.bgCard, borderRadius: 16, borderWidth: 1, borderColor: D.border },
  clientRow:        { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  clientRowDim:     { opacity: 0.4 },
  checkbox:         { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: D.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:       { backgroundColor: D.pink, borderColor: D.pink },
  clientName:       { fontSize: 14, fontWeight: '700', color: D.textPrimary },
  clientSub:        { fontSize: 12, color: D.textMuted, marginTop: 1 },
  clientBday:       { fontSize: 10, color: D.gold },
  divider:          { height: 1, backgroundColor: D.border, marginLeft: 44 },
});
