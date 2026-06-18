import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;
const STATUS_COLOR: Record<string,string> = {
  confirmed: C.success, pending:'#F59E0B', completed:'#6366F1',
  cancelled:'#9CA3AF',  noshow:'#EF4444',  waitlist:'#8B5CF6',
};
const STATUS_LABEL: Record<string,string> = {
  confirmed:'Confirmed', pending:'Pending', completed:'Completed',
  cancelled:'Cancelled', noshow:'No-show', waitlist:'Waitlist',
};

function fmtCurrency(n: number) { return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function isoDate(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, onPress }: { icon:string; label:string; value:string; color:string; onPress?:()=>void }) {
  return (
    <TouchableOpacity style={[s.statCard, { borderTopColor: color, borderTopWidth: 3 }]} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Booking Card ───────────────────────────────────────────────────────────
function BookingCard({ item, onConfirm, onDeny }: { item:any; onConfirm:(id:string)=>void; onDeny:(id:string)=>void }) {
  const clientName = item.clientName || item.client_name || item.contactName || 'Client';
  const service    = item.serviceName || item.service_name || item.service || '';
  const status     = item.status || 'pending';
  const statusCol  = STATUS_COLOR[status] || C.soft;
  const time       = item.appointmentTime || item.appointment_time || item.time || '';
  const price      = item.price != null ? fmtCurrency(parseFloat(item.price)) : '';
  const duration   = item.duration ? `${item.duration}m` : '';

  let timeStr = '—';
  if (time) {
    try { timeStr = new Date(time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); } catch {}
  }

  return (
    <View style={s.bookCard}>
      <View style={[s.bookBar, { backgroundColor: statusCol }]} />
      <View style={s.bookBody}>
        <View style={s.bookTop}>
          <View style={{ flex:1 }}>
            <Text style={s.bookTime}>{timeStr}</Text>
            <Text style={s.bookClient}>{clientName}</Text>
            {!!service && <Text style={s.bookService}>{service}{duration ? ` · ${duration}` : ''}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[s.statusPill, { backgroundColor: statusCol+'20' }]}>
              <Text style={[s.statusPillTxt, { color: statusCol }]}>{STATUS_LABEL[status] || status}</Text>
            </View>
            {!!price && <Text style={s.bookPrice}>{price}</Text>}
          </View>
        </View>
        {status === 'pending' && (
          <View style={s.bookActions}>
            <TouchableOpacity style={s.confirmBtn} onPress={() => onConfirm(item.id)}>
              <Text style={s.confirmBtnTxt}>✓ Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.denyBtn} onPress={() => onDeny(item.id)}>
              <Text style={s.denyBtnTxt}>✕ Deny</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Date Strip Day ─────────────────────────────────────────────────────────
function DateDay({ date, selected, hasBooking, onPress }: { date:Date; selected:boolean; hasBooking:boolean; onPress:()=>void }) {
  const isToday = isoDate(date) === isoDate(new Date());
  const day = date.toLocaleDateString('en-US', { weekday:'short' }).toUpperCase().slice(0,3);
  const num = date.getDate();
  return (
    <TouchableOpacity style={[s.dateDay, isToday && s.dateDayToday, selected && !isToday && s.dateDaySelected]} onPress={onPress}>
      <Text style={[s.dateDayLabel, (isToday||selected) && { color: isToday ? C.white : C.rose }]}>{day}</Text>
      <Text style={[s.dateDayNum, (isToday||selected) && { color: isToday ? C.white : C.rose }]}>{num}</Text>
      {hasBooking && <View style={[s.dateDot, isToday && { backgroundColor: 'rgba(255,255,255,0.8)' }]} />}
    </TouchableOpacity>
  );
}

// ── Add Booking Modal ──────────────────────────────────────────────────────
function AddBookingModal({ visible, clients, settings, onClose, onSave }:
  { visible:boolean; clients:any[]; settings:any; onClose:()=>void; onSave:(b:any)=>void }) {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [date, setDate] = useState(isoDate(new Date()));
  const [time, setTime] = useState('10:00 AM');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const services = settings?.servicesCatalog || [];
  const filteredClients = clients.filter(c => {
    const n = (c.name || '').toLowerCase(); const e = (c.contactEmail||'').toLowerCase();
    const q = clientSearch.toLowerCase();
    return !q || n.includes(q) || e.includes(q);
  }).slice(0, 10);
  const filteredServices = services.filter((sv: any) => {
    const n = (sv.name||'').toLowerCase(); return !serviceSearch || n.includes(serviceSearch.toLowerCase());
  }).slice(0, 10);

  const save = () => {
    if (!selectedClient || !selectedService || !date || !time) {
      Alert.alert('Missing Fields', 'Please select a client, service, date and time.'); return;
    }
    onSave({ clientId: selectedClient.id, clientName: selectedClient.name, serviceId: selectedService.id, serviceName: selectedService.name, price: selectedService.price, duration: selectedService.duration, date, time, notes: note, status: 'confirmed' });
    setSelectedClient(null); setSelectedService(null); setClientSearch(''); setServiceSearch(''); setDate(isoDate(new Date())); setTime('10:00 AM'); setNote('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <Text style={m.title}>Add Appointment</Text>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={m.scroll} keyboardShouldPersistTaps="handled">
          <Text style={m.label}>CLIENT</Text>
          <TextInput style={m.input} value={clientSearch} onChangeText={setClientSearch} placeholder="Search client by name or email…" placeholderTextColor={C.soft} />
          {!!clientSearch && filteredClients.map(c => (
            <TouchableOpacity key={c.id} style={[m.option, selectedClient?.id===c.id && m.optionOn]} onPress={() => { setSelectedClient(c); setClientSearch(c.name||c.contactEmail||''); }}>
              <Text style={m.optionTxt}>{c.name || 'Unknown'}</Text>
              {!!c.contactEmail && <Text style={m.optionSub}>{c.contactEmail}</Text>}
            </TouchableOpacity>
          ))}
          <Text style={m.label}>SERVICE</Text>
          <TextInput style={m.input} value={serviceSearch} onChangeText={setServiceSearch} placeholder="Search service…" placeholderTextColor={C.soft} />
          {!!serviceSearch && filteredServices.map((sv: any, i: number) => (
            <TouchableOpacity key={i} style={[m.option, selectedService?.name===sv.name && m.optionOn]} onPress={() => { setSelectedService(sv); setServiceSearch(sv.name); }}>
              <Text style={m.optionTxt}>{sv.name}</Text>
              <Text style={m.optionSub}>{sv.duration ? `${sv.duration}m` : ''}{sv.price ? ` · $${sv.price}` : ''}</Text>
            </TouchableOpacity>
          ))}
          <Text style={m.label}>DATE</Text>
          <TextInput style={m.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.soft} />
          <Text style={m.label}>TIME</Text>
          <TextInput style={m.input} value={time} onChangeText={setTime} placeholder="10:00 AM" placeholderTextColor={C.soft} />
          <Text style={m.label}>NOTE (OPTIONAL)</Text>
          <TextInput style={[m.input, { height: 72, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} multiline placeholder="Internal note…" placeholderTextColor={C.soft} />
          <TouchableOpacity style={m.saveBtn} onPress={save}>
            <Text style={m.saveBtnTxt}>Save Appointment</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
const FILTERS = ['All','Confirmed','Pending','Completed','Cancelled','No-show'];

export default function CalendarScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const { token } = useAuth();

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [settings, setSettings]   = useState<any>(null);
  const [clients, setClients]     = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);      // weeks relative to current week
  const [filter, setFilter]       = useState('All');
  const [addModal, setAddModal]   = useState(false);

  // Build 7-day strip for current week offset
  const weekStart = (() => {
    const d = new Date();
    const dow = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7); // Mon-based
    d.setHours(0,0,0,0);
    return d;
  })();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [bRes, aRes, stRes] = await Promise.all([
        OwnerApi.bookings(token),
        OwnerApi.analyticsOverview(token).catch(() => null),
        OwnerApi.settings(token).catch(() => null),
      ]);
      setBookings(Array.isArray(bRes.bookings) ? bRes.bookings : []);
      setAnalytics(aRes);
      setSettings(stRes?.settings || null);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  const loadClients = useCallback(async () => {
    if (!token) return;
    try { const r = await OwnerApi.clients(token); setClients(Array.isArray(r.clients) ? r.clients : []); } catch {}
  }, [token]);

  useEffect(() => { load(); loadClients(); }, [load, loadClients]);

  const bookingsForDate = bookings.filter(b => {
    const t = b.appointmentTime || b.appointment_time || b.time || b.date || '';
    if (!t) return false;
    try { return isoDate(new Date(t)) === selectedDate; } catch { return false; }
  });

  const filteredBookings = bookingsForDate.filter(b => {
    if (filter === 'All') return true;
    return (b.status||'').toLowerCase() === filter.toLowerCase().replace('-','').replace('show','show');
  });

  // Build a Set of dates that have bookings (for dot indicators)
  const bookedDates = new Set(bookings.map(b => {
    const t = b.appointmentTime || b.appointment_time || b.time || b.date || '';
    try { return isoDate(new Date(t)); } catch { return ''; }
  }).filter(Boolean));

  const handleConfirm = async (id: string) => {
    if (!token) return;
    Alert.alert('Confirm Booking', 'Mark this booking as confirmed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await OwnerApi.updateBooking(token, id, { status: 'confirmed' });
          setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleDeny = async (id: string) => {
    if (!token) return;
    Alert.alert('Deny Booking', 'Deny this booking request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deny', style: 'destructive', onPress: async () => {
        try {
          await OwnerApi.updateBooking(token, id, { status: 'cancelled' });
          setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleAddBooking = async (body: any) => {
    if (!token) return;
    try {
      const r = await OwnerApi.createBooking(token, body);
      if (r.booking) setBookings(bs => [r.booking, ...bs]);
      setAddModal(false);
      Alert.alert('Booked ✓', `${body.clientName}'s appointment was added.`);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const todayBookings   = bookings.filter(b => { const t=b.appointmentTime||b.appointment_time||b.time||''; try { return isoDate(new Date(t))===isoDate(new Date()); } catch { return false; } });
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const weekRevenue     = analytics?.revenue?.week ?? 0;
  const totalClients    = analytics?.clients?.total ?? 0;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.heading}>Calendar</Text>
          <Text style={s.subheading}>{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddModal(true)}>
          <Text style={s.addBtnTxt}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.rose} />}
      >
        {/* Stat cards */}
        <View style={s.statsRow}>
          <StatCard icon="📅" label="Today" value={String(todayBookings.length)} color={C.rose} />
          <StatCard icon="💰" label="This Week" value={fmtCurrency(weekRevenue)} color="#6366F1" />
          <StatCard icon="⏳" label="Pending" value={String(pendingBookings.length)} color="#F59E0B"
            onPress={() => { setFilter('Pending'); }} />
          <StatCard icon="👥" label="Clients" value={String(totalClients)} color={C.success} />
        </View>

        {/* Week date strip */}
        <View style={s.stripWrapper}>
          <View style={s.stripHeader}>
            <Text style={s.stripMonth}>{weekStart.toLocaleDateString('en-US', { month:'long', year:'numeric' })}</Text>
            <View style={{ flexDirection:'row', gap:8 }}>
              <TouchableOpacity style={s.stripNav} onPress={() => setWeekOffset(w => w-1)}><Text style={s.stripNavTxt}>‹</Text></TouchableOpacity>
              <TouchableOpacity style={s.stripNav} onPress={() => setWeekOffset(0)}><Text style={[s.stripNavTxt, { fontSize:11 }]}>Today</Text></TouchableOpacity>
              <TouchableOpacity style={s.stripNav} onPress={() => setWeekOffset(w => w+1)}><Text style={s.stripNavTxt}>›</Text></TouchableOpacity>
            </View>
          </View>
          <View style={s.stripRow}>
            {weekDays.map((d, i) => (
              <DateDay key={i} date={d} selected={isoDate(d)===selectedDate} hasBooking={bookedDates.has(isoDate(d))} onPress={() => setSelectedDate(isoDate(d))} />
            ))}
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterTab, filter===f && s.filterTabOn]} onPress={() => setFilter(f)}>
              <Text style={[s.filterTabTxt, filter===f && s.filterTabTxtOn]}>{f}</Text>
              {f==='Pending' && pendingBookings.length > 0 && (
                <View style={s.filterBadge}><Text style={s.filterBadgeTxt}>{pendingBookings.length}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected date heading */}
        <View style={s.dateHeading}>
          <Text style={s.dateHeadingTxt}>
            {new Date(selectedDate+'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </Text>
          <Text style={s.dateHeadingCount}>{filteredBookings.length} appointment{filteredBookings.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Bookings list */}
        {loading ? (
          <ActivityIndicator color={C.rose} size="large" style={{ marginTop: 40 }} />
        ) : filteredBookings.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📅</Text>
            <Text style={s.emptyTxt}>No appointments {filter !== 'All' ? `with status "${filter}"` : 'on this day'}.</Text>
          </View>
        ) : (
          filteredBookings.map((b, i) => (
            <BookingCard key={b.id || i} item={b} onConfirm={handleConfirm} onDeny={handleDeny} />
          ))
        )}

        {/* Upcoming this week */}
        {filter === 'All' && !loading && (() => {
          const upcoming = bookings.filter(b => {
            const t=b.appointmentTime||b.appointment_time||b.time||'';
            try {
              const d=new Date(t); const today=new Date(); const endOfWeek=addDays(today,7);
              return d>today && d<=endOfWeek;
            } catch { return false; }
          }).slice(0,5);
          if (!upcoming.length) return null;
          return (
            <View style={s.upcomingSection}>
              <Text style={s.sectionTitle}>Upcoming This Week</Text>
              {upcoming.map((b,i)=>(
                <View key={b.id||i} style={s.upcomingRow}>
                  <View style={[s.upcomingDot,{backgroundColor:STATUS_COLOR[b.status]||C.soft}]}/>
                  <View style={{flex:1}}>
                    <Text style={s.upcomingClient}>{b.clientName||b.client_name||'Client'}</Text>
                    <Text style={s.upcomingMeta}>{b.serviceName||b.service_name||''} · {(() => { try { return new Date(b.appointmentTime||b.appointment_time||b.time).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); } catch { return ''; } })()}</Text>
                  </View>
                  <Text style={[s.upcomingStatus,{color:STATUS_COLOR[b.status]||C.soft}]}>{STATUS_LABEL[b.status]||b.status}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddBookingModal visible={addModal} clients={clients} settings={settings} onClose={() => setAddModal(false)} onSave={handleAddBooking} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: C.cream },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border, backgroundColor:C.cream },
  heading:        { fontSize:24, fontWeight:'900', color:C.charcoal, fontFamily:'Georgia' },
  subheading:     { fontSize:12, color:C.soft, marginTop:2 },
  addBtn:         { backgroundColor:C.rose, borderRadius:999, paddingHorizontal:16, paddingVertical:9 },
  addBtnTxt:      { color:C.white, fontWeight:'800', fontSize:14 },
  scroll:         { paddingBottom:40 },
  statsRow:       { flexDirection:'row', padding:14, gap:10 },
  statCard:       { flex:1, backgroundColor:C.white, borderRadius:14, padding:12, alignItems:'center', shadowColor:C.charcoal, shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2 },
  statIcon:       { fontSize:18, marginBottom:4 },
  statValue:      { fontSize:18, fontWeight:'900' },
  statLabel:      { fontSize:10, color:C.soft, fontWeight:'600', marginTop:2, textAlign:'center' },
  stripWrapper:   { backgroundColor:C.white, marginHorizontal:14, borderRadius:16, padding:16, borderWidth:1, borderColor:C.border, marginBottom:8 },
  stripHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  stripMonth:     { fontSize:14, fontWeight:'800', color:C.charcoal },
  stripNav:       { paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:C.border },
  stripNavTxt:    { fontSize:16, color:C.rose, fontWeight:'700' },
  stripRow:       { flexDirection:'row', justifyContent:'space-between' },
  dateDay:        { flex:1, alignItems:'center', paddingVertical:8, borderRadius:12 },
  dateDayToday:   { backgroundColor:C.rose },
  dateDaySelected:{ backgroundColor:C.pinkLight, borderWidth:1.5, borderColor:C.rose },
  dateDayLabel:   { fontSize:9, fontWeight:'700', color:C.soft, textTransform:'uppercase', marginBottom:3 },
  dateDayNum:     { fontSize:15, fontWeight:'800', color:C.charcoal },
  dateDot:        { width:4, height:4, borderRadius:2, backgroundColor:C.rose, marginTop:3 },
  filterRow:      { paddingHorizontal:14, paddingVertical:10, gap:8 },
  filterTab:      { paddingHorizontal:14, paddingVertical:7, borderRadius:999, backgroundColor:C.white, borderWidth:1, borderColor:C.border },
  filterTabOn:    { backgroundColor:C.rose, borderColor:C.rose },
  filterTabTxt:   { fontSize:12, fontWeight:'600', color:C.soft },
  filterTabTxtOn: { color:C.white, fontWeight:'800' },
  filterBadge:    { backgroundColor:C.white, borderRadius:999, paddingHorizontal:5, paddingVertical:1, marginLeft:4 },
  filterBadgeTxt: { fontSize:9, fontWeight:'800', color:C.rose },
  dateHeading:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingVertical:10 },
  dateHeadingTxt: { fontSize:13, fontWeight:'700', color:C.charcoal },
  dateHeadingCount:{ fontSize:12, color:C.soft },
  bookCard:       { flexDirection:'row', backgroundColor:C.white, marginHorizontal:14, marginBottom:10, borderRadius:14, overflow:'hidden', shadowColor:C.charcoal, shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:6, elevation:1 },
  bookBar:        { width:4 },
  bookBody:       { flex:1, padding:14 },
  bookTop:        { flexDirection:'row', alignItems:'flex-start' },
  bookTime:       { fontSize:11, fontWeight:'700', color:C.rose, textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 },
  bookClient:     { fontSize:15, fontWeight:'700', color:C.charcoal },
  bookService:    { fontSize:12, color:C.soft, marginTop:2 },
  bookPrice:      { fontSize:12, fontWeight:'700', color:C.gold, marginTop:4 },
  statusPill:     { paddingHorizontal:8, paddingVertical:3, borderRadius:999 },
  statusPillTxt:  { fontSize:10, fontWeight:'700' },
  bookActions:    { flexDirection:'row', gap:8, marginTop:12 },
  confirmBtn:     { flex:1, borderRadius:999, paddingVertical:8, alignItems:'center', backgroundColor:'rgba(26,158,74,0.1)', borderWidth:1, borderColor:'rgba(26,158,74,0.3)' },
  confirmBtnTxt:  { fontSize:12, fontWeight:'800', color:C.success },
  denyBtn:        { flex:1, borderRadius:999, paddingVertical:8, alignItems:'center', backgroundColor:'rgba(239,68,68,0.08)', borderWidth:1, borderColor:'rgba(239,68,68,0.25)' },
  denyBtnTxt:     { fontSize:12, fontWeight:'800', color:'#EF4444' },
  empty:          { alignItems:'center', paddingVertical:48 },
  emptyIcon:      { fontSize:40, marginBottom:12 },
  emptyTxt:       { fontSize:14, color:C.soft, textAlign:'center' },
  upcomingSection:{ margin:14, backgroundColor:C.white, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14 },
  sectionTitle:   { fontSize:12, fontWeight:'800', color:C.charcoal, marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 },
  upcomingRow:    { flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.border, gap:10 },
  upcomingDot:    { width:8, height:8, borderRadius:4 },
  upcomingClient: { fontSize:13, fontWeight:'700', color:C.charcoal },
  upcomingMeta:   { fontSize:11, color:C.soft, marginTop:2 },
  upcomingStatus: { fontSize:11, fontWeight:'700' },
});

// ── Add Modal Styles ───────────────────────────────────────────────────────
const m = StyleSheet.create({
  container:  { flex:1, backgroundColor:C.cream },
  header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:1, borderBottomColor:C.border },
  title:      { fontSize:18, fontWeight:'900', color:C.charcoal, fontFamily:'Georgia' },
  cancel:     { color:C.rose, fontWeight:'700', fontSize:15 },
  scroll:     { padding:20, gap:4 },
  label:      { fontSize:10, fontWeight:'800', letterSpacing:1, color:C.soft, textTransform:'uppercase', marginTop:14, marginBottom:6 },
  input:      { backgroundColor:C.white, borderRadius:12, padding:13, fontSize:14, color:C.charcoal, borderWidth:1, borderColor:C.border },
  option:     { backgroundColor:C.white, borderRadius:10, padding:12, marginBottom:4, borderWidth:1, borderColor:C.border },
  optionOn:   { borderColor:C.rose, backgroundColor:C.pinkLight },
  optionTxt:  { fontSize:13, fontWeight:'700', color:C.charcoal },
  optionSub:  { fontSize:11, color:C.soft, marginTop:2 },
  saveBtn:    { backgroundColor:C.rose, borderRadius:999, paddingVertical:15, alignItems:'center', marginTop:20 },
  saveBtnTxt: { color:C.white, fontWeight:'800', fontSize:16 },
});
