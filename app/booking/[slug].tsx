import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Animated, PanResponder, Dimensions, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { DiscoverApi, BookingApi } from '../services/ApiService';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Dynamic palette from brand colour ─────────────────────────────────────
const BASE = {
  textPrimary: '#F5EEF0', textSec: '#9E8A90', textMuted: '#5C4A52',
  white: '#FFFFFF', gold: '#C9A96E',
  success: '#1A9E4A', successBg: 'rgba(26,158,74,0.12)',
  promoGreen: 'rgba(45,184,122,0.10)',
};

function _hexToRgb(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return null;
  return { r: parseInt(m[1].slice(0,2),16), g: parseInt(m[1].slice(2,4),16), b: parseInt(m[1].slice(4,6),16) };
}
function _dark(hex: string, f: number): string {
  const rgb = _hexToRgb(hex);
  if (!rgb) return '#110A0E';
  const r = Math.round(rgb.r * f).toString(16).padStart(2,'0');
  const g = Math.round(rgb.g * f).toString(16).padStart(2,'0');
  const b = Math.round(rgb.b * f).toString(16).padStart(2,'0');
  return `#${r}${g}${b}`;
}

function palette(primaryHex?: string, accentHex?: string) {
  const p = /^#[0-9A-Fa-f]{6}$/.test(primaryHex || '') ? primaryHex! : '#D4417A';
  const a = /^#[0-9A-Fa-f]{6}$/.test(accentHex  || '') ? accentHex!  : '#FDE8EF';
  // Derive very dark brand-tinted backgrounds from primary
  const bgBase     = _dark(p, 0.10);
  const bgCard     = _dark(p, 0.15);
  const bgElevated = _dark(p, 0.20);
  return {
    ...BASE, bgBase, bgCard, bgElevated,
    pink: p, accent: a,
    pinkGlow: p + '45', border: p + '25', borderMid: p + '40', cardOn: p + '12',
  };
}

// ── Profession intake options (mirrors PWA shared-utils) ──────────────────
const LASH_OPTIONS = [
  { id: 'classic', label: 'Classic Set',       icon: '👁️', desc: 'A soft, everyday look with clean length and light definition.' },
  { id: 'volume',  label: 'Volume / Wispy',    icon: '🌟', desc: 'Fuller fan work, wispy styling, and more dramatic density.' },
  { id: 'lift',    label: 'Lash Lift & Tint',  icon: '💫', desc: 'Natural-lash enhancement with curl, lift, and optional tint.' },
  { id: 'fill',    label: 'Fill / Maintenance', icon: '🔄', desc: 'Touch-up work for retention, balance, and shape correction.' },
];
const WAX_OPTIONS = [
  { id: 'brows',  label: 'Brows & Face',       icon: '🤨', desc: 'Brows, lip, chin, nose, and other quick facial wax services.' },
  { id: 'bikini', label: 'Brazilian / Bikini',  icon: '🌸', desc: 'Intimate-area waxing with prep and aftercare considerations.' },
  { id: 'body',   label: 'Body Waxing',         icon: '🦵', desc: 'Legs, arms, back, chest, and larger-area body wax services.' },
];
const NAIL_FOCUS_OPTIONS = [
  { id: 'acrylic', label: 'Extensions / Acrylic', icon: '💅', desc: 'Full sets, overlays, fills, and structured enhancement services.' },
  { id: 'gel',     label: 'Gel Manicure',          icon: '✨', desc: 'Gel polish, overlays, BIAB, and long-wear natural nail services.' },
  { id: 'natural', label: 'Natural Nail Care',      icon: '🌸', desc: 'Classic manicures, repair work, shaping, and strengthening care.' },
  { id: 'pedi',    label: 'Pedicure',               icon: '🦶', desc: 'Spa pedicures, gel toes, callus care, and finish upgrades.' },
];
type ProfKey = 'hair'|'nail'|'lash'|'wax';
const PROF_META: Record<ProfKey, { providerLabel:string; intakeStep:string; intakeTitle:string; intakeSub:string; intakeKey:string }> = {
  hair: { providerLabel:'Stylist',       intakeStep:'Hair Texture',   intakeTitle:"What's your hair texture?",              intakeSub:'Helps your stylist prepare and give accurate timing.',               intakeKey:'Hair Texture' },
  nail: { providerLabel:'Nail Tech',     intakeStep:'Service Focus',  intakeTitle:'What are you booking for today?',         intakeSub:'Helps your nail tech prep the right products and timing.',           intakeKey:'Service Focus' },
  lash: { providerLabel:'Lash Artist',   intakeStep:'Set Preference', intakeTitle:'What lash look are you after?',           intakeSub:'Helps your lash artist plan the right set and timing.',             intakeKey:'Set Preference' },
  wax:  { providerLabel:'Wax Specialist',intakeStep:'Service Area',   intakeTitle:'Which area are we focusing on today?',    intakeSub:'Helps your wax specialist prep timing and aftercare.',              intakeKey:'Service Area' },
};

// ── Hair textures ─────────────────────────────────────────────────────────
const TEXTURES = [
  { id: 'straight', label: 'Straight',       icon: '—', desc: 'Fine to coarse, naturally falls flat with little to no wave or curl.' },
  { id: 'wavy',     label: 'Wavy',           icon: '~', desc: 'Loose S-shaped waves with natural movement and a slight bend.' },
  { id: 'curly',    label: 'Curly',          icon: 'ᴒ', desc: 'Defined spirals or ringlets with a bouncy, voluminous curl pattern.' },
  { id: 'coily',    label: 'Coily / Coarse', icon: 'ℰ', desc: 'Tight, densely packed coils or zigzag patterns with high shrinkage.' },
];

// ── Nail options ───────────────────────────────────────────────────────────
const NAIL_LENGTHS = ['Short', 'Medium', 'Long', 'XL'];
const NAIL_SHAPES  = ['Square', 'Round', 'Almond', 'Coffin', 'Stiletto', 'Oval'];

// ── Hair colours (identical to PWA) ──────────────────────────────────────
const HAIR_COLOURS = [
  { code: '1',       name: 'Jet Black',    hex: '#0a0a0a' },
  { code: '1B',      name: 'Off Black',    hex: '#1a1108' },
  { code: '2',       name: 'Dark Brown',   hex: '#2c1503' },
  { code: '4',       name: 'Med. Brown',   hex: '#4a2506' },
  { code: '6',       name: 'Chestnut',     hex: '#6b3a1f' },
  { code: '8',       name: 'Warm Brown',   hex: '#7d4b2a' },
  { code: '27',      name: 'Honey Blonde', hex: '#c68c3c' },
  { code: '30',      name: 'Auburn',       hex: '#9a3b1e' },
  { code: '33',      name: 'Dark Auburn',  hex: '#6b1c0a' },
  { code: '99J',     name: 'Burgundy',     hex: '#5e0a22' },
  { code: '350',     name: 'Copper',       hex: '#c05a1c' },
  { code: '613',     name: 'Platinum',     hex: '#f5e6c3' },
  { code: 'T1B/27',  name: 'Black→Honey',  hex: '#1a1108', hex2: '#c68c3c' },
  { code: 'T1B/30',  name: 'Black→Auburn', hex: '#1a1108', hex2: '#9a3b1e' },
  { code: 'T1B/613', name: 'Black→Plat.',  hex: '#1a1108', hex2: '#f5e6c3' },
  { code: 'T4/27',   name: 'Brown→Honey',  hex: '#4a2506', hex2: '#c68c3c' },
] as { code: string; name: string; hex: string; hex2?: string }[];

