import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_HOURS = { open:'09:00', close:'18:00', isOpen: true };

type DayHours = { open: string; close: string; isOpen: boolean };
type Schedule = Record<string, DayHours>;

const QUICK_TIMES = Array.from({ length: Math.floor((23 * 60 + 55 - 6 * 60) / 5) + 1 }, (_, i) => {
  const total = 6 * 60 + i * 5;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function fmt12(t: string) {
  if (!t) return '';
  try { const [h,m] = t.split(':'); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; } catch { return t; }
}

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [bookingBuffer, setBookingBuffer] = useState('30');
  const [maxAdvance, setMaxAdvance] = useState('60');
  const [editDay, setEditDay]   = useState<string|null>(null);
  const [editField, setEditField] = useState<'open'|'close'>('open');

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const r = await SettingsApi.get(token);
      const st = r.settings || {};
      setSettings(st);
      const wh = st.workingHours || {};
      const built: Schedule = {};
      DAYS.forEach(d => { built[d] = wh[d] || { ...DEFAULT_HOURS }; });
      setSchedule(built);
      setBookingBuffer(String(st.bookingBufferMin ?? 30));
      setMaxAdvance(String(st.maxAdvanceDays ?? 60));
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await SettingsApi.save(token, { ...settings, workingHours: schedule, bookingBufferMin: parseInt(bookingBuffer)||30, maxAdvanceDays: parseInt(maxAdvance)||60 });
      Alert.alert('Saved ✓', 'Your availability has been updated.');
      router.back();
    } catch (e:any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const toggleDay = (day: string) => {
    setSchedule(s => ({ ...s, [day]: { ...s[day], isOpen: !s[day].isOpen } }));
  };

  const setTime = (day: string, field: 'open'|'close', time: string) => {
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: time } }));
    setEditDay(null);
  };

  const copyToAll = (day: string) => {
    const src = schedule[day];
    const updated: Schedule = {};
    DAYS.forEach(d => { updated[d] = { ...src, isOpen: schedule[d].isOpen }; });
    setSchedule(updated);
    Alert.alert('Done', `Hours from ${day} copied to all open days.`);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Working Hours</Text>
        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={C.white} size="small" /> : <Text style={s.saveBtnTxt}>Save</Text>}
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={C.rose} size="large" style={{marginTop:60}} /> : (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.desc}>Set your availability for each day of the week. Clients can only book during open hours.</Text>

          {DAYS.map(day => {
            const dh = schedule[day] || DEFAULT_HOURS;
            return (
              <View key={day} style={s.dayCard}>
                <View style={s.dayTop}>
                  <Text style={[s.dayName, !dh.isOpen && s.dayNameOff]}>{day}</Text>
                  <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                    {dh.isOpen && (
                      <TouchableOpacity onPress={() => copyToAll(day)}>
                        <Text style={s.copyBtn}>Copy to all</Text>
                      </TouchableOpacity>
                    )}
                    <Switch value={dh.isOpen} onValueChange={() => toggleDay(day)} trackColor={{true:C.rose,false:C.border}} thumbColor={C.white} />
                  </View>
                </View>
                {dh.isOpen && (
                  <View style={s.timeRow}>
                    <TouchableOpacity style={s.timePill} onPress={() => { setEditDay(day); setEditField('open'); }}>
                      <Text style={s.timePillLabel}>Open</Text>
                      <Text style={s.timePillTime}>{fmt12(dh.open)}</Text>
                    </TouchableOpacity>
                    <Text style={s.timeDash}>—</Text>
                    <TouchableOpacity style={s.timePill} onPress={() => { setEditDay(day); setEditField('close'); }}>
                      <Text style={s.timePillLabel}>Close</Text>
                      <Text style={s.timePillTime}>{fmt12(dh.close)}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {editDay===day && (
                  <View style={s.timePicker}>
                    <Text style={s.timePickerLabel}>{editField==='open'?'Opening':'Closing'} time for {day}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:8}}>
                      {QUICK_TIMES.map(t => (
                        <TouchableOpacity key={t} style={[s.timeOpt, dh[editField]===t && s.timeOptOn]} onPress={() => setTime(day, editField, t)}>
                          <Text style={[s.timeOptTxt, dh[editField]===t && s.timeOptTxtOn]}>{fmt12(t)}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {!dh.isOpen && (
                  <View style={s.closedBadge}><Text style={s.closedBadgeTxt}>Closed</Text></View>
                )}
              </View>
            );
          })}

          <Text style={s.sectionTitle}>BOOKING PREFERENCES</Text>
          <View style={s.prefCard}>
            <View style={s.prefRow}>
              <View style={{flex:1}}>
                <Text style={s.prefLabel}>Booking Buffer</Text>
                <Text style={s.prefDesc}>Minimum gap between appointments (minutes)</Text>
              </View>
              <TextInput style={s.prefInput} value={bookingBuffer} onChangeText={setBookingBuffer} keyboardType="number-pad" />
            </View>
            <View style={[s.prefRow,{borderTopWidth:1,borderTopColor:C.border}]}>
              <View style={{flex:1}}>
                <Text style={s.prefLabel}>Max Advance Days</Text>
                <Text style={s.prefDesc}>How far ahead clients can book</Text>
              </View>
              <TextInput style={s.prefInput} value={maxAdvance} onChangeText={setMaxAdvance} keyboardType="number-pad" />
            </View>
          </View>

          <View style={{height:40}}/>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:C.cream },
  topBar:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:C.border },
  back:            { color:C.rose, fontWeight:'700', fontSize:14, width:60 },
  title:           { fontSize:17, fontWeight:'900', color:C.charcoal },
  saveBtn:         { backgroundColor:C.rose, borderRadius:999, paddingHorizontal:18, paddingVertical:8 },
  saveBtnTxt:      { color:C.white, fontWeight:'800', fontSize:14 },
  scroll:          { padding:16 },
  desc:            { fontSize:13, color:C.soft, lineHeight:20, marginBottom:18 },
  sectionTitle:    { fontSize:10, fontWeight:'800', letterSpacing:1, textTransform:'uppercase', color:C.rose, marginTop:24, marginBottom:10 },
  dayCard:         { backgroundColor:C.white, borderRadius:16, padding:16, marginBottom:10, borderWidth:1, borderColor:C.border },
  dayTop:          { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  dayName:         { fontSize:15, fontWeight:'800', color:C.charcoal },
  dayNameOff:      { color:C.soft },
  copyBtn:         { fontSize:11, color:C.rose, fontWeight:'700' },
  timeRow:         { flexDirection:'row', alignItems:'center', marginTop:12, gap:8 },
  timePill:        { flex:1, backgroundColor:C.cream, borderRadius:10, padding:12, borderWidth:1, borderColor:C.border },
  timePillLabel:   { fontSize:9, fontWeight:'700', color:C.soft, textTransform:'uppercase', letterSpacing:0.5 },
  timePillTime:    { fontSize:14, fontWeight:'800', color:C.charcoal, marginTop:2 },
  timeDash:        { fontSize:16, color:C.soft, fontWeight:'700' },
  timePicker:      { marginTop:12, backgroundColor:C.cream, borderRadius:12, padding:12, borderWidth:1, borderColor:C.border },
  timePickerLabel: { fontSize:11, fontWeight:'700', color:C.soft, marginBottom:4 },
  timeOpt:         { paddingHorizontal:14, paddingVertical:9, borderRadius:999, borderWidth:1, borderColor:C.border, backgroundColor:C.white },
  timeOptOn:       { backgroundColor:C.rose, borderColor:C.rose },
  timeOptTxt:      { fontSize:12, fontWeight:'700', color:C.charcoal },
  timeOptTxtOn:    { color:C.white },
  closedBadge:     { marginTop:8, alignSelf:'flex-start', backgroundColor:'#9CA3AF20', borderRadius:999, paddingHorizontal:12, paddingVertical:4 },
  closedBadgeTxt:  { fontSize:11, fontWeight:'700', color:'#9CA3AF' },
  prefCard:        { backgroundColor:C.white, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  prefRow:         { flexDirection:'row', alignItems:'center', padding:14, gap:12 },
  prefLabel:       { fontSize:14, fontWeight:'700', color:C.charcoal },
  prefDesc:        { fontSize:12, color:C.soft, marginTop:2 },
  prefInput:       { width:72, backgroundColor:C.cream, borderRadius:10, borderWidth:1, borderColor:C.border, padding:10, textAlign:'center', fontSize:16, fontWeight:'800', color:C.charcoal },
});
