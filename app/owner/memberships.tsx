'use strict';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
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

function cents(n: number) { return `$${(n / 100).toFixed(2)}`; }

// ─── Plan Modal ────────────────────────────────────────────────────────────────

function PlanModal({ onSave, onClose }: { onSave: (b: any) => Promise<void>; onClose: () => void }) {
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [price, setPrice]       = useState('');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Enter a plan name.'); return; }
    const price_cents = Math.round(parseFloat(price.replace(/[^0-9.]/g, '')) * 100) || 0;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: desc.trim() || undefined, price_cents, interval });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>New Membership Plan</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.rose} /> : <Text style={m.save}>Create</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={m.label}>Plan Name *</Text>
          <TextInput style={m.input} value={name} onChangeText={setName} placeholder="e.g. Monthly VIP" placeholderTextColor={Colors.soft} />
          <Text style={m.label}>Description</Text>
          <TextInput style={[m.input, { minHeight: 80 }]} value={desc} onChangeText={setDesc} placeholder="What's included in this plan?" placeholderTextColor={Colors.soft} multiline />
          <Text style={m.label}>Price</Text>
          <TextInput style={m.input} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor={Colors.soft} keyboardType="decimal-pad" />
          <Text style={m.label}>Billing Interval</Text>
          <View style={m.segRow}>
            {(['monthly', 'yearly'] as const).map(iv => (
              <TouchableOpacity key={iv} style={[m.seg, interval === iv && m.segActive]} onPress={() => setInterval(iv)}>
                <Text style={[m.segTxt, interval === iv && m.segTxtActive]}>{iv === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Package Modal ─────────────────────────────────────────────────────────────

function PackageModal({ onSave, onClose }: { onSave: (b: any) => Promise<void>; onClose: () => void }) {
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [price, setPrice]       = useState('');
  const [visits, setVisits]     = useState('5');
  const [service, setService]   = useState('');
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Enter a package name.'); return; }
    const price_cents = Math.round(parseFloat(price.replace(/[^0-9.]/g, '')) * 100) || 0;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: desc.trim() || undefined, price_cents, visit_count: parseInt(visits) || 5, service_name: service.trim() || undefined });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>New Service Package</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.rose} /> : <Text style={m.save}>Create</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={m.label}>Package Name *</Text>
          <TextInput style={m.input} value={name} onChangeText={setName} placeholder="e.g. 5-Visit Blowout Bundle" placeholderTextColor={Colors.soft} />
          <Text style={m.label}>Description</Text>
          <TextInput style={[m.input, { minHeight: 80 }]} value={desc} onChangeText={setDesc} placeholder="What's included?" placeholderTextColor={Colors.soft} multiline />
          <Text style={m.label}>Price</Text>
          <TextInput style={m.input} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor={Colors.soft} keyboardType="decimal-pad" />
          <Text style={m.label}>Number of Visits</Text>
          <TextInput style={m.input} value={visits} onChangeText={setVisits} placeholder="5" placeholderTextColor={Colors.soft} keyboardType="number-pad" />
          <Text style={m.label}>Service (optional — leave blank for any service)</Text>
          <TextInput style={m.input} value={service} onChangeText={setService} placeholder="e.g. Blowout, Balayage" placeholderTextColor={Colors.soft} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MembershipsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [tab, setTab]           = useState<'plans' | 'packages'>('plans');
  const [plans, setPlans]       = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [clientM, setClientM]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const [showPkg, setShowPkg]   = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [plRes, pkRes, cmRes] = await Promise.allSettled([
        OwnerApi.listMembershipPlans(token),
        OwnerApi.listPackages(token),
        OwnerApi.listClientMemberships(token),
      ]);
      if (plRes.status === 'fulfilled') setPlans(plRes.value.plans || []);
      if (pkRes.status === 'fulfilled') setPackages(pkRes.value.packages || []);
      if (cmRes.status === 'fulfilled') setClientM(cmRes.value.memberships || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const deletePlan = (id: string) => {
    Alert.alert('Delete Plan', 'Delete this membership plan? Clients already on this plan will not be affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await OwnerApi.deleteMembershipPlan(token!, id); setPlans(p => p.filter(x => x.id !== id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const deletePkg = (id: string) => {
    Alert.alert('Delete Package', 'Delete this service package?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await OwnerApi.deletePackage(token!, id); setPackages(p => p.filter(x => x.id !== id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.charcoal} /></TouchableOpacity>
        <Text style={s.pageTitle}>Memberships</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => tab === 'plans' ? setShowPlan(true) : setShowPkg(true)}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {(['plans', 'packages'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'plans' ? `Plans (${plans.length})` : `Packages (${packages.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'plans' && (
          <>
            {plans.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>💳</Text>
                <Text style={s.emptyTitle}>No Plans Yet</Text>
                <Text style={s.emptySub}>Create recurring monthly or yearly membership plans for your best clients.</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setShowPlan(true)}>
                  <Text style={s.emptyBtnTxt}>+ Create First Plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              plans.map(plan => (
                <View key={plan.id} style={s.planCard}>
                  <View style={s.planHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planName}>{plan.name}</Text>
                      {!!plan.description && <Text style={s.planDesc}>{plan.description}</Text>}
                    </View>
                    <View style={s.planPriceBox}>
                      <Text style={s.planPrice}>{cents(plan.price_cents || 0)}</Text>
                      <Text style={s.planInterval}>/{plan.interval || 'monthly'}</Text>
                    </View>
                  </View>
                  <View style={s.planFooter}>
                    <View style={[s.statusBadge, { backgroundColor: plan.active ? Colors.success + '20' : Colors.soft + '20' }]}>
                      <Text style={[s.statusTxt, { color: plan.active ? Colors.success : Colors.soft }]}>{plan.active ? 'Active' : 'Inactive'}</Text>
                    </View>
                    {clientM.filter(c => c.plan_id === plan.id).length > 0 && (
                      <Text style={s.memberCount}>{clientM.filter(c => c.plan_id === plan.id).length} clients</Text>
                    )}
                    <TouchableOpacity onPress={() => deletePlan(plan.id)} style={s.deleteBtn}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'packages' && (
          <>
            {packages.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>🎁</Text>
                <Text style={s.emptyTitle}>No Packages Yet</Text>
                <Text style={s.emptySub}>Create pre-paid visit bundles. Clients buy a set number of visits upfront.</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setShowPkg(true)}>
                  <Text style={s.emptyBtnTxt}>+ Create First Package</Text>
                </TouchableOpacity>
              </View>
            ) : (
              packages.map(pkg => (
                <View key={pkg.id} style={s.planCard}>
                  <View style={s.planHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planName}>{pkg.name}</Text>
                      {!!pkg.description && <Text style={s.planDesc}>{pkg.description}</Text>}
                      {!!pkg.service_name && <Text style={s.planDesc}>Service: {pkg.service_name}</Text>}
                    </View>
                    <View style={s.planPriceBox}>
                      <Text style={s.planPrice}>{cents(pkg.price_cents || 0)}</Text>
                      <Text style={s.planInterval}>{pkg.visit_count || 1} visits</Text>
                    </View>
                  </View>
                  <View style={s.planFooter}>
                    <TouchableOpacity onPress={() => deletePkg(pkg.id)} style={s.deleteBtn}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showPlan && (
        <PlanModal
          onSave={async (body) => { const res = await OwnerApi.createMembershipPlan(token!, body); setPlans(p => [...p, res.plan]); }}
          onClose={() => setShowPlan(false)}
        />
      )}
      {showPkg && (
        <PackageModal
          onSave={async (body) => { const res = await OwnerApi.createPackage(token!, body); setPackages(p => [...p, res.package]); }}
          onClose={() => setShowPkg(false)}
        />
      )}
    </View>
  );
}

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  cancel:    { fontSize: 15, color: Colors.soft },
  save:      { fontSize: 15, color: Colors.rose, fontWeight: '800' },
  label:     { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  input:     { backgroundColor: Colors.cream, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  segRow:    { flexDirection: 'row', gap: 8 },
  seg:       { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  segActive: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  segTxt:    { fontSize: 13, fontWeight: '700', color: Colors.soft },
  segTxtActive: { color: Colors.white },
});

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  addBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.rose, alignItems: 'center', justifyContent: 'center' },
  tabRow:      { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn:      { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:{ borderBottomWidth: 2, borderBottomColor: Colors.rose },
  tabTxt:      { fontSize: 13, fontWeight: '700', color: Colors.soft },
  tabTxtActive:{ color: Colors.rose },
  scroll:      { padding: 16, gap: 12 },
  emptyBox:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji:  { fontSize: 48 },
  emptyTitle:  { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  emptySub:    { fontSize: 14, color: Colors.soft, textAlign: 'center' },
  emptyBtn:    { backgroundColor: Colors.rose, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  emptyBtnTxt: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  planCard:    { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  planHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  planName:    { fontSize: 15, fontWeight: '800', color: Colors.charcoal },
  planDesc:    { fontSize: 12, color: Colors.soft, marginTop: 2 },
  planPriceBox:{ alignItems: 'flex-end' },
  planPrice:   { fontSize: 20, fontWeight: '900', color: Colors.rose },
  planInterval:{ fontSize: 11, color: Colors.soft },
  planFooter:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },
  memberCount: { fontSize: 12, color: Colors.soft, flex: 1 },
  deleteBtn:   { padding: 6 },
});
