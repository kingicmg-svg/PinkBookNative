import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { DiscoverApi, BookingApi } from '../services/ApiService';

// ── Dynamic palette (overridden from brand after load) ─────────────────────
const BASE = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  white:'#FFFFFF', gold:'#C9A96E',
  success:'#1A9E4A', successBg:'rgba(26,158,74,0.12)',
};
function palette(accentHex?: string) {
  const a = /^#[0-9A-Fa-f]{6}$/.test(accentHex||'') ? accentHex! : '#D4417A';
  return {
    ...BASE,
    pink: a,
    pinkGlow: a + '45',
    border: a + '25',
    borderMid: a + '40',
    cardOn: a + '12',
  };
}

// ── Constants ─────────────────────────────────────────────────────────────
const TEXTURES = [
  { id:'straight', label:'Straight',       icon:'—', desc:'Fine to coarse, naturally falls flat.' },
  { id:'wavy',     label:'Wavy',           icon:'~', desc:'Loose S-shaped waves, natural movement.' },
  { id:'curly',    label:'Curly',          icon:'ᴒ', desc:'Defined spirals or ringlets.' },
  { id:'coily',    label:'Coily / Coarse', icon:'ℰ', desc:'Tight coils or zigzag patterns.' },
];
const PAYMENT_OPTS = [
  { id:'stripe',    label:'Online (Card)',       icon:'💳', desc:'Secure card via Stripe' },
  { id:'etransfer', label:'E-Transfer',          icon:'📧', desc:'Interac e-Transfer' },
  { id:'cash',      label:'Cash at Appointment', icon:'💵', desc:'Pay on arrival' },
];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Time slot generator from working hours ─────────────────────────────────
function genSlots(wh: any, isoDate: string, interval = 30): string[] {
  if (!wh || !isoDate) return [];
  const day = DAY_NAMES[new Date(isoDate + 'T12:00:00').getDay()];
  const h = wh[day];
  if (!h || h.isOpen === false) return [];
  const [oh, om] = (h.open  || '09:00').split(':').map(Number);
  const [ch, cm] = (h.close || '18:00').split(':').map(Number);
  const slots: string[] = [];
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  while (cur + interval <= end) {
    const hh = Math.floor(cur / 60);
    const mm = cur % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12  = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    slots.push(`${h12}:${String(mm).padStart(2,'0')} ${ampm}`);
    cur += interval;
  }
  return slots;
}

// ── Date helpers ───────────────────────────────────────────────────────────
function isOpenDay(wh: any, isoDate: string): boolean {
  if (!wh) return true;
  const day = DAY_NAMES[new Date(isoDate + 'T12:00:00').getDay()];
  const h = wh[day];
  return h?.isOpen !== false;
}
function genDates(n: number, wh?: any): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < n && out.length < 30; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    if (!wh || isOpenDay(wh, iso)) out.push(iso);
    if (out.length >= 21) break;
  }
  return out;
}
function fmtDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}
function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return { wd: d.toLocaleDateString('en',{weekday:'short'}), day: d.getDate() };
}

