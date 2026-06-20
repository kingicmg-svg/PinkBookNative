import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

const TABS = ['Terms of Service', 'Privacy Policy'];

const TERMS = `Last updated: January 2026

1. ACCEPTANCE OF TERMS
By accessing or using PinkBook, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.

2. DESCRIPTION OF SERVICE
PinkBook is a booking and business management platform for beauty professionals. We provide tools for scheduling, client management, payments, and discovery.

3. BUSINESS ACCOUNTS
Business owners who register are responsible for all activity under their account. You must provide accurate information and maintain the security of your login credentials.

4. BOOKING & CANCELLATIONS
Booking policies (cancellation windows, deposits, no-show fees) are set by each individual business. PinkBook is not responsible for disputes between clients and service providers.

5. PAYMENTS
PinkBook facilitates payments through Stripe and e-transfer. PinkBook does not store full card numbers. Stripe's terms apply to all card transactions.

6. DISCOVERY LISTING
When you enable Discovery in Brand Studio, your business profile becomes publicly visible on PinkBook's discover feed. You can disable this at any time.

7. INTELLECTUAL PROPERTY
PinkBook and its original content are the exclusive property of PinkBook Inc. User-uploaded content (logos, photos) remains owned by the uploader.

8. PROHIBITED CONDUCT
You may not use PinkBook for fraudulent purposes, to harass clients, to spam, or to violate any applicable laws.

9. LIMITATION OF LIABILITY
PinkBook is provided "as is". We are not liable for indirect, incidental, or consequential damages arising from your use of the platform.

10. TERMINATION
We reserve the right to terminate accounts that violate these Terms.

11. CHANGES TO TERMS
We may update these Terms at any time. Continued use after updates constitutes acceptance of the new Terms.

12. CONTACT
Questions? Email us at legal@pinkbook.app`;

const PRIVACY = `Last updated: January 2026

1. INFORMATION WE COLLECT
We collect information you provide (name, email, business details), usage data (pages visited, features used), and technical data (device type, IP address for security).

2. HOW WE USE YOUR INFORMATION
We use your data to provide and improve PinkBook services, send transactional emails (booking confirmations, reminders), and for security and fraud prevention.

3. DATA SHARING
We do not sell your personal data. We share data only with:
• Stripe (payment processing)
• Twilio (SMS reminders)  
• SendGrid (email delivery)
• Firebase (authentication)
All partners are bound by their own privacy policies.

4. CLIENT DATA
Business owners are data controllers for their client data. Clients can request deletion of their data by contacting the business or emailing privacy@pinkbook.app.

5. COOKIES & TRACKING
PinkBook uses essential cookies for authentication and session management. No third-party advertising cookies are used.

6. DATA SECURITY
We use industry-standard encryption (TLS, bcrypt, JWT) to protect your data. We conduct regular security audits.

7. DATA RETENTION
Active account data is retained as long as your account exists. After account deletion, most data is removed within 30 days.

8. YOUR RIGHTS
You have the right to access, correct, or delete your personal data. Contact privacy@pinkbook.app to exercise these rights.

9. CHILDREN
PinkBook is not intended for users under 13. We do not knowingly collect data from children.

10. CONTACT
Privacy Officer: privacy@pinkbook.app
PinkBook Inc., Toronto, Ontario, Canada`;

export default function PoliciesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Legal</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.body}>{tab === 0 ? TERMS : PRIVACY}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.cream },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:       { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:      { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  tabs:       { flexDirection: 'row', backgroundColor: Colors.pinkLight + '60', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:        { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:  { borderBottomWidth: 2, borderBottomColor: Colors.rose },
  tabTxt:     { fontSize: 13, fontWeight: '600', color: Colors.soft },
  tabTxtActive:{ color: Colors.rose, fontWeight: '800' },
  scroll:     { padding: 20 },
  body:       { fontSize: 13, color: Colors.mid, lineHeight: 22 },
});
