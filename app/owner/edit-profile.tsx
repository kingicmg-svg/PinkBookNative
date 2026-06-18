import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const PROFESSIONS = ['Independent Stylist','Hair Salon','Nail Technician','Nail Studio','Lash Artist','Lash Studio','Wax Specialist','Wax Studio'];
const CATEGORIES  = ['hair','nails','lashes','brows','skin','makeup','waxing'];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { token } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [name, setName]         = useState('');
  const [studioName, setStudio] = useState('');
  const [bio, setBio]           = useState('');
  const [city, setCity]         = useState('');
  const [phone, setPhone]       = useState('');
  const [profession, setProfession] = useState('');
  const [category, setCategory]    = useState('');
  const [error, setError]          = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([OwnerApi.me(token), SettingsApi.get(token)]).then(([meRes, settRes]) => {
      const u = meRes.user || {};
      const st = settRes?.settings || {};
      setName(u.name || '');
      setPhone(u.phone || '');
      setStudio(st.studioName || u.studioName || '');
      setBio(st.bio || '');
      setCity(st.city || '');
      setProfession(st.profession || '');
      setCategory(st.category || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    if (!token) return;
    setSaving(true); setError(null);
    try {
      await SettingsApi.save(token, { studioName, bio, city, profession, category });
      Alert.alert('Saved', 'Profile updated successfully.');
      router.back();
    } catch (e: any) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.rose} size="small" /> : <Text style={s.saveBtn}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          {!!error && <Text style={s.error}>{error}</Text>}

          <Text style={s.section}>Business Identity</Text>
          <Text style={s.label}>Studio Name</Text>
          <TextInput style={s.input} value={studioName} onChangeText={setStudio} placeholder="My Studio" placeholderTextColor={Colors.soft} />

          <Text style={s.label}>Your Name / Display Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Jane Smith" placeholderTextColor={Colors.soft} />

          <Text style={s.label}>Short Bio (max 150 chars)</Text>
          <TextInput style={[s.input, { height: 90, textAlignVertical: 'top' }]} value={bio} onChangeText={t => setBio(t.slice(0, 150))} placeholder="Tell clients what makes you unique..." placeholderTextColor={Colors.soft} multiline />
          <Text style={s.charCount}>{bio.length} / 150</Text>

          <Text style={s.label}>City</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="Toronto, ON" placeholderTextColor={Colors.soft} />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={Colors.soft} keyboardType="phone-pad" />

          <Text style={s.section}>Business Type</Text>
          <Text style={s.label}>Profession</Text>
          <View style={s.chipGroup}>
            {PROFESSIONS.map(p => (
              <TouchableOpacity key={p} style={[s.chip, profession === p && s.chipActive]} onPress={() => setProfession(p)}>
                <Text style={[s.chipTxt, profession === p && s.chipTxtActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Category</Text>
          <View style={s.chipGroup}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[s.chipTxt, category === c && s.chipTxtActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
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
  container: { flex: 1, backgroundColor: Colors.cream },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:      { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:     { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  saveBtn:   { color: Colors.rose, fontWeight: '800', fontSize: 15, width: 60, textAlign: 'right' },
  scroll:    { padding: 20, gap: 2 },
  error:     { backgroundColor: Colors.error + '18', borderRadius: 10, padding: 12, marginBottom: 12, color: Colors.error, fontSize: 13, fontWeight: '600' },
  section:   { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: Colors.rose, marginTop: 20, marginBottom: 12 },
  label:     { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 6, marginTop: 12 },
  input:     { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  charCount: { fontSize: 11, color: Colors.soft, textAlign: 'right', marginTop: 4 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive:{ backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt:   { fontSize: 12, fontWeight: '600', color: Colors.soft },
  chipTxtActive: { color: Colors.white, fontWeight: '700' },
});
