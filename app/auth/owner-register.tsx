import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { OwnerApi, SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;

const GOOGLE_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || null;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || null;

const PROFESSIONS = [
  { id: 'hair', emoji: '✂️', label: 'Hair Stylist' },
  { id: 'nail', emoji: '💅', label: 'Nail Tech' },
  { id: 'lash', emoji: '👁️', label: 'Lash Artist' },
  { id: 'wax',  emoji: '🪮', label: 'Wax Specialist' },
];

const ACCOUNT_TYPES = [
  { id: 'independent', emoji: '🧑‍🎨', label: 'Independent', sub: 'Solo pro' },
  { id: 'salon',       emoji: '🏢',   label: 'Salon / Studio', sub: 'Team & multi-stylist' },
];

const TIMEZONES = [
  { label: 'EST – Eastern',    value: 'America/Toronto' },
  { label: 'CST – Central',    value: 'America/Chicago' },
  { label: 'MST – Mountain',   value: 'America/Denver' },
  { label: 'PST – Pacific',    value: 'America/Los_Angeles' },
  { label: 'AST – Atlantic',   value: 'America/Halifax' },
  { label: 'NST – Newfoundland', value: 'America/St_Johns' },
  { label: 'GMT – UK',         value: 'Europe/London' },
  { label: 'AEST – Sydney',    value: 'Australia/Sydney' },
];

export default function OwnerRegisterScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { signIn } = useAuth();
  const google = useGoogleAuth(GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Step 1 — identity
  const [profession, setProfession] = useState<string>('hair');
  const [accountType, setAccountType] = useState<string>('independent');

  // Step 2 — contact
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');

  // Step 3 — location
  const [city,     setCity]     = useState('');
  const [province, setProvince] = useState('');

  // Step 4 — timezone (auto-detected)
  const [timezone, setTimezone] = useState('');
  const [showTzPicker, setShowTzPicker] = useState(false);

  // Terms
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Auto-detect timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz || 'America/Toronto');
    } catch {
      setTimezone('America/Toronto');
    }
  }, []);

  const tzLabel = TIMEZONES.find(t => t.value === timezone)?.label || timezone;

  // Handle Google Sign-In
  useEffect(() => {
    if (!google.idToken) return;
    (async () => {
      setGoogleLoading(true);
      try {
        const res = await OwnerApi.googleSignIn(google.idToken!);
        if (!res.token) throw new Error('No token returned');
        await signIn(res.token);
        // Save onboarding data
        if (profession || city || timezone) {
          await SettingsApi.save(res.token, { profession, city, province: province.trim(), timezone }).catch(() => {});
        }
        router.replace('/(owner-tabs)/calendar');
      } catch (e: any) { setError(e.message || 'Google sign-in failed'); }
      finally { setGoogleLoading(false); }
    })();
  }, [google.idToken]);

  const submit = async () => {
    if (!profession) { setError('Please select your profession.'); return; }
    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!city.trim()) { setError('City is required.'); return; }
    if (!acceptTerms) { setError('Please accept the Terms & Privacy Policy to continue.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await OwnerApi.register({
        name:  name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });
      if (!res.token) throw new Error('No token returned');
      await signIn(res.token);
      // Save onboarding fields to settings immediately after registration
      await SettingsApi.save(res.token, {
        profession,
        accountType,
        city:     city.trim(),
        province: province.trim(),
        timezone,
      }).catch(() => {});
      router.replace('/(owner-tabs)/calendar');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Create your account</Text>
        <Text style={s.sub}>Start your PinkBook business for free — no credit card required.</Text>

        {!!error && <View style={s.errorBox}><Text style={s.errorTxt}>{error}</Text></View>}

        {/* ── Profession ── */}
        <Text style={s.sectionLabel}>WHAT DO YOU DO?</Text>
        <View style={s.cardGrid}>
          {PROFESSIONS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[s.typeCard, profession === p.id && s.typeCardOn]}
              onPress={() => setProfession(p.id)}
            >
              <Text style={s.typeEmoji}>{p.emoji}</Text>
              <Text style={[s.typeLabel, profession === p.id && s.typeLabelOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account Type ── */}
        <Text style={s.sectionLabel}>ACCOUNT TYPE</Text>
        <View style={s.cardRow}>
          {ACCOUNT_TYPES.map(a => (
            <TouchableOpacity
              key={a.id}
              style={[s.typeCard, s.typeCardHalf, accountType === a.id && s.typeCardOn]}
              onPress={() => setAccountType(a.id)}
            >
              <Text style={s.typeEmoji}>{a.emoji}</Text>
              <Text style={[s.typeLabel, accountType === a.id && s.typeLabelOn]}>{a.label}</Text>
              <Text style={s.typeSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Name & Credentials ── */}
        <Text style={s.sectionLabel}>YOUR DETAILS</Text>

        <Text style={s.label}>Full Name *</Text>
        <TextInput
          style={s.input}
          placeholder={accountType === 'salon' ? 'Your name or salon name' : 'Jane Smith'}
          placeholderTextColor={C.soft}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={s.label}>Email *</Text>
        <TextInput
          style={s.input}
          placeholder="you@example.com"
          placeholderTextColor={C.soft}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={s.label}>Password *</Text>
        <TextInput
          style={s.input}
          placeholder="Min 8 characters"
          placeholderTextColor={C.soft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={s.label}>Phone (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={C.soft}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* ── Location ── */}
        <Text style={s.sectionLabel}>LOCATION</Text>

        <Text style={s.label}>City *</Text>
        <TextInput
          style={s.input}
          placeholder="Toronto"
          placeholderTextColor={C.soft}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        <Text style={s.label}>Province / State</Text>
        <TextInput
          style={s.input}
          placeholder="Ontario"
          placeholderTextColor={C.soft}
          value={province}
          onChangeText={setProvince}
          autoCapitalize="words"
        />

        {/* ── Timezone ── */}
        <Text style={s.sectionLabel}>TIMEZONE</Text>
        <TouchableOpacity style={s.tzRow} onPress={() => setShowTzPicker(v => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={s.tzLabel}>{tzLabel}</Text>
            <Text style={s.tzSub}>Used for your booking calendar</Text>
          </View>
          <Text style={s.tzChevron}>{showTzPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showTzPicker && (
          <View style={s.tzList}>
            {TIMEZONES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[s.tzOption, timezone === t.value && s.tzOptionOn]}
                onPress={() => { setTimezone(t.value); setShowTzPicker(false); }}
              >
                <Text style={[s.tzOptionTxt, timezone === t.value && s.tzOptionTxtOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Terms ── */}
        <TouchableOpacity style={s.termsRow} onPress={() => setAcceptTerms(v => !v)} activeOpacity={0.8}>
          <View style={[s.checkbox, acceptTerms && s.checkboxOn]}>
            {acceptTerms && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.termsTxt}>
            I agree to the{' '}
            <Text style={s.termsLink} onPress={() => router.push('/owner/legal')}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.termsLink} onPress={() => router.push('/owner/legal')}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* ── Submit ── */}
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={C.white} />
            : <Text style={s.btnText}>Create Account</Text>}
        </TouchableOpacity>

        {google.ready && (
          <TouchableOpacity
            style={[s.googleBtn, googleLoading && { opacity: 0.6 }]}
            onPress={() => google.promptAsync()}
            disabled={googleLoading}
          >
            {googleLoading
              ? <ActivityIndicator color={C.charcoal} size="small" />
              : <Text style={s.googleBtnText}>🌐 Continue with Google</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.link} onPress={() => router.replace('/auth/owner-login')}>
          <Text style={s.linkText}>Already have an account? Sign in →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:        { flexGrow: 1, paddingHorizontal: 20 },
  back:          { marginBottom: 20 },
  backText:      { color: C.rose, fontSize: 14, fontWeight: '600' },
  heading:       { fontSize: 26, fontWeight: '900', color: C.charcoal, marginBottom: 6, fontFamily: 'Georgia' },
  sub:           { fontSize: 14, color: C.soft, marginBottom: 24, lineHeight: 20 },
  errorBox:      { backgroundColor: '#EF444415', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#EF444430' },
  errorTxt:      { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  sectionLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: C.rose, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  label:         { fontSize: 12, fontWeight: '700', color: C.charcoal, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:         { backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.charcoal, borderWidth: 1, borderColor: C.border, marginBottom: 14 },

  // Profession / account type cards
  cardGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  cardRow:       { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeCard:      { flex: 1, minWidth: '44%', backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  typeCardHalf:  { flex: 1 },
  typeCardOn:    { borderColor: C.rose, backgroundColor: C.pinkLight },
  typeEmoji:     { fontSize: 22, marginBottom: 6 },
  typeLabel:     { fontSize: 13, fontWeight: '700', color: C.charcoal, textAlign: 'center' },
  typeLabelOn:   { color: C.rose },
  typeSub:       { fontSize: 11, color: C.soft, marginTop: 2, textAlign: 'center' },

  // Timezone
  tzRow:         { backgroundColor: C.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  tzLabel:       { fontSize: 15, fontWeight: '700', color: C.charcoal },
  tzSub:         { fontSize: 12, color: C.soft, marginTop: 2 },
  tzChevron:     { fontSize: 11, color: C.soft },
  tzList:        { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 4 },
  tzOption:      { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  tzOptionOn:    { backgroundColor: C.pinkLight },
  tzOptionTxt:   { fontSize: 14, color: C.charcoal, fontWeight: '600' },
  tzOptionTxtOn: { color: C.rose, fontWeight: '800' },

  // Terms
  termsRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20, marginBottom: 20 },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, marginTop: 1 },
  checkboxOn:    { backgroundColor: C.rose, borderColor: C.rose },
  checkmark:     { color: C.white, fontSize: 13, fontWeight: '800' },
  termsTxt:      { flex: 1, fontSize: 13, color: C.soft, lineHeight: 20 },
  termsLink:     { color: C.rose, fontWeight: '700' },

  // Buttons
  btn:           { backgroundColor: C.charcoal, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnText:       { color: C.white, fontWeight: '800', fontSize: 15 },
  googleBtn:     { borderWidth: 1.5, borderColor: C.border, borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  googleBtnText: { color: C.charcoal, fontWeight: '700', fontSize: 14 },
  link:          { alignItems: 'center', paddingBottom: 8 },
  linkText:      { color: C.rose, fontSize: 13, fontWeight: '600' },
});
