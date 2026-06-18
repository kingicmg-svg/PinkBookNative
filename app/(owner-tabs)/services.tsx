import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  TextInput, Switch, Alert, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;

const CATEGORIES = ['Hair','Nails','Lashes','Brows','Skin','Makeup','Waxing','Other'];
const COLOR_PRESETS = ['#C85D7A','#6366F1','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#1C1C1E'];
const PROMO_TYPES = ['percentage','fixed'];

// ── Service Form Modal ─────────────────────────────────────────────────────
function ServiceModal({ visible, service, onClose, onSave }: { visible:boolean; service:any|null; onClose:()=>void; onSave:(s:any)=>void }) {
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [price, setPrice]       = useState('');
  const [deposit, setDeposit]   = useState('');
  const [duration, setDuration] = useState('');
  const [prepMin, setPrepMin]   = useState('');
  const [appMin, setAppMin]     = useState('');
  const [finMin, setFinMin]     = useState('');
  const [category, setCategory] = useState('Hair');
  const [color, setColor]       = useState(COLOR_PRESETS[0]);
  const [visible2, setVisible2] = useState(true);

  useEffect(() => {
    if (service) {
      setName(service.name||''); setDesc(service.description||'');
      setPrice(service.price!=null?String(service.price):'');
      setDeposit(service.deposit!=null?String(service.deposit):'');
      setDuration(service.duration!=null?String(service.duration):'');
      setPrepMin(service.prepMin!=null?String(service.prepMin):'');
      setAppMin(service.appMin!=null?String(service.appMin):'');
      setFinMin(service.finMin!=null?String(service.finMin):'');
      setCategory(service.category||'Hair'); setColor(service.color||COLOR_PRESETS[0]);
      setVisible2(service.visible !== false);
    } else {
      setName(''); setDesc(''); setPrice(''); setDeposit(''); setDuration('');
      setPrepMin(''); setAppMin(''); setFinMin(''); setCategory('Hair');
      setColor(COLOR_PRESETS[0]); setVisible2(true);
    }
  }, [service, visible]);

  const save = () => {
    if (!name.trim()) { Alert.alert('Required', 'Service name is required.'); return; }
    onSave({ id: service?.id || Date.now().toString(), name: name.trim(), description: desc.trim(),
      price: price?parseFloat(price):null, deposit: deposit?parseFloat(deposit):null,
      duration: duration?parseInt(duration):null, prepMin: prepMin?parseInt(prepMin):null,
      appMin: appMin?parseInt(appMin):null, finMin: finMin?parseInt(finMin):null,
      category, color, visible: visible2 });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sm.container}>
        <View style={sm.header}>
          <TouchableOpacity onPress={onClose}><Text style={sm.cancelTxt}>Cancel</Text></TouchableOpacity>
          <Text style={sm.title}>{service ? 'Edit Service' : 'New Service'}</Text>
          <TouchableOpacity onPress={save}><Text style={sm.saveTxt}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={sm.scroll} keyboardShouldPersistTaps="handled">
          <Text style={sm.label}>SERVICE NAME *</Text>
          <TextInput style={sm.input} value={name} onChangeText={setName} placeholder="e.g. Knotless Braids" placeholderTextColor={C.soft} />
          <Text style={sm.label}>DESCRIPTION</Text>
          <TextInput style={[sm.input,{height:72,textAlignVertical:'top'}]} value={desc} onChangeText={setDesc} multiline placeholder="Brief description…" placeholderTextColor={C.soft} />
          <View style={sm.row2}>
            <View style={{flex:1}}>
              <Text style={sm.label}>PRICE ($)</Text>
              <TextInput style={sm.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.soft} />
            </View>
            <View style={{flex:1}}>
              <Text style={sm.label}>DEPOSIT ($)</Text>
              <TextInput style={sm.input} value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.soft} />
            </View>
          </View>
          <Text style={sm.label}>TOTAL DURATION (min)</Text>
          <TextInput style={sm.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="e.g. 180" placeholderTextColor={C.soft} />
          <Text style={sm.label}>STAGE TIMING (min)</Text>
          <View style={sm.row3}>
            <View style={{flex:1}}>
              <Text style={sm.stageLbl}>🔧 Prep</Text>
              <TextInput style={sm.input} value={prepMin} onChangeText={setPrepMin} keyboardType="number-pad" placeholder="—" placeholderTextColor={C.soft} />
            </View>
            <View style={{flex:1}}>
              <Text style={sm.stageLbl}>✂️ Application</Text>
              <TextInput style={sm.input} value={appMin} onChangeText={setAppMin} keyboardType="number-pad" placeholder="—" placeholderTextColor={C.soft} />
            </View>
            <View style={{flex:1}}>
              <Text style={sm.stageLbl}>✨ Finish</Text>
              <TextInput style={sm.input} value={finMin} onChangeText={setFinMin} keyboardType="number-pad" placeholder="—" placeholderTextColor={C.soft} />
            </View>
          </View>
          <Text style={sm.label}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingBottom:8}}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[sm.chip, category===cat && sm.chipOn]} onPress={() => setCategory(cat)}>
                <Text style={[sm.chipTxt, category===cat && sm.chipTxtOn]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={sm.label}>COLOUR LABEL</Text>
          <View style={{flexDirection:'row',gap:10,flexWrap:'wrap',marginBottom:12}}>
            {COLOR_PRESETS.map(cl => (
              <TouchableOpacity key={cl} style={[sm.colorDot, {backgroundColor:cl}, color===cl && sm.colorDotOn]} onPress={() => setColor(cl)} />
            ))}
          </View>
          <View style={sm.toggleRow}>
            <View>
              <Text style={sm.toggleLabel}>Visible on booking page</Text>
              <Text style={sm.toggleSub}>Clients can book this service</Text>
            </View>
            <Switch value={visible2} onValueChange={setVisible2} trackColor={{true:C.rose,false:C.border}} thumbColor={C.white} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Add-on Form Modal ──────────────────────────────────────────────────────
function AddonModal({ visible, addon, services, onClose, onSave }: { visible:boolean; addon:any|null; services:any[]; onClose:()=>void; onSave:(a:any)=>void }) {
  const [name, setName]   = useState('');
  const [price, setPrice] = useState('');
  const [linked, setLinked] = useState('all');

  useEffect(() => {
    if (addon) { setName(addon.name||''); setPrice(addon.price!=null?String(addon.price):''); setLinked(addon.linkedService||'all'); }
    else { setName(''); setPrice(''); setLinked('all'); }
  }, [addon, visible]);

  const save = () => {
    if (!name.trim()) { Alert.alert('Required','Add-on name is required.'); return; }
    onSave({ id: addon?.id||Date.now().toString(), name:name.trim(), price:price?parseFloat(price):null, linkedService:linked });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sm.container}>
        <View style={sm.header}>
          <TouchableOpacity onPress={onClose}><Text style={sm.cancelTxt}>Cancel</Text></TouchableOpacity>
          <Text style={sm.title}>{addon?'Edit Add-on':'New Add-on'}</Text>
          <TouchableOpacity onPress={save}><Text style={sm.saveTxt}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={sm.scroll}>
          <Text style={sm.label}>ADD-ON NAME *</Text>
          <TextInput style={sm.input} value={name} onChangeText={setName} placeholder="e.g. Deep Condition" placeholderTextColor={C.soft} />
          <Text style={sm.label}>PRICE ($)</Text>
          <TextInput style={sm.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.soft} />
          <Text style={sm.label}>LINKED SERVICE</Text>
          <TouchableOpacity style={[sm.chip,sm.chipOn,{alignSelf:'flex-start'}]}>
            <Text style={sm.chipTxtOn}>All services</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Promo Code Modal ───────────────────────────────────────────────────────
function PromoModal({ visible, onClose, onSave }: { visible:boolean; onClose:()=>void; onSave:(p:any)=>void }) {
  const [code, setCode]     = useState('');
  const [type, setType]     = useState<'percentage'|'fixed'>('percentage');
  const [value, setValue]   = useState('');
  const [expiry, setExpiry] = useState('');
  const [limit, setLimit]   = useState('');
  const [active, setActive] = useState(true);

  const save = () => {
    if (!code.trim()||!value) { Alert.alert('Required','Code and value are required.'); return; }
    onSave({ code:code.toUpperCase().trim(), type, value:parseFloat(value), expiresAt:expiry||null, usageLimit:limit?parseInt(limit):null, active });
    setCode(''); setValue(''); setExpiry(''); setLimit(''); setType('percentage'); setActive(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sm.container}>
        <View style={sm.header}>
          <TouchableOpacity onPress={onClose}><Text style={sm.cancelTxt}>Cancel</Text></TouchableOpacity>
          <Text style={sm.title}>New Promo Code</Text>
          <TouchableOpacity onPress={save}><Text style={sm.saveTxt}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={sm.scroll}>
          <Text style={sm.label}>CODE *</Text>
          <TextInput style={[sm.input,{textTransform:'uppercase'}]} value={code} onChangeText={setCode} placeholder="e.g. WELCOME20" autoCapitalize="characters" placeholderTextColor={C.soft} maxLength={30} />
          <Text style={sm.label}>DISCOUNT TYPE</Text>
          <View style={{flexDirection:'row',gap:10,marginBottom:8}}>
            {PROMO_TYPES.map(t => (
              <TouchableOpacity key={t} style={[sm.chip,type===t&&sm.chipOn]} onPress={() => setType(t as any)}>
                <Text style={[sm.chipTxt,type===t&&sm.chipTxtOn]}>{t==='percentage'?'% Percentage':'$ Fixed Amount'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={sm.label}>VALUE *</Text>
          <TextInput style={sm.input} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={type==='percentage'?'e.g. 20':'e.g. 15.00'} placeholderTextColor={C.soft} />
          <Text style={sm.label}>EXPIRY DATE</Text>
          <TextInput style={sm.input} value={expiry} onChangeText={setExpiry} placeholder="YYYY-MM-DD (optional)" placeholderTextColor={C.soft} />
          <Text style={sm.label}>USAGE LIMIT</Text>
          <TextInput style={sm.input} value={limit} onChangeText={setLimit} keyboardType="number-pad" placeholder="Unlimited" placeholderTextColor={C.soft} />
          <View style={sm.toggleRow}>
            <Text style={sm.toggleLabel}>Active</Text>
            <Switch value={active} onValueChange={setActive} trackColor={{true:C.rose,false:C.border}} thumbColor={C.white} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Service Card ───────────────────────────────────────────────────────────
function ServiceCard({ item, onEdit, onDelete, onToggle }: { item:any; onEdit:()=>void; onDelete:()=>void; onToggle:(v:boolean)=>void }) {
  const color = item.color || C.rose;
  return (
    <View style={[sc.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={sc.top}>
        <View style={{ flex:1 }}>
          <Text style={sc.name}>{item.name}</Text>
          {!!item.description && <Text style={sc.desc} numberOfLines={1}>{item.description}</Text>}
          <View style={sc.meta}>
            {item.price!=null && <Text style={sc.metaTxt}>${Number(item.price).toFixed(2)}</Text>}
            {item.duration!=null && <Text style={sc.metaTxt}>{item.duration}m</Text>}
            {!!item.category && <Text style={sc.metaTxt}>{item.category}</Text>}
            {item.deposit!=null && item.deposit>0 && <Text style={sc.metaTxt}>Deposit: ${item.deposit}</Text>}
          </View>
          {(item.prepMin||item.appMin||item.finMin) && (
            <View style={sc.stages}>
              {item.prepMin>0 && <Text style={sc.stagePill}>🔧 {item.prepMin}m</Text>}
              {item.appMin>0 && <Text style={sc.stagePill}>✂️ {item.appMin}m</Text>}
              {item.finMin>0 && <Text style={sc.stagePill}>✨ {item.finMin}m</Text>}
            </View>
          )}
        </View>
        <View style={sc.actions}>
          <Switch value={item.visible!==false} onValueChange={onToggle} trackColor={{true:C.rose,false:C.border}} thumbColor={C.white} />
          <TouchableOpacity style={sc.editBtn} onPress={onEdit}><Text style={sc.editTxt}>Edit</Text></TouchableOpacity>
          <TouchableOpacity style={sc.deleteBtn} onPress={onDelete}><Text style={sc.deleteTxt}>✕</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
const TABS = ['Services', 'Add-ons', 'Promos'];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [tab, setTab] = useState(0);

  // Services tab
  const [services, setServices] = useState<any[]>([]);
  const [svcModal, setSvcModal] = useState(false);
  const [editSvc, setEditSvc]   = useState<any>(null);

  // Add-ons tab
  const [addons, setAddons]     = useState<any[]>([]);
  const [addonModal, setAddonModal] = useState(false);
  const [editAddon, setEditAddon]   = useState<any>(null);

  // Promos tab
  const [promos, setPromos]     = useState<any[]>([]);
  const [promoModal, setPromoModal] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const r = await OwnerApi.settings(token);
      const st = r.settings || {};
      setSettings(st);
      // servicesCatalog is stored as { services: [...], addons: [...], ownerId, profession }
      const cat = st.servicesCatalog || {};
      setServices(Array.isArray(cat.services) ? cat.services : []);
      setAddons(Array.isArray(cat.addons) ? cat.addons : []);
    } catch {}
    // Load promos separately
    try {
      const pr = await OwnerApi.listPromos(token);
      setPromos(Array.isArray(pr.codes) ? pr.codes : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async (newSettings: any) => {
    if (!token) return;
    setSaving(true);
    try { await SettingsApi.save(token, { ...settings, ...newSettings }); setSettings((s:any) => ({ ...s, ...newSettings })); }
    catch (e:any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  // Helper: build the merged servicesCatalog object (matches PWA schema)
  const buildCatalog = (newServices: any[], newAddons: any[]) => ({
    ...(settings?.servicesCatalog || {}),
    services: newServices,
    addons: newAddons,
  });

  // ── Services CRUD ──
  const saveService = async (svc: any) => {
    const updated = editSvc ? services.map(s => s.id===svc.id ? svc : s) : [...services, svc];
    setServices(updated);
    setSvcModal(false); setEditSvc(null);
    await saveSettings({ servicesCatalog: buildCatalog(updated, addons) });
  };
  const deleteService = (id: string) => {
    Alert.alert('Delete Service', 'Remove this service from your catalog?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        const updated = services.filter(s => s.id !== id);
        setServices(updated);
        await saveSettings({ servicesCatalog: buildCatalog(updated, addons) });
      }},
    ]);
  };
  const toggleService = async (id: string, visible: boolean) => {
    const updated = services.map(s => s.id===id ? { ...s, visible } : s);
    setServices(updated);
    await saveSettings({ servicesCatalog: buildCatalog(updated, addons) });
  };

  // ── Add-ons CRUD ──
  const saveAddon = async (addon: any) => {
    const updated = editAddon ? addons.map(a => a.id===addon.id ? addon : a) : [...addons, addon];
    setAddons(updated);
    setAddonModal(false); setEditAddon(null);
    await saveSettings({ servicesCatalog: buildCatalog(services, updated) });
  };
  const deleteAddon = (id: string) => {
    Alert.alert('Delete Add-on','Remove this add-on?',[
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        const updated = addons.filter(a => a.id!==id);
        setAddons(updated); await saveSettings({ servicesCatalog: buildCatalog(services, updated) });
      }},
    ]);
  };

  // ── Promos CRUD ──
  const savePromo = async (promo: any) => {
    if (!token) return;
    try { await OwnerApi.createPromo(token, promo); await load(true); }
    catch (e:any) { Alert.alert('Error', e.message); }
    setPromoModal(false);
  };
  const deletePromo = (id: string) => {
    Alert.alert('Delete Promo','Remove this promo code?',[
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        if (!token) return;
        try { await OwnerApi.deletePromo(token, id); setPromos(ps => ps.filter(p => p.id!==id)); }
        catch (e:any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.heading}>Services & Pricing</Text>
        {saving && <ActivityIndicator color={C.rose} size="small" />}
      </View>
      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map((t,i) => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab===i && s.tabBtnOn]} onPress={() => setTab(i)}>
            <Text style={[s.tabBtnTxt, tab===i && s.tabBtnTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator style={{marginTop:60}} color={C.rose} size="large" /> : (
        <>
          {/* ── SERVICES TAB ── */}
          {tab === 0 && (
            <ScrollView contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.rose} />}>
              <TouchableOpacity style={s.addRowBtn} onPress={() => { setEditSvc(null); setSvcModal(true); }}>
                <Text style={s.addRowBtnTxt}>＋ Add Service</Text>
              </TouchableOpacity>
              {services.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyTxt}>No services yet. Add your first service above.</Text></View>
              ) : services.map((sv, i) => (
                <ServiceCard key={sv.id||i} item={sv}
                  onEdit={() => { setEditSvc(sv); setSvcModal(true); }}
                  onDelete={() => deleteService(sv.id)}
                  onToggle={(v) => toggleService(sv.id, v)} />
              ))}
            </ScrollView>
          )}

          {/* ── ADD-ONS TAB ── */}
          {tab === 1 && (
            <ScrollView contentContainerStyle={s.list}>
              <TouchableOpacity style={s.addRowBtn} onPress={() => { setEditAddon(null); setAddonModal(true); }}>
                <Text style={s.addRowBtnTxt}>＋ Add Add-on</Text>
              </TouchableOpacity>
              {addons.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyTxt}>No add-ons yet.</Text></View>
              ) : addons.map((a, i) => (
                <View key={a.id||i} style={sc.card}>
                  <View style={sc.top}>
                    <View style={{flex:1}}>
                      <Text style={sc.name}>{a.name}</Text>
                      <View style={sc.meta}>
                        {a.price!=null && <Text style={sc.metaTxt}>${Number(a.price).toFixed(2)}</Text>}
                        {!!a.linkedService && a.linkedService!=='all' && <Text style={sc.metaTxt}>Linked: {a.linkedService}</Text>}
                      </View>
                    </View>
                    <View style={sc.actions}>
                      <TouchableOpacity style={sc.editBtn} onPress={() => { setEditAddon(a); setAddonModal(true); }}><Text style={sc.editTxt}>Edit</Text></TouchableOpacity>
                      <TouchableOpacity style={sc.deleteBtn} onPress={() => deleteAddon(a.id)}><Text style={sc.deleteTxt}>✕</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* ── PROMOS TAB ── */}
          {tab === 2 && (
            <ScrollView contentContainerStyle={s.list}>
              <TouchableOpacity style={s.addRowBtn} onPress={() => setPromoModal(true)}>
                <Text style={s.addRowBtnTxt}>＋ Add Promo Code</Text>
              </TouchableOpacity>
              {promos.length === 0 ? (
                <View style={s.empty}><Text style={s.emptyTxt}>No promo codes yet.</Text></View>
              ) : promos.map((p, i) => (
                <View key={p.id||i} style={sc.card}>
                  <View style={sc.top}>
                    <View style={{flex:1}}>
                      <Text style={sc.name}>{p.code}</Text>
                      <View style={sc.meta}>
                        <Text style={sc.metaTxt}>{p.type==='percentage'?`${p.value}% off`:`$${p.value} off`}</Text>
                        {p.usageLimit && <Text style={sc.metaTxt}>Limit: {p.usageLimit}</Text>}
                        {p.expiresAt && <Text style={sc.metaTxt}>Exp: {p.expiresAt}</Text>}
                        <View style={[sc.badge, {backgroundColor: p.active?C.success+'20':'#9CA3AF20'}]}>
                          <Text style={[sc.badgeTxt, {color: p.active?C.success:'#9CA3AF'}]}>{p.active?'Active':'Inactive'}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity style={sc.deleteBtn} onPress={() => deletePromo(p.id)}><Text style={sc.deleteTxt}>✕</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      <ServiceModal visible={svcModal} service={editSvc} onClose={() => { setSvcModal(false); setEditSvc(null); }} onSave={saveService} />
      <AddonModal visible={addonModal} addon={editAddon} services={services} onClose={() => { setAddonModal(false); setEditAddon(null); }} onSave={saveAddon} />
      <PromoModal visible={promoModal} onClose={() => setPromoModal(false)} onSave={savePromo} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:C.cream },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  heading:   { fontSize:22, fontWeight:'900', color:C.charcoal, fontFamily:'Georgia' },
  tabBar:    { flexDirection:'row', backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border },
  tabBtn:    { flex:1, paddingVertical:12, alignItems:'center' },
  tabBtnOn:  { borderBottomWidth:2, borderBottomColor:C.rose },
  tabBtnTxt: { fontSize:13, fontWeight:'600', color:C.soft },
  tabBtnTxtOn:{ color:C.rose, fontWeight:'800' },
  list:      { padding:14, gap:10 },
  addRowBtn: { borderRadius:12, borderWidth:1.5, borderColor:C.rose, borderStyle:'dashed', paddingVertical:14, alignItems:'center' },
  addRowBtnTxt:{ color:C.rose, fontWeight:'800', fontSize:14 },
  empty:     { padding:40, alignItems:'center' },
  emptyTxt:  { color:C.soft, fontSize:14, textAlign:'center' },
});

const sc = StyleSheet.create({
  card:     { backgroundColor:C.white, borderRadius:14, borderWidth:1, borderColor:C.border, overflow:'hidden', padding:14 },
  top:      { flexDirection:'row', alignItems:'flex-start', gap:10 },
  name:     { fontSize:15, fontWeight:'800', color:C.charcoal },
  desc:     { fontSize:12, color:C.soft, marginTop:2 },
  meta:     { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:6 },
  metaTxt:  { fontSize:11, color:C.mid, backgroundColor:C.cream, paddingHorizontal:8, paddingVertical:3, borderRadius:999 },
  stages:   { flexDirection:'row', gap:6, marginTop:6 },
  stagePill:{ fontSize:11, color:C.rose, backgroundColor:C.pinkLight, paddingHorizontal:8, paddingVertical:3, borderRadius:999 },
  actions:  { alignItems:'flex-end', gap:6 },
  editBtn:  { borderRadius:8, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:C.border },
  editTxt:  { fontSize:12, fontWeight:'700', color:C.charcoal },
  deleteBtn:{ borderRadius:8, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:'rgba(239,68,68,0.3)', backgroundColor:'rgba(239,68,68,0.06)' },
  deleteTxt:{ fontSize:12, fontWeight:'700', color:'#EF4444' },
  badge:    { paddingHorizontal:8, paddingVertical:2, borderRadius:999 },
  badgeTxt: { fontSize:10, fontWeight:'700' },
});

const sm = StyleSheet.create({
  container: { flex:1, backgroundColor:C.cream },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, borderBottomWidth:1, borderBottomColor:C.border },
  title:     { fontSize:16, fontWeight:'800', color:C.charcoal },
  cancelTxt: { fontSize:15, color:C.soft, fontWeight:'600' },
  saveTxt:   { fontSize:15, color:C.rose, fontWeight:'800' },
  scroll:    { padding:18, gap:2 },
  label:     { fontSize:10, fontWeight:'800', letterSpacing:1, color:C.soft, textTransform:'uppercase', marginTop:16, marginBottom:6 },
  input:     { backgroundColor:C.white, borderRadius:12, padding:13, fontSize:14, color:C.charcoal, borderWidth:1, borderColor:C.border },
  row2:      { flexDirection:'row', gap:12 },
  row3:      { flexDirection:'row', gap:8 },
  stageLbl:  { fontSize:10, fontWeight:'700', color:C.soft, marginBottom:4 },
  chip:      { paddingHorizontal:14, paddingVertical:7, borderRadius:999, borderWidth:1, borderColor:C.border, backgroundColor:C.white },
  chipOn:    { backgroundColor:C.rose, borderColor:C.rose },
  chipTxt:   { fontSize:12, fontWeight:'600', color:C.soft },
  chipTxtOn: { color:C.white, fontWeight:'800' },
  colorDot:  { width:32, height:32, borderRadius:16 },
  colorDotOn:{ borderWidth:3, borderColor:C.charcoal },
  toggleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14, borderTopWidth:1, borderTopColor:C.border, marginTop:16 },
  toggleLabel:{ fontSize:14, fontWeight:'700', color:C.charcoal },
  toggleSub:  { fontSize:12, color:C.soft, marginTop:2 },
});
