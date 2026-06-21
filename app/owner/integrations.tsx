'use strict';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi, API_URL } from '../services/ApiService';
import Colors from '../../constants/Colors';

function Row({ icon, title, sub, onPress, badge }: { icon: string; title: string; sub: string; onPress: () => void; badge?: string }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={s.rowIcon}><Text style={{ fontSize: 20 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.rowTitle}>{title}</Text>
          {!!badge && <View style={s.badge}><Text style={s.badgeTxt}>{badge}</Text></View>}
        </View>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.soft} />
    </TouchableOpacity>
  );
}

function Section({ title }: { title: string }) {
  return <Text style={s.section}>{title}</Text>;
}

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [calendarUrl, setCalendarUrl] = useState('');
  const [loading, setLoading]         = useState(true);
  const [tier, setTier]               = useState('starter');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const stRes = await SettingsApi.get(token);
      const st = (stRes as any)?.settings || {};
      const meRes = await OwnerApi.me(token).catch(() => ({ user: null }));
      const u = meRes.user || {};
      setTier(u?.subscription_tier || u?.tier || st?.subscriptionTier || st?.subscription_tier || 'starter');
      setCalendarUrl(OwnerApi.calendarExport(token));
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const isPro = ['pro', 'salon', 'studio_elite', 'owner'].includes(tier);

  const copyCalUrl = async () => {
    if (!calendarUrl) return;
    try { await Clipboard.setString(calendarUrl); Alert.alert('Copied!', 'Calendar URL copied. Paste it into Google Calendar, Apple Calendar, or any ICS-compatible app.'); }
    catch { await Share.share({ message: calendarUrl }); }
  };

  const openUrl = async (url: string) => {
    try { await WebBrowser.openBrowserAsync(url); }
    catch { Linking.openURL(url); }
  };

  const proGate = (feature: string) => {
    if (!isPro) {
      Alert.alert('Pro Feature', `${feature} is available on the Pro plan and above. Upgrade to unlock integrations.`);
      return false;
    }
    return true;
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.charcoal} /></TouchableOpacity>
        <Text style={s.pageTitle}>Integrations</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Calendar */}
        <Section title="📅 Calendar" />
        <View style={s.group}>
          <Row
            icon="🍎"
            title="Apple Calendar"
            sub="Subscribe to your bookings in Apple Calendar (ICS)"
            badge={!isPro ? 'Pro' : undefined}
            onPress={() => {
              if (!proGate('Calendar export')) return;
              Alert.alert(
                'Subscribe to Calendar',
                'Copy your calendar URL and add it as a subscription in Apple Calendar:\n\nFile → New Calendar Subscription → paste the URL.',
                [{ text: 'Copy URL', onPress: copyCalUrl }, { text: 'Cancel', style: 'cancel' }],
              );
            }}
          />
          <Row
            icon="🗓"
            title="Google Calendar"
            sub="Subscribe via ICS URL — works in Google Calendar"
            badge={!isPro ? 'Pro' : undefined}
            onPress={() => {
              if (!proGate('Calendar export')) return;
              Alert.alert(
                'Add to Google Calendar',
                'Copy your ICS URL and paste it into Google Calendar:\n\nOther Calendars → + → From URL.',
                [{ text: 'Copy URL', onPress: copyCalUrl }, { text: 'Open Google Cal', onPress: () => openUrl('https://calendar.google.com') }, { text: 'Cancel', style: 'cancel' }],
              );
            }}
          />
          <Row
            icon="📋"
            title="Outlook / Other"
            sub="ICS subscription URL — works with any calendar app"
            badge={!isPro ? 'Pro' : undefined}
            onPress={() => {
              if (!proGate('Calendar export')) return;
              copyCalUrl();
            }}
          />
        </View>

        {/* Payments */}
        <Section title="💳 Payments" />
        <View style={s.group}>
          <Row
            icon="🦓"
            title="Stripe Connect"
            sub="Accept deposits and card payments from clients"
            onPress={() => {
              Alert.alert('Stripe Connect', 'Set up Stripe Connect to accept client payments.\n\nGo to Settings → Plans & Billing → Stripe Connect.', [
                { text: 'Go to Settings', onPress: () => router.push('/(owner-tabs)/settings') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
        </View>

        {/* Social */}
        <Section title="📱 Social & Marketing" />
        <View style={s.group}>
          <Row
            icon="📸"
            title="Instagram Link in Bio"
            sub="Get a ready-to-paste booking link for your Instagram bio"
            onPress={() => router.push('/(owner-tabs)/dashboard')}
          />
          <Row
            icon="🔗"
            title="Website Booking Widget"
            sub="Embed a Book Now button on your website"
            onPress={() => router.push('/(owner-tabs)/dashboard')}
          />
          <Row
            icon="📲"
            title="QR Code Download"
            sub="Display your booking QR at your salon or in print materials"
            onPress={() => router.push('/(owner-tabs)/dashboard')}
          />
        </View>

        {/* Analytics */}
        <Section title="📊 Analytics & Reporting" />
        <View style={s.group}>
          <Row
            icon="📈"
            title="Revenue & Bookings Report"
            sub="View your analytics in the Finances tab"
            onPress={() => router.push('/(owner-tabs)/finances')}
          />
          <Row
            icon="🔄"
            title="Client Retention"
            sub="See how many clients return vs. one-time visits"
            badge={!isPro ? 'Pro' : undefined}
            onPress={() => {
              if (!proGate('Retention analytics')) return;
              router.push('/(owner-tabs)/finances');
            }}
          />
        </View>

        {/* Notifications & Comms */}
        <Section title="🔔 Notifications & Communication" />
        <View style={s.group}>
          <Row
            icon="📧"
            title="Email Notifications"
            sub="Configure booking confirmations, reminders, and cancellation emails"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') { Alert.alert('Pro Feature', 'Email notifications require the Pro plan.'); return; }
              router.push('/owner/notifications');
            }}
          />
          <Row
            icon="💬"
            title="SMS Reminders"
            sub="Send automated text reminders to clients before their appointment"
            badge={tier === 'starter' ? 'Pro' : undefined}
            onPress={() => {
              if (tier === 'starter') { Alert.alert('Pro Feature', 'SMS notifications require the Pro plan.'); return; }
              router.push('/owner/notifications');
            }}
          />
          <Row
            icon="📣"
            title="Marketing Campaigns"
            sub="Send bulk email or SMS campaigns to your clients"
            onPress={() => router.push('/owner/campaigns')}
          />
        </View>

        {/* Third-party */}
        <Section title="🔌 Third-Party Tools" />
        <View style={s.group}>
          <Row
            icon="📊"
            title="Google Analytics"
            sub="Track your booking page visits with Google Analytics"
            badge="Elite"
            onPress={() => {
              Alert.alert('Studio Elite Feature', 'Add Google Analytics tracking to your booking page with a Studio Elite plan.');
            }}
          />
          <Row
            icon="🌐"
            title="Custom Domain"
            sub="Use your own domain for your booking page"
            badge="Elite"
            onPress={() => {
              Alert.alert('Studio Elite Feature', 'Connect a custom domain (e.g. book.yoursalon.com) with Studio Elite.');
            }}
          />
          <Row
            icon="✉️"
            title="Custom Email Domain"
            sub="Send notification emails from your own domain"
            badge="Elite"
            onPress={() => {
              Alert.alert('Studio Elite Feature', 'Send emails from your own domain with Studio Elite.');
            }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.cream },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle:  { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  scroll:     { padding: 16, gap: 4 },
  section:    { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: Colors.rose, paddingHorizontal: 4, marginTop: 20, marginBottom: 8 },
  group:      { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  rowIcon:    { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  rowTitle:   { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  rowSub:     { fontSize: 12, color: Colors.soft, marginTop: 2 },
  badge:      { backgroundColor: Colors.rose, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  badgeTxt:   { fontSize: 10, fontWeight: '800', color: Colors.white },
});
