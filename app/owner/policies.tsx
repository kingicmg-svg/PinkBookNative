/**
 * Booking Policy Manager — native equivalent of pinkbook-policies.html
 * Covers: Cancellation, Late Arrival, No-Show, Acknowledgment
 * Data saved to server via SettingsApi (key: bookingPolicy)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

// ── Types ──────────────────────────────────────────────────────────────────
interface BookingPolicy {
  cancelEnabled: boolean; cancelWindow: string; cancelDepositRule: string;
  cancelEarlyRule: string; rescheduleAllowed: boolean; rescheduleWindow: string;
  lateEnabled: boolean; gracePeriod: string; lateThreshold: string; lateAction: string;
  noshowEnabled: boolean; noshowFeeType: string; noshowFeeAmount: string;
  noshowEnforce: string; blockRepeat: boolean;
  ackEnabled: boolean; ackTiming: string; ackText: string;
}
const DEFAULT_POLICY: BookingPolicy = {
  cancelEnabled: true, cancelWindow: '24', cancelDepositRule: 'retain',
  cancelEarlyRule: 'refund', rescheduleAllowed: true, rescheduleWindow: '24',
  lateEnabled: true, gracePeriod: '10', lateThreshold: '15', lateAction: 'shorten',
  noshowEnabled: true, noshowFeeType: 'deposit', noshowFeeAmount: '50',
  noshowEnforce: 'manual', blockRepeat: false,
  ackEnabled: true, ackTiming: 'step4',
  ackText: 'I have read and agree to the booking and cancellation policy.',
};
const CANCEL_WINDOWS   = [{ v:'12',l:'12 hrs'},{v:'24',l:'24 hrs'},{v:'48',l:'48 hrs'},{v:'72',l:'72 hrs'},{v:'168',l:'1 week'}];
const LATE_ACTIONS     = [{ v:'shorten',l:'Shorten appt'},{v:'cancel',l:'May cancel'},{v:'stylist',l:'Stylist decides'}];
const NOSHOW_FEE_TYPES = [{ v:'deposit',l:'Retain deposit'},{v:'custom',l:'Custom fee'},{v:'none',l:'No fee'}];
const ENFORCE_TYPES    = [{ v:'manual',l:'Manual review'},{v:'auto',l:'Auto-charge'}];

// ── Chips ──────────────────────────────────────────────────────────────────
function Chips({ options, value, onSelect }: { options:{v:string;l:string}[]; value:string; onSelect:(v:string)=>void }) {
  return (
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:6 }}>
      {options.map(o => (
        <TouchableOpacity key={o.v} onPress={() => onSelect(o.v)}
          style={[sc.chip, value===o.v && sc.chipOn]}>
          <Text style={[sc.chipTxt, value===o.v && sc.chipTxtOn]}>{o.l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Section card ───────────────────────────────────────────────────────────
function PolicyCard({ icon, title, sub, enabled, onToggle, children }: {
  icon:string; title:string; sub:string; enabled?:boolean;
  onToggle?:(v:boolean)=>void; children:React.ReactNode;
}) {
  return (
    <View style={sc.card}>
      <View style={sc.cardHead}>
        <View style={sc.iconWrap}><Text style={{fontSize:20}}>{icon}</Text></View>
        <View style={{flex:1}}><Text style={sc.cardTitle}>{title}</Text><Text style={sc.cardSub}>{sub}</Text></View>
        {onToggle !== undefined && (
          <Switch value={!!enabled} onValueChange={onToggle} trackColor={{true:Colors.rose}} thumbColor={Colors.white} />
        )}
      </View>
      {(enabled === undefined || enabled) && <View style={sc.cardBody}>{children}</View>}
    </View>
  );
}

function SettingRow({ label, sub, children }: { label:string; sub?:string; children:React.ReactNode }) {
  return (
    <View style={{marginBottom:14}}>
      <Text style={sc.rowLabel}>{label}</Text>
      {!!sub && <Text style={sc.rowSub}>{sub}</Text>}
      <View style={{marginTop:4}}>{children}</View>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PoliciesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [policy, setPolicy] = useState<BookingPolicy>(DEFAULT_POLICY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    SettingsApi.get(token)
      .then(r => { const p = r?.settings?.bookingPolicy; if (p) setPolicy({ ...DEFAULT_POLICY, ...p }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const patch = useCallback(<K extends keyof BookingPolicy>(k: K, v: BookingPolicy[K]) => setPolicy(p => ({ ...p, [k]: v })), []);

  const save = async () => {
    if (!token) { Alert.alert('Not signed in'); return; }
    setSaving(true);
    try {
      await SettingsApi.save(token, { bookingPolicy: policy });
      Alert.alert('Policy Saved ✓', 'Your booking policy is active and will be shown to clients before they book.');
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message || 'Could not save policy.');
    } finally { setSaving(false); }
  };

  const summary = (() => {
    const parts: string[] = [];
    if (policy.cancelEnabled) {
      const wl = CANCEL_WINDOWS.find(w=>w.v===policy.cancelWindow)?.l||'24 hrs';
      const dl = {retain:'deposit retained',refund:'deposit refunded',partial:'partial refund'}[policy.cancelDepositRule]||'deposit may be retained';
      parts.push(`Cancellations within ${wl}: ${dl}.`);
    }
    if (policy.lateEnabled) {
      const al = LATE_ACTIONS.find(a=>a.v===policy.lateAction)?.l||'stylist decides';
      parts.push(`Late ${policy.lateThreshold}+ min: ${al.toLowerCase()}.`);
    }
    if (policy.noshowEnabled) {
      const fl = policy.noshowFeeType==='custom' ? `$${policy.noshowFeeAmount} no-show fee`
        : policy.noshowFeeType==='none' ? 'no fee' : 'deposit retained as no-show fee';
      parts.push(`No-show: ${fl}.`);
    }
    return parts.length ? parts.join(' ') : 'Standard booking policies apply.';
  })();

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:Colors.cream}}><ActivityIndicator color={Colors.rose} size="large"/></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Policy Manager</Text>
        <View style={{width:60}} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.desc}>Define how your business handles cancellations, late arrivals, and no-shows. Shown to clients before they book.</Text>

        {/* Cancellation */}
        <PolicyCard icon="📋" title="Cancellation Policy" sub="Rules for cancellations and deposit handling"
          enabled={policy.cancelEnabled} onToggle={v => patch('cancelEnabled', v)}>
          <SettingRow label="Cancellation Window" sub="Clients must cancel before this deadline or face a penalty.">
            <Chips options={CANCEL_WINDOWS} value={policy.cancelWindow} onSelect={v => patch('cancelWindow', v)} />
          </SettingRow>
          <SettingRow label="Late Cancellation (within window)" sub="What happens to the deposit?">
            <Chips options={[{v:'retain',l:'Retain deposit'},{v:'refund',l:'Full refund'},{v:'partial',l:'Partial refund'}]}
              value={policy.cancelDepositRule} onSelect={v => patch('cancelDepositRule', v)} />
          </SettingRow>
          <SettingRow label="Early Cancellation (outside window)">
            <Chips options={[{v:'refund',l:'Full refund'},{v:'retain',l:'Retain deposit'}]}
              value={policy.cancelEarlyRule} onSelect={v => patch('cancelEarlyRule', v)} />
          </SettingRow>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <View><Text style={sc.rowLabel}>Allow Rescheduling</Text><Text style={sc.rowSub}>Clients can reschedule instead of cancel</Text></View>
            <Switch value={policy.rescheduleAllowed} onValueChange={v => patch('rescheduleAllowed', v)} trackColor={{true:Colors.rose}} thumbColor={Colors.white} />
          </View>
          {policy.rescheduleAllowed && (
            <SettingRow label="Reschedule Window">
              <Chips options={[{v:'24',l:'24 hrs'},{v:'48',l:'48 hrs'},{v:'72',l:'72 hrs'}]}
                value={policy.rescheduleWindow} onSelect={v => patch('rescheduleWindow', v)} />
            </SettingRow>
          )}
        </PolicyCard>

        {/* Late Arrival */}
        <PolicyCard icon="⏱️" title="Late Arrival Policy" sub="Define tolerance for tardy clients"
          enabled={policy.lateEnabled} onToggle={v => patch('lateEnabled', v)}>
          <SettingRow label="Grace Period (minutes)" sub="No penalty within this window.">
            <TextInput style={sc.numIn} keyboardType="number-pad" value={policy.gracePeriod}
              onChangeText={v => patch('gracePeriod', v)} maxLength={3} />
          </SettingRow>
          <SettingRow label="Late Threshold (minutes)" sub="Arrival after this is considered late.">
            <TextInput style={sc.numIn} keyboardType="number-pad" value={policy.lateThreshold}
              onChangeText={v => patch('lateThreshold', v)} maxLength={3} />
          </SettingRow>
          <SettingRow label="Action for Late Arrivals">
            <Chips options={LATE_ACTIONS} value={policy.lateAction} onSelect={v => patch('lateAction', v)} />
          </SettingRow>
        </PolicyCard>

        {/* No-Show */}
        <PolicyCard icon="⚠️" title="No-Show Policy" sub="Automatic or manual enforcement"
          enabled={policy.noshowEnabled} onToggle={v => patch('noshowEnabled', v)}>
          <SettingRow label="No-Show Fee">
            <Chips options={NOSHOW_FEE_TYPES} value={policy.noshowFeeType} onSelect={v => patch('noshowFeeType', v)} />
          </SettingRow>
          {policy.noshowFeeType === 'custom' && (
            <SettingRow label="Fee Amount ($)">
              <TextInput style={sc.numIn} keyboardType="decimal-pad" value={policy.noshowFeeAmount}
                onChangeText={v => patch('noshowFeeAmount', v)} maxLength={6} />
            </SettingRow>
          )}
          <SettingRow label="Enforcement">
            <Chips options={ENFORCE_TYPES} value={policy.noshowEnforce} onSelect={v => patch('noshowEnforce', v)} />
          </SettingRow>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <View><Text style={sc.rowLabel}>Block Repeat No-Shows</Text><Text style={sc.rowSub}>Prevent rebook after 2+ no-shows</Text></View>
            <Switch value={policy.blockRepeat} onValueChange={v => patch('blockRepeat', v)} trackColor={{true:Colors.rose}} thumbColor={Colors.white} />
          </View>
        </PolicyCard>

        {/* Acknowledgment */}
        <PolicyCard icon="✅" title="Policy Acknowledgment" sub="Require clients to agree before booking"
          enabled={policy.ackEnabled} onToggle={v => patch('ackEnabled', v)}>
          <SettingRow label="Show during booking">
            <Chips options={[{v:'step4',l:'Before payment'},{v:'step5',l:'Final review'}]}
              value={policy.ackTiming} onSelect={v => patch('ackTiming', v)} />
          </SettingRow>
          <SettingRow label="Acknowledgment Text">
            <TextInput style={[sc.numIn, {width:'100%',height:60,textAlignVertical:'top',paddingTop:8}]}
              multiline value={policy.ackText} onChangeText={v => patch('ackText', v)} />
          </SettingRow>
        </PolicyCard>

        {/* Preview */}
        <View style={s.preview}>
          <Text style={s.previewLabel}>✦ Policy Preview (shown to clients)</Text>
          <Text style={s.previewText}>{summary}</Text>
          {policy.ackEnabled && (
            <View style={s.ackRow}>
              <View style={s.ackBox}/><Text style={s.ackText}>{policy.ackText}</Text>
            </View>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity style={[s.saveBtn, saving && {opacity:0.7}]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white}/> : <Text style={s.saveTxt}>Save & Publish Policy</Text>}
        </TouchableOpacity>
        <View style={{height:60}}/>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  card:      {backgroundColor:Colors.white, borderRadius:16, borderWidth:1, borderColor:Colors.border, marginBottom:16, overflow:'hidden'},
  cardHead:  {flexDirection:'row', alignItems:'center', gap:12, padding:16, borderBottomWidth:1, borderBottomColor:Colors.border},
  iconWrap:  {width:40, height:40, borderRadius:12, backgroundColor:Colors.pinkLight, justifyContent:'center', alignItems:'center'},
  cardTitle: {fontSize:14, fontWeight:'800', color:Colors.charcoal},
  cardSub:   {fontSize:11, color:Colors.soft, marginTop:2},
  cardBody:  {padding:16},
  rowLabel:  {fontSize:13, fontWeight:'700', color:Colors.charcoal},
  rowSub:    {fontSize:11, color:Colors.soft},
  chip:      {paddingHorizontal:12, paddingVertical:6, borderRadius:100, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.cream},
  chipOn:    {borderColor:Colors.rose, backgroundColor:Colors.pinkLight},
  chipTxt:   {fontSize:12, fontWeight:'600', color:Colors.mid},
  chipTxtOn: {color:Colors.rose},
  numIn:     {width:80, borderWidth:1.5, borderColor:Colors.border, borderRadius:10, padding:8, fontSize:14, color:Colors.charcoal, textAlign:'center'},
});
const s = StyleSheet.create({
  container:    {flex:1, backgroundColor:Colors.cream},
  topBar:       {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:Colors.border, backgroundColor:Colors.white},
  back:         {color:Colors.rose, fontWeight:'700', fontSize:14, width:60},
  title:        {fontSize:16, fontWeight:'800', color:Colors.charcoal},
  scroll:       {padding:16},
  desc:         {fontSize:13, color:Colors.mid, lineHeight:20, marginBottom:16},
  preview:      {backgroundColor:'#FFF6FA', borderRadius:14, borderWidth:1, borderColor:Colors.border, padding:16, marginBottom:16},
  previewLabel: {fontSize:11, fontWeight:'700', color:Colors.rose, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8},
  previewText:  {fontSize:13, color:Colors.mid, lineHeight:20},
  ackRow:       {flexDirection:'row', alignItems:'flex-start', gap:10, marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:Colors.border},
  ackBox:       {width:18, height:18, borderRadius:5, borderWidth:2, borderColor:Colors.rose, marginTop:2},
  ackText:      {flex:1, fontSize:12, color:Colors.mid, lineHeight:18},
  saveBtn:      {backgroundColor:Colors.rose, borderRadius:100, padding:16, alignItems:'center', marginBottom:16, shadowColor:Colors.rose, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:4},
  saveTxt:      {color:Colors.white, fontWeight:'800', fontSize:15},
});

