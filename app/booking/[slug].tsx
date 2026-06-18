import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { DiscoverApi, BookingApi } from '../services/ApiService';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF', gold:'#C9A96E',
  success:'rgba(26,158,74,0.15)', successText:'#1A9E4A',
};

const STEPS = ['Service','Date & Time','Your Info','Payment','Confirm'];
const TEXTURES = [
  { id:'straight', label:'Straight', desc:'Fine to coarse, naturally falls flat.' },
  { id:'wavy',     label:'Wavy',     desc:'Loose S-shaped waves, natural movement.' },
  { id:'curly',    label:'Curly',    desc:'Defined spirals or ringlets.' },
  { id:'coily',    label:'Coily / Coarse', desc:'Tight coils or zigzag patterns.' },
];
const PAYMENT_METHODS = ['Online (Card)', 'E-Transfer', 'Cash at Appointment'];

function genDates(n: number) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [step, setStep]               = useState(0);
  const [loadingBiz, setLoadingBiz]   = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [business, setBusiness]       = useState<any>(null);
  const [settings, setSettings]       = useState<any>(null);
  const [services, setServices]       = useState<any[]>([]);

  // Booking state
  const [texture, setTexture]         = useState('');
  const [service, setService]         = useState<any>(null);
  const [addons, setAddons]           = useState<string[]>([]);
  const [date, setDate]               = useState('');
  const [time, setTime]               = useState('');
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [payMethod, setPayMethod]     = useState(PAYMENT_METHODS[0]);
  const [note, setNote]               = useState('');
  const [confirmed, setConfirmed]     = useState(false);
  const [confToken, setConfToken]     = useState('');

  const dates = genDates(30);
  const TIMES = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'];

  useEffect(() => {
    if (!slug) return;
    DiscoverApi.business(slug as string).then(r => {
      const biz = r.data || {};
      setBusiness(biz);
      if (biz.owner_id) {
        BookingApi.settings(biz.owner_id).then(s => {
          setSettings(s);
          // servicesCatalog is { services: [...], addons: [...] }
          const cat = s?.servicesCatalog || {};
          setServices(Array.isArray(cat.services) ? cat.services : []);
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoadingBiz(false));
  }, [slug]);

  // Pre-fill from auth
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        setEmail(payload.email || '');
        setFirstName(payload.first_name || payload.name?.split(' ')[0] || '');
        setLastName(payload.last_name || payload.name?.split(' ').slice(1).join(' ') || '');
      } catch {}
    }
  }, [token]);

  const isHair = !business?.category || business?.category === 'hair';
  const actualStep = isHair ? step : step === 0 ? 1 : step; // skip texture for non-hair
  const displayStep = isHair ? step : step; // display correctly

  const submit = async () => {
    if (!email || !firstName) { Alert.alert('Missing Info', 'Please enter your name and email.'); return; }
    setSubmitting(true);
    try {
      const r = await BookingApi.submit({
        ownerSlug: slug, ownerId: business?.owner_id,
        clientFirstName: firstName, clientLastName: lastName,
        clientEmail: email, clientPhone: phone,
        serviceId: service?.id, serviceName: service?.name,
        servicePrice: service?.price, serviceDuration: service?.duration,
        addons, hairTexture: texture,
        date, time,
        paymentMethod: payMethod === 'Online (Card)' ? 'stripe' : payMethod === 'E-Transfer' ? 'etransfer' : 'cash',
        notes: note,
        status: payMethod === 'Cash at Appointment' ? 'confirmed' : 'pending',
      });
      setConfToken(r?.booking?.id || r?.confirmationToken || '');
      setConfirmed(true);
    } catch (e: any) {
      Alert.alert('Booking Failed', e.message || 'Unable to complete booking. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loadingBiz) return <View style={[s.center, { backgroundColor: D.bgBase, paddingTop: insets.top }]}><ActivityIndicator color={D.pink} size="large" /></View>;

  if (confirmed) return (
    <View style={[s.center, { backgroundColor: D.bgBase, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.confCard}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌸</Text>
        <Text style={s.confTitle}>Booking Confirmed!</Text>
        <Text style={s.confSub}>A confirmation has been sent to {email}.</Text>
        {!!business?.business_name && <Text style={s.confBiz}>with {business.business_name}</Text>}
        <View style={s.confDetails}>
          {!!service && <Text style={s.confDetail}>✦ {service.name}</Text>}
          {!!date && <Text style={s.confDetail}>✦ {fmtDate(date)} at {time}</Text>}
          {!!payMethod && <Text style={s.confDetail}>✦ Payment: {payMethod}</Text>}
        </View>
        <TouchableOpacity style={s.confBtn} onPress={() => router.replace('/(consumer-tabs)/bookings')}>
          <Text style={s.confBtnTxt}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.replace('/(consumer-tabs)/discover')}>
          <Text style={{ color: D.textSec, fontSize: 14 }}>Back to Discover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return isHair ? (
        <>
          <Text style={s.stepTitle}>What's your hair texture?</Text>
          <Text style={s.stepSub}>Helps your stylist prepare and give accurate timing.</Text>
          {TEXTURES.map(t => (
            <TouchableOpacity key={t.id} style={[s.optionCard, texture===t.id && s.optionCardOn]} onPress={() => setTexture(t.id)}>
              <Text style={[s.optionLabel, texture===t.id && { color: D.pink }]}>{t.label}</Text>
              <Text style={s.optionDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </>
      ) : null;

      case 1: return (
        <>
          <Text style={s.stepTitle}>Choose your service</Text>
          <Text style={s.stepSub}>All pricing and durations shown upfront.</Text>
          {services.length === 0
            ? <View style={s.emptyBox}><Text style={{ color: D.textSec, textAlign: 'center' }}>No services available yet.</Text></View>
            : services.map((sv: any, i: number) => (
                <TouchableOpacity key={i} style={[s.serviceCard, service?.id===sv.id && s.serviceCardOn]} onPress={() => setService(sv)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.serviceName, service?.id===sv.id && { color: D.pink }]}>{sv.name}</Text>
                    {!!sv.duration && <Text style={s.serviceMeta}>{sv.duration} min</Text>}
                  </View>
                  {!!sv.price && <Text style={[s.servicePrice, service?.id===sv.id && { color: D.pink }]}>${sv.price}</Text>}
                </TouchableOpacity>
              ))
          }
        </>
      );

      case 2: return (
        <>
          <Text style={s.stepTitle}>Date & Time</Text>
          <Text style={s.stepSub}>Select your preferred appointment slot.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
            {dates.map(d => (
              <TouchableOpacity key={d} style={[s.dateChip, date===d && s.dateChipOn]} onPress={() => setDate(d)}>
                <Text style={[s.dateWeekday, date===d && { color: D.pink }]}>{new Date(d+'T00:00:00').toLocaleDateString('en',{weekday:'short'})}</Text>
                <Text style={[s.dateNum, date===d && { color: D.pink }]}>{new Date(d+'T00:00:00').getDate()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.timeGrid}>
            {TIMES.map(t => (
              <TouchableOpacity key={t} style={[s.timeChip, time===t && s.timeChipOn]} onPress={() => setTime(t)}>
                <Text style={[s.timeTxt, time===t && { color: D.white, fontWeight: '700' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      );

      case 3: return (
        <>
          <Text style={s.stepTitle}>Your info</Text>
          <Text style={s.stepSub}>How should {business?.business_name || 'the studio'} reach you?</Text>
          <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First Name *" placeholderTextColor={D.textMuted} />
          <TextInput style={s.input} value={lastName}  onChangeText={setLastName}  placeholder="Last Name"  placeholderTextColor={D.textMuted} />
          <TextInput style={s.input} value={email}     onChangeText={setEmail}     placeholder="Email *"    placeholderTextColor={D.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={s.input} value={phone}     onChangeText={setPhone}     placeholder="Phone"      placeholderTextColor={D.textMuted} keyboardType="phone-pad" />
          <Text style={s.label}>Payment Method</Text>
          <View style={{ gap: 8 }}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity key={m} style={[s.optionCard, payMethod===m && s.optionCardOn]} onPress={() => setPayMethod(m)}>
                <Text style={[s.optionLabel, payMethod===m && { color: D.pink }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Note to stylist (optional)</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} placeholder="Any preferences or special requests..." placeholderTextColor={D.textMuted} multiline />
        </>
      );

      case 4: return (
        <>
          <Text style={s.stepTitle}>Review & Confirm</Text>
          <Text style={s.stepSub}>Check your details before booking.</Text>
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>{business?.business_name || 'Appointment'}</Text>
            {!!service && <View style={s.summaryRow}><Text style={s.summaryKey}>Service</Text><Text style={s.summaryVal}>{service.name} {service.price ? `· $${service.price}` : ''}</Text></View>}
            {!!date  && <View style={s.summaryRow}><Text style={s.summaryKey}>Date</Text><Text style={s.summaryVal}>{fmtDate(date)}</Text></View>}
            {!!time  && <View style={s.summaryRow}><Text style={s.summaryKey}>Time</Text><Text style={s.summaryVal}>{time}</Text></View>}
            <View style={s.summaryRow}><Text style={s.summaryKey}>Name</Text><Text style={s.summaryVal}>{firstName} {lastName}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryKey}>Email</Text><Text style={s.summaryVal}>{email}</Text></View>
            {!!phone && <View style={s.summaryRow}><Text style={s.summaryKey}>Phone</Text><Text style={s.summaryVal}>{phone}</Text></View>}
            <View style={s.summaryRow}><Text style={s.summaryKey}>Payment</Text><Text style={s.summaryVal}>{payMethod}</Text></View>
          </View>
          <TouchableOpacity style={[s.bookBtn, submitting && { opacity: 0.7 }]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={D.white} /> : <Text style={s.bookBtnTxt}>Confirm Booking</Text>}
          </TouchableOpacity>
        </>
      );
    }
  };

  // Skip step 0 for non-hair pros
  const canNext = () => {
    if (step === 0 && isHair && !texture) return false;
    if (step === 1 && !service) return false;
    if (step === 2 && (!date || !time)) return false;
    if (step === 3 && (!email || !firstName)) return false;
    return true;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.bizName} numberOfLines={1}>{business?.business_name || 'Book'}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={s.stepBar}>
          {STEPS.map((name, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1 }}>
              <View style={[s.stepDot, i === step && s.stepDotActive, i < step && s.stepDotDone]}>
                <Text style={[s.stepNum, (i <= step) && { color: D.white }]}>{i < step ? '✓' : i+1}</Text>
              </View>
            </View>
          ))}
        </View>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {renderStep()}
          <View style={{ height: 20 }} />
        </ScrollView>
        <View style={[s.navBar, { paddingBottom: insets.bottom + 8 }]}>
          {step > 0 && <TouchableOpacity style={s.navBack} onPress={() => setStep(s => Math.max(0, s-1))}><Text style={s.navBackTxt}>← Back</Text></TouchableOpacity>}
          {step < 4
            ? <TouchableOpacity style={[s.navNext, !canNext() && { opacity: 0.4 }]} onPress={() => canNext() && setStep(s => {
                if (s === 0 && !isHair) return 1; // skip texture
                return s+1;
              })} disabled={!canNext()}>
                <Text style={s.navNextTxt}>{step === 0 && isHair ? 'Continue' : step === 4 ? 'Review' : `Next: ${STEPS[step+1]}`} →</Text>
              </TouchableOpacity>
            : null
          }
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: D.bgBase },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  back:         { color: D.pink, fontWeight: '700', fontSize: 14, width: 60 },
  bizName:      { fontSize: 16, fontWeight: '800', color: D.textPrimary, maxWidth: '60%' },
  stepBar:      { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 12 },
  stepDot:      { width: 26, height: 26, borderRadius: 13, backgroundColor: D.bgElevated, borderWidth: 1, borderColor: D.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:{ backgroundColor: D.pink, borderColor: D.pink },
  stepDotDone:  { backgroundColor: 'rgba(212,65,122,0.3)', borderColor: D.pink },
  stepNum:      { fontSize: 11, fontWeight: '800', color: D.textMuted },
  scroll:       { padding: 20 },
  stepTitle:    { fontSize: 22, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia', marginBottom: 6 },
  stepSub:      { fontSize: 13, color: D.textSec, lineHeight: 18, marginBottom: 20 },
  optionCard:   { backgroundColor: D.bgCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: D.border },
  optionCardOn: { borderColor: D.pink, backgroundColor: 'rgba(212,65,122,0.08)' },
  optionLabel:  { fontSize: 15, fontWeight: '700', color: D.textPrimary, marginBottom: 4 },
  optionDesc:   { fontSize: 13, color: D.textSec, lineHeight: 18 },
  serviceCard:  { backgroundColor: D.bgCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: D.border, flexDirection: 'row', alignItems: 'center' },
  serviceCardOn:{ borderColor: D.pink, backgroundColor: 'rgba(212,65,122,0.08)' },
  serviceName:  { fontSize: 15, fontWeight: '700', color: D.textPrimary },
  serviceMeta:  { fontSize: 12, color: D.textSec, marginTop: 2 },
  servicePrice: { fontSize: 18, fontWeight: '800', color: D.textPrimary },
  emptyBox:     { padding: 40, backgroundColor: D.bgCard, borderRadius: 14, borderWidth: 1, borderColor: D.border },
  dateChip:     { width: 54, paddingVertical: 10, borderRadius: 14, backgroundColor: D.bgCard, borderWidth: 1, borderColor: D.border, alignItems: 'center', gap: 2 },
  dateChipOn:   { borderColor: D.pink, backgroundColor: 'rgba(212,65,122,0.1)' },
  dateWeekday:  { fontSize: 10, fontWeight: '700', color: D.textMuted, textTransform: 'uppercase' },
  dateNum:      { fontSize: 18, fontWeight: '800', color: D.textPrimary },
  timeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: D.bgCard, borderWidth: 1, borderColor: D.border },
  timeChipOn:   { backgroundColor: D.pink, borderColor: D.pink },
  timeTxt:      { fontSize: 13, color: D.textSec },
  input:        { backgroundColor: D.bgCard, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: D.textPrimary, borderWidth: 1, borderColor: D.border, marginBottom: 12 },
  label:        { fontSize: 12, fontWeight: '700', color: D.textSec, marginBottom: 8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryCard:  { backgroundColor: D.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: D.border, marginBottom: 20, gap: 2 },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: D.textPrimary, fontFamily: 'Georgia', marginBottom: 14 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: D.border },
  summaryKey:   { fontSize: 13, color: D.textSec, fontWeight: '600' },
  summaryVal:   { fontSize: 13, color: D.textPrimary, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
  bookBtn:      { backgroundColor: D.pink, borderRadius: 999, paddingVertical: 16, alignItems: 'center', shadowColor: D.pink, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6 },
  bookBtnTxt:   { color: D.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  navBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: D.border, backgroundColor: D.bgBase },
  navBack:      { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: D.border },
  navBackTxt:   { fontSize: 14, fontWeight: '700', color: D.textSec },
  navNext:      { flex: 1, paddingVertical: 13, borderRadius: 999, backgroundColor: D.pink, alignItems: 'center', marginLeft: 8 },
  navNextTxt:   { fontSize: 14, fontWeight: '800', color: D.white },
  confCard:     { backgroundColor: D.bgCard, borderRadius: 24, padding: 32, margin: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,65,122,0.3)' },
  confTitle:    { fontSize: 24, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia', marginBottom: 8, textAlign: 'center' },
  confSub:      { fontSize: 14, color: D.textSec, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  confBiz:      { fontSize: 15, color: D.pink, fontWeight: '700', marginBottom: 16 },
  confDetails:  { backgroundColor: D.bgBase, borderRadius: 12, padding: 16, gap: 8, width: '100%', marginBottom: 20 },
  confDetail:   { fontSize: 14, color: D.textPrimary, fontWeight: '600' },
  confBtn:      { backgroundColor: D.pink, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center' },
  confBtnTxt:   { color: D.white, fontWeight: '800', fontSize: 15 },
});
