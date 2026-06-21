import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const D = {
  bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520',
  pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', textMuted:'#5C4A52',
  border:'rgba(212,65,122,0.15)', white:'#FFFFFF', gold:'#C9A96E', success:'#1A9E4A',
};

const FAQS = [
  { q: 'How do I reschedule or cancel my booking?', a: 'Open your booking from the Bookings tab and tap "Manage". You can cancel directly from there. Rescheduling requires contacting the stylist.' },
  { q: 'Can I book without creating an account?', a: 'Yes — you can book as a guest. Creating an account lets you track bookings, earn loyalty stamps, save favourite stylists, and leave reviews.' },
  { q: 'How does the loyalty program work?', a: 'Each stylist sets their own loyalty program. You earn stamps automatically each time you complete a booking. When you hit the target, your reward is unlocked.' },
  { q: 'Are my reviews verified?', a: 'Yes. PinkBook uses AI to verify that every review comes from a real booking before publishing. This protects pro reputations from fake reviews.' },
  { q: 'Can I save stylists I like?', a: 'Yes — tap the ♡ heart on any stylist card in Discover to save them to your Saved tab for quick re-booking.' },
  { q: 'How do I pay for my appointment?', a: 'Deposits (if required by the stylist) are collected through the booking flow via Stripe. Remaining balance is paid at the appointment.' },
  { q: 'What if a stylist cancels on me?', a: 'You will receive an email/push notification. Any deposit collected is refunded per the stylist\'s cancellation policy.' },
  { q: 'I didn\'t get a confirmation email — what do I do?', a: 'Check your spam folder first. If it\'s not there, contact us at hello@pinkbook.app and we\'ll look into it.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[s.faq, open && s.faqOpen]}
      onPress={() => { setOpen(!open); Haptics.selectionAsync(); }}
      activeOpacity={0.85}
    >
      <View style={s.faqHeader}>
        <Text style={s.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={D.textMuted} />
      </View>
      {open && <Text style={s.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Linking.openURL(`mailto:hello@pinkbook.app?subject=PinkBook Client Support&body=${encodeURIComponent(message)}`);
    setSending(false);
    setMessage('');
    Alert.alert('Opening email', 'Your email app will open with your message pre-filled.');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={D.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Quick contact */}
        <View style={s.contactRow}>
          <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL('mailto:hello@pinkbook.app')}>
            <Ionicons name="mail-outline" size={22} color={D.pink} />
            <Text style={s.contactBtnTxt}>Email Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL('https://pinkbook.app')}>
            <Ionicons name="globe-outline" size={22} color={D.pink} />
            <Text style={s.contactBtnTxt}>Website</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL('https://instagram.com/pinkbook.app')}>
            <Ionicons name="logo-instagram" size={22} color={D.pink} />
            <Text style={s.contactBtnTxt}>Instagram</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={s.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        {FAQS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}

        {/* Send message */}
        <Text style={s.sectionLabel}>SEND US A MESSAGE</Text>
        <View style={s.messageCard}>
          <Text style={s.messageHint}>Describe your issue and we'll get back to you within 24 hours.</Text>
          <TextInput
            style={s.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="What can we help you with?"
            placeholderTextColor={D.textMuted}
            multiline
            maxLength={800}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!message.trim() || sending) && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!message.trim() || sending}
          >
            {sending ? <ActivityIndicator color={D.white} size="small" /> : (
              <>
                <Ionicons name="send" size={16} color={D.white} />
                <Text style={s.sendBtnTxt}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerTxt}>PinkBook v1.0 · Made with 💅 for beauty professionals</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://pinkbook.app/privacy')}>
            <Text style={s.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: D.bgBase },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border, gap: 12 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212,65,122,0.1)', alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 18, fontWeight: '900', color: D.textPrimary, fontFamily: 'Georgia' },
  scroll:        { padding: 20, gap: 16 },
  contactRow:    { flexDirection: 'row', gap: 10 },
  contactBtn:    { flex: 1, backgroundColor: D.bgCard, borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: D.border },
  contactBtnTxt: { fontSize: 11, fontWeight: '700', color: D.textSec },
  sectionLabel:  { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 1.2 },
  faq:           { backgroundColor: D.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: D.border },
  faqOpen:       { borderColor: 'rgba(212,65,122,0.35)' },
  faqHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  faqQ:          { flex: 1, fontSize: 14, fontWeight: '700', color: D.textPrimary, lineHeight: 20 },
  faqA:          { fontSize: 13, color: D.textSec, lineHeight: 20, marginTop: 10 },
  messageCard:   { backgroundColor: D.bgCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: D.border, gap: 12 },
  messageHint:   { fontSize: 12, color: D.textMuted },
  messageInput:  { backgroundColor: D.bgBase, borderRadius: 12, padding: 14, color: D.textPrimary, fontSize: 14, minHeight: 110, borderWidth: 1, borderColor: D.border },
  sendBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: D.pink, borderRadius: 12, paddingVertical: 13 },
  sendBtnTxt:    { color: D.white, fontWeight: '800', fontSize: 14 },
  footer:        { alignItems: 'center', gap: 8, marginTop: 8 },
  footerTxt:     { fontSize: 11, color: D.textMuted },
  footerLink:    { fontSize: 11, color: D.pink, fontWeight: '600' },
});
