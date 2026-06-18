import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ClientApi } from '../services/ApiService';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF',
};

function Row({ icon, label, sub, onPress, danger }: { icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: '#D32F2F' }]}>{label}</Text>
        {!!sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {!danger && <Text style={s.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, signOut } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    ClientApi.me(token).then(r => {
      const u = r.client || (r as any).user || r;
      setUser(u);
      setFirstName(u.first_name || u.name?.split(' ')[0] || '');
      setLastName(u.last_name || u.name?.split(' ').slice(1).join(' ') || '');
      setPhone(u.phone || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await ClientApi.updateProfile(token, { first_name: firstName, last_name: lastName, phone });
      setUser((u: any) => ({ ...u, first_name: firstName, last_name: lastName, phone }));
      setEditing(false);
    } catch (e: any) { Alert.alert('Error', e.message || 'Could not save changes.'); }
    finally { setSaving(false); }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={D.pink} size="large" /></View>;

  if (!token) return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}><Text style={s.heading}>Profile</Text></View>
      <View style={s.center}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>👤</Text>
        <Text style={[s.heading, { color: D.textSec, fontSize: 16 }]}>Sign in to view your profile</Text>
        <TouchableOpacity style={s.signInBtn} onPress={() => router.push('/auth/client-login')}>
          <Text style={s.signInTxt}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const name = [firstName, lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Client';
  const email = user?.email || '';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}><Text style={s.heading}>Profile</Text></View>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Avatar + name */}
        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{(firstName[0] || email[0] || '?').toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.nameText}>{name}</Text>
            <Text style={s.emailText}>{email}</Text>
          </View>
          <TouchableOpacity onPress={() => setEditing(e => !e)}>
            <Text style={{ color: D.pink, fontWeight: '700', fontSize: 14 }}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {editing && (
          <View style={s.editCard}>
            <Text style={s.editLabel}>FIRST NAME</Text>
            <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor={D.textMuted} />
            <Text style={s.editLabel}>LAST NAME</Text>
            <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor={D.textMuted} />
            <Text style={s.editLabel}>PHONE</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={D.textMuted} keyboardType="phone-pad" />
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color={D.white} size="small" /> : <Text style={s.saveBtnTxt}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.section}>My Activity</Text>
        <View style={s.group}>
          <Row icon="📅" label="My Bookings"   sub="View and manage appointments"       onPress={() => router.push('/(consumer-tabs)/bookings')} />
        </View>

        <Text style={s.section}>More</Text>
        <View style={s.group}>
          <Row icon="📄" label="Terms & Privacy" sub="Our legal policies"               onPress={() => router.push('/consumer/policies')} />
          <Row icon="❓" label="Help Center"     sub="FAQs and support"                 onPress={() => router.push('/owner/help')} />
        </View>

        <View style={[s.group, { marginTop: 8 }]}>
          <Row icon="🚪" label="Sign Out" onPress={confirmSignOut} danger />
        </View>

        <Text style={s.version}>PinkBook  ·  pinkbook.app</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: D.bgBase },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:     { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  heading:    { fontSize: 24, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  scroll:     { padding: 16, gap: 2 },
  profileCard:{ backgroundColor: D.bgCard, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: D.border, marginBottom: 10 },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(212,65,122,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 22, fontWeight: '800', color: D.pink },
  nameText:   { fontSize: 16, fontWeight: '800', color: D.textPrimary },
  emailText:  { fontSize: 12, color: D.textSec, marginTop: 2 },
  editCard:   { backgroundColor: D.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: D.border, marginBottom: 10 },
  editLabel:  { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input:      { backgroundColor: D.bgElevated, borderRadius: 12, padding: 13, fontSize: 14, color: D.textPrimary, borderWidth: 1, borderColor: D.border, marginBottom: 4 },
  saveBtn:    { backgroundColor: D.pink, borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  saveBtnTxt: { color: D.white, fontWeight: '800', fontSize: 15 },
  section:    { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: D.pink, paddingHorizontal: 4, marginTop: 20, marginBottom: 8 },
  group:      { backgroundColor: D.bgCard, borderRadius: 16, borderWidth: 1, borderColor: D.border, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  rowIcon:    { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(212,65,122,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel:   { fontSize: 14, fontWeight: '700', color: D.textPrimary },
  rowSub:     { fontSize: 12, color: D.textSec, marginTop: 2 },
  chevron:    { fontSize: 22, color: D.textMuted, fontWeight: '300' },
  version:    { textAlign: 'center', fontSize: 11, color: D.textMuted, marginTop: 24 },
  signInBtn:  { marginTop: 20, backgroundColor: D.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  signInTxt:  { color: D.white, fontWeight: '700', fontSize: 14 },
});