const MAX_COLOURS = 3;
const HAIR_EXT_KEYWORDS = [
  'sew-in', 'sewin', 'sew in', 'extension', 'weave', 'weft',
  'frontal', 'closure', 'quickweave', 'quick weave',
  'wig install', 'lace install', 'tape-in', 'tape in',
  'braid', 'braids', 'braided', 'knotless', 'box braid',
  'cornrow', 'cornrows', 'faux loc', 'faux locs', 'goddess braid',
  'feed-in', 'feed in', 'micro braid', 'senegalese', 'twist',
];
function isExtensionService(name: string) {
  if (!name) return false;
  const l = name.toLowerCase();
  return HAIR_EXT_KEYWORDS.some(kw => l.includes(kw));
}

// ── Payment options ────────────────────────────────────────────────────────
const PAYMENT_OPTS = [
  { id: 'etransfer', label: 'E-Transfer',          icon: '📲', desc: 'Interac e-Transfer, manual confirmation' },
  { id: 'card',      label: 'Online (Card)',        icon: '💳', desc: 'Secure card via Stripe checkout' },
  { id: 'cash',      label: 'Cash at Appointment', icon: '💵', desc: 'Pay on arrival' },
];

// ── Date helpers ───────────────────────────────────────────────────────────
const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
function buildSlots(wh: any, iso: string, interval = 30): string[] {
  if (!wh || !iso) return [];
  const dow = new Date(iso + 'T12:00:00').getDay();
  const day = wh[DOW_KEYS[dow]];
  if (!day || day.enabled === false) return [];
  const [oh, om] = (day.open  || '09:00').split(':').map(Number);
  const [ch, cm] = (day.close || '18:00').split(':').map(Number);
  const slots: string[] = [];
  let cur = oh * 60 + om;
  while (cur + interval <= ch * 60 + cm) {
    const hh = Math.floor(cur / 60), mm = cur % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM', h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    slots.push(h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ampm);
    cur += interval;
  }
  return slots;
}
function isOpenDay(wh: any, iso: string) {
  if (!wh) return true;
  const day = wh[DOW_KEYS[new Date(iso + 'T12:00:00').getDay()]];
  return !day || day.enabled !== false;
}
function genDates(wh?: any): string[] {
  const out: string[] = [], today = new Date();
  for (let i = 0; out.length < 30 && i < 90; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    if (!wh || isOpenDay(wh, iso)) out.push(iso);
  }
  return out;
}
function fmtLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function fmtShort(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return { wd: d.toLocaleDateString('en', { weekday: 'short' }), day: d.getDate() };
}
const FALLBACK_TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '1:00 PM', '1:30 PM',  '2:00 PM',  '2:30 PM',  '3:00 PM',
  '3:30 PM',  '4:00 PM', '4:30 PM',  '5:00 PM',
];

// ── Step dots ──────────────────────────────────────────────────────────────
function StepDots({ total, current, D }: { total: number; current: number; D: ReturnType<typeof palette> }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[
          { height: 6, borderRadius: 3 },
          { width: i === current ? 20 : 6 },
          { backgroundColor: i < current ? D.pink + '80' : i === current ? D.pink : D.bgElevated },
        ]} />
      ))}
    </View>
  );
}

