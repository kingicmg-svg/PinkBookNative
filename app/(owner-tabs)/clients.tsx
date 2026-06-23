import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import type { AppTheme } from '../../constants/Colors';

const C = Colors;
const FILTERS = ['all','vip','new','regular','sensitive','coily','curly','wavy'];

function ini(name: string) { return (name||'?').split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2); }
function fmtDate(d: string|null) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch { return d; } }

// ── Add / Edit Client Modal ────────────────────────────────────────────────
function ClientModal({ visible, client, onClose, onSave }: { visible:boolean; client:any|null; onClose:()=>void; onSave:(c:any)=>void }) {
  const T = useTheme();
  const cm = React.useMemo(() => makeModalStyles(T), [T]);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name||''); setEmail(client.contactEmail||'');
      setPhone(client.contactPhone||''); setBirthday(client.birthday||'');
      setNotes(client.notes||'');
    } else {
      setName(''); setEmail(''); setPhone(''); setBirthday(''); setNotes('');
    }
  }, [client, visible]);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Required','Client name is required.'); return; }
    setSaving(true);
    try {
      onSave({ name:name.trim(), contactEmail:email.trim(), contactPhone:phone.trim(), birthday:birthday.trim()||null, notes:notes.trim() });
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cm.container}>
        <View style={cm.header}>
          <TouchableOpacity onPress={onClose}><Text style={cm.cancelTxt}>Cancel</Text></TouchableOpacity>
          <Text style={cm.title}>{client ? 'Edit Client' : 'Add Client'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={T.rose} size="small" /> : <Text style={cm.saveTxt}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={cm.scroll} keyboardShouldPersistTaps="handled">
          <Text style={cm.label}>FULL NAME *</Text>
          <TextInput style={cm.input} value={name} onChangeText={setName} placeholder="e.g. Amara Johnson" placeholderTextColor={T.textMuted} />
          <Text style={cm.label}>EMAIL</Text>
          <TextInput style={cm.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={T.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <Text style={cm.label}>PHONE</Text>
          <TextInput style={cm.input} value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={T.textMuted} keyboardType="phone-pad" />
          <Text style={cm.label}>BIRTHDAY (MM-DD or YYYY-MM-DD)</Text>
          <TextInput style={cm.input} value={birthday} onChangeText={setBirthday} placeholder="e.g. 06-15" placeholderTextColor={T.textMuted} />
          <Text style={cm.label}>STYLIST NOTES</Text>
          <TextInput style={[cm.input,{height:100,textAlignVertical:'top'}]} value={notes} onChangeText={setNotes} multiline placeholder="Formulas, preferences, sensitivities…" placeholderTextColor={T.textMuted} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Client Detail Modal ────────────────────────────────────────────────────
function ClientDetail({ visible, client, stats, bookings, onClose, onEdit }: { visible:boolean; client:any|null; stats:any|null; bookings:any[]; onClose:()=>void; onEdit:()=>void }) {
  const T = useTheme();
  const cm = React.useMemo(() => makeModalStyles(T), [T]);
  const cd = React.useMemo(() => makeDetailStyles(T), [T]);
  if (!client) return null;
  const name = client.name || 'Client';
  const totalVisits = stats?.totalVisits ?? 0;
  const totalSpent  = stats?.totalSpent  ?? 0;
  const topService  = stats?.topService  ?? '—';
  const cancelCount = stats?.cancelCount ?? 0;
  const tags = client.tags || [];
  const hasTag = (tag:string) => tags.includes(tag);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cm.container}>
        <View style={cm.header}>
          <TouchableOpacity onPress={onClose}><Text style={cm.cancelTxt}>Close</Text></TouchableOpacity>
          <Text style={cm.title}>Client Profile</Text>
          <TouchableOpacity onPress={onEdit}><Text style={cm.saveTxt}>Edit</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{paddingBottom:40}}>
          {/* Profile section */}
          <View style={cd.profileSection}>
            <View style={cd.avatar}><Text style={cd.avatarTxt}>{ini(name)}</Text></View>
            <Text style={cd.name}>{name}</Text>
            {!!client.contactEmail && <Text style={cd.meta}>📧 {client.contactEmail}</Text>}
            {!!client.contactPhone && <Text style={cd.meta}>📞 {client.contactPhone}</Text>}
            {!!client.birthday && <Text style={cd.meta}>🎂 {client.birthday}</Text>}
          </View>
          {/* Tags */}
          {tags.length > 0 && (
            <View style={cd.tagsRow}>
              {tags.map((t:string,i:number) => <View key={i} style={cd.tag}><Text style={cd.tagTxt}>{t}</Text></View>)}
            </View>
          )}
          {/* Stats */}
          <View style={cd.statsGrid}>
            <View style={cd.statCell}>
              <Text style={cd.statValue}>{totalVisits}</Text>
              <Text style={cd.statLabel}>Total Visits</Text>
            </View>
            <View style={cd.statCell}>
              <Text style={cd.statValue}>${Number(totalSpent).toFixed(0)}</Text>
              <Text style={cd.statLabel}>Total Spent</Text>
            </View>
            <View style={cd.statCell}>
              <Text style={cd.statValue}>{cancelCount}</Text>
              <Text style={cd.statLabel}>Cancellations</Text>
            </View>
          </View>
          {!!topService && topService!=='—' && (
            <View style={cd.topService}>
              <Text style={cd.topServiceLabel}>Most Booked Service</Text>
              <Text style={cd.topServiceName}>{topService}</Text>
            </View>
          )}
          {/* Notes */}
          {!!client.notes && (
            <View style={cd.notesSection}>
              <Text style={cd.notesLabel}>STYLIST NOTES</Text>
              <Text style={cd.notesBody}>{client.notes}</Text>
            </View>
          )}
          {/* Booking history */}
          {bookings.length > 0 && (
            <View style={cd.historySection}>
              <Text style={cd.historyTitle}>BOOKING HISTORY</Text>
              {bookings.slice(0,10).map((b,i) => {
                const svc  = b.serviceName||b.service_name||'';
                const rawDate = b.startsAt||b.starts_at||b.date||b.appointmentDate||b.appointment_date||'';
                const parsedDate = rawDate ? new Date(rawDate) : null;
                const dateStr = parsedDate && !isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                  : '—';
                const st   = b.status||'confirmed';
                const stCol: Record<string,string> = { confirmed:C.success, pending:'#F59E0B', completed:'#6366F1', cancelled:'#9CA3AF' };
                return (
                  <View key={b.id||i} style={cd.historyRow}>
                    <View style={{flex:1}}>
                      <Text style={cd.historySvc}>{svc||'Appointment'}</Text>
                      <Text style={cd.historyDate}>{dateStr}</Text>
                    </View>
                    <View style={[cd.historyBadge,{backgroundColor:(stCol[st]||T.textMuted)+'20'}]}>
                      <Text style={[cd.historyBadgeTxt,{color:stCol[st]||T.textMuted}]}>{st}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{height:40}}/>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Client Row ─────────────────────────────────────────────────────────────
function ClientRow({ item, onPress }: { item:any; onPress:()=>void }) {
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);
  const name  = item.name||'Unknown';
  const email = item.contactEmail||'';
  const phone = item.contactPhone||'';
  const bday  = item.birthday||'';
  const today = new Date();
  const isBday = bday && (() => { try { const parts=bday.split('-'); const m=parseInt(parts[parts.length===3?1:0])-1; const d=parseInt(parts[parts.length===3?2:1]); return today.getMonth()===m && today.getDate()===d; } catch { return false; } })();
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      <View style={s.avatar}><Text style={s.avatarTxt}>{ini(name)}</Text></View>
      <View style={{flex:1}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
          <Text style={s.name}>{name}</Text>
          {isBday && <Text style={{fontSize:14}}>🎂</Text>}
        </View>
        {!!email && <Text style={s.sub} numberOfLines={1}>{email}</Text>}
        {!!phone && !email && <Text style={s.sub}>{phone}</Text>}
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const T = useTheme();
  const s  = React.useMemo(() => makeStyles(T), [T]);
  const cm = React.useMemo(() => makeModalStyles(T), [T]);
  const cd = React.useMemo(() => makeDetailStyles(T), [T]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients]   = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);

  // Client detail
  const [detailClient, setDetailClient] = useState<any>(null);
  const [detailStats, setDetailStats]   = useState<any>(null);
  const [detailBookings, setDetailBookings] = useState<any[]>([]);
  const [detailModal, setDetailModal]   = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const r = await OwnerApi.clients(token);
      setClients(Array.isArray(r.clients) ? r.clients : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
    // Upcoming birthdays (best-effort, non-blocking)
    OwnerApi.upcomingBirthdays(token)
      .then(b => setBirthdays(Array.isArray(b.clients) ? b.clients : []))
      .catch(() => setBirthdays([]));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c: any) => {
    setDetailClient(c); setDetailModal(true); setDetailLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        OwnerApi.clientStats(token!, c.id).catch(() => null),
        OwnerApi.bookings(token!).catch(() => ({ bookings: [] })),
      ]);
      setDetailStats(statsRes?.stats || null);
      const allBookings = bookingsRes?.bookings || [];
      setDetailBookings(allBookings.filter((b:any) => b.clientId===c.id || b.client_id===c.id));
    } catch {} finally { setDetailLoading(false); }
  };

  const handleSave = async (body: any) => {
    if (!token) return;
    try {
      if (editClient) {
        const r = await OwnerApi.updateClient(token, editClient.id, body);
        setClients(cs => cs.map(c => c.id===editClient.id ? (r.client||{...c,...body}) : c));
        setEditClient(null);
      } else {
        const r = await OwnerApi.createClient(token, body);
        if (r.client) setClients(cs => [r.client, ...cs]);
      }
      setAddModal(false);
      Alert.alert('Saved ✓', `${body.name} has been saved.`);
    } catch (e:any) { Alert.alert('Error', e.message); }
  };

  const filteredClients = clients.filter(c => {
    const name  = (c.name||'').toLowerCase();
    const email = (c.contactEmail||'').toLowerCase();
    const q     = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || email.includes(q);
    const matchFilter = filter==='all' || (c.tags||[]).includes(filter);
    return matchSearch && matchFilter;
  });

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.heading}>Clients</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditClient(null); setAddModal(true); }}>
          <Text style={s.addBtnTxt}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search by name or email…" placeholderTextColor={T.textMuted} autoCorrect={false} />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><Text style={s.searchClear}>✕</Text></TouchableOpacity>}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterChip, filter===f && s.filterChipOn]} onPress={() => setFilter(f)}>
            <Text style={[s.filterChipTxt, filter===f && s.filterChipTxtOn]}>
              {f==='vip'?'⭐ VIP':f==='new'?'🌱 New':f.charAt(0).toUpperCase()+f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={s.countTxt}>{filteredClients.length} client{filteredClients.length!==1?'s':''}</Text>

      {/* Upcoming birthdays */}
      {!search && birthdays.length > 0 && (
        <View style={s.bdayWrap}>
          <Text style={s.bdayTitle}>🎂 Upcoming Birthdays</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 14 }}>
            {birthdays.map(b => {
              const when = b.daysAway === 0 ? 'Today' : b.daysAway === 1 ? 'Tomorrow' : `in ${b.daysAway} days`;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={s.bdayCard}
                  activeOpacity={0.8}
                  onPress={() => { const match = clients.find(c => c.id === b.id); if (match) openDetail(match); }}
                >
                  <Text style={s.bdayName} numberOfLines={1}>{b.name}</Text>
                  <Text style={s.bdayWhen}>{when}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{marginTop:60}} color={T.rose} size="large" />
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(_,i) => String(i)}
          renderItem={({ item }) => <ClientRow item={item} onPress={() => openDetail(item)} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={T.rose} />}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyTxt}>{search ? 'No clients match your search.' : 'No clients yet. Add your first client.'}</Text>
            </View>
          }
        />
      )}

      <ClientModal visible={addModal||!!editClient} client={editClient} onClose={() => { setAddModal(false); setEditClient(null); }} onSave={handleSave} />

      <ClientDetail
        visible={detailModal}
        client={detailClient}
        stats={detailStats}
        bookings={detailBookings}
        onClose={() => { setDetailModal(false); setDetailClient(null); setDetailStats(null); setDetailBookings([]); }}
        onEdit={() => { setDetailModal(false); setEditClient(detailClient); }}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
