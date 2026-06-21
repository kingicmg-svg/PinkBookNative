'use strict';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const CHANNELS = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'sms',   label: 'SMS',   icon: '💬' },
  { key: 'both',  label: 'Both',  icon: '📨' },
];

const AUDIENCES = [
  { key: 'all',          label: 'All Clients',       desc: 'Everyone who has booked with you' },
  { key: 'inactive',     label: 'Inactive Clients',  desc: 'No booking in the last 60 days' },
  { key: 'new_clients',  label: 'New Clients',        desc: 'First booking in the last 30 days' },
];

const STATUS_COLORS: Record<string, string> = {
  draft:     Colors.soft,
  scheduled: Colors.gold,
  sent:      Colors.success,
  failed:    Colors.error,
};

// ─── Create Campaign Modal ────────────────────────────────────────────────────

function CreateModal({ onSave, onClose }: { onSave: (body: any) => Promise<void>; onClose: () => void }) {
  const [name, setName]         = useState('');
  const [channel, setChannel]   = useState('email');
  const [audience, setAudience] = useState('all');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [saving, setSaving]     = useState(false);

  const save = async (send: boolean) => {
    if (!name.trim()) { Alert.alert('Required', 'Enter a campaign name.'); return; }
    if (!body.trim())  { Alert.alert('Required', 'Enter a message body.'); return; }
    if (channel !== 'sms' && !subject.trim()) { Alert.alert('Required', 'Enter an email subject.'); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), channel, audience, subject: subject.trim() || undefined, body: body.trim() });
      if (send) Alert.alert('Sent!', 'Your campaign has been sent to clients.');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>New Campaign</Text>
          <TouchableOpacity onPress={() => save(false)} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.rose} /> : <Text style={m.save}>Save Draft</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={m.label}>Campaign Name *</Text>
          <TextInput style={m.input} value={name} onChangeText={setName} placeholder="e.g. Summer Promo" placeholderTextColor={Colors.soft} />

          <Text style={m.label}>Channel</Text>
          <View style={m.segRow}>
            {CHANNELS.map(c => (
              <TouchableOpacity key={c.key} style={[m.seg, channel === c.key && m.segActive]} onPress={() => setChannel(c.key)}>
                <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                <Text style={[m.segTxt, channel === c.key && m.segTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={m.label}>Audience</Text>
          {AUDIENCES.map(a => (
            <TouchableOpacity key={a.key} style={[m.audienceBtn, audience === a.key && m.audienceBtnActive]} onPress={() => setAudience(a.key)}>
              <View style={m.audienceRow}>
                <View style={[m.radio, audience === a.key && m.radioActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[m.audienceLabel, audience === a.key && { color: Colors.rose }]}>{a.label}</Text>
                  <Text style={m.audienceDesc}>{a.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {channel !== 'sms' && (
            <>
              <Text style={m.label}>Email Subject *</Text>
              <TextInput style={m.input} value={subject} onChangeText={setSubject} placeholder="e.g. ☀️ Summer special just for you!" placeholderTextColor={Colors.soft} />
            </>
          )}

          <Text style={m.label}>Message Body *</Text>
          <TextInput
            style={[m.input, { minHeight: 160 }]}
            value={body}
            onChangeText={setBody}
            placeholder={channel === 'sms' ? "Hi {name}! We have a special offer just for you. Book now at pinkbook.app" : "Hi {name},\n\nWe wanted to reach out with something special..."}
            placeholderTextColor={Colors.soft}
            multiline
          />
          <Text style={m.hint}>Use {'{name}'} to personalize with the client's name.</Text>

          <TouchableOpacity style={m.sendBtn} onPress={() => {
            Alert.alert('Send Now?', 'This will send the campaign immediately to all matching clients.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send Now', onPress: () => save(true) },
            ]);
          }} disabled={saving}>
            <Ionicons name="send-outline" size={16} color={Colors.white} />
            <Text style={m.sendBtnTxt}>Send Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CampaignsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sending, setSending]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await OwnerApi.listCampaigns(token);
      setCampaigns(res.campaigns || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load campaigns');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const deleteCampaign = (id: string) => {
    Alert.alert('Delete Campaign', 'Delete this draft campaign?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await OwnerApi.deleteCampaign(token!, id); setCampaigns(c => c.filter(x => x.id !== id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const sendCampaign = async (id: string) => {
    Alert.alert('Send Campaign', 'Send this campaign now to all matching clients?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSending(id);
        try {
          const res = await OwnerApi.sendCampaign(token!, id);
          Alert.alert('Sent!', `Campaign delivered to ${res.sent || 0} clients.`);
          load();
        } catch (e: any) {
          Alert.alert('Error', e.message);
        } finally {
          setSending(null);
        }
      }},
    ]);
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.charcoal} /></TouchableOpacity>
        <Text style={s.pageTitle}>Campaigns</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Explainer */}
        <View style={s.heroBanner}>
          <Text style={s.heroEmoji}>📣</Text>
          <Text style={s.heroTitle}>Email & SMS Campaigns</Text>
          <Text style={s.heroSub}>Send targeted messages to all your clients, inactive clients, or new clients. Re-engage and grow bookings.</Text>
        </View>

        {campaigns.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>✉️</Text>
            <Text style={s.emptyTitle}>No Campaigns Yet</Text>
            <Text style={s.emptySub}>Create your first campaign to send a message to your clients.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={s.emptyBtnTxt}>+ Create First Campaign</Text>
            </TouchableOpacity>
          </View>
        ) : (
          campaigns.map(c => {
            const color = STATUS_COLORS[c.status] || Colors.soft;
            const channelIcon = CHANNELS.find(ch => ch.key === c.channel)?.icon || '📧';
            return (
              <View key={c.id} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.campaignIcon}>{channelIcon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.campaignName}>{c.name}</Text>
                    <Text style={s.campaignMeta}>
                      {AUDIENCES.find(a => a.key === c.audience)?.label || c.audience}
                      {c.sent_at ? '  ·  Sent ' + new Date(c.sent_at).toLocaleDateString() : ''}
                      {c.recipient_count ? `  ·  ${c.recipient_count} recipients` : ''}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[s.statusTxt, { color }]}>{c.status}</Text>
                  </View>
                </View>
                {c.subject && <Text style={s.campaignSubject} numberOfLines={1}>📧 {c.subject}</Text>}
                <Text style={s.campaignBody} numberOfLines={2}>{c.body}</Text>
                {c.status === 'draft' && (
                  <View style={s.cardActions}>
                    <TouchableOpacity
                      style={s.sendBtn}
                      onPress={() => sendCampaign(c.id)}
                      disabled={sending === c.id}
                    >
                      {sending === c.id
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <><Ionicons name="send-outline" size={14} color={Colors.white} /><Text style={s.sendBtnTxt}>Send Now</Text></>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => deleteCampaign(c.id)}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showCreate && (
        <CreateModal
          onSave={async (body) => { const res = await OwnerApi.createCampaign(token!, body); setCampaigns(c => [res.campaign, ...c]); }}
          onClose={() => { setShowCreate(false); load(); }}
        />
      )}
    </View>
  );
}

const m = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.white },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:        { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  cancel:       { fontSize: 15, color: Colors.soft },
  save:         { fontSize: 15, color: Colors.rose, fontWeight: '800' },
  label:        { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  input:        { backgroundColor: Colors.cream, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  hint:         { fontSize: 11, color: Colors.soft, marginTop: -8 },
  segRow:       { flexDirection: 'row', gap: 8 },
  seg:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  segActive:    { backgroundColor: Colors.rose, borderColor: Colors.rose },
  segTxt:       { fontSize: 12, fontWeight: '700', color: Colors.soft },
  segTxtActive: { color: Colors.white },
  audienceBtn:  { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12 },
  audienceBtnActive: { borderColor: Colors.rose, backgroundColor: Colors.pinkLight },
  audienceRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  radioActive:  { borderColor: Colors.rose, backgroundColor: Colors.rose },
  audienceLabel:{ fontSize: 14, fontWeight: '800', color: Colors.charcoal },
  audienceDesc: { fontSize: 11, color: Colors.soft, marginTop: 1 },
  sendBtn:      { backgroundColor: Colors.rose, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  sendBtnTxt:   { color: Colors.white, fontWeight: '800', fontSize: 14 },
});

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle:    { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  addBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.rose, alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 16, gap: 12 },
  heroBanner:   { backgroundColor: Colors.charcoal, borderRadius: 18, padding: 20, alignItems: 'center', gap: 6, marginBottom: 4 },
  heroEmoji:    { fontSize: 32 },
  heroTitle:    { fontSize: 18, fontWeight: '900', color: Colors.white, fontFamily: 'Georgia' },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  emptyBox:     { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji:   { fontSize: 48 },
  emptyTitle:   { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  emptySub:     { fontSize: 14, color: Colors.soft, textAlign: 'center' },
  emptyBtn:     { backgroundColor: Colors.rose, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  emptyBtnTxt:  { color: Colors.white, fontWeight: '800', fontSize: 14 },
  card:         { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  campaignIcon: { fontSize: 22, marginTop: 2 },
  campaignName: { fontSize: 15, fontWeight: '800', color: Colors.charcoal },
  campaignMeta: { fontSize: 11, color: Colors.soft, marginTop: 1 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusTxt:    { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  campaignSubject:{ fontSize: 12, color: Colors.mid, fontStyle: 'italic' },
  campaignBody: { fontSize: 13, color: Colors.soft, lineHeight: 18 },
  cardActions:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  sendBtn:      { flex: 1, backgroundColor: Colors.rose, borderRadius: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sendBtnTxt:   { color: Colors.white, fontWeight: '800', fontSize: 13 },
  deleteBtn:    { padding: 8 },
});
