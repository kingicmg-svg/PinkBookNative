import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi, BrandStudioApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

// ── Canonical profession values (must match booking page + backend) ─────────
const PROFESSIONS = [
  { id: 'hair', label: '💇 Hair Stylist' },
  { id: 'nail', label: '💅 Nail Tech' },
  { id: 'lash', label: '✨ Lash Artist' },
  { id: 'wax',  label: '🧴 Wax Specialist' },
] as const;

// Maps booking profession → brand_studio_profiles.service_category (discovery)
const PROF_TO_CATEGORY: Record<string, string> = {
  hair: 'hair',
  nail: 'nails',
  lash: 'lashes',
  wax:  'waxing',
};

const PROF_LABELS: Record<string, string> = {
  hair: 'Hair Stylist',
  nail: 'Nail Tech',
  lash: 'Lash Artist',
  wax:  'Wax Specialist',
};

// Default service catalogs (mirrors pinkbook-shared-utils.js PROFESSION_CONFIG)
const PROFESSION_DEFAULTS: Record<string, { services: any[]; addons: any[] }> = {
  hair: {
    services: [
      { name: 'Knotless Braids',       price: 220, durFrom: '5 hrs',       durTo: '6 hrs',       deposit: 50, active: true  },
      { name: 'Full Sew-In',           price: 180, durFrom: '3 hrs',       durTo: '4 hrs',       deposit: 40, active: true  },
      { name: 'Natural Wash & Style',  price: 95,  durFrom: '2 hrs',       durTo: '3 hrs',       deposit: 25, active: true  },
      { name: 'Colour Treatment',      price: 160, durFrom: '3 hrs',       durTo: '5 hrs',       deposit: 50, active: false },
    ],
    addons: [
      { name: 'Deep Condition',  price: 25, linked: '' },
      { name: 'Scalp Treatment', price: 20, linked: '' },
      { name: 'Blow Dry',        price: 15, linked: 'Knotless Braids' },
      { name: 'Edge Control',    price: 10, linked: '' },
    ],
  },
  nail: {
    services: [
      { name: 'Full Set — Acrylic', price: 85, durFrom: '1 hr 30 min', durTo: '2 hrs',        deposit: 20, active: true  },
      { name: 'Gel Manicure',       price: 55, durFrom: '45 min',       durTo: '1 hr',         deposit: 15, active: true  },
      { name: 'Classic Pedicure',   price: 65, durFrom: '1 hr',         durTo: '1 hr 30 min',  deposit: 15, active: true  },
      { name: 'Nail Art',           price: 35, durFrom: '30 min',       durTo: '1 hr',         deposit: 10, active: false },
    ],
    addons: [
      { name: 'Nail Repair',           price: 8,  linked: '' },
      { name: 'Chrome Powder',         price: 15, linked: '' },
      { name: 'Extra Nail Art Design', price: 10, linked: '' },
      { name: 'Paraffin Wax Dip',      price: 15, linked: 'Classic Pedicure' },
    ],
  },
  lash: {
    services: [
      { name: 'Classic Full Set',      price: 120, durFrom: '1 hr 30 min', durTo: '2 hrs',        deposit: 30, active: true  },
      { name: 'Volume Full Set',       price: 160, durFrom: '2 hrs',       durTo: '2 hrs 30 min', deposit: 40, active: true  },
      { name: 'Lash Fill (2–3 Weeks)', price: 70,  durFrom: '1 hr',        durTo: '1 hr 30 min',  deposit: 20, active: true  },
      { name: 'Lash Lift & Tint',      price: 90,  durFrom: '1 hr',        durTo: '1 hr 15 min',  deposit: 20, active: false },
    ],
    addons: [
      { name: 'Lash Seal & Coating',   price: 10, linked: '' },
      { name: 'Lower Lash Extensions', price: 25, linked: 'Classic Full Set' },
      { name: 'Lash Bath (Cleanse)',   price: 15, linked: '' },
      { name: 'Full Set Removal',      price: 20, linked: '' },
    ],
  },
  wax: {
    services: [
      { name: 'Brazilian Wax',    price: 65, durFrom: '30 min', durTo: '45 min', deposit: 15, active: true  },
      { name: 'Brow Shape & Wax', price: 30, durFrom: '20 min', durTo: '30 min', deposit: 0,  active: true  },
      { name: 'Full Leg Wax',     price: 80, durFrom: '45 min', durTo: '1 hr',   deposit: 20, active: true  },
      { name: 'Underarm Wax',     price: 25, durFrom: '15 min', durTo: '20 min', deposit: 0,  active: false },
    ],
    addons: [
      { name: 'Bikini Upgrade',   price: 15, linked: 'Brazilian Wax' },
      { name: 'Lip & Chin Combo', price: 20, linked: '' },
      { name: 'Brow Tint',        price: 15, linked: 'Brow Shape & Wax' },
    ],
  },
};

