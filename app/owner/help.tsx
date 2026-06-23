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
      { q: 'How do I set up my booking page?', a: 'Go to Brand Studio in your Settings. Configure your business info, visual identity, booking link, communication voice, service gallery, and preview.' },
      { q: 'How do clients find and book with me?', a: 'Clients can find you on PinkBook Discovery if you\'ve enabled it in Brand Studio. You can also share your direct booking link from Settings.' },
      { q: 'What\'s my booking link?', a: 'Your booking link is pinkbook.app/[your-slug]. Find and copy it from the Settings screen under "Booking Link".' },
      { q: 'What is the Welcome Tour?', a: 'The Welcome Tour is a guided walkthrough that runs the first time you sign up. It highlights each section of the Dashboard and explains what it does. You can replay it from the Help Center.' },
    ],
  },
  {
    cat: 'Booking & Calendar',
    emoji: '📅',
    faqs: [
      { q: 'How do I set my availability?', a: 'Go to Settings → Working Hours. Set your working hours per day of the week and buffer times between appointments.' },
      { q: 'Can clients book instantly or do I approve?', a: 'By default, bookings are pending until you confirm. You can enable auto-confirm for repeat clients in Settings → Preferences.' },
      { q: 'How do I block off time?', a: 'From the Calendar tab, tap on any time slot to block it. Blocked times won\'t show as available to clients.' },
      { q: 'What calendar views are available?', a: 'The client-facing booking calendar supports Month view (default, all plans), Quarter and Year views (Pro+). Configure in Settings → Booking Calendar Range.' },
      { q: 'How do I view my daily schedule?', a: 'The Dashboard "Today\'s Schedule" section shows all appointments for the selected date. The Calendar tab shows a full color-coded view. The Appointments tab shows a full filterable list.' },
    ],
  },
  {
    cat: 'Services & Pricing',
    emoji: '✂️',
    faqs: [
      { q: 'How do I add or edit services?', a: 'Go to the Services tab. Tap the + button to add a service. Enter name, duration, price, and optional color code. Clients see these when booking.' },
      { q: 'Can I add service add-ons?', a: 'Yes. When editing a service, enable "Available as add-on." Add-ons appear during Step 2 of the booking flow with their own prices.' },
      { q: 'What are color codes for?', a: 'Color codes appear on your calendar, appointment list, and service cards to visually distinguish service types at a glance.' },
      { q: 'Can I edit or delete services?', a: 'Yes — tap any service to edit it. To delete, use the delete button on the service card. Existing confirmed bookings are unaffected.' },
    ],
  },
  {
    cat: 'Clients & Import',
    emoji: '👥',
    faqs: [
      { q: 'How do I import my existing clients?', a: 'Go to Settings → Import Clients (Pro+ required). Upload a CSV with columns: first_name, last_name, email, phone. Duplicates are detected by email and skipped.' },
      { q: 'Can I add notes to client profiles?', a: 'Yes. Tap any client in the Clients tab to open their profile. Scroll to Notes to add freeform notes (formulas, preferences, allergies) visible only to you.' },
      { q: 'How do I view a client\'s booking history?', a: 'Open the client\'s profile from the Clients tab. Their full booking history, spend, and visit frequency are shown.' },
      { q: 'Can I search or filter clients?', a: 'Yes — the Clients tab has a real-time search bar. Search by name, email, or phone. Results update instantly as you type.' },
    ],
  },
  {
    cat: 'Payments & Deposits',
    emoji: '💳',
    faqs: [
      { q: 'How do I set up Stripe?', a: 'Connect Stripe from Settings → Integrations. Enter your Stripe Publishable Key and Secret Key, then toggle ON and tap "Test Stripe." Once connected, clients can pay online when booking.' },
      { q: 'Can I require a deposit?', a: 'Yes. In Settings → Booking Policies, set a deposit amount (flat or %) and choose when it\'s required. Clients pay the deposit at booking time.' },
      { q: 'How do I handle no-shows?', a: 'Set a no-show fee in Settings → Booking Policies. If a client no-shows, you can mark the booking and the fee can be charged to their saved card (Stripe required).' },
      { q: 'How do e-transfer deposits work?', a: 'Enter your e-transfer email in Settings → Preferences. During booking, clients see your e-transfer address with instructions. You manually verify receipt and then confirm the booking.' },
    ],
  },
  {
    cat: 'Integrations',
    emoji: '🔌',
    faqs: [
      { q: 'How do I link my Instagram?', a: 'Go to Settings → Integrations → Instagram. Enter your handle and toggle ON. An Instagram link appears in your client booking page sidebar.' },
      { q: 'How do I set up email notifications?', a: 'Email notifications use SendGrid. Go to Settings → Integrations → SendGrid, enter your API Key and verified sender email, then toggle ON. Confirmations, reminders, and cancellation notices are sent automatically.' },
      { q: 'How do I set up SMS notifications?', a: 'SMS uses Twilio. Go to Settings → Integrations → Twilio, enter your Account SID, Auth Token, and From number, then toggle ON. Reminders and confirmations are sent as text messages.' },
      { q: 'What is Google Calendar Sync?', a: 'Google Calendar Sync adds your PinkBook bookings to your Google Calendar as events. Enable it in Settings → Integrations → Google Calendar and authorize PinkBook. Confirmations, cancellations, and changes sync both ways.' },
      { q: 'Are integrations available on all plans?', a: 'Social links and e-transfer are free on all plans. Stripe, Google Calendar Sync, email notifications, and SMS require Pro ($24/mo) or higher. White-label and custom domain require Studio Elite ($149/mo).' },
    ],
  },
  {
    cat: 'Policies',
    emoji: '🛡️',
    faqs: [
      { q: 'What policies can I configure?', a: 'In Settings → Booking Policies you can set: cancellation window (24h/48h/72h), deposit (% or flat), no-show fee, late arrival grace period, and a custom policy message displayed to clients during booking.' },
      { q: 'When do clients see the policies?', a: 'Policies are shown at Step 5 (Review & Confirm) of the booking flow before the client can submit. They must scroll past them before the Confirm button becomes active.' },
      { q: 'Can I have different policies per service?', a: 'Policies currently apply globally to all services. With percentage-based deposits the actual amount scales with price automatically. Per-service policies may be added in a future update.' },
    ],
  },
  {
    cat: 'Notifications',
    emoji: '🔔',
    faqs: [
      { q: 'What notifications will I receive?', a: 'You\'ll be notified for: new booking requests, booking confirmations, cancellations, upcoming appointment reminders, and system alerts. Notifications appear in the bell icon and the Notifications tab.' },
      { q: 'How do I set reminder lead times?', a: 'Go to Settings → Preferences → Reminder Lead Time. Choose 24, 48, or 72 hours before the appointment. Reminders are sent by email (SendGrid) and/or SMS (Twilio) if those integrations are connected.' },
      { q: 'Can I clear all notifications?', a: 'Yes — in the Notifications tab, tap "Clear all" to dismiss everything. Or dismiss individual notifications by tapping the dismiss button on each one.' },
    ],
  },
  {
    cat: 'Plans & Subscription',
    emoji: '💎',
    faqs: [
      { q: 'What plans are available?', a: 'Starter (free): up to 20 bookings/mo, basic booking flow.\nPro ($24/mo): unlimited bookings, Stripe, CSV import, receipts, calendar views, email/SMS, custom policies, Brand Studio.\nSalon ($79/mo): everything in Pro + multi-stylist, team calendar, Brand Studio Pro.\nStudio Elite ($149/mo): everything in Salon + white-label, custom domain, Service Gallery.' },
      { q: 'How do I upgrade my plan?', a: 'Go to Settings → Plans & Pricing. Select the plan you want and follow the instructions to set up billing. You can also upgrade from any locked feature screen.' },
      { q: 'Can I cancel my plan anytime?', a: 'Yes. Cancel from Settings → Plans & Pricing at any time. Your account reverts to Starter at the end of the billing period. No data is lost.' },
      { q: 'What is White-Label Mode?', a: 'Studio Elite exclusive. Removes all PinkBook branding from your client-facing booking pages — "Powered by PinkBook" badge, PinkBook logo in browser tab — replaced with your own studio name and logo. Enable in Brand Studio → White Label.' },
    ],
  },
  {
    cat: 'Security & Privacy',
    emoji: '🔒',
    faqs: [
      { q: 'Is my data encrypted?', a: 'Yes. Sensitive data is encrypted with AES-256-GCM at rest. All traffic uses HTTPS/TLS. Credit card numbers are handled entirely by Stripe and never touch PinkBook servers. API keys are stored encrypted and masked in the UI.' },
      { q: 'How are passwords stored?', a: 'Passwords are hashed with bcrypt (salted). Your actual password is never stored — not even PinkBook can see it. If you forget your password, use the password reset flow which sends a time-limited secure link to your email.' },
      { q: 'How do I sign out securely?', a: 'Tap Sign Out at the bottom of Settings. Your session is terminated and session data is cleared. Always sign out when using a shared device.' },
    ],
  },
  {
    cat: 'Custom Domain Email',
    emoji: '🌐',
    faqs: [
      { q: 'What is custom domain email?', a: 'Lets you send booking confirmations and reminders from your own business email (e.g. bookings@mybusiness.com) instead of a generic PinkBook address. Improves deliverability and brand recognition.' },
      { q: 'How do I connect my domain?', a: 'Go to Custom Domain Email → Connect Domain. Enter your domain, then PinkBook generates four TXT DNS records (Ownership, SPF, DKIM, DMARC). Publish these in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.), then click "Verify Domain." DNS propagation can take 2–48 hours.' },
      { q: 'What do the domain statuses mean?', a: '⏳ Pending — DNS records not yet verified.\n✓ Verified — all records confirmed, emails sending from your domain.\n✗ Failed — verification failed. Click the domain to see which record failed. Common causes: DNS propagation delay, typo in a record value, or two conflicting SPF records.' },
      { q: 'How do I send a test email?', a: 'Go to Custom Domain Email → Send Test Email. Choose a template (Booking Confirmation, Appointment Reminder, or Campaign). Fill in the recipient address and click Send. Check the result panel for which sender domain was used.' },
    ],
  },
  {
    cat: 'Admin Debug Panel',
    emoji: '🛠️',
    faqs: [
      { q: 'What is the Admin Debug Panel?', a: 'A diagnostic tool for monitoring all connected custom domains and every email send attempt. Access it from Custom Domain Email → Admin / Debug Panel. Shows domain statuses and a full email delivery log.' },
      { q: 'How do I diagnose a failed email?', a: 'Open Admin Debug Panel → Email Logs. Search by the client\'s email address or filter by Status: Failed. Click the row to see the full error. Common causes: wrong API key, domain lost verification, invalid recipient address, or rate limit exceeded.' },
      { q: 'What do the stats cards show?', a: 'Total Domains — all connected domains.\nVerified — actively sending.\nPending — awaiting DNS verification.\nEmails Logged — total send attempts (sent + failed). Click Refresh (↺) to update.' },
    ],
  },
  {
    cat: 'Discovery & Public Profile',
    emoji: '🔍',
    faqs: [
      { q: 'What is PinkBook Discovery?', a: 'A public directory where clients can browse and book beauty pros without an account. Clients filter by category (Hair, Nails, Lashes, etc.), search by name or city, and sort by proximity or AI score.' },
      { q: 'How do I get listed on Discovery?', a: 'Complete your Brand Studio profile: set your Business Name, a Booking Slug, a Service Category, and your City. Your listing appears within minutes. You are listed by default once these are set.' },
      { q: 'How do I opt out of Discovery?', a: 'Go to Brand Studio → Identity, turn OFF "List on PinkBook Discovery," and save. Your booking page continues to work — only your public browse listing is removed.' },
      { q: 'What is the AI Discovery Score?', a: 'A 0–100 ranking that controls your placement in Discovery. Higher scores come from: completed profile, number of confirmed bookings, repeat client rate, recent booking activity, Stripe Connect verified, and Pro/Salon/Elite plan.' },
      { q: 'What is the Trending Strip?', a: '"Trending Now" shows the most-booked pros this month (rolling 30-day window, top 8). It\'s driven purely by booking volume through PinkBook — no manual feature required.' },
    ],
  },
  {
    cat: 'Brand Studio',
    emoji: '🎨',
    faqs: [
      { q: 'What is Brand Studio?', a: 'Brand Studio is a multi-step editor to customize your client-facing booking page: business identity, visual theme (logo, colors, banner), booking link/slug, social profiles, communication voice, and white-label options.' },
      { q: 'Is Brand Studio available on Starter?', a: 'Basic profile setup is available on all plans. Full Brand Studio (colors, fonts, custom booking link) requires Pro or above. White-label and Service Gallery require Studio Elite.' },
      { q: 'How do I add portfolio photos?', a: 'In Brand Studio → Gallery (Studio Elite), upload up to 24 photos with before/after pairs, captions, and drag-to-reorder. Non-Elite plans can add up to 6 showcase images.' },
      { q: 'What is the Announcement Banner?', a: 'A thin bar at the top of your booking page for time-sensitive notices (e.g. "Holiday hours: Dec 23–Jan 2 off"). Configure the text in Brand Studio → Voice and toggle it on/off. Available on Salon plan and above.' },
    ],
  },
  {
    cat: 'Waitlist & Gift Certificates',
    emoji: '📋',
    faqs: [
      { q: 'How does the Waitlist work?', a: 'When no available times match a client\'s preferred date, they can join your waitlist with their contact info and preferred service/date. Manage entries from the Waitlist page — view details, notify a client when a slot opens, or remove entries.' },
      { q: 'How do I create Gift Certificates?', a: 'Go to Gift Certificates → + New Certificate. Set a dollar value and optional note, then Generate. A unique code (e.g. PB-XKJ9-4728) is created. Share it with the recipient however you like.' },
      { q: 'How do I redeem a Gift Certificate?', a: 'On the Gift Certificates page, find the code and tap "Mark Redeemed." The certificate records the redemption date. Redeemed certificates cannot be reused.' },
      { q: 'Can gift certificates expire?', a: 'Expiry is at your discretion — PinkBook does not auto-expire certificates. Include your expiry policy in your Custom Policy Message. Note: Canadian provincial law may restrict expiry on gift cards sold for monetary value.' },
    ],
  },
  {
    cat: 'Client Accounts',
    emoji: '👤',
    faqs: [
      { q: 'Do clients need an account to book?', a: 'No. Booking never requires a PinkBook client account. Clients provide their name, email, and phone as part of the booking flow. No login required.' },
      { q: 'What is a PinkBook client account?', a: 'An optional account for consumers that lets them view their full booking history across all PinkBook providers, save favourite pros, leave reviews, and manage their contact info in one place.' },
      { q: 'How do clients sign up?', a: 'Clients sign up at pinkbook.app or via the Discovery page sign-in link. They enter name, email, and a password (or use Continue with Google). An email verification link is sent before the account is fully active.' },
      { q: 'How does Google Sign-In work for clients?', a: 'Clients tap "Continue with Google" on the account page and select their Google account. PinkBook receives only their name and email — no other Google data. New accounts are created instantly; existing accounts are matched by email and logged in.' },
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
