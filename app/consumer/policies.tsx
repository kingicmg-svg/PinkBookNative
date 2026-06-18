import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const D = { bgBase:'#110A0E', bgCard:'#1A1014', bgElevated:'#221520', pink:'#D4417A', textPrimary:'#F5EEF0', textSec:'#9E8A90', border:'rgba(212,65,122,0.15)' };

const TABS = ['Client Terms', 'Privacy Policy'];
const TERMS = `Last updated: January 2026

By booking through PinkBook, you agree to the following terms as a client.

1. BOOKING & CANCELLATIONS
Each business on PinkBook sets its own cancellation and deposit policies. Please review the studio's policy before booking. Late cancellations or no-shows may result in a fee.

2. PAYMENT
Payments are processed securely through Stripe or e-transfer as specified by the business. PinkBook does not store payment credentials.

3. DISPUTES
For disputes about services received, please contact the business directly. PinkBook facilitates bookings but is not a party to the service contract between client and provider.

4. YOUR DATA
Your booking information (name, email, phone) is shared only with the business you book with. See our Privacy Policy for full details.

5. ACCOUNT
You are responsible for maintaining the security of your PinkBook account. Notify us immediately of any unauthorized access.

6. CONTACT
Questions? Email clients@pinkbook.app`;

const PRIVACY = `Last updated: January 2026

1. WHAT WE COLLECT
When you book through PinkBook, we collect: name, email, phone number, booking preferences, and service history.

2. HOW WE USE IT
We use your data to: confirm bookings, send reminders, and improve the PinkBook experience.

3. WHO SEES YOUR DATA
Your booking details are shared with the specific business you book with. We do not sell your data to advertisers.

4. REMINDERS & EMAILS
PinkBook sends booking confirmations and reminders on behalf of businesses. You can opt out of marketing emails at any time.

5. YOUR RIGHTS
You can request a copy, correction, or deletion of your data at any time by emailing privacy@pinkbook.app.

6. RETENTION
Your data is retained for as long as your account is active, plus a 90-day grace period after deletion.

7. CONTACT
privacy@pinkbook.app`;

export default function ConsumerPoliciesScreen() {
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
          <TouchableOpacity key={i} style={[s.tab, tab===i && s.tabOn]} onPress={() => setTab(i)}>
            <Text style={[s.tabTxt, tab===i && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.body}>{tab===0 ? TERMS : PRIVACY}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bgBase },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border },
  back:      { color: D.pink, fontWeight: '700', fontSize: 14, width: 60 },
  title:     { fontSize: 16, fontWeight: '800', color: D.textPrimary },
  tabs:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: D.border },
  tab:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabOn:     { borderBottomWidth: 2, borderBottomColor: D.pink },
  tabTxt:    { fontSize: 13, fontWeight: '600', color: D.textSec },
  tabTxtOn:  { color: D.pink, fontWeight: '800' },
  body:      { fontSize: 13, color: D.textSec, lineHeight: 22 },
});