// ── Business header card ───────────────────────────────────────────────────
function BizHeader({ biz, D }: { biz: any; D: ReturnType<typeof palette> }) {
  const initials = (biz?.business_name || '?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <View style={[hdr.card, { borderColor: D.borderMid }]}>
      <View style={[hdr.avatar, { backgroundColor: D.pink }]}>
        <Text style={hdr.initials}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[hdr.name, { color: BASE.textPrimary }]} numberOfLines={1}>{biz?.business_name || 'Book Appointment'}</Text>
        <View style={hdr.meta}>
          {!!biz?.service_category && <Text style={[hdr.tag, { borderColor: D.borderMid, color: D.pink }]}>{biz.service_category}</Text>}
          {!!biz?.city && <Text style={[hdr.city, { color: BASE.textSec }]}>📍 {biz.city}</Text>}
        </View>
        {!!biz?.bio && <Text style={[hdr.bio, { color: BASE.textSec }]} numberOfLines={2}>{biz.bio}</Text>}
        {biz?.avg_rating > 0 && (
          <View style={hdr.stars}>
            {[1,2,3,4,5].map(n => <Text key={n} style={{ fontSize: 11, color: n <= Math.round(biz.avg_rating) ? D.gold : BASE.textMuted }}>★</Text>)}
            <Text style={[hdr.ratingTxt, { color: BASE.textSec }]}>{Number(biz.avg_rating).toFixed(1)} ({biz.review_count || 0})</Text>
          </View>
        )}
      </View>
    </View>
  );
}
const hdr = StyleSheet.create({
  card:     { flexDirection:'row', gap:14, backgroundColor:BASE.bgCard, borderRadius:16, padding:16, marginHorizontal:16, marginTop:8, marginBottom:4, borderWidth:1 },
  avatar:   { width:56, height:56, borderRadius:28, alignItems:'center', justifyContent:'center' },
  initials: { fontSize:20, fontWeight:'900', color:BASE.white },
  name:     { fontSize:17, fontWeight:'900', fontFamily:'Georgia', marginBottom:4 },
  meta:     { flexDirection:'row', gap:8, alignItems:'center', marginBottom:4 },
  tag:      { fontSize:10, fontWeight:'700', borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2, textTransform:'uppercase', letterSpacing:0.5 },
  city:     { fontSize:12 },
  bio:      { fontSize:12, lineHeight:17 },
  stars:    { flexDirection:'row', gap:1, alignItems:'center', marginTop:2 },
  ratingTxt:{ fontSize:11, marginLeft:4 },
  gold:     { color:'#C9A96E' },
});

