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

function cents(n: number) { return `$${(n / 100).toFixed(2)}`; }

// ─── Item Modal ───────────────────────────────────────────────────────────────

function ItemModal({
  item,
  onSave,
  onClose,
}: {
  item: any | null;
  onSave: (body: any) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName]     = useState(item?.name || '');
  const [sku, setSku]       = useState(item?.sku || '');
  const [desc, setDesc]     = useState(item?.description || '');
  const [price, setPrice]   = useState(item?.price_cents ? (item.price_cents / 100).toFixed(2) : '');
  const [stock, setStock]   = useState(String(item?.stock_count ?? 0));
  const [cat, setCat]       = useState(item?.category || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Enter an item name.'); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        sku: sku.trim() || undefined,
        description: desc.trim() || undefined,
        price_cents: Math.round(parseFloat(price.replace(/[^0-9.]/g, '')) * 100) || 0,
        stock_count: parseInt(stock) || 0,
        category: cat.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>{item ? 'Edit Item' : 'New Item'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.rose} /> : <Text style={m.save}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={m.label}>Item Name *</Text>
          <TextInput style={m.input} value={name} onChangeText={setName} placeholder="e.g. Olaplex No.3" placeholderTextColor={Colors.soft} />
          <Text style={m.label}>SKU / Barcode</Text>
          <TextInput style={m.input} value={sku} onChangeText={setSku} placeholder="Optional" placeholderTextColor={Colors.soft} />
          <Text style={m.label}>Category</Text>
          <TextInput style={m.input} value={cat} onChangeText={setCat} placeholder="e.g. Hair Care, Tools, Retail" placeholderTextColor={Colors.soft} />
          <Text style={m.label}>Description</Text>
          <TextInput style={[m.input, { minHeight: 80 }]} value={desc} onChangeText={setDesc} placeholder="Optional" placeholderTextColor={Colors.soft} multiline />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={m.label}>Retail Price</Text>
              <TextInput style={m.input} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor={Colors.soft} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={m.label}>Stock Count</Text>
              <TextInput style={m.input} value={stock} onChangeText={setStock} placeholder="0" placeholderTextColor={Colors.soft} keyboardType="number-pad" />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Stock Adjust Modal ───────────────────────────────────────────────────────

function StockModal({ item, onSave, onClose }: { item: any; onSave: (delta: number, reason: string) => Promise<void>; onClose: () => void }) {
  const [delta, setDelta]   = useState('');
  const [reason, setReason] = useState('');
  const [dir, setDir]       = useState<'add' | 'remove'>('add');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = parseInt(delta);
    if (!n || n < 1) { Alert.alert('Invalid', 'Enter a positive number.'); return; }
    setSaving(true);
    try {
      await onSave(dir === 'add' ? n : -n, reason.trim());
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>Adjust Stock — {item.name}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.rose} /> : <Text style={m.save}>Save</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ padding: 20, gap: 14 }}>
          <Text style={m.label}>Current Stock: {item.stock_count ?? 0}</Text>
          <View style={m.segRow}>
            <TouchableOpacity style={[m.seg, dir === 'add' && m.segActive]} onPress={() => setDir('add')}>
              <Text style={[m.segTxt, dir === 'add' && m.segTxtActive]}>➕ Add Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.seg, dir === 'remove' && m.segActive]} onPress={() => setDir('remove')}>
              <Text style={[m.segTxt, dir === 'remove' && m.segTxtActive]}>➖ Remove Stock</Text>
            </TouchableOpacity>
          </View>
          <Text style={m.label}>Quantity</Text>
          <TextInput style={m.input} value={delta} onChangeText={setDelta} placeholder="e.g. 5" keyboardType="number-pad" placeholderTextColor={Colors.soft} />
          <Text style={m.label}>Reason (optional)</Text>
          <TextInput style={m.input} value={reason} onChangeText={setReason} placeholder="e.g. Restock, Sold, Damaged" placeholderTextColor={Colors.soft} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [items, setItems]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState<any | null>(null);
  const [stockItem, setStockItem] = useState<any | null>(null);
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await OwnerApi.listInventory(token);
      setItems(res.items || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load inventory');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const deleteItem = (id: string) => {
    Alert.alert('Delete Item', 'Remove this item from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await OwnerApi.deleteInventoryItem(token!, id); setItems(i => i.filter(x => x.id !== id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const filtered = items.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = items.reduce((sum, i) => sum + (i.price_cents || 0) * (i.stock_count || 0), 0);
  const lowStock = items.filter(i => (i.stock_count || 0) <= 3 && (i.stock_count || 0) > 0);
  const outOfStock = items.filter(i => (i.stock_count || 0) === 0);

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.charcoal} /></TouchableOpacity>
        <Text style={s.pageTitle}>Inventory</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      {items.length > 0 && (
        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{items.length}</Text>
            <Text style={s.statLabel}>Items</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{cents(totalValue)}</Text>
            <Text style={s.statLabel}>Total Value</Text>
          </View>
          {lowStock.length > 0 && (
            <View style={[s.statItem, { backgroundColor: Colors.gold + '20' }]}>
              <Text style={[s.statValue, { color: Colors.gold }]}>{lowStock.length}</Text>
              <Text style={[s.statLabel, { color: Colors.gold }]}>Low Stock</Text>
            </View>
          )}
          {outOfStock.length > 0 && (
            <View style={[s.statItem, { backgroundColor: Colors.error + '15' }]}>
              <Text style={[s.statValue, { color: Colors.error }]}>{outOfStock.length}</Text>
              <Text style={[s.statLabel, { color: Colors.error }]}>Out of Stock</Text>
            </View>
          )}
        </View>
      )}

      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.soft} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search items, SKU, category…"
          placeholderTextColor={Colors.soft}
        />
        {!!search && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close" size={16} color={Colors.soft} /></TouchableOpacity>}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {filtered.length === 0 && !loading && (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📦</Text>
            <Text style={s.emptyTitle}>{items.length === 0 ? 'No Items Yet' : 'No Results'}</Text>
            <Text style={s.emptySub}>{items.length === 0 ? 'Track retail products, tools, and supplies.' : 'Try a different search term.'}</Text>
            {items.length === 0 && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={s.emptyBtnTxt}>+ Add First Item</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {filtered.map(item => {
          const isLow = (item.stock_count || 0) <= 3 && (item.stock_count || 0) > 0;
          const isOut = (item.stock_count || 0) === 0;
          return (
            <View key={item.id} style={s.itemCard}>
              <View style={s.itemHeader}>
                <View style={[s.itemIcon, { backgroundColor: isOut ? Colors.error + '20' : isLow ? Colors.gold + '20' : Colors.pinkLight }]}>
                  <Text style={{ fontSize: 20 }}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemMeta}>
                    {item.category ? `${item.category}  ·  ` : ''}{item.sku ? `SKU: ${item.sku}` : ''}
                  </Text>
                </View>
                <Text style={s.itemPrice}>{cents(item.price_cents || 0)}</Text>
              </View>
              <View style={s.itemFooter}>
                <View style={[s.stockBadge, { backgroundColor: isOut ? Colors.error + '20' : isLow ? Colors.gold + '20' : Colors.success + '20' }]}>
                  <Text style={[s.stockTxt, { color: isOut ? Colors.error : isLow ? Colors.gold : Colors.success }]}>
                    {isOut ? 'Out of stock' : `${item.stock_count} in stock`}
                  </Text>
                </View>
                <View style={s.itemActions}>
                  <TouchableOpacity onPress={() => setStockItem(item)} style={s.actionBtn}>
                    <Ionicons name="swap-vertical-outline" size={16} color={Colors.rose} />
                    <Text style={s.actionTxt}>Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditItem(item)} style={s.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color={Colors.soft} />
                    <Text style={s.actionTxt}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={s.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showAdd && (
        <ItemModal
          item={null}
          onSave={async (body) => { const res = await OwnerApi.createInventoryItem(token!, body); setItems(i => [...i, res.item]); }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editItem && (
        <ItemModal
          item={editItem}
          onSave={async (body) => { const res = await OwnerApi.updateInventoryItem(token!, editItem.id, body); setItems(i => i.map(x => x.id === editItem.id ? res.item : x)); setEditItem(null); }}
          onClose={() => setEditItem(null)}
        />
      )}
      {stockItem && (
        <StockModal
          item={stockItem}
          onSave={async (delta, reason) => {
            const res = await OwnerApi.adjustStock(token!, stockItem.id, { delta, reason });
            setItems(i => i.map(x => x.id === stockItem.id ? res.item : x));
            setStockItem(null);
          }}
          onClose={() => setStockItem(null)}
        />
      )}
    </View>
  );
}

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { fontSize: 16, fontWeight: '800', color: Colors.charcoal, flex: 1, textAlign: 'center' },
  cancel:    { fontSize: 15, color: Colors.soft },
  save:      { fontSize: 15, color: Colors.rose, fontWeight: '800' },
  label:     { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  input:     { backgroundColor: Colors.cream, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  segRow:    { flexDirection: 'row', gap: 8 },
  seg:       { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  segActive: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  segTxt:    { fontSize: 12, fontWeight: '700', color: Colors.soft },
  segTxtActive: { color: Colors.white },
});

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  addBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.rose, alignItems: 'center', justifyContent: 'center' },
  statsBar:    { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  statItem:    { flex: 1, backgroundColor: Colors.pinkLight, borderRadius: 10, padding: 8, alignItems: 'center' },
  statValue:   { fontSize: 16, fontWeight: '900', color: Colors.charcoal },
  statLabel:   { fontSize: 10, color: Colors.soft, fontWeight: '600' },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.charcoal },
  scroll:      { padding: 16, gap: 10 },
  emptyBox:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji:  { fontSize: 48 },
  emptyTitle:  { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  emptySub:    { fontSize: 14, color: Colors.soft, textAlign: 'center' },
  emptyBtn:    { backgroundColor: Colors.rose, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  emptyBtnTxt: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  itemCard:    { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  itemHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemName:    { fontSize: 15, fontWeight: '800', color: Colors.charcoal },
  itemMeta:    { fontSize: 11, color: Colors.soft, marginTop: 1 },
  itemPrice:   { fontSize: 16, fontWeight: '800', color: Colors.rose },
  itemFooter:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  stockTxt:    { fontSize: 11, fontWeight: '700' },
  itemActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.cream },
  actionTxt:   { fontSize: 12, fontWeight: '700', color: Colors.soft },
});
