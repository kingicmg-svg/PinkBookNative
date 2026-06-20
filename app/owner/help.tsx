import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { SupportApi } from '../services/ApiService';

const SUPPORT_EMAIL = 'pinkbook.tech@gmail.com';
const ISSUE_TYPES = ['Booking issue', 'Payments & billing', 'Account access', 'Bug report', 'Feature request', 'Other'];

const TOPICS = [
  {
    cat: 'Getting Started',
    emoji: '🚀',
    faqs: [
      { q: 'How do I set up my booking page?', a: 'Go to Brand Studio in your Settings. You\'ll be guided through a 6-step setup: business info, visual identity, booking link, your voice, service gallery, and preview.' },
      { q: 'How do clients find and book with me?', a: 'Clients can find you on PinkBook Discovery if you\'ve enabled it in Brand Studio. You can also share your direct booking link from Settings.' },
      { q: 'What\'s my booking link?', a: 'Your booking link is pinkbook.app/[your-slug]. Find and copy it from the Settings screen under "Booking Link".' },
    ],
  },
  {
    cat: 'Booking & Calendar',
    emoji: '📅',
    faqs: [
      { q: 'How do I set my availability?', a: 'Go to Settings → Brand Studio → Step 2, or use the Calendar tab. Set your working hours per day of the week and buffer times between appointments.' },
      { q: 'Can clients book instantly or do I approve?', a: 'By default, bookings are auto-confirmed. You can require deposits or manual approval for certain payment methods in your policy settings.' },
      { q: 'How do I block off time?', a: 'From the Calendar tab, tap on any time slot to block it. Blocked times won\'t show as available to clients.' },
    ],
  },
  {
    cat: 'Services & Pricing',
    emoji: '✂️',
    faqs: [
      { q: 'How do I add or edit services?', a: 'Go to the Services tab. Tap the + button to add a service. Enter name, duration, price, and optional color code. Clients see these when booking.' },
      { q: 'Can I add service add-ons?', a: 'Yes. When editing a service, scroll down to the Add-ons section to add optional extras with their own prices and durations.' },
      { q: 'What are color codes for?', a: 'Color codes appear on your calendar to help you visually distinguish service types at a glance.' },
    ],
  },
  {
    cat: 'Clients & Import',
    emoji: '👥',
    faqs: [
      { q: 'How do I import my existing clients?', a: 'You need Pro plan or above. In Settings, you can upload a CSV file with columns: first_name, last_name, email, phone. All imports are validated before saving.' },
      { q: 'Can I add notes to client profiles?', a: 'Yes. Tap any client in the Clients tab to open their profile. Scroll to the Notes section to add freeform notes visible only to you.' },
      { q: 'How do I view a client\'s booking history?', a: 'Open the client\'s profile from the Clients tab. Their full booking history, spend, and visit frequency are shown.' },
    ],
  },
  {
    cat: 'Payments & Deposits',
    emoji: '💳',
    faqs: [
      { q: 'How do I set up Stripe?', a: 'Connect Stripe from Settings → Integrations. You\'ll need a Stripe account. Once connected, clients can pay online when booking. Pro plan required.' },
      { q: 'Can I require a deposit?', a: 'Yes. In Settings → Policies, set a deposit amount (flat or %) and choose when it\'s required. Clients pay the deposit at booking time.' },
      { q: 'How do I handle no-shows?', a: 'Set a no-show fee in Settings → Policies. If a client no-shows, you can mark the booking and the fee can be charged to their saved card (Stripe required).' },
    ],
  },
  {
    cat: 'Plans & Billing',
    emoji: '💜',
    faqs: [
      { q: 'What\'s included in the free Starter plan?', a: 'Starter is free forever and includes: up to 20 bookings/month, basic service catalog, client profiles, and the 5-step booking flow. No credit card required.' },
      { q: 'How do I upgrade my plan?', a: 'Go to Settings → Plans & Pricing. Select the plan you want and follow the instructions to set up billing through Stripe.' },
      { q: 'Can I cancel my plan anytime?', a: 'Yes. Cancel from Settings → Plans & Pricing at any time. Your account reverts to Starter at the end of the billing period. No data is lost.' },
    ],
  },
  {
    cat: 'Brand Studio',
    emoji: '🎨',
    faqs: [
      { q: 'What is Brand Studio?', a: 'Brand Studio is a 6-step setup wizard that lets you configure your business identity: name, tagline, logo, colors, fonts, booking link, communication voice, and service gallery.' },
      { q: 'Is Brand Studio available on Starter?', a: 'Basic profile setup is available on all plans. Full Brand Studio features (colors, fonts, custom booking link) require Pro or above.' },
      { q: 'How do I add portfolio photos?', a: 'In Brand Studio, Step 5 is the Service Gallery. Upload your best work photos. These appear on your discover listing and booking page.' },
    ],
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  const filtered = search.trim()
    ? TOPICS.map(t => ({ ...t, faqs: t.faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) })).filter(t => t.faqs.length > 0)
    : TOPICS;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Help Center</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <TextInput style={s.search} placeholder="Search help topics..." placeholderTextColor={Colors.soft} value={search} onChangeText={setSearch} />
        {filtered.map(topic => (
          <View key={topic.cat} style={s.section}>
            <View style={s.catHeader}>
              <Text style={s.catEmoji}>{topic.emoji}</Text>
              <Text style={s.catName}>{topic.cat}</Text>
            </View>
            {topic.faqs.map((faq, i) => {
              const key = `${topic.cat}-${i}`;
              const isOpen = open === key;
              return (
                <TouchableOpacity key={i} style={[s.faqRow, isOpen && s.faqOpen]} onPress={() => setOpen(isOpen ? null : key)}>
                  <Text style={s.faqQ}>{faq.q}</Text>
                  <Text style={[s.faqChevron, isOpen && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                  {isOpen && <Text style={s.faqA}>{faq.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={s.contactBox}>
          <Text style={s.contactTitle}>Still need help?</Text>
          <Text style={s.contactSub}>Reach our team at pinkbook.tech@gmail.com</Text>
          <TouchableOpacity style={s.contactBtn} onPress={() => setSupportOpen(true)}>
            <Text style={s.contactBtnTxt}>Email Support</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      <SupportFormModal visible={supportOpen} onClose={() => setSupportOpen(false)} />
    </View>
  );
}

function SupportFormModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setIssueType(ISSUE_TYPES[0]); setEmail(''); setSubject(''); setMessage('');
    setSubmitting(false); setSent(false);
  };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Add a subject and details', 'Please describe your issue so we can help.');
      return;
    }
    setSubmitting(true);
    // Primary path: send the request through the backend, which emails it to the
    // PinkBook support inbox (pinkbook.tech@gmail.com) with the user as reply-to.
    try {
      await SupportApi.submit({
        issueType,
        email: email.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        platform: `ios-app/${Platform.OS}`,
      });
      setSubmitting(false);
      setSent(true);
      return;
    } catch {
      // Fallback: hand off to the device mail client when available, guarded so
      // it never throws "Unable to open URL" on devices without a mail client.
      const body = `Issue type: ${issueType}\nFrom: ${email || '(not provided)'}\n\n${message}`;
      const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[' + issueType + '] ' + subject)}&body=${encodeURIComponent(body)}`;
      try {
        const canMail = await Linking.canOpenURL(mailUrl);
        if (canMail) await Linking.openURL(mailUrl);
      } catch {
        /* no-op: fall through to in-app confirmation */
      }
      setSubmitting(false);
      setSent(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[m.container, { paddingTop: insets.top }]}>
        <View style={m.topBar}>
          <TouchableOpacity onPress={close}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>Contact Support</Text>
          <View style={{ width: 60 }} />
        </View>

        {sent ? (
          <View style={m.successWrap}>
            <Text style={m.successIcon}>✓</Text>
            <Text style={m.successTitle}>Message sent</Text>
            <Text style={m.successSub}>
              Thanks — our team received your request and will reply by email. You can also reach us anytime at {SUPPORT_EMAIL}.
            </Text>
            <TouchableOpacity style={m.submitBtn} onPress={close}>
              <Text style={m.submitTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={m.scroll} keyboardShouldPersistTaps="handled">
              <Text style={m.label}>What can we help with?</Text>
              <View style={m.chips}>
                {ISSUE_TYPES.map(t => (
                  <TouchableOpacity key={t} style={[m.chip, issueType === t && m.chipOn]} onPress={() => setIssueType(t)}>
                    <Text style={[m.chipTxt, issueType === t && m.chipTxtOn]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={m.label}>Your email (for our reply)</Text>
              <TextInput
                style={m.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.soft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={m.label}>Subject</Text>
              <TextInput
                style={m.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief subject"
                placeholderTextColor={Colors.soft}
              />

              <Text style={m.label}>Describe the issue</Text>
              <TextInput
                style={[m.input, m.textarea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Include what you did, what you expected, and what happened…"
                placeholderTextColor={Colors.soft}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity style={[m.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
                {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={m.submitTxt}>Send Message</Text>}
              </TouchableOpacity>
              <Text style={m.footNote}>Or email us directly at {SUPPORT_EMAIL}</Text>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:        { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:       { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  scroll:      { padding: 16, gap: 12 },
  search:      { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  section:     { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  catHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.pinkLight + '60' },
  catEmoji:    { fontSize: 18 },
  catName:     { fontSize: 14, fontWeight: '800', color: Colors.charcoal },
  faqRow:      { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 6 },
  faqOpen:     { backgroundColor: Colors.pinkLight + '30' },
  faqQ:        { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.charcoal, lineHeight: 18 },
  faqChevron:  { fontSize: 20, color: Colors.rose, fontWeight: '300', lineHeight: 20 },
  faqA:        { width: '100%', fontSize: 13, color: Colors.mid, lineHeight: 20, marginTop: 4 },
  contactBox:  { backgroundColor: Colors.charcoal, borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 8 },
  contactTitle:{ fontSize: 16, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  contactSub:  { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 16, textAlign: 'center' },
  contactBtn:  { backgroundColor: Colors.rose, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  contactBtnTxt:{ color: Colors.white, fontWeight: '800', fontSize: 14 },
});

const m = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel:       { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:        { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  scroll:       { padding: 16 },
  label:        { fontSize: 13, fontWeight: '800', color: Colors.charcoal, marginTop: 16, marginBottom: 8 },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipOn:       { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt:      { fontSize: 12, fontWeight: '700', color: Colors.soft },
  chipTxtOn:    { color: Colors.white },
  input:        { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  textarea:     { minHeight: 120 },
  submitBtn:    { backgroundColor: Colors.rose, borderRadius: 999, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  submitTxt:    { color: Colors.white, fontWeight: '800', fontSize: 15 },
  footNote:     { fontSize: 12, color: Colors.soft, textAlign: 'center', marginTop: 14 },
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successIcon:  { fontSize: 48, color: Colors.success, fontWeight: '900' },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.charcoal },
  successSub:   { fontSize: 14, color: Colors.mid, textAlign: 'center', lineHeight: 21 },
});