// ── Step indicator ─────────────────────────────────────────────────────────
function StepDots({ total, current, D }: { total:number; current:number; D: ReturnType<typeof palette> }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10 }}>
      {Array.from({length:total}).map((_,i) => (
        <View key={i} style={[
          { width: i===current?22:8, height:8, borderRadius:4 },
          { backgroundColor: i<current ? D.pink+'80' : i===current ? D.pink : BASE.bgElevated },
        ]} />
      ))}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [addons, setAddons]     = useState<any[]>([]);
  const [D, setD]               = useState(palette());

  // Booking state
  const [step, setStep]           = useState(0);
  const [texture, setTexture]     = useState('');
  const [service, setService]     = useState<any>(null);
  const [selAddons, setSelAddons] = useState<string[]>([]);
  const [date, setDate]           = useState('');
  const [time, setTime]           = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [note, setNote]           = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [confirmed, setConfirmed] = useState(false);
  const [confToken, setConfToken] = useState('');

  useEffect(() => {
    if (!slug) return;
    DiscoverApi.business(slug as string).then(r => {
      const biz = r.data || {};
      setBusiness(biz);
      // Apply brand color
      const accent = biz.primaryColor || biz.accentColor || biz.accent_color || '#D4417A';
      setD(palette(accent));
      if (biz.owner_id) {
        BookingApi.settings(biz.owner_id).then(s => {
          setSettings(s);
          const cat = s?.servicesCatalog || {};
          setServices(Array.isArray(cat.services) ? cat.services.filter((sv:any) => sv.visible !== false) : []);
          setAddons(Array.isArray(cat.addons) ? cat.addons : []);
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  // Pre-fill from token
  useEffect(() => {
    if (!token) return;
    try {
      const pl = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      setEmail(pl.email||''); setFirstName(pl.first_name||pl.name?.split(' ')[0]||''); setLastName(pl.last_name||pl.name?.split(' ').slice(1).join(' ')||'');
    } catch {}
  }, [token]);

  const isHair = settings?.profession === 'hair' || business?.service_category === 'hair' || !business?.service_category;
  const profession = settings?.profession || business?.service_category || 'hair';

  // Steps: 0=texture(hair only), 1=service, 2=addons(if any), 3=date, 4=time, 5=info, 6=payment, 7=review
  const hasAddonStep = addons.length > 0 && !!service;
  const steps = isHair
    ? hasAddonStep ? ['Texture','Service','Add-ons','Date','Time','Your Info','Payment','Confirm'] : ['Texture','Service','Date','Time','Your Info','Payment','Confirm']
    : hasAddonStep ? ['Service','Add-ons','Date','Time','Your Info','Payment','Confirm']           : ['Service','Date','Time','Your Info','Payment','Confirm'];

  // Map logical step to content
  const getContent = (s: number): string => {
    if (isHair) {
      if (s===0) return 'texture';
      if (s===1) return 'service';
      if (s===2 && hasAddonStep) return 'addons';
      const off = hasAddonStep ? 3 : 2;
      if (s===off)   return 'date';
      if (s===off+1) return 'time';
      if (s===off+2) return 'info';
      if (s===off+3) return 'payment';
      return 'review';
    } else {
      if (s===0) return 'service';
      if (s===1 && hasAddonStep) return 'addons';
      const off = hasAddonStep ? 2 : 1;
      if (s===off)   return 'date';
      if (s===off+1) return 'time';
      if (s===off+2) return 'info';
      if (s===off+3) return 'payment';
      return 'review';
    }
  };

  const content = getContent(step);

  const workingHours  = settings?.workingHours;
  const slotInterval  = settings?.slotIntervalMinutes || 30;
  const availDates    = genDates(60, workingHours);
  const timeSlots     = date ? genSlots(workingHours, date, slotInterval) : [];
  const FALLBACK_TIMES = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'];
  const displayTimes  = timeSlots.length > 0 ? timeSlots : FALLBACK_TIMES;

  const totalPrice = (parseFloat(service?.price)||0) + selAddons.reduce((acc,id) => {
    const a = addons.find(x => x.id===id); return acc + (parseFloat(a?.price)||0);
  }, 0);

  const canAdvance = () => {
    if (content==='texture')  return !!texture;
    if (content==='service')  return !!service;
    if (content==='date')     return !!date;
    if (content==='time')     return !!time;
    if (content==='info')     return !!firstName && !!email;
    return true;
  };

  const submit = async () => {
    if (!email||!firstName) { Alert.alert('Missing Info','Please enter your name and email.'); return; }
    setSubmitting(true);
    try {
      const addonList = selAddons.map(id => addons.find(a=>a.id===id)).filter(Boolean);
      const r = await BookingApi.submit({
        ownerSlug: slug, ownerId: business?.owner_id,
        clientFirstName: firstName, clientLastName: lastName,
        clientEmail: email, clientPhone: phone,
        serviceId: service?.id, serviceName: service?.name,
        servicePrice: service?.price, serviceDuration: service?.duration,
        addons: addonList, hairTexture: texture,
        date, time, paymentMethod: payMethod, notes: note,
        status: payMethod==='cash' ? 'confirmed' : 'pending',
      });
      setConfToken(r?.booking?.id||r?.confirmationToken||'');
      setConfirmed(true);
    } catch(e:any) { Alert.alert('Booking Failed', e.message||'Please try again.'); }
    finally { setSubmitting(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={[st.fill, { backgroundColor:BASE.bgBase, justifyContent:'center', alignItems:'center', paddingTop:insets.top }]}>
      <ActivityIndicator color="#D4417A" size="large" />
      <Text style={{ color:BASE.textSec, marginTop:12, fontSize:14 }}>Loading booking page…</Text>
    </View>
  );

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (confirmed) return (
    <View style={[st.fill, { backgroundColor:BASE.bgBase, paddingTop:insets.top, paddingBottom:insets.bottom+16 }]}>
      <ScrollView contentContainerStyle={{ flexGrow:1, alignItems:'center', justifyContent:'center', padding:24 }}>
        <View style={[st.confCard, { borderColor:D.borderMid }]}>
          <Text style={{ fontSize:52, marginBottom:12 }}>🌸</Text>
          <Text style={[st.confTitle, { color:D.pink }]}>You're Booked!</Text>
          <Text style={[st.confSub, { color:BASE.textSec }]}>
            A confirmation has been sent to {'\n'}<Text style={{ color:BASE.textPrimary, fontWeight:'700' }}>{email}</Text>
          </Text>
          <View style={[st.confBox, { borderColor:D.border, backgroundColor:BASE.bgBase }]}>
            {!!business?.business_name && <View style={st.confRow}><Text style={st.confKey}>Studio</Text><Text style={[st.confVal,{color:D.pink}]}>{business.business_name}</Text></View>}
            {!!service && <View style={st.confRow}><Text style={st.confKey}>Service</Text><Text style={st.confVal}>{service.name}</Text></View>}
            {selAddons.length>0 && <View style={st.confRow}><Text style={st.confKey}>Add-ons</Text><Text style={st.confVal}>{selAddons.map(id=>addons.find(a=>a.id===id)?.name).filter(Boolean).join(', ')}</Text></View>}
            {!!date && <View style={st.confRow}><Text style={st.confKey}>Date</Text><Text style={st.confVal}>{fmtDateLong(date)}</Text></View>}
            {!!time && <View style={st.confRow}><Text style={st.confKey}>Time</Text><Text style={st.confVal}>{time}</Text></View>}
            {totalPrice>0 && <View style={st.confRow}><Text style={st.confKey}>Total</Text><Text style={[st.confVal,{color:D.pink,fontWeight:'800'}]}>${totalPrice.toFixed(2)}</Text></View>}
            <View style={st.confRow}><Text style={st.confKey}>Payment</Text><Text style={st.confVal}>{PAYMENT_OPTS.find(p=>p.id===payMethod)?.label||payMethod}</Text></View>
          </View>
          {!!service?.deposit && service.deposit>0 && (
            <View style={[st.depositNote, { backgroundColor:D.pink+'18', borderColor:D.border }]}>
              <Text style={{ color:D.pink, fontSize:13, fontWeight:'700' }}>Deposit Required: ${service.deposit}</Text>
              <Text style={{ color:BASE.textSec, fontSize:12, marginTop:2 }}>You'll receive payment instructions by email.</Text>
            </View>
          )}
          <TouchableOpacity style={[st.confBtn, { backgroundColor:D.pink }]} onPress={() => router.replace('/(consumer-tabs)/bookings')}>
            <Text style={st.confBtnTxt}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop:12 }} onPress={() => router.back()}>
            <Text style={{ color:BASE.textSec, fontSize:14 }}>← Back to Discover</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ── Step content ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch(content) {
      case 'texture': return (
        <>
          <Text style={st.stepTitle}>What's your hair texture?</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>Helps your stylist prepare and give accurate timing.</Text>
          {TEXTURES.map(t => (
            <TouchableOpacity key={t.id} style={[st.card, texture===t.id && { borderColor:D.pink, backgroundColor:D.cardOn }]} onPress={() => setTexture(t.id)}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                <View style={[st.texIcon, { backgroundColor: texture===t.id ? D.pink : BASE.bgElevated }]}>
                  <Text style={{ fontSize:16 }}>{t.icon}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[st.cardTitle, texture===t.id && { color:D.pink }]}>{t.label}</Text>
                  <Text style={[st.cardSub, { color:BASE.textSec }]}>{t.desc}</Text>
                </View>
                {texture===t.id && <View style={[st.check, { backgroundColor:D.pink }]}><Text style={{ color:BASE.white, fontSize:11, fontWeight:'900' }}>✓</Text></View>}
              </View>
            </TouchableOpacity>
          ))}
        </>
      );

      case 'service': return (
        <>
          <Text style={st.stepTitle}>Choose your service</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>All pricing and durations shown upfront.</Text>
          {services.length===0
            ? <View style={[st.emptyBox, { borderColor:D.border }]}><Text style={{ color:BASE.textSec, textAlign:'center', fontSize:14 }}>No services listed yet.</Text></View>
            : services.map((sv:any,i:number) => (
              <TouchableOpacity key={i} style={[st.serviceCard, service?.id===sv.id && { borderColor:D.pink, backgroundColor:D.cardOn }]} onPress={() => { setService(sv); setSelAddons([]); }}>
                {!!sv.color && <View style={{ width:4, backgroundColor:sv.color, borderRadius:2, alignSelf:'stretch' }} />}
                <View style={{ flex:1, paddingLeft: sv.color ? 12 : 0 }}>
                  <Text style={[st.cardTitle, service?.id===sv.id && { color:D.pink }]}>{sv.name}</Text>
                  <View style={{ flexDirection:'row', gap:8, marginTop:4, flexWrap:'wrap' }}>
                    {!!sv.duration && <Text style={[st.pill, { borderColor:D.border, color:BASE.textSec }]}>{sv.duration} min</Text>}
                    {!!sv.category && <Text style={[st.pill, { borderColor:D.border, color:BASE.textSec }]}>{sv.category}</Text>}
                    {!!sv.deposit && sv.deposit>0 && <Text style={[st.pill, { borderColor:D.pink+'60', color:D.pink }]}>Deposit ${sv.deposit}</Text>}
                  </View>
                  {!!sv.description && <Text style={[st.cardSub, { color:BASE.textSec, marginTop:4 }]} numberOfLines={2}>{sv.description}</Text>}
                </View>
                <View style={{ alignItems:'flex-end', gap:4 }}>
                  {!!sv.price && <Text style={[st.price, service?.id===sv.id && { color:D.pink }]}>${Number(sv.price).toFixed(2)}</Text>}
                  {service?.id===sv.id && <View style={[st.check, { backgroundColor:D.pink }]}><Text style={{ color:BASE.white, fontSize:11, fontWeight:'900' }}>✓</Text></View>}
                </View>
              </TouchableOpacity>
            ))
          }
        </>
      );

      case 'addons': return (
        <>
          <Text style={st.stepTitle}>Add-ons</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>Enhance your appointment (optional).</Text>
          {addons.map((a:any,i:number) => {
            const on = selAddons.includes(a.id);
            return (
              <TouchableOpacity key={i} style={[st.card, on && { borderColor:D.pink, backgroundColor:D.cardOn }]}
                onPress={() => setSelAddons(prev => on ? prev.filter(x=>x!==a.id) : [...prev, a.id])}>
                <View style={{ flex:1 }}>
                  <Text style={[st.cardTitle, on && { color:D.pink }]}>{a.name}</Text>
                  {!!a.linkedService && a.linkedService!=='all' && <Text style={[st.cardSub, { color:BASE.textMuted }]}>For: {a.linkedService}</Text>}
                </View>
                {!!a.price && <Text style={[st.price, on && { color:D.pink }]}>+${Number(a.price).toFixed(2)}</Text>}
                <View style={[st.check, on ? { backgroundColor:D.pink } : { backgroundColor:BASE.bgElevated, borderWidth:1, borderColor:D.border }]}>
                  {on && <Text style={{ color:BASE.white, fontSize:11, fontWeight:'900' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={[st.card, { flexDirection:'row', justifyContent:'space-between', backgroundColor:BASE.bgElevated }]}>
            <Text style={{ color:BASE.textSec, fontSize:13 }}>Service subtotal</Text>
            <Text style={{ color:BASE.textPrimary, fontWeight:'700', fontSize:13 }}>${(parseFloat(service?.price)||0).toFixed(2)}</Text>
          </View>
          {selAddons.length>0 && selAddons.map(id => { const a = addons.find(x=>x.id===id); return a ? (
            <View key={id} style={[st.card, { flexDirection:'row', justifyContent:'space-between', backgroundColor:BASE.bgElevated }]}>
              <Text style={{ color:BASE.textSec, fontSize:13 }}>+ {a.name}</Text>
              <Text style={{ color:D.pink, fontWeight:'700', fontSize:13 }}>+${(parseFloat(a.price)||0).toFixed(2)}</Text>
            </View>
          ) : null; })}
        </>
      );

      case 'date': return (
        <>
          <Text style={st.stepTitle}>Choose a date</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>
            {workingHours ? 'Only your available days are shown.' : 'Select your preferred date.'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingBottom:4 }}>
            {availDates.map(d => {
              const { wd, day } = fmtDateShort(d);
              const on = date===d;
              return (
                <TouchableOpacity key={d} style={[st.dateChip, on && { borderColor:D.pink, backgroundColor:D.cardOn }]} onPress={() => { setDate(d); setTime(''); }}>
                  <Text style={[st.dateWd, { color: on ? D.pink : BASE.textMuted }]}>{wd}</Text>
                  <Text style={[st.dateDay, { color: on ? D.pink : BASE.textPrimary }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {!!date && (
            <View style={[st.selectedDate, { borderColor:D.border }]}>
              <Text style={{ color:D.pink, fontWeight:'700', fontSize:14 }}>📅 {fmtDateLong(date)}</Text>
            </View>
          )}
        </>
      );

      case 'time': return (
        <>
          <Text style={st.stepTitle}>Pick a time</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>
            {date ? fmtDateLong(date) : 'Select an available time slot.'}
          </Text>
          {displayTimes.length===0
            ? <View style={[st.emptyBox, { borderColor:D.border }]}><Text style={{ color:BASE.textSec, textAlign:'center' }}>No available slots this day.</Text></View>
            : (
              <View style={st.timeGrid}>
                {displayTimes.map(t => (
                  <TouchableOpacity key={t} style={[st.timeChip, { borderColor:D.border, backgroundColor: time===t ? D.pink : BASE.bgCard }]} onPress={() => setTime(t)}>
                    <Text style={[st.timeTxt, { color: time===t ? BASE.white : BASE.textSec, fontWeight: time===t ? '800' : '500' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          }
        </>
      );

      case 'info': return (
        <>
          <Text style={st.stepTitle}>Your info</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>How should {business?.business_name || 'the studio'} contact you?</Text>
          <View style={st.row2}>
            <TextInput style={[st.input, { flex:1 }]} value={firstName} onChangeText={setFirstName} placeholder="First Name *" placeholderTextColor={BASE.textMuted} />
            <TextInput style={[st.input, { flex:1 }]} value={lastName}  onChangeText={setLastName}  placeholder="Last Name"  placeholderTextColor={BASE.textMuted} />
          </View>
          <TextInput style={st.input} value={email} onChangeText={setEmail} placeholder="Email *" placeholderTextColor={BASE.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={st.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={BASE.textMuted} keyboardType="phone-pad" />
          <TextInput style={[st.input, { height:80, textAlignVertical:'top' }]} value={note} onChangeText={setNote} placeholder="Note to stylist (optional)…" placeholderTextColor={BASE.textMuted} multiline />
        </>
      );

      case 'payment': return (
        <>
          <Text style={st.stepTitle}>Payment method</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>How will you pay for your appointment?</Text>
          {PAYMENT_OPTS.map(p => (
            <TouchableOpacity key={p.id} style={[st.card, payMethod===p.id && { borderColor:D.pink, backgroundColor:D.cardOn }]} onPress={() => setPayMethod(p.id)}>
              <Text style={{ fontSize:22 }}>{p.icon}</Text>
              <View style={{ flex:1 }}>
                <Text style={[st.cardTitle, payMethod===p.id && { color:D.pink }]}>{p.label}</Text>
                <Text style={[st.cardSub, { color:BASE.textSec }]}>{p.desc}</Text>
              </View>
              {payMethod===p.id && <View style={[st.check, { backgroundColor:D.pink }]}><Text style={{ color:BASE.white, fontSize:11, fontWeight:'900' }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </>
      );

      case 'review': return (
        <>
          <Text style={st.stepTitle}>Review & Confirm</Text>
          <Text style={[st.stepSub, { color:BASE.textSec }]}>Everything look right?</Text>
          <View style={[st.summaryCard, { borderColor:D.borderMid }]}>
            <Text style={[st.summaryTitle, { color:BASE.textPrimary }]}>{business?.business_name}</Text>
            {isHair && !!texture && <SummaryRow k="Hair Texture" v={TEXTURES.find(t=>t.id===texture)?.label||texture} D={D} />}
            {!!service   && <SummaryRow k="Service" v={`${service.name}${service.price ? ` · $${service.price}` : ''}`} D={D} />}
            {selAddons.length>0 && <SummaryRow k="Add-ons" v={selAddons.map(id=>addons.find(a=>a.id===id)?.name).filter(Boolean).join(', ')} D={D} />}
            {!!date      && <SummaryRow k="Date"    v={fmtDateLong(date)} D={D} />}
            {!!time      && <SummaryRow k="Time"    v={time} D={D} />}
            <SummaryRow k="Name"    v={`${firstName} ${lastName}`.trim()} D={D} />
            <SummaryRow k="Email"   v={email} D={D} />
            {!!phone     && <SummaryRow k="Phone"   v={phone} D={D} />}
            <SummaryRow k="Payment" v={PAYMENT_OPTS.find(p=>p.id===payMethod)?.label||payMethod} D={D} />
            {totalPrice>0 && <View style={[st.totalRow, { borderTopColor:D.border }]}>
              <Text style={{ color:BASE.textSec, fontWeight:'700', fontSize:14 }}>Total</Text>
              <Text style={[st.totalAmt, { color:D.pink }]}>${totalPrice.toFixed(2)}</Text>
            </View>}
          </View>
          {!!service?.deposit && service.deposit>0 && (
            <View style={[st.depositNote, { backgroundColor:D.pink+'18', borderColor:D.border }]}>
              <Text style={{ color:D.pink, fontWeight:'700' }}>Deposit required: ${service.deposit}</Text>
              <Text style={{ color:BASE.textSec, fontSize:12, marginTop:2 }}>Instructions sent to your email after booking.</Text>
            </View>
          )}
          <TouchableOpacity style={[st.bookBtn, { backgroundColor:D.pink, shadowColor:D.pink }, submitting && { opacity:0.7 }]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={BASE.white} /> : <Text style={st.bookBtnTxt}>Confirm Booking →</Text>}
          </TouchableOpacity>
        </>
      );

      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView style={[st.fill, { backgroundColor:BASE.bgBase }]} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[st.fill, { paddingTop:insets.top }]}>
        {/* Top bar */}
        <View style={[st.topBar, { borderBottomColor:D.border }]}>
          <TouchableOpacity style={st.backBtn} onPress={() => step>0 ? setStep(s=>s-1) : router.back()}>
            <Text style={[st.backTxt, { color:D.pink }]}>← {step>0?'Back':'Close'}</Text>
          </TouchableOpacity>
          <Text style={st.topTitle} numberOfLines={1}>{steps[step]}</Text>
          <View style={{ width:70 }} />
        </View>

        <StepDots total={steps.length} current={step} D={D} />

        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          <BizHeader biz={business} D={D} />
          <View style={{ paddingHorizontal:16, paddingTop:16 }}>
            {renderContent()}
            <View style={{ height:32 }} />
          </View>
        </ScrollView>

        {/* Next / Skip bar */}
        {content !== 'review' && (
          <View style={[st.navBar, { borderTopColor:D.border, paddingBottom:insets.bottom+8 }]}>
            {content==='addons' && (
              <TouchableOpacity style={[st.skipBtn, { borderColor:D.border }]} onPress={() => setStep(s=>s+1)}>
                <Text style={{ color:BASE.textSec, fontWeight:'700', fontSize:14 }}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[st.nextBtn, { backgroundColor: canAdvance() ? D.pink : BASE.bgElevated, flex:1, shadowColor:D.pink }, !canAdvance() && { shadowOpacity:0 }]}
              onPress={() => canAdvance() && setStep(s=>s+1)}
              disabled={!canAdvance()}
            >
              <Text style={[st.nextTxt, !canAdvance() && { color:BASE.textMuted }]}>
                {content==='payment' ? 'Review Booking' : `Next: ${steps[step+1] || 'Confirm'}`} →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ k, v, D }: { k:string; v:string; D:ReturnType<typeof palette> }) {
  return (
    <View style={[st.summaryRow, { borderBottomColor:D.border }]}>
      <Text style={[st.sumKey, { color:BASE.textSec }]}>{k}</Text>
      <Text style={[st.sumVal, { color:BASE.textPrimary }]} numberOfLines={2}>{v}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  fill:        { flex:1 },
  topBar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1 },
  backBtn:     { width:70 },
  backTxt:     { fontWeight:'700', fontSize:14 },
  topTitle:    { fontSize:15, fontWeight:'800', color:BASE.textPrimary, maxWidth:'50%' },
  scroll:      { paddingBottom:40 },
  stepTitle:   { fontSize:22, fontWeight:'900', color:BASE.textPrimary, fontFamily:'Georgia', marginBottom:6 },
  stepSub:     { fontSize:13, lineHeight:18, marginBottom:18 },
  card:        { backgroundColor:BASE.bgCard, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor:BASE.bgElevated, flexDirection:'row', alignItems:'center', gap:12 },
  cardTitle:   { fontSize:15, fontWeight:'700', color:BASE.textPrimary },
  cardSub:     { fontSize:12, lineHeight:16, marginTop:2 },
  texIcon:     { width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center' },
  check:       { width:22, height:22, borderRadius:11, alignItems:'center', justifyContent:'center' },
  serviceCard: { backgroundColor:BASE.bgCard, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor:BASE.bgElevated, flexDirection:'row', alignItems:'center', gap:8 },
  pill:        { fontSize:11, fontWeight:'600', borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  price:       { fontSize:18, fontWeight:'900', color:BASE.textPrimary },
  emptyBox:    { padding:40, backgroundColor:BASE.bgCard, borderRadius:14, borderWidth:1, alignItems:'center' },
  dateChip:    { width:56, paddingVertical:10, borderRadius:14, backgroundColor:BASE.bgCard, borderWidth:1, borderColor:BASE.bgElevated, alignItems:'center', gap:3 },
  dateWd:      { fontSize:10, fontWeight:'700', textTransform:'uppercase' },
  dateDay:     { fontSize:18, fontWeight:'900' },
  selectedDate:{ marginTop:12, padding:14, backgroundColor:BASE.bgCard, borderRadius:12, borderWidth:1, alignItems:'center' },
  timeGrid:    { flexDirection:'row', flexWrap:'wrap', gap:8 },
  timeChip:    { paddingHorizontal:14, paddingVertical:11, borderRadius:10, borderWidth:1, minWidth:90, alignItems:'center' },
  timeTxt:     { fontSize:13 },
  row2:        { flexDirection:'row', gap:10 },
  input:       { backgroundColor:BASE.bgCard, borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:14, color:BASE.textPrimary, borderWidth:1, borderColor:BASE.bgElevated, marginBottom:12 },
  summaryCard: { backgroundColor:BASE.bgCard, borderRadius:16, padding:20, borderWidth:1, marginBottom:20 },
  summaryTitle:{ fontSize:18, fontWeight:'900', fontFamily:'Georgia', marginBottom:14 },
  summaryRow:  { flexDirection:'row', justifyContent:'space-between', paddingVertical:9, borderBottomWidth:1 },
  sumKey:      { fontSize:13, fontWeight:'600', flex:1 },
  sumVal:      { fontSize:13, fontWeight:'600', flex:2, textAlign:'right' },
  totalRow:    { flexDirection:'row', justifyContent:'space-between', paddingTop:12, marginTop:4, borderTopWidth:1 },
  totalAmt:    { fontSize:20, fontWeight:'900' },
  depositNote: { borderRadius:12, padding:14, marginBottom:16, borderWidth:1 },
  bookBtn:     { borderRadius:999, paddingVertical:17, alignItems:'center', shadowOffset:{width:0,height:6}, shadowOpacity:0.45, shadowRadius:14, elevation:6, marginBottom:8 },
  bookBtnTxt:  { color:BASE.white, fontWeight:'900', fontSize:16, letterSpacing:0.3 },
  navBar:      { flexDirection:'row', paddingHorizontal:16, paddingTop:12, borderTopWidth:1, gap:10 },
  skipBtn:     { paddingVertical:14, paddingHorizontal:20, borderRadius:999, borderWidth:1, alignItems:'center' },
  nextBtn:     { paddingVertical:14, borderRadius:999, alignItems:'center', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:10, elevation:4 },
  nextTxt:     { color:BASE.white, fontWeight:'800', fontSize:15 },
  confCard:    { backgroundColor:BASE.bgCard, borderRadius:24, padding:28, borderWidth:1, alignItems:'center', width:'100%' },
  confTitle:   { fontSize:26, fontWeight:'900', fontFamily:'Georgia', marginBottom:8, textAlign:'center' },
  confSub:     { fontSize:14, lineHeight:20, textAlign:'center', marginBottom:20 },
  confBox:     { borderRadius:14, padding:16, borderWidth:1, width:'100%', marginBottom:16, gap:1 },
  confRow:     { flexDirection:'row', justifyContent:'space-between', paddingVertical:7 },
  confKey:     { fontSize:13, color:BASE.textSec, fontWeight:'600' },
  confVal:     { fontSize:13, color:BASE.textPrimary, fontWeight:'700', textAlign:'right', flex:1, marginLeft:8 },
  confBtn:     { borderRadius:999, paddingVertical:14, width:'100%', alignItems:'center', marginTop:4 },
  confBtnTxt:  { color:BASE.white, fontWeight:'800', fontSize:15 },
});