/** Normalise any legacy display-string profession values to canonical ids */
function normaliseProf(p: string): string {
  if (['hair', 'nail', 'lash', 'wax'].includes(p)) return p;
  const lc = (p || '').toLowerCase();
  if (lc.includes('nail')) return 'nail';
  if (lc.includes('lash')) return 'lash';
  if (lc.includes('wax'))  return 'wax';
  return 'hair';
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { token } = useAuth();

  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [name,    setName]      = useState('');
  const [studioName, setStudio] = useState('');
  const [bio,     setBio]       = useState('');
  const [city,    setCity]      = useState('');
  const [phone,   setPhone]     = useState('');
  const [profession, setProfession]         = useState('hair');
  const [originalProfession, setOrigProf]   = useState('hair');
  const [error,   setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([OwnerApi.me(token), SettingsApi.get(token)])
      .then(([meRes, settRes]) => {
        const u  = meRes.user || {};
        const st = settRes?.settings || {};
        setName(u.name || '');
        setPhone(u.phone || '');
        setStudio(st.studioName || u.studioName || '');
        setBio(st.bio || '');
        setCity(st.city || '');
        const prof = normaliseProf(st.profession || 'hair');
        setProfession(prof);
        setOrigProf(prof);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // ── Actual save (called after any warning dialog is dismissed) ───────────
  const doSave = async (resetCatalog: boolean) => {
    if (!token) return;
    setSaving(true); setError(null);
    try {
      const settingsPayload: Record<string, any> = { studioName, bio, city, profession };

      if (resetCatalog && PROFESSION_DEFAULTS[profession]) {
        const defs = PROFESSION_DEFAULTS[profession];
        settingsPayload.servicesCatalog = {
          profession,
          services: defs.services.map((s, i) => ({
            id: i + 1, ...s,
            appMin: 60, prepMin: 5, finMin: 5,
            color: '#C85D7A', desc: '', category: '',
          })),
          addons: defs.addons.map((a, i) => ({ id: i + 1, ...a })),
          updatedAt: new Date().toISOString(),
        };
      }

      await Promise.all([
        SettingsApi.save(token, settingsPayload),
        OwnerApi.updateProfile(token, { name, phone }),
      ]);

      // Sync service_category to brand_studio_profiles so Discovery shows
      // the correct category without requiring a separate Brand Studio save.
      const discoverCat = PROF_TO_CATEGORY[profession];
      if (discoverCat) {
        BrandStudioApi.saveProfile(token, { serviceCategory: discoverCat }).catch(() => {});
      }

      setOrigProf(profession);
      Alert.alert(
        'Saved',
        resetCatalog
          ? `Profession changed to ${PROF_LABELS[profession]}. Your services have been reset to defaults — head to Services to customise them.`
          : 'Profile updated successfully.',
      );
      router.back();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Save entry point — shows warning if profession changed ───────────────
  const save = () => {
    const professionChanged = profession !== originalProfession && !!originalProfession;
    if (professionChanged) {
      Alert.alert(
        'Change Profession?',
        `Switching to ${PROF_LABELS[profession]} will replace your saved services with default ${PROF_LABELS[profession]} services.\n\nYour existing services will be lost. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change & Reset Services', style: 'destructive', onPress: () => doSave(true) },
        ],
      );
      return;
    }
    doSave(false);
  };

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.rose} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator color={Colors.rose} size="small" />
              : <Text style={s.saveBtn}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {!!error && <Text style={s.error}>{error}</Text>}

          {/* ── Business Identity ── */}
          <Text style={s.section}>Business Identity</Text>

          <Text style={s.label}>Studio / Business Name</Text>
          <TextInput style={s.input} value={studioName} onChangeText={setStudio}
            placeholder="My Studio" placeholderTextColor={Colors.soft} />

          <Text style={s.label}>Your Name / Display Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Jane Smith" placeholderTextColor={Colors.soft} />

          <Text style={s.label}>Short Bio (max 150 chars)</Text>
          <TextInput
            style={[s.input, { height: 90, textAlignVertical: 'top' }]}
            value={bio} onChangeText={t => setBio(t.slice(0, 150))}
            placeholder="Tell clients what makes you unique..."
            placeholderTextColor={Colors.soft} multiline />
          <Text style={s.charCount}>{bio.length} / 150</Text>

          <Text style={s.label}>City</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity}
            placeholder="Toronto, ON" placeholderTextColor={Colors.soft} />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone}
            placeholder="+1 (555) 000-0000" placeholderTextColor={Colors.soft}
            keyboardType="phone-pad" />

          {/* ── Profession ── */}
          <Text style={s.section}>Profession</Text>
          <Text style={s.sectionSub}>
            {'Controls the booking page layout, intake questions, and service panels shown to clients.'}
            {profession !== originalProfession && originalProfession
              ? '\n\n⚠️ Saving will reset your services to defaults for this profession.'
              : ''}
          </Text>

          <View style={s.profGrid}>
            {PROFESSIONS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[s.profCard, profession === p.id && s.profCardActive]}
                onPress={() => setProfession(p.id)}>
                <Text style={[s.profLabel, profession === p.id && s.profLabelActive]}>
                  {p.label}
                </Text>
                {profession === p.id && originalProfession !== p.id && (
                  <Text style={s.profChangeBadge}>will reset services</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.cream },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  back:            { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:           { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  saveBtn:         { color: Colors.rose, fontWeight: '800', fontSize: 15, width: 60, textAlign: 'right' },
  scroll:          { padding: 20 },
  error:           { backgroundColor: '#FF3B3018', borderRadius: 10, padding: 12, marginBottom: 12, color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  section:         { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: Colors.rose, marginTop: 20, marginBottom: 4 },
  sectionSub:      { fontSize: 12, color: Colors.soft, lineHeight: 18, marginBottom: 12 },
  label:           { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 6, marginTop: 12 },
  input:           { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  charCount:       { fontSize: 11, color: Colors.soft, textAlign: 'right', marginTop: 4 },
  profGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  profCard:        { width: '47%', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  profCardActive:  { borderColor: Colors.rose, backgroundColor: Colors.pinkLight ?? '#FFF0F5' },
  profLabel:       { fontSize: 13, fontWeight: '700', color: Colors.mid ?? Colors.soft, textAlign: 'center' },
  profLabelActive: { color: Colors.rose },
  profChangeBadge: { fontSize: 10, color: Colors.rose, marginTop: 4, fontWeight: '600' },
});
