import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Switch, Alert, TextInput, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ClientApi } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF', gold:'#C9A96E',
  success:'#1A9E4A', error:'#D32F2F',
};

const ini = (name: string) => (name||'?').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2);

function Row({ icon, label, sub, onPress, right, danger }: { icon: string; label: string; sub?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress && !right} activeOpacity={onPress ? 0.7 : 1}>
      <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: D.error || '#D32F2F' }]}>{label}</Text>
        {!!sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Text style={s.chevron}>›</Text>)}
    </TouchableOpacity>
  );
}

function LoyaltyCardItem({ card }: { card: any }) {
  const punches  = card.punch_count || 0;
  const required = card.visits_required || 10;
  const pct      = Math.min(punches / required, 1);
  const done     = punches >= required;
  return (
    <View style={lc.card}>
      <View style={lc.row}>
        <View style={{ flex: 1 }}>
          <Text style={lc.biz} numberOfLines={1}>{card.business_name || 'Stylist'}</Text>
          <Text style={lc.reward}>{done ? '🎉 Reward ready!' : card.reward_text || 'Loyalty Reward'}</Text>
        </View>
        <Text style={lc.count}>{punches}/{required}</Text>
      </View>
      <View style={lc.track}><View style={[lc.fill, { width: `${Math.round(pct*100)}%` as any }, done && { backgroundColor: D.gold }]} /></View>
    </View>
  );
}
const lc = StyleSheet.create({
  card:    { backgroundColor: D.bgElevated, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: D.border, marginBottom: 8 },
  row:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  biz:     { fontSize: 14, fontWeight: '800', color: D.textPrimary, marginBottom: 2 },
  reward:  { fontSize: 11, color: D.gold, fontWeight: '600' },
  count:   { fontSize: 16, fontWeight: '900', color: D.pink },
  track:   { height: 6, backgroundColor: 'rgba(212,65,122,0.15)', borderRadius: 999, overflow: 'hidden' },
  fill:    { height: '100%', backgroundColor: D.pink, borderRadius: 999 },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, signOut } = useAuth();
  const [user,          setUser]         = useState<any>(null);
  const [loyaltyCards,  setLoyaltyCards] = useState<any[]>([]);
  const [notifPrefs,    setNotifPrefs]   = useState<any>({ booking_reminders: true, booking_confirmed: true, loyalty_updates: true, marketing: false });
  const [loading,       setLoading]      = useState(true);
  const [editing,       setEditing]      = useState(false);
  const [saving,        setSaving]       = useState(false);
  const [firstName,     setFirstName]    = useState('');
  const [lastName,      setLastName]     = useState('');
  const [phone,         setPhone]        = useState('');
  const [savingPrefs,   setSavingPrefs]  = useState(false);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [me, lc, np] = await Promise.allSettled([
        ClientApi.me(token),
        ClientApi.loyaltyCards(token),
        ClientApi.notifPrefs(token),
      ]);
      if (me.status === 'fulfilled') {
        const u = me.value.client || me.value;
        setUser(u);
        setFirstName(u.first_name || u.firstName || u.name?.split(' ')[0] || '');
        setLastName(u.last_name   || u.lastName  || u.name?.split(' ').slice(1).join(' ') || '');
        setPhone(u.phone || '');
      }
      if (lc.status === 'fulfilled') setLoyaltyCards(lc.value.cards || []);
      if (np.status === 'fulfilled') setNotifPrefs(np.value.prefs || notifPrefs);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const r = await ClientApi.updateProfile(token, { first_name: firstName, last_name: lastName, phone });
      setUser(r.client || r);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save profile.');
    } finally { setSaving(false); }
  };

  const togglePref = async (key: string, val: boolean) => {
    const newPrefs = { ...notifPrefs, [key]: val };
    setNotifPrefs(newPrefs);
    setSavingPrefs(true);
    try {
      await ClientApi.updateNotifPrefs(token!, {
        bookingReminders: newPrefs.booking_reminders,
        bookingConfirmed: newPrefs.booking_confirmed,
        loyaltyUpdates:   newPrefs.loyalty_updates,
        marketing:        newPrefs.marketing,
      });
    } catch { setNotifPrefs(notifPrefs); }
    finally { setSavingPrefs(false); }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); router.replace('/auth/client-login'); } },
    ]);
  };

  const shareApp = async () => {
    try {
      await Share.share({ message: 'Book your next beauty appointment on PinkBook 💅\nhttps://pinkbook.app' });
    } catch {}
  };

  if (!token) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}><Text style={s.heading}>Profile</Text></View>
        <View style={s.empty}>
          <Text style={{ fontSize: 44, marginBottom: 16 }}>👤</Text>
          <Text style={s.emptyH}>Your account, your beauty journey</Text>
          <Text style={s.emptySub}>Sign in to track loyalty, manage notifications, and save your favourite stylists.</Text>
          <TouchableOpacity style={s.cta} onPress={() => router.push('/auth/client-login')}>
            <Text style={s.ctaTxt}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.cta, { backgroundColor: 'transparent', borderWidth: 1, borderColor: D.pink, marginTop: 8 }]} onPress={() => router.push('/auth/client-register')}>
            <Text style={[s.ctaTxt, { color: D.pink }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={D.pink} size="large" />
      </View>
    );
  }

  const displayName = [user?.first_name || user?.firstName, user?.last_name || user?.lastName].filter(Boolean).join(' ') || user?.email || 'You';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}><Text style={s.heading}>Profile</Text></View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{ini(displayName)}</Text></View>
          <View>
            <Text style={s.displayName}>{displayName}</Text>
            <Text style={s.email}>{user?.email || ''}</Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? 'close' : 'pencil-outline'} size={15} color={D.pink} />
          </TouchableOpacity>
        </View>

        {/* Edit form */}
        {editing && (
          <View style={s.editCard}>
            <Text style={s.sectionLabel}>EDIT PROFILE</Text>
            <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={D.textMuted} />
            <TextInput style={s.input} value={lastName}  onChangeText={setLastName}  placeholder="Last name"  placeholderTextColor={D.textMuted} />
            <TextInput style={s.input} value={phone}     onChangeText={setPhone}     placeholder="Phone"      placeholderTextColor={D.textMuted} keyboardType="phone-pad" />
            <TouchableOpacity style={[s.cta, saving && { opacity: 0.5 }]} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color={D.white} size="small" /> : <Text style={s.ctaTxt}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Loyalty cards */}
        {loyaltyCards.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>MY LOYALTY CARDS ({loyaltyCards.length})</Text>
            {loyaltyCards.map(c => <LoyaltyCardItem key={c.id} card={c} />)}
          </View>
        )}

        {/* Notifications */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
          <View style={s.card}>
            {[
              { key: 'booking_reminders', icon: '⏰', label: 'Booking Reminders', sub: 'Reminders before your appointments' },
              { key: 'booking_confirmed', icon: '✅', label: 'Booking Confirmed',  sub: 'Confirmation when bookings are accepted' },
              { key: 'loyalty_updates',  icon: '☕', label: 'Loyalty Updates',    sub: 'When you earn stamps or unlock rewards' },
              { key: 'marketing',        icon: '🎁', label: 'Offers & Promotions',sub: 'Special deals from stylists you follow' },
            ].map(({ key, icon, label, sub }) => (
              <View key={key} style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleLabel}>{icon} {label}</Text>
                  <Text style={s.toggleSub}>{sub}</Text>
                </View>
                <Switch
                  value={!!notifPrefs[key]}
                  onValueChange={val => togglePref(key, val)}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: D.pink + '80' }}
                  thumbColor={notifPrefs[key] ? D.pink : '#444'}
                  disabled={savingPrefs}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Account */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <View style={s.card}>
            <Row icon="🔑" label="Change Password" onPress={() => router.push('/auth/forgot-password')} />
            <Row icon="🌸" label="Share PinkBook" sub="Invite friends to discover great stylists" onPress={shareApp} />
            <Row icon="❓" label="Help & Support" onPress={() => router.push('/consumer/support')} />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.card}>
            <Row icon="🚪" label="Sign Out" danger onPress={handleSignOut} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: D.bgBase },
  header:       { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  heading:      { fontSize: 24, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  scroll:       { padding: 20, gap: 20 },
  avatarSection:{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: D.bgCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: D.border },
  avatar:       { width: 54, height: 54, borderRadius: 27, backgroundColor: D.pink + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: D.pink + '60' },
  avatarTxt:    { fontSize: 20, fontWeight: '900', color: D.pink },
  displayName:  { fontSize: 16, fontWeight: '900', color: D.textPrimary },
  email:        { fontSize: 12, color: D.textMuted, marginTop: 2 },
  editBtn:      { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212,65,122,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: D.border },
  editCard:     { backgroundColor: D.bgCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: D.border, gap: 10 },
  input:        { backgroundColor: D.bgBase, borderRadius: 10, padding: 13, color: D.textPrimary, fontSize: 14, borderWidth: 1, borderColor: D.border },
  section:      { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 1.2, paddingHorizontal: 4 },
  card:         { backgroundColor: D.bgCard, borderRadius: 18, borderWidth: 1, borderColor: D.border, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(212,65,122,0.06)' },
  rowIcon:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(212,65,122,0.10)', alignItems: 'center', justifyContent: 'center' },
  rowLabel:     { fontSize: 14, fontWeight: '700', color: D.textPrimary },
  rowSub:       { fontSize: 11, color: D.textMuted, marginTop: 1 },
  chevron:      { fontSize: 22, color: D.textMuted },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(212,65,122,0.06)', gap: 12 },
  toggleLabel:  { fontSize: 14, fontWeight: '700', color: D.textPrimary },
  toggleSub:    { fontSize: 11, color: D.textMuted, marginTop: 1 },
  empty:        { alignItems: 'center', paddingTop: 60, gap: 10, paddingHorizontal: 24 },
  emptyH:       { fontSize: 17, fontWeight: '800', color: D.textPrimary, textAlign: 'center' },
  emptySub:     { fontSize: 13, color: D.textSec, textAlign: 'center', lineHeight: 20 },
  cta:          { backgroundColor: D.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  ctaTxt:       { color: D.white, fontWeight: '800', fontSize: 14 },
});
