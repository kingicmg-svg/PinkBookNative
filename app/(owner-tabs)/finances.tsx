import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import type { AppTheme } from '../../constants/Colors';

const C = Colors;
function fmt(n: number) { return '$' + Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function fmtDate(t: string) { try { return new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch { return t||'—'; } }

const STATUS_COLOR: Record<string,string> = { confirmed:C.success, pending:'#F59E0B', completed:'#6366F1', cancelled:'#9CA3AF', noshow:'#EF4444' };

function StatCard({ label, value, sub, accent }: { label:string; value:string; sub?:string; accent?:string }) {
  return (
    <View style={[s.statCard, accent && { borderTopColor:accent, borderTopWidth:3 }]}>
      <Text style={[s.statVal, accent && { color:accent }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {!!sub && <Text style={s.statSub}>{sub}</Text>}
    </View>
  );
}

const PERIODS = ['Week','Month','Year'];
const STATUS_ORDER = ['confirmed','pending','completed','cancelled','noshow'];

export default function FinancesScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const T = useTheme();
  const s = React.useMemo(() => makeStyles(T), [T]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [byService, setByService] = useState<any[]>([]);
  const [period, setPeriod]       = useState(0); // 0=Week, 1=Month, 2=Year

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [aRes, bRes, sRes] = await Promise.all([
        OwnerApi.analyticsOverview(token),
        OwnerApi.bookings(token),
        OwnerApi.analyticsByService(token).catch(() => ({ services: [] })),
      ]);
      setAnalytics(aRes);
      setBookings(Array.isArray(bRes.bookings) ? bRes.bookings : []);
      setByService(Array.isArray(sRes.services) ? sRes.services : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Filter bookings by period
  const now = new Date();
  const periodStart = (() => {
    const d = new Date(now);
    if (period === 0) { d.setDate(d.getDate()-7); }
    else if (period === 1) { d.setMonth(d.getMonth(),1); d.setHours(0,0,0,0); }
    else { d.setMonth(0,1); d.setHours(0,0,0,0); }
    return d;
  })();

  const filteredBookings = bookings.filter(b => {
    const t = b.appointmentTime||b.appointment_time||b.time||'';
    try { return new Date(t) >= periodStart; } catch { return false; }
  }).sort((a,b) => { const ta=a.appointmentTime||a.appointment_time||a.time||''; const tb=b.appointmentTime||b.appointment_time||b.time||''; return new Date(tb).getTime()-new Date(ta).getTime(); });

  const totalBooked    = filteredBookings.reduce((acc,b) => acc+(parseFloat(b.price)||0), 0);
  const totalCollected = filteredBookings.filter(b => b.status==='completed'||b.paymentStatus==='paid_in_full').reduce((acc,b) => acc+(parseFloat(b.price)||0), 0);
  const totalOutstanding = Math.max(0, totalBooked - totalCollected);

  const rev = analytics?.revenue || {};
  const bkgs = analytics?.bookings || {};
  const clts = analytics?.clients || {};
  const avgs = analytics?.averages || {};

  const currentYear = new Date().getFullYear();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}><Text style={s.heading}>Finances</Text></View>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={T.rose} />}
      >
        {loading ? <ActivityIndicator color={T.rose} size="large" style={{marginTop:40}} /> : (<>

        {/* Revenue stats */}
        <Text style={s.sectionTitle}>Revenue Overview</Text>
        <View style={s.statsGrid}>
          <StatCard label="This Week"  value={fmt(rev.week||0)}  accent={T.rose} />
          <StatCard label="This Month" value={fmt(rev.month||0)} accent="#6366F1" />
          <StatCard label="This Year"  value={fmt(rev.year||0)}  accent={C.success} />
        </View>

        {/* Totals */}
        <Text style={s.sectionTitle}>All Time Totals</Text>
        <View style={s.statsGrid}>
          <StatCard label="Total Bookings"    value={String(bkgs.total||0)} />
          <StatCard label="Completed"         value={String(bkgs.completed||0)} sub={`${bkgs.completion_rate||0}% rate`} />
          <StatCard label="Cancelled"         value={String(bkgs.cancelled||0)} />
        </View>
        <View style={s.statsGrid}>
          <StatCard label="Total Clients"     value={String(clts.total||0)} />
          <StatCard label="New This Month"    value={String(clts.new_this_month||0)} />
          <StatCard label="Avg Booking"       value={fmt(avgs.booking_value||0)} />
        </View>

        {/* Period selector */}
        <Text style={s.sectionTitle}>Transaction History</Text>
        <View style={s.periodBar}>
          {PERIODS.map((p,i) => (
            <TouchableOpacity key={p} style={[s.periodBtn, period===i && s.periodBtnOn]} onPress={() => setPeriod(i)}>
              <Text style={[s.periodBtnTxt, period===i && s.periodBtnTxtOn]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period summary */}
        <View style={s.periodSummary}>
          <View style={s.summaryItem}><Text style={s.summaryVal}>{fmt(totalBooked)}</Text><Text style={s.summaryKey}>Booked</Text></View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}><Text style={[s.summaryVal,{color:C.success}]}>{fmt(totalCollected)}</Text><Text style={s.summaryKey}>Collected</Text></View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}><Text style={[s.summaryVal,{color:'#F59E0B'}]}>{fmt(totalOutstanding)}</Text><Text style={s.summaryKey}>Outstanding</Text></View>
        </View>

        {/* By-service breakdown */}
        {byService.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Revenue by Service</Text>
            <View style={s.card}>
              {byService.slice(0,8).map((sv,i) => (
                <View key={i} style={[s.svcRow, i>0 && { borderTopWidth:1, borderTopColor:T.border }]}>
                  <Text style={s.svcName}>{sv.serviceName||sv.service_name||'Service'}</Text>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={s.svcRevenue}>{fmt(sv.revenue||sv.total||0)}</Text>
                    {sv.count!=null && <Text style={s.svcCount}>{sv.count} booking{sv.count!==1?'s':''}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Transactions list */}
        <Text style={s.sectionTitle}>Transactions ({filteredBookings.length})</Text>
        {filteredBookings.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyTxt}>No transactions for this period.</Text></View>
        ) : filteredBookings.map((b,i) => {
          const client   = b.clientName||b.client_name||'Client';
          const service  = b.serviceName||b.service_name||'';
          const price    = parseFloat(b.price)||0;
          const status   = b.status||'confirmed';
          const date     = b.appointmentTime||b.appointment_time||b.time||'';
          const stCol    = STATUS_COLOR[status]||T.textSec;
          return (
            <View key={b.id||i} style={s.txRow}>
              <View style={{flex:1}}>
                <Text style={s.txClient}>{client}</Text>
                <Text style={s.txService}>{service||'Appointment'}</Text>
                <Text style={s.txDate}>{fmtDate(date)}</Text>
              </View>
              <View style={{alignItems:'flex-end',gap:4}}>
                <Text style={[s.txPrice, price>0 && { color:T.textPrimary }]}>{price>0?fmt(price):'—'}</Text>
                <View style={[s.txBadge,{backgroundColor:stCol+'18'}]}>
                  <Text style={[s.txBadgeTxt,{color:stCol}]}>{status}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{height:40}}/>
        </>)}
      </ScrollView>
    </View>
  );
}

function makeStyles(T: AppTheme) { return StyleSheet.create({
  container:     { flex:1, backgroundColor:T.bgBase },
  header:        { paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:T.border, backgroundColor:T.bgBase },
  heading:       { fontSize:22, fontWeight:'900', color:T.textPrimary, fontFamily:'Georgia' },
  scroll:        { padding:14 },
  sectionTitle:  { fontSize:11, fontWeight:'800', color:T.rose, textTransform:'uppercase', letterSpacing:1, marginTop:20, marginBottom:10, paddingHorizontal:2 },
  statsGrid:     { flexDirection:'row', gap:8, marginBottom:4 },
  statCard:      { flex:1, backgroundColor:T.bgCard, borderRadius:14, padding:14, alignItems:'center', borderWidth:1, borderColor:T.border },
  statVal:       { fontSize:18, fontWeight:'900', color:T.textPrimary, marginBottom:4 },
  statLabel:     { fontSize:9, fontWeight:'700', color:T.textSec, textAlign:'center', textTransform:'uppercase', letterSpacing:0.3 },
  statSub:       { fontSize:9, color:T.rose, marginTop:2, fontWeight:'600' },
  periodBar:     { flexDirection:'row', backgroundColor:T.bgCard, borderRadius:12, borderWidth:1, borderColor:T.border, padding:3, gap:2 },
  periodBtn:     { flex:1, paddingVertical:8, borderRadius:9, alignItems:'center' },
  periodBtnOn:   { backgroundColor:T.rose },
  periodBtnTxt:  { fontSize:12, fontWeight:'700', color:T.textSec },
  periodBtnTxtOn:{ color:T.white, fontWeight:'800' },
  periodSummary: { flexDirection:'row', backgroundColor:T.bgCard, borderRadius:14, borderWidth:1, borderColor:T.border, padding:16, marginTop:10, alignItems:'center' },
  summaryItem:   { flex:1, alignItems:'center' },
  summaryVal:    { fontSize:16, fontWeight:'900', color:T.textPrimary },
  summaryKey:    { fontSize:10, color:T.textSec, fontWeight:'600', marginTop:2 },
  summaryDivider:{ width:1, height:32, backgroundColor:T.border },
  card:          { backgroundColor:T.bgCard, borderRadius:14, borderWidth:1, borderColor:T.border, overflow:'hidden', marginTop:4 },
  svcRow:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14 },
  svcName:       { fontSize:13, fontWeight:'700', color:T.textPrimary, flex:1 },
  svcRevenue:    { fontSize:14, fontWeight:'800', color:T.textPrimary },
  svcCount:      { fontSize:10, color:T.textSec, marginTop:2 },
  txRow:         { flexDirection:'row', alignItems:'flex-start', backgroundColor:T.bgCard, borderRadius:12, padding:14, marginBottom:8, borderWidth:1, borderColor:T.border },
  txClient:      { fontSize:14, fontWeight:'700', color:T.textPrimary },
  txService:     { fontSize:12, color:T.textSec, marginTop:2 },
  txDate:        { fontSize:11, color:T.textMuted, marginTop:3 },
  txPrice:       { fontSize:16, fontWeight:'900', color:T.textSec },
  txBadge:       { paddingHorizontal:8, paddingVertical:3, borderRadius:999 },
  txBadgeTxt:    { fontSize:10, fontWeight:'700' },
  empty:         { padding:40, alignItems:'center' },
  emptyTxt:      { color:T.textSec, fontSize:14, textAlign:'center' },
}); }
