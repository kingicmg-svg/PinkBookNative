import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD    = 16;
const LABEL_W  = 130;
const COL_W    = Math.floor((SCREEN_W - H_PAD * 2 - LABEL_W) / 4);
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

const C = Colors;

const PLANS = [
  { id: 'starter',      emoji: '🌸', label: 'Starter',      price: 'Free',  color: '#9CA3AF', dark: false },
  { id: 'pro',          emoji: '💜', label: 'Pro',          price: '$24/mo', color: '#C85D7A', dark: false },
  { id: 'salon',        emoji: '👑', label: 'Salon',        price: '$79/mo', color: '#7C3AED', dark: false },
  { id: 'studio_elite', emoji: '⭐', label: 'Studio Elite', price: '$149/mo', color: '#1C1C1E', dark: true },
];

type Row = { label: string; values: (string | boolean)[] };
type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: 'Bookings & Clients',
    rows: [
      { label: 'Bookings per month',          values: ['20', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Client profiles & database',  values: [true, true, true, true] },
      { label: 'Client notes & history',      values: [false, true, true, true] },
      { label: 'CSV client import',           values: [false, true, true, true] },
      { label: 'Smart scheduling & buffers',  values: [false, true, true, true] },
    ],
  },
  {
    title: 'Payments',
    rows: [
      { label: 'E-transfer processing',       values: [true, true, true, true] },
      { label: 'Stripe online payments',      values: [false, true, true, true] },
      { label: 'Auto receipts & invoices',    values: [false, true, true, true] },
      { label: 'Custom deposits',             values: [false, true, true, true] },
    ],
  },
  {
    title: 'Calendar & Scheduling',
    rows: [
      { label: 'Month-view booking calendar', values: [true, true, true, true] },
      { label: 'Google Calendar sync',        values: [false, true, true, true] },
      { label: 'Multiple stylist calendars',  values: [false, false, true, true] },
      { label: 'Shared team availability',    values: [false, false, true, true] },
    ],
  },
  {
    title: 'Notifications & Marketing',
    rows: [
      { label: 'In-app notification center',  values: [true, true, true, true] },
      { label: 'Branded email notifications', values: [false, true, true, true] },
      { label: 'SMS reminders (Twilio)',       values: [false, true, true, true] },
      { label: 'Announcement banners',        values: [false, false, true, true] },
    ],
  },
  {
    title: 'Brand & Customisation',
    rows: [
      { label: 'Booking page link',           values: [true, true, true, true] },
      { label: 'Brand colors, fonts & logo',  values: [false, true, true, true] },
      { label: 'Banner image on booking page',values: [false, false, true, true] },
      { label: 'Service gallery (portfolio)', values: [false, false, false, true] },
      { label: 'Before/after photo sets',     values: [false, false, false, true] },
      { label: 'White-label (no PinkBook branding)', values: [false, false, false, true] },
      { label: 'Custom domain (yourstudio.com)',      values: [false, false, false, true] },
      { label: 'Custom email domain',         values: [false, false, false, true] },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Standard support',            values: [true, true, true, true] },
      { label: 'Priority support',            values: [false, false, true, true] },
      { label: 'Dedicated account support',   values: [false, false, false, true] },
    ],
  },
];

export default function PlanCompareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [highlight, setHighlight] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.heading}>Compare Plans</Text>
        <Text style={s.sub}>Find the right fit for your business</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan header row */}
        <View style={s.planRow}>
          <View style={{ width: LABEL_W }} />
          {PLANS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[s.planCol, { width: COL_W }, highlight === p.id && { backgroundColor: p.color + '18' }]}
              onPress={() => setHighlight(highlight === p.id ? null : p.id)}
              activeOpacity={0.8}
            >
              <Text style={s.planEmoji}>{p.emoji}</Text>
              <Text style={[s.planName, { color: p.color }]}>{p.label}</Text>
              <Text style={[s.planPrice, { color: p.color }]}>{p.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feature sections */}
        {SECTIONS.map(sec => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            {sec.rows.map((row, ri) => (
              <View key={ri} style={[s.row, ri % 2 === 0 && s.rowAlt]}>
                <Text style={s.rowLabel} numberOfLines={3}>{row.label}</Text>
                {row.values.map((val, ci) => {
                  const plan = PLANS[ci];
                  const isHighlit = highlight === plan.id;
                  return (
                    <View
                      key={ci}
                      style={[
                        s.cell,
                        { width: COL_W },
                        isHighlit && { backgroundColor: plan.color + '12' },
                      ]}
                    >
                      {typeof val === 'boolean' ? (
                        <Text style={[s.check, { color: val ? plan.color : '#D1D5DB' }]}>
                          {val ? '✓' : '–'}
                        </Text>
                      ) : (
                        <Text style={[s.cellTxt, { color: isHighlit ? plan.color : C.charcoal }]} numberOfLines={2}>
                          {val}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ))}

        {/* CTA */}
        <View style={s.cta}>
          <Text style={s.ctaNote}>All paid plans include a 14-day free trial. No credit card required to start.</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.back()}>
            <Text style={s.ctaBtnTxt}>← Back to Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:      { backgroundColor: C.cream, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn:     { marginBottom: 8 },
  backTxt:     { color: C.rose, fontSize: 14, fontWeight: '600' },
  heading:     { fontSize: 24, fontWeight: '900', color: C.charcoal, fontFamily: 'Georgia' },
  sub:         { fontSize: 13, color: C.soft, marginTop: 2 },

  planRow:     { flexDirection: 'row', paddingHorizontal: H_PAD, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  planCol:     { alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
  planEmoji:   { fontSize: 18, marginBottom: 2 },
  planName:    { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  planPrice:   { fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 1 },

  section:      { marginTop: 16, marginHorizontal: H_PAD, backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.rose, textTransform: 'uppercase', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, backgroundColor: C.pinkLight },

  row:     { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border + '80' },
  rowAlt:  { backgroundColor: '#FAFAFA' },
  rowLabel:{ width: LABEL_W, fontSize: 12, color: C.charcoal, paddingHorizontal: 12, paddingVertical: 10, lineHeight: 16 },
  cell:    { width: COL_W, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  check:   { fontSize: 16, fontWeight: '800' },
  cellTxt: { fontSize: 11, fontWeight: '700', textAlign: 'center', paddingHorizontal: 2 },

  cta:       { margin: 20, alignItems: 'center', gap: 12 },
  ctaNote:   { fontSize: 12, color: C.soft, textAlign: 'center', lineHeight: 18 },
  ctaBtn:    { backgroundColor: C.charcoal, borderRadius: 100, paddingVertical: 14, paddingHorizontal: 32 },
  ctaBtnTxt: { color: C.white, fontWeight: '800', fontSize: 14 },
});