function makeStyles(T: AppTheme) { return StyleSheet.create({
  container:     { flex:1, backgroundColor:T.bgBase },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:T.border },
  heading:       { fontSize:22, fontWeight:'900', color:T.textPrimary, fontFamily:'Georgia' },
  addBtn:        { backgroundColor:T.rose, borderRadius:999, paddingHorizontal:16, paddingVertical:8 },
  addBtnTxt:     { color:T.white, fontWeight:'800', fontSize:14 },
  searchRow:     { paddingHorizontal:14, paddingTop:12, paddingBottom:4 },
  searchBox:     { flexDirection:'row', alignItems:'center', backgroundColor:T.bgCard, borderRadius:12, paddingHorizontal:12, gap:8, borderWidth:1, borderColor:T.border },
  searchIcon:    { fontSize:14 },
  searchInput:   { flex:1, paddingVertical:11, fontSize:14, color:T.textPrimary },
  searchClear:   { fontSize:14, color:T.textSec, padding:4 },
  filterScroll:  { flexGrow:0 },
  filterRow:     { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:8, gap:8 },
  filterChip:    { height:32, paddingHorizontal:14, borderRadius:999, backgroundColor:T.bgCard, borderWidth:1, borderColor:T.border, alignItems:'center', justifyContent:'center' },
  filterChipOn:  { backgroundColor:T.rose, borderColor:T.rose },
  filterChipTxt: { fontSize:12, fontWeight:'600', color:T.textSec },
  filterChipTxtOn:{ color:T.white, fontWeight:'800' },
  countTxt:      { fontSize:11, color:T.textSec, paddingHorizontal:18, paddingBottom:6 },
  bdayWrap:      { paddingLeft:14, paddingBottom:10 },
  bdayTitle:     { fontSize:12, fontWeight:'800', color:T.textPrimary, marginBottom:8 },
  bdayCard:      { backgroundColor:T.bgCard, borderWidth:1, borderColor:T.border, borderRadius:12, paddingHorizontal:14, paddingVertical:10, minWidth:120 },
  bdayName:      { fontSize:13, fontWeight:'700', color:T.textPrimary },
  bdayWhen:      { fontSize:11, color:T.rose, fontWeight:'700', marginTop:2 },
  row:           { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, backgroundColor:T.bgCard, gap:12 },
  separator:     { height:1, backgroundColor:T.border, marginLeft:68 },
  avatar:        { width:44, height:44, borderRadius:22, backgroundColor:T.bgElevated, alignItems:'center', justifyContent:'center' },
  avatarTxt:     { fontSize:16, fontWeight:'800', color:T.rose },
  name:          { fontSize:14, fontWeight:'700', color:T.textPrimary },
  sub:           { fontSize:12, color:T.textSec, marginTop:2 },
  chevron:       { fontSize:20, color:T.textSec },
  empty:         { paddingTop:60, alignItems:'center', gap:12 },
  emptyIcon:     { fontSize:40 },
  emptyTxt:      { fontSize:14, color:T.textSec, textAlign:'center' },
}); }

