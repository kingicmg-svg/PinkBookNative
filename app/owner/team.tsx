import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;

const ROLES  = ['Stylist', 'Nail Tech', 'Lash Artist', 'Wax Specialist', 'Assistant', 'Manager', 'Other'];
const COLORS = ['#C85D7A','#6366F1','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#1C1C1E','#7C3AED','#EF4444'];

// ── Member Form Modal ──────────────────────────────────────────────────────
function MemberModal({ visible, member, onClose, onSave }: {
  visible: boolean; member: any | null; onClose: () => void; onSave: (m: any) => void;
}) {
  const [name,  setName]  = useState('');
  const [role,  setRole]  = useState('Stylist');
  const [color, setColor] = useState(COLORS[0]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setRole(member.role || 'Stylist');
      setColor(member.color_hex || COLORS[0]);
      setActive(member.active !== false);
    } else {
      setName(''); setRole('Stylist'); setColor(COLORS[0]); setActive(true);
    }
  }, [member, visible]);

  const save = () => {
    if (!name.trim()) { Alert.alert('Required', 'Name is required.'); return; }
    onSave({ name: name.trim(), role, color_hex: color, active });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>{member ? 'Edit Member' : 'Add Team Member'}</Text>
          <TouchableOpacity onPress={save}><Text style={m.save}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={m.scroll} keyboardShouldPersistTaps="handled">
          <Text style={m.label}>FULL NAME *</Text>
          <TextInput
            style={m.input} value={name} onChangeText={setName}
            placeholder="Jane Smith" placeholderTextColor={C.soft}
            autoCapitalize="words"
          />

          <Text style={m.label}>ROLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {ROLES.map(r => (
              <TouchableOpacity key={r} style={[m.chip, role === r && m.chipOn]} onPress={() => setRole(r)}>
                <Text style={[m.chipTxt, role === r && m.chipTxtOn]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={m.label}>CALENDAR COLOUR</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            {COLORS.map(cl => (
              <TouchableOpacity
                key={cl}
                style={[m.colorDot, { backgroundColor: cl }, color === cl && m.colorDotOn]}
                onPress={() => setColor(cl)}
              />
            ))}
          </View>

          <View style={m.toggleRow}>
            <View>
              <Text style={m.toggleLabel}>Active</Text>
              <Text style={m.toggleSub}>Appears in booking flow and calendar</Text>
            </View>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: C.rose, false: C.border }} thumbColor={C.white} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { token } = useAuth();

  const [tier,    setTier]    = useState('starter');
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const isSalon = tier === 'salon' || tier === 'studio_elite' || tier === 'owner';

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [stRes, staffRes] = await Promise.all([
        SettingsApi.get(token),
        OwnerApi.listStaff(token).catch(() => ({ staff: [] })),
      ]);
      const st = stRes?.settings || {};
      setTier(st.subscriptionTier || st.subscription_tier || 'starter');
      setStaff(Array.isArray(staffRes.staff) ? staffRes.staff : []);
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveMember = async (data: any) => {
    if (!token) return;
    setSaving(true);
    try {
      if (editing) {
        await OwnerApi.updateStaff(token, editing.id, data);
      } else {
        await OwnerApi.createStaff(token, data);
      }
      setModal(false); setEditing(null);
      await load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const deleteMember = (id: string, name: string) => {
    Alert.alert('Remove Team Member', `Remove ${name} from your team?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        if (!token) return;
        try { await OwnerApi.deleteStaff(token, id); setStaff(s => s.filter(m => m.id !== id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={C.rose} size="large" />
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Team Members</Text>
        {saving
          ? <ActivityIndicator color={C.rose} size="small" style={{ width: 60 }} />
          : <View style={{ width: 60 }} />}
      </View>

      {!isSalon ? (
        // ── Tier gate ──
        <ScrollView contentContainerStyle={s.gateScroll}>
          <View style={s.gateCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
            <Text style={s.gateTitle}>Salon Plan Feature</Text>
            <Text style={s.gateSub}>
              Team management — multiple stylist profiles, colour-coded calendars, individual schedules,
              and shared team availability — is available on the Salon plan and above.
            </Text>
            <View style={s.featureList}>
              {[
                '✓  Multiple stylist profiles',
                '✓  Per-stylist calendar colour',
                '✓  Individual working schedules',
                '✓  Shared team calendar view',
                '✓  Team availability management',
                '✓  Assign bookings to specific stylists',
              ].map(f => (
                <Text key={f} style={s.featureItem}>{f}</Text>
              ))}
            </View>
            <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/owner/upgrade')}>
              <Text style={s.upgradeBtnTxt}>View Salon Plan →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // ── Team list ──
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.sectionDesc}>
            Add your team members. Each gets a colour-coded calendar slot and can be assigned to bookings.
          </Text>

          <TouchableOpacity style={s.addBtn} onPress={() => { setEditing(null); setModal(true); }}>
            <Text style={s.addBtnTxt}>＋ Add Team Member</Text>
          </TouchableOpacity>

          {staff.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🧑‍🎨</Text>
              <Text style={s.emptyTxt}>No team members yet.{'\n'}Add your first stylist above.</Text>
            </View>
          ) : staff.map(member => (
            <View key={member.id} style={[s.card, { borderLeftColor: member.color_hex || C.rose, borderLeftWidth: 4 }]}>
              <View style={s.cardTop}>
                {/* Avatar */}
                <View style={[s.avatar, { backgroundColor: (member.color_hex || C.rose) + '25' }]}>
                  <Text style={[s.avatarTxt, { color: member.color_hex || C.rose }]}>
                    {(member.name?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.memberName}>{member.name}</Text>
                    {member.active === false && (
                      <View style={s.inactiveBadge}><Text style={s.inactiveTxt}>Inactive</Text></View>
                    )}
                  </View>
                  <Text style={s.memberRole}>{member.role || 'Stylist'}</Text>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity style={s.editBtn} onPress={() => { setEditing(member); setModal(true); }}>
                    <Text style={s.editTxt}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => deleteMember(member.id, member.name)}>
                    <Text style={s.deleteTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <MemberModal
        visible={modal}
        member={editing}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={saveMember}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.cream },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  back:        { color: C.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:       { fontSize: 17, fontWeight: '900', color: C.charcoal },

  // Gate
  gateScroll:  { padding: 24, alignItems: 'center' },
  gateCard:    { backgroundColor: C.white, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border, maxWidth: 420, width: '100%' },
  gateTitle:   { fontSize: 20, fontWeight: '900', color: C.charcoal, marginBottom: 10, textAlign: 'center' },
  gateSub:     { fontSize: 14, color: C.soft, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  featureList: { width: '100%', gap: 8, marginBottom: 24 },
  featureItem: { fontSize: 14, color: C.charcoal, fontWeight: '600' },
  upgradeBtn:  { backgroundColor: '#7C3AED', borderRadius: 100, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  upgradeBtnTxt:{ color: C.white, fontWeight: '800', fontSize: 15 },

  // List
  scroll:      { padding: 16, gap: 10 },
  sectionDesc: { fontSize: 13, color: C.soft, lineHeight: 20, marginBottom: 8 },
  addBtn:      { borderRadius: 12, borderWidth: 1.5, borderColor: C.rose, borderStyle: 'dashed', paddingVertical: 14, alignItems: 'center', marginBottom: 4 },
  addBtnTxt:   { color: C.rose, fontWeight: '800', fontSize: 14 },
  empty:       { padding: 48, alignItems: 'center' },
  emptyTxt:    { color: C.soft, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Card
  card:        { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', padding: 14 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 18, fontWeight: '900' },
  memberName:  { fontSize: 15, fontWeight: '800', color: C.charcoal },
  memberRole:  { fontSize: 12, color: C.soft, marginTop: 2 },
  inactiveBadge: { backgroundColor: '#9CA3AF20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  inactiveTxt:   { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  actions:     { alignItems: 'flex-end', gap: 6 },
  editBtn:     { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  editTxt:     { fontSize: 12, fontWeight: '700', color: C.charcoal },
  deleteBtn:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' },
  deleteTxt:   { fontSize: 12, fontWeight: '700', color: '#EF4444' },
});

// ── Modal Styles ───────────────────────────────────────────────────────────
const m = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.cream },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  title:       { fontSize: 16, fontWeight: '800', color: C.charcoal },
  cancel:      { fontSize: 15, color: C.soft, fontWeight: '600' },
  save:        { fontSize: 15, color: C.rose, fontWeight: '800' },
  scroll:      { padding: 18, gap: 2 },
  label:       { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: C.soft, textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  input:       { backgroundColor: C.white, borderRadius: 12, padding: 13, fontSize: 14, color: C.charcoal, borderWidth: 1, borderColor: C.border },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  chipOn:      { backgroundColor: C.rose, borderColor: C.rose },
  chipTxt:     { fontSize: 12, fontWeight: '600', color: C.soft },
  chipTxtOn:   { color: C.white, fontWeight: '800' },
  colorDot:    { width: 32, height: 32, borderRadius: 16 },
  colorDotOn:  { borderWidth: 3, borderColor: C.charcoal },
  toggleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, marginTop: 16 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: C.charcoal },
  toggleSub:   { fontSize: 12, color: C.soft, marginTop: 2 },
});