// ── Business header ────────────────────────────────────────────────────────
function BizHeader({ biz, D }: { biz: any; D: ReturnType<typeof palette> }) {
  const name     = biz?.businessName || biz?.business_name || 'Book Appointment';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const rating   = biz?.avgRating || biz?.avg_rating;
  const reviews  = biz?.reviewCount || biz?.review_count || 0;
  const category = biz?.serviceCategory || biz?.service_category;
  const city     = biz?.city;
  const bio      = biz?.bio;
  return (
    <View style={[hdr.card, { backgroundColor: D.bgCard, borderColor: D.borderMid }]}>
      <View style={[hdr.avatar, { backgroundColor: D.pink }]}>
        <Text style={hdr.initials}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[hdr.name, { color: BASE.textPrimary }]} numberOfLines={1}>{name}</Text>
        <View style={hdr.meta}>
          {!!category && <Text style={[hdr.tag, { borderColor: D.borderMid, color: D.pink }]}>{category}</Text>}
          {!!city && <Text style={[hdr.city, { color: BASE.textSec }]}>📍 {city}</Text>}
        </View>
        {!!bio && <Text style={[hdr.bio, { color: BASE.textSec }]} numberOfLines={2}>{bio}</Text>}
        {!!rating && rating > 0 && (
          <View style={hdr.stars}>
            {[1, 2, 3, 4, 5].map(n => <Text key={n} style={{ fontSize: 11, color: n <= Math.round(rating) ? D.gold : BASE.textMuted }}>★</Text>)}
            <Text style={[hdr.ratingTxt, { color: BASE.textSec }]}>{Number(rating).toFixed(1)} ({reviews})</Text>
          </View>
        )}
      </View>
    </View>
  );
}
const hdr = StyleSheet.create({
  card:     { flexDirection: 'row', gap: 14, backgroundColor: '#1A1014', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderWidth: 1 },
  avatar:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 20, fontWeight: '900', color: BASE.white },
  name:     { fontSize: 17, fontWeight: '900', fontFamily: 'Georgia', marginBottom: 4 },
  meta:     { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  tag:      { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  city:     { fontSize: 12 },
  bio:      { fontSize: 12, lineHeight: 17 },
  stars:    { flexDirection: 'row', gap: 1, alignItems: 'center', marginTop: 2 },
  ratingTxt:{ fontSize: 11, marginLeft: 4 },
  gold:     { color: '#C9A96E' },
});

// ── Colour swatch ──────────────────────────────────────────────────────────
function ColourSwatch({ c, selected, onPress, D }: { c: typeof HAIR_COLOURS[0]; selected: boolean; onPress: () => void; D: ReturnType<typeof palette> }) {
  return (
    <TouchableOpacity onPress={onPress} style={[csw.wrap, selected && { borderColor: D.pink, backgroundColor: D.cardOn }]}>
      <View style={[csw.circle, { backgroundColor: c.hex }]}>
        {!!c.hex2 && <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', backgroundColor: c.hex2 }} />}
        {selected && (
          <View style={[csw.checkOvl, { backgroundColor: D.pink + '60' }]}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: BASE.textPrimary }}>{c.code}</Text>
      <Text style={{ fontSize: 9, textAlign: 'center', color: BASE.textMuted, lineHeight: 11 }} numberOfLines={2}>{c.name}</Text>
    </TouchableOpacity>
  );
}
const csw = StyleSheet.create({
  wrap:    { width: 62, alignItems: 'center', gap: 4, padding: 4, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  circle:  { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)', overflow: 'hidden', position: 'relative' },
  checkOvl:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
});

// ── Pill ──────────────────────────────────────────────────────────────────
function Pill({ label, selected, onPress, D }: { label: string; selected: boolean; onPress: () => void; D: ReturnType<typeof palette> }) {
  return (
    <TouchableOpacity onPress={onPress} style={[pl.wrap, { backgroundColor: D.bgCard }, selected && { borderColor: D.pink, backgroundColor: D.cardOn }]}>
      <Text style={[pl.txt, { color: selected ? D.pink : BASE.textSec, fontWeight: selected ? '700' : '500' }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const pl = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5, borderColor: '#2A1E23', backgroundColor: '#1A1014' },
  txt:  { fontSize: 14 },
});

// ── Summary row ────────────────────────────────────────────────────────────
function SumRow({ k, v, D }: { k: string; v: string; D: ReturnType<typeof palette> }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: D.border }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: BASE.textSec, flex: 1 }}>{k}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: BASE.textPrimary, flex: 2, textAlign: 'right' }} numberOfLines={2}>{v}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // ── Data ──────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [business,   setBusiness]   = useState<any>(null);
  const [settings,   setSettings]   = useState<any>(null);
  const [services,   setServices]   = useState<any[]>([]);
  const [addons,     setAddons]     = useState<any[]>([]);
  const [D,          setD]          = useState(palette());

  // ── Booking state ─────────────────────────────────────────────────────
  const [step,          setStep]          = useState(0);
  const [texture,       setTexture]       = useState('');
  const [nailLength,    setNailLength]    = useState('');
  const [nailShape,     setNailShape]     = useState('');
  const [service,       setService]       = useState<any>(null);
  const [selAddons,     setSelAddons]     = useState<string[]>([]);
  const [hairType,      setHairType]      = useState('');
  const [hairColours,   setHairColours]   = useState<string[]>([]);
  const [date,          setDate]          = useState('');
  const [time,          setTime]          = useState('');
  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [email,         setEmail]         = useState('');
  const [phone,         setPhone]         = useState('');
  const [note,          setNote]          = useState('');
  const [payMethod,     setPayMethod]     = useState('etransfer');
  const [promoCode,     setPromoCode]     = useState('');
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [confirmed,     setConfirmed]     = useState(false);
  const [confId,        setConfId]        = useState('');
  const [confToken,     setConfToken]     = useState('');
  const [stripeEnabled, setStripeEnabled] = useState(false);

  // ── Swipe-down to dismiss ─────────────────────────────────────────────
  const slideY    = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const scrollAtTop = useRef(true);

  // Subtle hint: fade in then fade out
  useEffect(() => {
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(hintOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        scrollAtTop.current && gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) slideY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.5) {
          Animated.timing(slideY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(() => router.back());
        } else {
          Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
    })
  ).current;

  // ── Derived ───────────────────────────────────────────────────────────
  const profession     = settings?.profession || business?.serviceCategory || business?.service_category || 'hair';
  const isHair         = profession === 'hair';
  const isNail         = profession === 'nail' || profession === 'nails';
  const isLash         = profession === 'lash';
  const isWax          = profession === 'wax';
  const profKey        = (isHair ? 'hair' : isNail ? 'nail' : isLash ? 'lash' : isWax ? 'wax' : 'hair') as ProfKey;
  const profMeta       = PROF_META[profKey];
  const workingHours   = settings?.workingHours || null;
  const slotInterval   = settings?.slotIntervalMinutes || 30;
  const hairHumanLabel = settings?.hairHumanLabel || 'Human Boho';
  const hairSynthLabel = settings?.hairSyntheticLabel || 'Synthetic Boho';
  const hairHumanPrice = Number(settings?.hairHumanPrice || 0);
  const hairSynthPrice = Number(settings?.hairSyntheticPrice || 0);
  const mixCharge      = Number(settings?.hairExtMixCharge || 15);
  const loyaltyConfig  = settings?.loyaltyConfig || null;

  const intakeForms = Array.isArray(settings?.intakeForms) ? settings.intakeForms : [];
  const intakeQuestions: { text: string }[] = [];
  for (const form of intakeForms) {
    for (const q of (Array.isArray(form?.questions) ? form.questions : [])) {
      const t = String(q || '').trim();
      if (t && !intakeQuestions.find(x => x.text === t)) intakeQuestions.push({ text: t });
    }
  }

  const showExtPanel  = isHair && !!service && isExtensionService(service.name || '');
  const showColours   = showExtPanel && (hairType === hairHumanLabel || hairType === hairSynthLabel);
  const hairMixCharge = showColours && hairColours.length >= 2 ? mixCharge : 0;
  const hairTypePrice = showExtPanel && hairType === hairHumanLabel ? hairHumanPrice
                      : showExtPanel && hairType === hairSynthLabel ? hairSynthPrice : 0;

  const addonTotal = selAddons.reduce((acc, n) => acc + (Number(addons.find((a: any) => a.name === n)?.price) || 0), 0);
  const totalPrice = (Number(service?.price) || 0) + addonTotal + hairTypePrice;
  const deposit    = (Number(service?.deposit) || 0) + hairMixCharge;

  const availDates   = genDates(workingHours || undefined);
  const slots        = date ? buildSlots(workingHours, date, slotInterval) : [];
  const displayTimes = slots.length > 0 ? slots : FALLBACK_TIMES;

  const STEPS = isHair  ? ['Hair Texture',  'Service', 'Date & Time', 'Your Info', 'Review']
    : isLash  ? ['Set Preference','Service', 'Date & Time', 'Your Info', 'Review']
    : isWax   ? ['Service Area',   'Service', 'Date & Time', 'Your Info', 'Review']
    : isNail  ? ['Service Focus',  'Nail Style', 'Service', 'Date & Time', 'Your Info', 'Review']
    :           ['Service', 'Date & Time', 'Your Info', 'Review'];
  const CONTENT_KEYS = isHair  ? ['texture',    'service', 'datetime', 'info', 'review']
    : isLash  ? ['intake',     'service', 'datetime', 'info', 'review']
    : isWax   ? ['intake',     'service', 'datetime', 'info', 'review']
    : isNail  ? ['nail_focus', 'nail_style', 'service', 'datetime', 'info', 'review']
    :           ['service',    'datetime',  'info', 'review'];
  const content    = CONTENT_KEYS[step] || 'service';
  const totalSteps = STEPS.length;

  // ── Load data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    // Load payment config (Stripe enabled?) alongside business data
    BookingApi.getStripePaymentConfig()
      .then(cfg => setStripeEnabled(!!cfg?.enabled))
      .catch(() => setStripeEnabled(false));

    DiscoverApi.business(slug as string)
      .then(r => {
        const biz = r?.data || r || {};
        setBusiness(biz);
        const accent  = biz.primaryColor || biz.primary_color || '#D4417A';
        const accentL = biz.accentColor  || biz.accentColorLight || '#FDE8EF';
        setD(palette(accent, accentL));
        const ownerId = biz.ownerId || biz.owner_id || '';
        if (ownerId) {
          BookingApi.settings(ownerId)
            .then(s => {
              setSettings(s);
              const cat = s?.servicesCatalog || {};
              setServices(Array.isArray(cat.services)
                ? cat.services.filter((sv: any) => sv.name && sv.active !== false) : []);
              setAddons(Array.isArray(cat.addons)
                ? cat.addons.filter((a: any) => a.name) : []);
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Pre-fill from JWT
  useEffect(() => {
    if (!token) return;
    try {
      const pl = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (pl.email) setEmail(pl.email);
      if (pl.first_name) setFirstName(pl.first_name);
      else if (pl.name) setFirstName(pl.name.split(' ')[0]);
      if (pl.last_name) setLastName(pl.last_name);
      else if (pl.name) setLastName(pl.name.split(' ').slice(1).join(' '));
    } catch {}
  }, [token]);

  const canAdvance = () => {
    switch (content) {
      case 'texture':    return !!texture;
      case 'intake':     return !!texture;       // lash / wax intake selection
      case 'nail_focus': return !!texture;       // nail service focus
      case 'nail_style': return !!nailLength && !!nailShape;
      case 'service':    return !!service;
      case 'datetime':   return !!date && !!time;
      case 'info':       return !!firstName && !!email && email.includes('@');
      default:           return true;
    }
  };

  const NATIVE_RETURN_URL = 'https://pinkbook.app/pinkbook-stripe-native-return.html';

  const startStripeCheckout = async () => {
    const amountCents = Math.round(deposit * 100);
    if (amountCents < 50) {
      Alert.alert('No Deposit Set', 'Card payment requires a deposit amount to be configured for this service. Please contact the studio or choose e-transfer.');
      return;
    }
    setSubmitting(true);
    try {
      const ownerId = business?.ownerId || business?.owner_id || '';
      const bookingRef = `${slug}-${Date.now()}`;
      const session = await BookingApi.createStripeCheckoutSession({
        amountCents,
        serviceName: service?.name || 'Booking Deposit',
        customerEmail: email,
        customerName: (firstName + ' ' + lastName).trim(),
        bookingRef,
        ownerId,
        successUrl: NATIVE_RETURN_URL + '?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl:  NATIVE_RETURN_URL + '?cancel=1',
      });
      if (!session?.url) throw new Error('Could not create Stripe checkout. Please try again.');

      // Open Stripe in in-app browser; wait for deep-link redirect back to pinkbook://
      const result = await WebBrowser.openAuthSessionAsync(session.url, 'pinkbook://');

      if (result.type !== 'success' || !result.url) {
        Alert.alert('Payment Cancelled', 'Your booking was not completed.');
        return;
      }

      // Parse session_id from the redirected deep-link URL
      const returnUrl = new URL(result.url);
      const sessionId = returnUrl.searchParams.get('session_id') || '';
      if (!sessionId) {
        Alert.alert('Payment Cancelled', 'Your booking was not completed.');
        return;
      }

      // Verify payment with backend
      const verified = await BookingApi.getStripeCheckoutSession(sessionId);
      if (verified.paymentStatus !== 'paid') {
        throw new Error('Payment is not confirmed yet. Please try again.');
      }

      // Now submit the booking with full Stripe payment details
      const r = await BookingApi.submit({
        email, phone,
        clientName:    (firstName + ' ' + lastName).trim(),
        firstName, lastName,
        service:       service?.name || '',
        serviceName:   service?.name || '',
        servicePrice:  Number(service?.price) || 0,
        duration:      service?.durFrom || '',
        ownerId,
        deposit:       deposit,
        totalPaid:     deposit,
        totalDue:      deposit,
        paymentMethod: 'card',
        paymentStatus: deposit >= (Number(service?.price) || deposit) ? 'paid_in_full' : 'deposit_paid',
        status:        'confirmed',
        stripeSessionId:         verified.id,
        stripePaymentIntentId:   verified.paymentIntentId || '',
        cardLast4:     verified.paymentCard?.last4 || '',
        cardBrand:     verified.paymentCard?.brand || '',
        cardWallet:    verified.paymentCard?.wallet || '',
        addons:        selAddons,
        date,
        dateLabel:     date ? fmtLong(date) : '',
        time,
        promoCode:     promoCode || undefined,
        notes:         note || undefined,
        intakeAnswers: Object.keys(intakeAnswers).length ? intakeAnswers : undefined,
        texture:       texture || undefined,
        ...(isHair ? { hairTexture: texture || undefined, hairType: hairType || undefined, hairColors: hairColours.length ? hairColours : undefined }
          : isNail ? { nailFocus: texture || undefined, nailLength: nailLength || undefined, nailShape: nailShape || undefined }
          : isLash ? { lashPreference: texture || undefined }
          : isWax  ? { waxArea: texture || undefined }
          : {}),
      });

      setConfId(r?.booking?.id || r?.id || '');
      setConfToken(r?.booking?.manageToken || r?.booking?.manage_token || '');
      setConfirmed(true);
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!firstName || !email || !email.includes('@')) {
      Alert.alert('Missing Info', 'Please enter your name and a valid email.'); return;
    }
    // Card payment routes through Stripe hosted checkout
    if (payMethod === 'card') {
      await startStripeCheckout();
      return;
    }
    setSubmitting(true);
    try {
      const r = await BookingApi.submit({
        email, phone,
        clientName:   (firstName + ' ' + lastName).trim(),
        firstName, lastName,
        service:      service?.name || '',
        serviceName:  service?.name || '',
        servicePrice: Number(service?.price) || 0,
        duration:     service?.durFrom || '',
        ownerId:      business?.ownerId || business?.owner_id || '',
        deposit:      deposit,
        addons:       selAddons,
        date,
        dateLabel:    date ? fmtLong(date) : '',
        time,
        paymentMethod: payMethod,
        promoCode:    promoCode || undefined,
        notes:        note || undefined,
        intakeAnswers: Object.keys(intakeAnswers).length ? intakeAnswers : undefined,
        // Profession-specific intake (backend reads 'texture' for hair)
        texture:      texture || undefined,
        ...(isHair ? {
          hairTexture:  texture || undefined,
          hairType:     hairType || undefined,
          hairColors:   hairColours.length ? hairColours : undefined,
        } : isNail ? {
          nailFocus:    texture || undefined,
          nailLength:   nailLength || undefined,
          nailShape:    nailShape  || undefined,
        } : isLash ? {
          lashPreference: texture || undefined,
        } : isWax ? {
          waxArea:      texture || undefined,
        } : {}),
      });
      setConfId(r?.booking?.id || r?.id || '');
      setConfToken(r?.booking?.manageToken || r?.booking?.manage_token || '');
      setConfirmed(true);
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.message || 'Could not complete booking.');
    } finally { setSubmitting(false); }
  };

  // ── Load error (fallback to web) ──────────────────────────────────────
  const webUrl = `https://pinkbook.app/pinkbook-booking.html?name=${encodeURIComponent(String(slug || ''))}` ;
  if (!loading && loadError) return (
    <View style={[s.fill, { backgroundColor: D.bgBase, justifyContent: 'center', alignItems: 'center', padding: 32, paddingTop: insets.top }]}>
      <Text style={{ fontSize: 36, marginBottom: 16 }}>⚠️</Text>
      <Text style={{ color: BASE.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>Couldn't load booking page</Text>
      <Text style={{ color: BASE.textSec, fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>There was a problem fetching this page. You can open it in your browser instead.</Text>
      <TouchableOpacity
        onPress={() => Linking.openURL(webUrl)}
        style={{ backgroundColor: '#D4417A', borderRadius: 100, paddingHorizontal: 28, paddingVertical: 14, marginBottom: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Open in Browser</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: BASE.textSec, fontSize: 14 }}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <View style={[s.fill, { backgroundColor: D.bgBase, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
      <ActivityIndicator color="#D4417A" size="large" />
      <Text style={{ color: BASE.textSec, marginTop: 12, fontSize: 14 }}>Loading booking page…</Text>
    </View>
  );

  // ── Confirmation screen ────────────────────────────────────────────────
  if (confirmed) return (
    <View style={[s.fill, { backgroundColor: D.bgBase, paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={[s.confCard, { backgroundColor: D.bgCard, borderColor: D.borderMid }]}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>🌸</Text>
          <Text style={[s.confTitle, { color: D.pink }]}>You're Booked!</Text>
          <Text style={[s.confSub, { color: BASE.textSec }]}>
            Confirmation sent to{'\n'}<Text style={{ color: BASE.textPrimary, fontWeight: '700' }}>{email}</Text>
          </Text>
          {!!confId && <Text style={[s.confRef, { color: BASE.textMuted, borderColor: D.border }]}>Booking #{confId}</Text>}
          <View style={[s.confBox, { borderColor: D.border, backgroundColor: D.bgBase }]}>
            {!!(business?.businessName || business?.business_name) && (
              <View style={s.confRow}><Text style={s.confKey}>Studio</Text><Text style={[s.confVal, { color: D.pink }]}>{business.businessName || business.business_name}</Text></View>
            )}
            {!!service && <View style={s.confRow}><Text style={s.confKey}>Service</Text><Text style={s.confVal}>{service.name}</Text></View>}
            {selAddons.length > 0 && <View style={s.confRow}><Text style={s.confKey}>Add-ons</Text><Text style={s.confVal}>{selAddons.join(', ')}</Text></View>}
            {isHair && !!texture && <View style={s.confRow}><Text style={s.confKey}>Texture</Text><Text style={s.confVal}>{TEXTURES.find(t => t.id === texture)?.label || texture}</Text></View>}
            {(isLash || isWax || isNail) && !!texture && <View style={s.confRow}><Text style={s.confKey}>{profMeta.intakeKey}</Text><Text style={s.confVal}>{texture}</Text></View>}
            {!!hairType && <View style={s.confRow}><Text style={s.confKey}>Hair Type</Text><Text style={s.confVal}>{hairType}</Text></View>}
            {hairColours.length > 0 && <View style={s.confRow}><Text style={s.confKey}>Colour(s)</Text><Text style={s.confVal}>{hairColours.join(', ')}</Text></View>}
            {isNail && !!nailLength && <View style={s.confRow}><Text style={s.confKey}>Nail Length</Text><Text style={s.confVal}>{nailLength}</Text></View>}
            {isNail && !!nailShape  && <View style={s.confRow}><Text style={s.confKey}>Nail Shape</Text><Text style={s.confVal}>{nailShape}</Text></View>}
            {!!date && <View style={s.confRow}><Text style={s.confKey}>Date</Text><Text style={s.confVal}>{fmtLong(date)}</Text></View>}
            {!!time && <View style={s.confRow}><Text style={s.confKey}>Time</Text><Text style={s.confVal}>{time}</Text></View>}
            {totalPrice > 0 && <View style={s.confRow}><Text style={s.confKey}>Total</Text><Text style={[s.confVal, { color: D.pink, fontWeight: '800' }]}>${totalPrice.toFixed(2)}</Text></View>}
            <View style={s.confRow}><Text style={s.confKey}>Payment</Text><Text style={s.confVal}>{PAYMENT_OPTS.find(p => p.id === payMethod)?.label || payMethod}</Text></View>
          </View>
          {deposit > 0 && (
            <View style={[s.depositNote, { backgroundColor: D.pink + '18', borderColor: D.border }]}>
              <Text style={{ color: D.pink, fontSize: 13, fontWeight: '700' }}>Deposit Required: ${deposit.toFixed(2)}</Text>
              <Text style={{ color: BASE.textSec, fontSize: 12, marginTop: 2 }}>You'll receive payment instructions by email.</Text>
            </View>
          )}
          {!!loyaltyConfig?.enabled && (
            <View style={[s.loyaltyBox, { marginBottom: 12 }]}>
              <Text style={{ color: '#2DB87A', fontSize: 12, fontWeight: '600' }}>
                🏅 Earn {loyaltyConfig.pointsPerVisit || 1} stamp{(loyaltyConfig.pointsPerVisit || 1) !== 1 ? 's' : ''} with this visit.
              </Text>
            </View>
          )}
          {confToken ? (
            <TouchableOpacity style={[s.confBtn, { backgroundColor: D.pink }]} onPress={() => router.push(`/consumer/manage-booking?token=${confToken}` as any)}>
              <Text style={s.confBtnTxt}>View My Booking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.confBtn, { backgroundColor: D.pink }]} onPress={() => router.replace('/(consumer-tabs)/bookings' as any)}>
              <Text style={s.confBtnTxt}>View My Bookings</Text>
            </TouchableOpacity>
          )}
          {!!token && !!confToken && (
            <TouchableOpacity style={{ marginTop: 10, paddingVertical: 10 }} onPress={() => router.replace('/(consumer-tabs)/bookings' as any)}>
              <Text style={{ color: BASE.textSec, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>View All Bookings →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ marginTop: 8 }} onPress={() => router.back()}>
            <Text style={{ color: BASE.textMuted, fontSize: 14, textAlign: 'center' }}>← Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ── Step content ──────────────────────────────────────────────────────
  const renderContent = () => {
    switch (content) {

      case 'texture': return (
        <View>
          <Text style={s.stepTitle}>{profMeta.intakeTitle}</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>{profMeta.intakeSub}</Text>
          {TEXTURES.map(t => (
            <TouchableOpacity key={t.id} style={[s.card, { backgroundColor: D.bgCard, borderColor: D.bgElevated }, texture === t.id && { borderColor: D.pink, backgroundColor: D.cardOn }]} onPress={() => setTexture(t.id)}>
              <View style={[s.texIcon, { backgroundColor: texture === t.id ? D.pink : D.bgElevated }]}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: texture === t.id ? BASE.white : BASE.textSec }}>{t.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, texture === t.id && { color: D.pink }]}>{t.label}</Text>
                <Text style={[s.cardSub, { color: BASE.textSec }]}>{t.desc}</Text>
              </View>
              {texture === t.id && <View style={[s.check, { backgroundColor: D.pink }]}><Text style={{ color: BASE.white, fontSize: 11, fontWeight: '900' }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </View>
      );

      // ── Generic intake for lash / wax (and nail service focus) ────────
      case 'intake':
      case 'nail_focus': {
        const opts = isLash ? LASH_OPTIONS : isWax ? WAX_OPTIONS : NAIL_FOCUS_OPTIONS;
        return (
          <View>
            <Text style={s.stepTitle}>{profMeta.intakeTitle}</Text>
            <Text style={[s.stepSub, { color: BASE.textSec }]}>{profMeta.intakeSub}</Text>
            {opts.map(o => (
              <TouchableOpacity key={o.id} style={[s.card, { backgroundColor: D.bgCard, borderColor: D.bgElevated }, texture === o.id && { borderColor: D.pink, backgroundColor: D.cardOn }]} onPress={() => setTexture(o.id)}>
                <View style={[s.texIcon, { backgroundColor: texture === o.id ? D.pink : D.bgElevated }]}>
                  <Text style={{ fontSize: 16 }}>{o.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, texture === o.id && { color: D.pink }]}>{o.label}</Text>
                  <Text style={[s.cardSub, { color: BASE.textSec }]}>{o.desc}</Text>
                </View>
                {texture === o.id && <View style={[s.check, { backgroundColor: D.pink }]}><Text style={{ color: BASE.white, fontSize: 11, fontWeight: '900' }}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      // ── Nail style (length + shape) — only for nail, step 2 ──────────
      case 'nail_style': return (
        <View>
          <Text style={s.stepTitle}>Nail Style</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>Help your nail tech prep the perfect set.</Text>
          <Text style={s.sectionTitle}>Nail Length</Text>
          <View style={s.pillRow}>
            {NAIL_LENGTHS.map(l => <Pill key={l} label={l} selected={nailLength === l} onPress={() => setNailLength(l)} D={D} />)}
          </View>
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Nail Shape</Text>
          <View style={s.pillRow}>
            {NAIL_SHAPES.map(sh => <Pill key={sh} label={sh} selected={nailShape === sh} onPress={() => setNailShape(sh)} D={D} />)}
          </View>
        </View>
      );

      // ── DEPRECATED — kept for safety ──────────────────────────────────
      case 'nail_intake': return (
        <View>
          <Text style={s.stepTitle}>Nail Preferences</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>Help your nail tech prepare the perfect set.</Text>
          <Text style={s.sectionTitle}>Nail Length</Text>
          <View style={s.pillRow}>
            {NAIL_LENGTHS.map(l => <Pill key={l} label={l} selected={nailLength === l} onPress={() => setNailLength(l)} D={D} />)}
          </View>
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Nail Shape</Text>
          <View style={s.pillRow}>
            {NAIL_SHAPES.map(sh => <Pill key={sh} label={sh} selected={nailShape === sh} onPress={() => setNailShape(sh)} D={D} />)}
          </View>
        </View>
      );

      case 'service': return (
        <View>
          <Text style={s.stepTitle}>Choose your service</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>All pricing and durations shown upfront.</Text>

          {services.length === 0 ? (
            <View style={[s.emptyBox, { backgroundColor: D.bgCard, borderColor: D.border }]}>
              <Text style={{ color: BASE.textSec, textAlign: 'center', fontSize: 14 }}>No services available. Check back soon.</Text>
            </View>
          ) : services.map((sv: any, i: number) => {
            const dur = sv.durFrom && sv.durTo ? sv.durFrom + '–' + sv.durTo : sv.durFrom || '';
            const sel = service?.name === sv.name;
            return (
              <TouchableOpacity key={i}
                style={[s.serviceCard, { backgroundColor: D.bgCard, borderColor: D.bgElevated }, sel && { borderColor: D.pink, backgroundColor: D.cardOn }]}
                onPress={() => { setService(sv); setSelAddons([]); setHairType(''); setHairColours([]); }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, sel && { color: D.pink }]}>{sv.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {!!dur && <Text style={[s.pill2, { borderColor: D.border, color: BASE.textSec }]}>⏱ {dur}</Text>}
                    {!!sv.deposit && sv.deposit > 0 && <Text style={[s.pill2, { borderColor: D.pink + '60', color: D.pink }]}>Deposit ${Number(sv.deposit).toFixed(0)}</Text>}
                  </View>
                  {!!sv.description && <Text style={[s.cardSub, { color: BASE.textSec, marginTop: 4 }]} numberOfLines={2}>{sv.description}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {!!sv.price && <Text style={[s.price, sel && { color: D.pink }]}>${Number(sv.price).toFixed(0)}</Text>}
                  {sel && <View style={[s.check, { backgroundColor: D.pink }]}><Text style={{ color: BASE.white, fontSize: 11, fontWeight: '900' }}>✓</Text></View>}
                </View>
              </TouchableOpacity>
            );
          })}

          {addons.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sectionTitle}>Add-ons <Text style={{ color: BASE.textMuted, fontWeight: '500', textTransform: 'none' }}>(optional)</Text></Text>
              <View style={s.addonsGrid}>
                {addons
                  .filter((a: any) => !a.linked || !service || a.linked === service.name)
                  .map((a: any, i: number) => {
                    const on = selAddons.includes(a.name);
                    return (
                      <TouchableOpacity key={i}
                        style={[s.addonCard, { backgroundColor: D.bgCard, borderColor: D.bgElevated }, on && { borderColor: D.pink, backgroundColor: D.cardOn }]}
                        onPress={() => setSelAddons(p => on ? p.filter(x => x !== a.name) : [...p, a.name])}>
                        <View style={[s.addonCheck, on ? { backgroundColor: D.pink, borderColor: D.pink } : { borderColor: D.border }]}>
                          {on && <Text style={{ color: BASE.white, fontSize: 10, fontWeight: '900' }}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.addonName, on && { color: D.pink }]}>{a.name}</Text>
                          {!!a.price && <Text style={[s.addonPrice, { color: D.pink }]}>+${Number(a.price).toFixed(0)}</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          )}

          {showExtPanel && (
            <View style={[s.extPanel, { borderColor: D.borderMid, backgroundColor: D.cardOn }]}>
              <Text style={[s.sectionTitle, { color: BASE.textPrimary, marginBottom: 12 }]}>Hair Type</Text>
              <View style={s.pillRow}>
                <Pill label={hairHumanLabel + (hairHumanPrice > 0 ? ' (+$' + hairHumanPrice + ')' : '')}
                  selected={hairType === hairHumanLabel}
                  onPress={() => { setHairType(hairHumanLabel); setHairColours([]); }} D={D} />
                <Pill label={hairSynthLabel + (hairSynthPrice > 0 ? ' (+$' + hairSynthPrice + ')' : '')}
                  selected={hairType === hairSynthLabel}
                  onPress={() => { setHairType(hairSynthLabel); setHairColours([]); }} D={D} />
                <Pill label="Natural" selected={hairType === 'Natural'}
                  onPress={() => { setHairType('Natural'); setHairColours([]); }} D={D} />
              </View>
              {showColours && (
                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text style={[s.sectionTitle, { color: BASE.textPrimary, marginBottom: 0 }]}>Colour</Text>
                    <Text style={{ color: BASE.textMuted, fontSize: 11 }}>Select 1–{MAX_COLOURS} • 2+ adds +${mixCharge} mix fee</Text>
                  </View>
                  <View style={s.colourGrid}>
                    {HAIR_COLOURS.map(c => (
                      <ColourSwatch key={c.code} c={c}
                        selected={hairColours.includes(c.code)}
                        onPress={() => {
                          const already = hairColours.includes(c.code);
                          setHairColours(p => already ? p.filter(x => x !== c.code) : p.length < MAX_COLOURS ? [...p, c.code] : p);
                        }}
                        D={D} />
                    ))}
                  </View>
                  {hairColours.length >= 2 && (
                    <View style={[s.mixNotice, { borderColor: D.borderMid, backgroundColor: D.pink + '10' }]}>
                      <Text style={{ color: D.pink, fontSize: 13, fontWeight: '600' }}>💫 Colour mix selected — +${mixCharge} mixing fee added</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      );

      case 'datetime': return (
        <View>
          <Text style={s.stepTitle}>Pick a date & time</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>
            {workingHours ? 'Only available days and slots are shown.' : 'Select your preferred date and time.'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8, paddingHorizontal: 2 }}>
            {availDates.map(d => {
              const { wd, day } = fmtShort(d);
              const on = date === d;
              return (
                <TouchableOpacity key={d}
                  style={[s.dateChip, { backgroundColor: D.bgCard, borderColor: D.bgElevated }, on && { borderColor: D.pink, backgroundColor: D.cardOn }]}
                  onPress={() => { setDate(d); setTime(''); }}>
                  <Text style={[s.dateWd, { color: on ? D.pink : BASE.textMuted }]}>{wd}</Text>
                  <Text style={[s.dateDay, { color: on ? D.pink : BASE.textPrimary }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {!!date && (
            <View style={[s.selectedDate, { backgroundColor: D.bgCard, borderColor: D.border }]}>
              <Text style={{ color: D.pink, fontWeight: '700', fontSize: 14 }}>📅 {fmtLong(date)}</Text>
            </View>
          )}
          {!!date && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 20 }]}>Available Times</Text>
              <View style={s.timeGrid}>
                {displayTimes.map(t => (
                  <TouchableOpacity key={t}
                    style={[s.timeChip, { borderColor: time === t ? D.pink : D.border, backgroundColor: time === t ? D.pink : D.bgCard }]}
                    onPress={() => setTime(t)}>
                    <Text style={[s.timeTxt, { color: time === t ? BASE.white : BASE.textSec, fontWeight: time === t ? '800' : '500' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      );

      case 'info': return (
        <View>
          <Text style={s.stepTitle}>Your info & payment</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>Your information is used only for this booking.</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput style={[s.input, { flex: 1, backgroundColor: D.bgCard, borderColor: D.bgElevated }]} value={firstName} onChangeText={setFirstName}
              placeholder="First Name *" placeholderTextColor={BASE.textMuted} />
            <TextInput style={[s.input, { flex: 1, backgroundColor: D.bgCard, borderColor: D.bgElevated }]} value={lastName} onChangeText={setLastName}
              placeholder="Last Name" placeholderTextColor={BASE.textMuted} />
          </View>
          <TextInput style={[s.input, { backgroundColor: D.bgCard, borderColor: D.bgElevated }]} value={email} onChangeText={setEmail}
            placeholder="Email *" placeholderTextColor={BASE.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[s.input, { backgroundColor: D.bgCard, borderColor: D.bgElevated }]} value={phone} onChangeText={setPhone}
            placeholder="Phone (optional)" placeholderTextColor={BASE.textMuted} keyboardType="phone-pad" />
          <TextInput style={[s.input, { height: 76, textAlignVertical: 'top', backgroundColor: D.bgCard, borderColor: D.bgElevated }]} value={note} onChangeText={setNote}
            placeholder="Note to stylist (optional)…" placeholderTextColor={BASE.textMuted} multiline />

          {intakeQuestions.length > 0 && (
            <View style={[s.intakeBox, { borderColor: D.borderMid }]}>
              <Text style={[s.sectionTitle, { color: D.pink }]}>Pre-Booking Questionnaire</Text>
              <Text style={{ color: BASE.textMuted, fontSize: 12, marginBottom: 14 }}>Help your provider prepare for your visit.</Text>
              {intakeQuestions.map((q, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: BASE.textSec, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{q.text}</Text>
                  <TextInput style={s.input}
                    value={intakeAnswers[q.text] || ''}
                    onChangeText={v => setIntakeAnswers(p => ({ ...p, [q.text]: v }))}
                    placeholder="Your answer…" placeholderTextColor={BASE.textMuted} />
                </View>
              ))}
            </View>
          )}

          {!!loyaltyConfig?.enabled && (
            <View style={[s.loyaltyBox, { marginBottom: 12 }]}>
              <Text style={{ color: '#2DB87A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Loyalty Program</Text>
              <Text style={{ color: BASE.textPrimary, fontSize: 13, lineHeight: 18 }}>
                Earn {loyaltyConfig.pointsPerVisit || 1} stamp{(loyaltyConfig.pointsPerVisit || 1) !== 1 ? 's' : ''} per visit. Reward after {loyaltyConfig.stampsRequired || 10} stamps: {loyaltyConfig.rewardDescription || 'Loyalty reward'}.
              </Text>
            </View>
          )}

          <Text style={s.sectionTitle}>Payment Method</Text>
          {PAYMENT_OPTS.filter(p =>
            p.id !== 'card' || (stripeEnabled && deposit > 0)
          ).map(p => (
            <TouchableOpacity key={p.id}
              style={[s.card, { backgroundColor: D.bgCard, borderColor: D.bgElevated }, payMethod === p.id && { borderColor: D.pink, backgroundColor: D.cardOn }]}
              onPress={() => setPayMethod(p.id)}>
              <Text style={{ fontSize: 22 }}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, payMethod === p.id && { color: D.pink }]}>{p.label}</Text>
                <Text style={[s.cardSub, { color: BASE.textSec }]}>{p.desc}</Text>
              </View>
              {payMethod === p.id && <View style={[s.check, { backgroundColor: D.pink }]}><Text style={{ color: BASE.white, fontSize: 11, fontWeight: '900' }}>✓</Text></View>}
            </TouchableOpacity>
          ))}

          <View style={[s.promoBox, { borderColor: D.borderMid }]}>
            <Text style={s.sectionTitle}>🏷️ Promo Code</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: D.bgCard, borderColor: D.bgElevated }]}
                value={promoCode} onChangeText={setPromoCode}
                placeholder="Enter promo code" placeholderTextColor={BASE.textMuted}
                autoCapitalize="characters" maxLength={30} />
              <TouchableOpacity style={[s.promoBtn, { backgroundColor: D.pink }]}
                onPress={() => { if (promoCode.trim()) Alert.alert('Promo Code', `Code "${promoCode.trim()}" will be applied at checkout.`); }}>
                <Text style={{ color: BASE.white, fontWeight: '700', fontSize: 14 }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );

      case 'review': return (
        <View>
          <Text style={s.stepTitle}>Review & Confirm</Text>
          <Text style={[s.stepSub, { color: BASE.textSec }]}>Double-check your details before confirming.</Text>
          <View style={[s.summaryCard, { backgroundColor: D.bgCard, borderColor: D.borderMid }]}>
            <Text style={[s.summaryTitle, { color: BASE.textPrimary }]}>{business?.businessName || business?.business_name || 'Appointment'}</Text>
            {isHair && !!texture && <SumRow k="Hair Texture" v={TEXTURES.find(t => t.id === texture)?.label || texture} D={D} />}
            {(isLash || isWax || isNail) && !!texture && <SumRow k={profMeta.intakeKey} v={
              isLash ? (LASH_OPTIONS.find(o => o.id === texture)?.label || texture)
              : isWax ? (WAX_OPTIONS.find(o => o.id === texture)?.label || texture)
              : (NAIL_FOCUS_OPTIONS.find(o => o.id === texture)?.label || texture)
            } D={D} />}
            {isNail && !!nailLength && <SumRow k="Nail Length" v={nailLength} D={D} />}
            {isNail && !!nailShape  && <SumRow k="Nail Shape"  v={nailShape}  D={D} />}
            {!!service && <SumRow k="Service" v={service.name + ' · $' + Number(service.price).toFixed(2)} D={D} />}
            {selAddons.length > 0 && <SumRow k="Add-ons" v={selAddons.join(', ')} D={D} />}
            {!!hairType && <SumRow k="Hair Type" v={hairType + (hairTypePrice > 0 ? ' (+$' + hairTypePrice + ')' : '')} D={D} />}
            {hairColours.length > 0 && <SumRow k="Colour(s)" v={hairColours.join(', ')} D={D} />}
            {hairMixCharge > 0 && <SumRow k="Mix Charge" v={'+$' + hairMixCharge} D={D} />}
            {!!date && <SumRow k="Date" v={fmtLong(date)} D={D} />}
            {!!time && <SumRow k="Time" v={time} D={D} />}
            <SumRow k="Name"  v={(firstName + ' ' + lastName).trim()} D={D} />
            <SumRow k="Email" v={email} D={D} />
            {!!phone && <SumRow k="Phone" v={phone} D={D} />}
            <SumRow k="Payment" v={PAYMENT_OPTS.find(p => p.id === payMethod)?.label || payMethod} D={D} />
            {!!promoCode && <SumRow k="Promo Code" v={promoCode} D={D} />}
            {totalPrice > 0 && (
              <View style={[s.totalRow, { borderTopColor: D.border }]}>
                <Text style={{ color: BASE.textSec, fontWeight: '700', fontSize: 14 }}>Total</Text>
                <Text style={[s.totalAmt, { color: D.pink }]}>${totalPrice.toFixed(2)}</Text>
              </View>
            )}
            {deposit > 0 && (
              <View style={[s.totalRow, { borderTopColor: D.border }]}>
                <Text style={{ color: BASE.textSec, fontWeight: '700', fontSize: 13 }}>Deposit Due</Text>
                <Text style={[s.totalAmt, { color: D.pink, fontSize: 16 }]}>${deposit.toFixed(2)}</Text>
              </View>
            )}
          </View>
          {!!loyaltyConfig?.enabled && (
            <View style={[s.loyaltyBox, { marginBottom: 12 }]}>
              <Text style={{ color: '#2DB87A', fontSize: 12 }}>🏅 Earn {loyaltyConfig.pointsPerVisit || 1} stamp with this visit.</Text>
            </View>
          )}
          <View style={[s.policyBox, { borderColor: D.border }]}>
            <Text style={{ color: BASE.textMuted, fontSize: 12, lineHeight: 18 }}>
              By confirming you agree to the provider's cancellation policy. Deposits are non-refundable if cancelled within 48 hours. Late arrivals of 15+ minutes may result in a rescheduled appointment.
            </Text>
          </View>
          <TouchableOpacity
            style={[s.bookBtn, { backgroundColor: D.pink, shadowColor: D.pink }, submitting && { opacity: 0.7 }]}
            onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={BASE.white} /> : <Text style={s.bookBtnTxt}>Confirm Booking →</Text>}
          </TouchableOpacity>
        </View>
      );

      default: return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={[s.fill, { backgroundColor: D.bgBase }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[s.fill, { transform: [{ translateY: slideY }] }]}>
        <View style={[s.fill, { paddingTop: insets.top }]}>

          {/* Drag handle + top bar — swipe area */}
          <View {...panResponder.panHandlers}>
            {/* Drag handle pill */}
            <View style={s.handleRow}>
              <View style={[s.handle, { backgroundColor: D.pink + '50' }]} />
            </View>
            {/* Nav bar */}
            <View style={[s.topBar, { borderBottomColor: D.border }]}>
              <TouchableOpacity style={s.backBtn} onPress={() => step > 0 ? setStep(n => n - 1) : router.back()}>
                <Text style={[s.backTxt, { color: D.pink }]}>← {step > 0 ? 'Back' : 'Close'}</Text>
              </TouchableOpacity>
              <Text style={s.topTitle} numberOfLines={1}>{STEPS[step]}</Text>
              <View style={{ width: 70 }} />
            </View>
          </View>

          <StepDots total={totalSteps} current={step} D={D} />

          {/* Swipe-down hint toast */}
          <Animated.View style={[s.hintToast, { opacity: hintOpacity }]} pointerEvents="none">
            <Text style={s.hintTxt}>↓  Swipe down to close</Text>
          </Animated.View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => { scrollAtTop.current = false; }}
            onMomentumScrollEnd={e => { scrollAtTop.current = e.nativeEvent.contentOffset.y <= 4; }}
            scrollEventThrottle={16}>
            <BizHeader biz={business} D={D} />
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {renderContent()}
              <View style={{ height: 40 }} />
            </View>
          </ScrollView>

          {content !== 'review' && (
            <View style={[s.navBar, { borderTopColor: D.border, paddingBottom: insets.bottom + 8 }]}>
              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: canAdvance() ? D.pink : D.bgElevated, shadowColor: D.pink }, !canAdvance() && { shadowOpacity: 0 }]}
                onPress={() => canAdvance() && setStep(n => n + 1)}
                disabled={!canAdvance()}>
                <Text style={[s.nextTxt, !canAdvance() && { color: BASE.textMuted }]}>
                  {step < totalSteps - 2 ? 'Next: ' + STEPS[step + 1] + ' →' : 'Review Booking →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:         { flex: 1 },
  handleRow:    { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:       { width: 38, height: 4, borderRadius: 2 },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1 },
  backBtn:      { width: 70 },
  backTxt:      { fontWeight: '700', fontSize: 14 },
  topTitle:     { fontSize: 15, fontWeight: '800', color: BASE.textPrimary, maxWidth: '50%' },
  hintToast:    { position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center', zIndex: 10, pointerEvents: 'none' } as any,
  hintTxt:      { fontSize: 12, color: 'rgba(245,238,240,0.45)', fontWeight: '500', letterSpacing: 0.3 },
  stepTitle:    { fontSize: 22, fontWeight: '900', color: BASE.textPrimary, fontFamily: 'Georgia', marginBottom: 6 },
  stepSub:      { fontSize: 13, lineHeight: 18, marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, color: BASE.textSec },
  card:         { backgroundColor: '#1A1014', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#221520', flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: BASE.textPrimary },
  cardSub:      { fontSize: 12, lineHeight: 16, marginTop: 2 },
  texIcon:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  check:        { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  serviceCard:  { backgroundColor: '#1A1014', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#221520', flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill2:        { fontSize: 11, fontWeight: '600', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  price:        { fontSize: 18, fontWeight: '900', color: BASE.textPrimary },
  emptyBox:     { padding: 40, backgroundColor: '#1A1014', borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  addonsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  addonCard:    { backgroundColor: '#1A1014', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#221520', flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: '45%', flex: 1 },
  addonCheck:   { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  addonName:    { fontSize: 13, fontWeight: '600', color: BASE.textPrimary },
  addonPrice:   { fontSize: 12, fontWeight: '700' },
  extPanel:     { marginTop: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  pillRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colourGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mixNotice:    { marginTop: 12, borderRadius: 10, borderWidth: 1, padding: 12 },
  dateChip:     { width: 56, paddingVertical: 10, borderRadius: 14, backgroundColor: '#1A1014', borderWidth: 1, borderColor: '#221520', alignItems: 'center', gap: 3 },
  dateWd:       { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dateDay:      { fontSize: 18, fontWeight: '900' },
  selectedDate: { marginTop: 12, padding: 14, backgroundColor: '#1A1014', borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  timeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip:     { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, minWidth: 90, alignItems: 'center' },
  timeTxt:      { fontSize: 13 },
  input:        { backgroundColor: '#1A1014', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: BASE.textPrimary, borderWidth: 1, borderColor: '#221520', marginBottom: 12 },
  intakeBox:    { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  loyaltyBox:   { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(45,184,122,0.3)', padding: 14, backgroundColor: BASE.promoGreen },
  promoBox:     { borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', padding: 14, marginTop: 4, marginBottom: 8 },
  promoBtn:     { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  policyBox:    { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryCard:  { backgroundColor: '#1A1014', borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontWeight: '900', fontFamily: 'Georgia', marginBottom: 14 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1 },
  totalAmt:     { fontSize: 20, fontWeight: '900' },
  depositNote:  { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  bookBtn:      { borderRadius: 999, paddingVertical: 17, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6, marginBottom: 8 },
  bookBtnTxt:   { color: BASE.white, fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
  navBar:       { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  nextBtn:      { paddingVertical: 16, borderRadius: 999, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  nextTxt:      { color: BASE.white, fontWeight: '800', fontSize: 15 },
  confCard:     { backgroundColor: '#1A1014', borderRadius: 24, padding: 28, borderWidth: 1, alignItems: 'center', width: '100%' },
  confTitle:    { fontSize: 26, fontWeight: '900', fontFamily: 'Georgia', marginBottom: 8, textAlign: 'center' },
  confSub:      { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  confRef:      { fontSize: 12, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16, fontWeight: '600' },
  confBox:      { borderRadius: 14, padding: 16, borderWidth: 1, width: '100%', marginBottom: 16 },
  confRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  confKey:      { fontSize: 13, color: BASE.textSec, fontWeight: '600' },
  confVal:      { fontSize: 13, color: BASE.textPrimary, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 8 },
  confBtn:      { borderRadius: 999, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 4 },
  confBtnTxt:   { color: BASE.white, fontWeight: '800', fontSize: 15 },
});
