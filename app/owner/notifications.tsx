import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;

const NOTIF_TYPES = [
  { key:'newBooking',    icon:'📅', label:'New Booking',          desc:'When a client books an appointment', canSMS:true  },
  { key:'reminder',      icon:'⏰', label:'Appointment Reminder',  desc:'Sent before each appointment',       canSMS:true  },
  { key:'payment',       icon:'💳', label:'Payment Receipt',       desc:'When a deposit is collected',         canSMS:false },
  { key:'cancellation',  icon:'✕',  label:'Cancellation Notice',   desc:'When a booking is cancelled',         canSMS:true  },
  { key:'review',        icon:'⭐', label:'New Review',            desc:'When a client leaves a review',       canSMS:false },
  { key:'marketing',     icon:'📣', label:'Marketing Emails',      desc:'Tips, updates and feature news',      canSMS:false },
];

const REMINDER_TIMES = ['1 hour before','2 hours before','4 hours before','1 day before','2 days before'];

interface Pref { emailOn: boolean; smsOn: boolean; }
type Prefs = Record<string, Pref>;

function ToggleRow({ icon, label, desc, prefs, onToggleEmail, onToggleSMS, canSMS }: {
  icon:string; label:string; desc:string; prefs:Pref;
  onToggleEmail:()=>void; onToggleSMS:()=>void; canSMS:boolean;
}) {
  return (
    <View style={s.notifRow}>
      <View style={s.notifIcon}><Text style={{fontSize:18}}>{icon}</Text></View>
      <View style={{flex:1}}>
        <Text style={s.notifLabel}>{label}</Text>
        <Text style={s.notifDesc}>{desc}</Text>
        <View style={s.notifToggles}>
          <TouchableOpacity style={[s.channelBtn, prefs.emailOn && s.channelBtnEmailOn]} onPress={onToggleEmail}>
            <Text style={[s.channelBtnTxt, prefs.emailOn && {color:'#4A90D9'}]}>📧 Email</Text>
          </TouchableOpacity>
          {canSMS && (
            <TouchableOpacity style={[s.channelBtn, prefs.smsOn && s.channelBtnSMSOn]} onPress={onToggleSMS}>
              <Text style={[s.channelBtnTxt, prefs.smsOn && {color:C.success}]}>💬 SMS</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [prefs, setPrefs]      = useState<Prefs>({});
  const [reminder1, setReminder1] = useState('1 day before');
  const [reminder2, setReminder2] = useState('2 hours before');

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const r = await SettingsApi.get(token);
      const st = r.settings || {};
      setSettings(st);
      const np = st.notifPrefs || {};
      const defaults: Prefs = {};
      NOTIF_TYPES.forEach(nt => {
        defaults[nt.key] = np[nt.key] || { emailOn: true, smsOn: nt.canSMS };
      });
      setPrefs(defaults);
      setReminder1(st.reminder1 || '1 day before');
      setReminder2(st.reminder2 || '2 hours before');
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const savePrefs = async (newPrefs: Prefs, r1?: string, r2?: string) => {
    if (!token) return;
    setSaving(true);
    try {
      await SettingsApi.save(token, { ...settings, notifPrefs: newPrefs, reminder1: r1||reminder1, reminder2: r2||reminder2 });
      setSettings((s:any) => ({ ...s, notifPrefs: newPrefs, reminder1: r1||reminder1, reminder2: r2||reminder2 }));
    } catch (e:any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const toggle = (key: string, channel: 'emailOn'|'smsOn') => {
    const updated = { ...prefs, [key]: { ...prefs[key], [channel]: !prefs[key]?.[channel] } };
    setPrefs(updated);
    savePrefs(updated);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        {saving ? <ActivityIndicator color={C.rose} size="small" style={{width:60}} /> : <View style={{width:60}}/>}
      </View>
      {loading ? <ActivityIndicator color={C.rose} size="large" style={{marginTop:60}} /> : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.sectionDesc}>Control which notifications are sent to you via email and SMS.</Text>

          {NOTIF_TYPES.map(nt => (
            <ToggleRow key={nt.key}
              icon={nt.icon} label={nt.label} desc={nt.desc}
              prefs={prefs[nt.key] || { emailOn:true, smsOn:false }}
              onToggleEmail={() => toggle(nt.key, 'emailOn')}
              onToggleSMS={() => toggle(nt.key, 'smsOn')}
              canSMS={nt.canSMS}
            />
          ))}

          <Text style={s.sectionTitle}>REMINDER TIMING</Text>
          <View style={s.card}>
            <View style={s.timingRow}>
              <View style={{flex:1}}>
                <Text style={s.timingLabel}>First Reminder</Text>
                <Text style={s.timingDesc}>Sent before appointment</Text>
              </View>
              <View style={s.timingPicker}>
                {REMINDER_TIMES.map(rt => (
                  <TouchableOpacity key={rt} style={[s.timingChip, reminder1===rt && s.timingChipOn]} onPress={() => { setReminder1(rt); savePrefs(prefs, rt, reminder2); }}>
                    <Text style={[s.timingChipTxt, reminder1===rt && s.timingChipTxtOn]}>{rt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[s.timingRow,{borderTopWidth:1,borderTopColor:C.border}]}>
              <View style={{flex:1}}>
                <Text style={s.timingLabel}>Second Reminder</Text>
                <Text style={s.timingDesc}>Closer reminder</Text>
              </View>
              <View style={s.timingPicker}>
                {REMINDER_TIMES.map(rt => (
                  <TouchableOpacity key={rt} style={[s.timingChip, reminder2===rt && s.timingChipOn]} onPress={() => { setReminder2(rt); savePrefs(prefs, reminder1, rt); }}>
                    <Text style={[s.timingChipTxt, reminder2===rt && s.timingChipTxtOn]}>{rt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={s.footerNote}>Changes are saved automatically when you toggle a setting.</Text>
          <View style={{height:40}}/>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:C.cream },
  topBar:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:C.border },
  back:           { color:C.rose, fontWeight:'700', fontSize:14, width:60 },
  title:          { fontSize:17, fontWeight:'900', color:C.charcoal },
  scroll:         { padding:16 },
  sectionDesc:    { fontSize:13, color:C.soft, lineHeight:20, marginBottom:20 },
  sectionTitle:   { fontSize:10, fontWeight:'800', letterSpacing:1, textTransform:'uppercase', color:C.rose, marginTop:24, marginBottom:10, paddingHorizontal:2 },
  card:           { backgroundColor:C.white, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  notifRow:       { flexDirection:'row', padding:14, backgroundColor:C.white, borderRadius:14, marginBottom:8, borderWidth:1, borderColor:C.border, gap:12, alignItems:'flex-start' },
  notifIcon:      { width:36, height:36, borderRadius:10, backgroundColor:C.pinkLight, alignItems:'center', justifyContent:'center' },
  notifLabel:     { fontSize:14, fontWeight:'700', color:C.charcoal },
  notifDesc:      { fontSize:12, color:C.soft, marginTop:2, marginBottom:10 },
  notifToggles:   { flexDirection:'row', gap:8 },
  channelBtn:     { paddingHorizontal:12, paddingVertical:6, borderRadius:999, borderWidth:1.5, borderColor:C.border, backgroundColor:C.white },
  channelBtnEmailOn:{ backgroundColor:'rgba(74,144,217,0.1)', borderColor:'rgba(74,144,217,0.4)' },
  channelBtnSMSOn:  { backgroundColor:'rgba(26,158,74,0.1)', borderColor:'rgba(26,158,74,0.4)' },
  channelBtnTxt:  { fontSize:11, fontWeight:'700', color:C.soft },
  timingRow:      { padding:14, gap:12 },
  timingLabel:    { fontSize:13, fontWeight:'700', color:C.charcoal },
  timingDesc:     { fontSize:11, color:C.soft, marginTop:2 },
  timingPicker:   { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:8 },
  timingChip:     { paddingHorizontal:10, paddingVertical:5, borderRadius:999, borderWidth:1, borderColor:C.border, backgroundColor:C.cream },
  timingChipOn:   { backgroundColor:C.rose, borderColor:C.rose },
  timingChipTxt:  { fontSize:11, fontWeight:'600', color:C.soft },
  timingChipTxtOn:{ color:C.white, fontWeight:'800' },
  footerNote:     { fontSize:11, color:C.soft, textAlign:'center', marginTop:20 },
});