function makeModalStyles(T: AppTheme) { return StyleSheet.create({
  container: { flex:1, backgroundColor:T.bgBase },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, borderBottomWidth:1, borderBottomColor:T.border },
  title:     { fontSize:16, fontWeight:'800', color:T.textPrimary },
  cancelTxt: { fontSize:15, color:T.textSec, fontWeight:'600' },
  saveTxt:   { fontSize:15, color:T.rose, fontWeight:'800' },
  scroll:    { padding:18, gap:2 },
  label:     { fontSize:10, fontWeight:'800', letterSpacing:1, color:T.textSec, textTransform:'uppercase', marginTop:14, marginBottom:6 },
  input:     { backgroundColor:T.bgCard, borderRadius:12, padding:13, fontSize:14, color:T.textPrimary, borderWidth:1, borderColor:T.border },
}); }

function makeDetailStyles(T: AppTheme) { return StyleSheet.create({
  profileSection:{ alignItems:'center', paddingVertical:24, borderBottomWidth:1, borderBottomColor:T.border, paddingHorizontal:20 },
  avatar:        { width:72, height:72, borderRadius:36, backgroundColor:T.bgElevated, alignItems:'center', justifyContent:'center', marginBottom:12 },
  avatarTxt:     { fontSize:26, fontWeight:'900', color:T.rose },
  name:          { fontSize:20, fontWeight:'900', color:T.textPrimary, fontFamily:'Georgia', marginBottom:8 },
  meta:          { fontSize:13, color:T.textSec, marginTop:4 },
  tagsRow:       { flexDirection:'row', flexWrap:'wrap', gap:8, padding:16, borderBottomWidth:1, borderBottomColor:T.border },
  tag:           { paddingHorizontal:12, paddingVertical:5, borderRadius:999, backgroundColor:T.bgElevated, borderWidth:1, borderColor:T.rose+'30' },
  tagTxt:        { fontSize:11, fontWeight:'700', color:T.rose },
  statsGrid:     { flexDirection:'row', padding:16, gap:1 },
  statCell:      { flex:1, alignItems:'center', padding:14, backgroundColor:T.bgCard, borderWidth:1, borderColor:T.border, margin:1, borderRadius:12 },
  statValue:     { fontSize:22, fontWeight:'900', color:T.textPrimary },
  statLabel:     { fontSize:10, fontWeight:'600', color:T.textSec, marginTop:4, textAlign:'center' },
  topService:    { margin:16, backgroundColor:T.bgCard, borderRadius:14, padding:16, borderWidth:1, borderColor:T.border },
  topServiceLabel:{ fontSize:10, fontWeight:'800', color:T.textSec, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 },
  topServiceName: { fontSize:16, fontWeight:'800', color:T.textPrimary },
  notesSection:  { margin:16, backgroundColor:T.bgElevated, borderRadius:14, padding:16, borderWidth:1, borderColor:T.border },
  notesLabel:    { fontSize:10, fontWeight:'800', color:T.textSec, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 },
  notesBody:     { fontSize:13, color:T.textPrimary, lineHeight:20 },
  historySection:{ margin:16 },
  historyTitle:  { fontSize:10, fontWeight:'800', color:T.textSec, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 },
  historyRow:    { flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:T.border },
  historySvc:    { fontSize:13, fontWeight:'700', color:T.textPrimary },
  historyDate:   { fontSize:11, color:T.textSec, marginTop:2 },
  historyBadge:  { paddingHorizontal:10, paddingVertical:4, borderRadius:999 },
  historyBadgeTxt:{ fontSize:10, fontWeight:'700' },
}); }
