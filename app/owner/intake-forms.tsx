'use strict';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
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

// Field types the form builder supports
const FIELD_TYPES = [
  { type: 'text',       label: 'Short Text',   icon: '✏️' },
  { type: 'textarea',   label: 'Long Text',    icon: '📝' },
  { type: 'checkbox',   label: 'Yes / No',     icon: '☑️' },
  { type: 'select',     label: 'Dropdown',     icon: '🔽' },
  { type: 'number',     label: 'Number',       icon: '🔢' },
  { type: 'date',       label: 'Date',         icon: '📅' },
  { type: 'signature',  label: 'Signature',    icon: '✍️' },
];

function uid() { return Math.random().toString(36).slice(2, 10); }

interface Field {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];  // for select
  placeholder?: string;
}

interface IntakeForm {
  service_name?: string;
  fields: Field[];
  active: boolean;
}

// ─── Field Editor Modal ────────────────────────────────────────────────────────

function FieldModal({
  field,
  onSave,
  onClose,
}: {
  field: Partial<Field> | null;
  onSave: (f: Field) => void;
  onClose: () => void;
}) {
  const [type, setType]         = useState(field?.type || 'text');
  const [label, setLabel]       = useState(field?.label || '');
  const [required, setRequired] = useState(field?.required ?? false);
  const [options, setOptions]   = useState((field?.options || []).join('\n'));
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');

  const save = () => {
    if (!label.trim()) { Alert.alert('Required', 'Enter a field label.'); return; }
    const f: Field = {
      id: field?.id || uid(),
      type,
      label: label.trim(),
      required,
      placeholder: placeholder.trim() || undefined,
      options: type === 'select' ? options.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
    };
    onSave(f);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={fm.container}>
        <View style={fm.header}>
          <TouchableOpacity onPress={onClose}><Text style={fm.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={fm.title}>{field?.id ? 'Edit Field' : 'Add Field'}</Text>
          <TouchableOpacity onPress={save}><Text style={fm.save}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Text style={fm.label}>Field Type</Text>
          <View style={fm.typeGrid}>
            {FIELD_TYPES.map(ft => (
              <TouchableOpacity
                key={ft.type}
                style={[fm.typeBtn, type === ft.type && fm.typeBtnActive]}
                onPress={() => setType(ft.type)}
              >
                <Text style={{ fontSize: 20 }}>{ft.icon}</Text>
                <Text style={[fm.typeBtnTxt, type === ft.type && { color: Colors.white }]}>{ft.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={fm.label}>Question / Label *</Text>
          <TextInput
            style={fm.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Do you have any allergies?"
            placeholderTextColor={Colors.soft}
          />

          <Text style={fm.label}>Placeholder (optional)</Text>
          <TextInput
            style={fm.input}
            value={placeholder}
            onChangeText={setPlaceholder}
            placeholder="Hint shown inside the field"
            placeholderTextColor={Colors.soft}
          />

          {type === 'select' && (
            <>
              <Text style={fm.label}>Options (one per line)</Text>
              <TextInput
                style={[fm.input, { minHeight: 100 }]}
                value={options}
                onChangeText={setOptions}
                placeholder={"Option A\nOption B\nOption C"}
                placeholderTextColor={Colors.soft}
                multiline
              />
            </>
          )}

          <View style={fm.switchRow}>
            <Text style={fm.label}>Required</Text>
            <Switch value={required} onValueChange={setRequired} trackColor={{ true: Colors.rose }} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IntakeFormsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [forms, setForms]     = useState<IntakeForm[]>([]);
  const [selected, setSelected] = useState<IntakeForm | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editingField, setEditingField] = useState<Partial<Field> | null | 'new'>(null);
  const [activeFormIdx, setActiveFormIdx] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await OwnerApi.listIntakeForms(token);
      const f = res.forms || [];
      setForms(f);
      if (f.length > 0) setSelected(f[0]);
      else setSelected({ service_name: undefined, fields: [], active: true });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load intake forms');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const currentForm: IntakeForm = selected
    ? { ...selected, fields: selected.fields ?? [] }
    : { fields: [], active: true };

  const saveForm = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await OwnerApi.saveIntakeForm(token, {
        service_name: currentForm.service_name,
        fields: currentForm.fields,
        active: currentForm.active,
      });
      Alert.alert('Saved', 'Intake form saved successfully.');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save form');
    } finally {
      setSaving(false);
    }
  };

  const addNewForm = () => {
    const blank: IntakeForm = { service_name: undefined, fields: [], active: true };
    setForms(prev => [...prev, blank]);
    setSelected(blank);
  };

  const handleSaveField = (f: Field) => {
    const isNew = !currentForm.fields.find(x => x.id === f.id);
    const updated = isNew
      ? [...currentForm.fields, f]
      : currentForm.fields.map(x => (x.id === f.id ? f : x));
    setSelected({ ...currentForm, fields: updated });
    setEditingField(null);
  };

  const removeField = (id: string) => {
    Alert.alert('Remove Field', 'Remove this field from the form?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setSelected({ ...currentForm, fields: currentForm.fields.filter(f => f.id !== id) });
      }},
    ]);
  };

  const moveField = (id: string, dir: 'up' | 'down') => {
    const idx = currentForm.fields.findIndex(f => f.id === id);
    if (idx < 0) return;
    const arr = [...currentForm.fields];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    setSelected({ ...currentForm, fields: arr });
  };

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.rose} size="large" />
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Intake Forms</Text>
        <TouchableOpacity onPress={saveForm} disabled={saving} style={s.saveBtn}>
          {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={s.saveTxt}>Save</Text>}
        </TouchableOpacity>
      </View>

      {/* Form selector tabs */}
      {forms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
          {forms.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={[s.tab, selected === f && s.tabActive]}
              onPress={() => setSelected(f)}
            >
              <Text style={[s.tabTxt, selected === f && s.tabTxtActive]}>
                {f.service_name || 'General Form'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.tab} onPress={addNewForm}>
            <Text style={[s.tabTxt, { color: Colors.rose }]}>+ New Form</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {forms.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>No Intake Forms Yet</Text>
          <Text style={s.emptySub}>Collect client info before appointments — allergies, medical notes, preferences.</Text>
          <TouchableOpacity style={s.createBtn} onPress={addNewForm}>
            <Text style={s.createBtnTxt}>Create Your First Form</Text>
          </TouchableOpacity>
        </View>
      )}

      {selected && (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Form settings */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Form Settings</Text>
            <Text style={s.fieldLabel}>For Service (optional — blank = applies to all)</Text>
            <TextInput
              style={s.input}
              value={currentForm.service_name || ''}
              onChangeText={v => setSelected({ ...currentForm, service_name: v.trim() || undefined })}
              placeholder="e.g. Balayage, Lash Extensions"
              placeholderTextColor={Colors.soft}
            />
            <View style={s.switchRow}>
              <Text style={s.fieldLabel}>Form Active</Text>
              <Switch
                value={currentForm.active}
                onValueChange={v => setSelected({ ...currentForm, active: v })}
                trackColor={{ true: Colors.rose }}
              />
            </View>
          </View>

          {/* Fields */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Fields ({currentForm.fields.length})</Text>
              <TouchableOpacity style={s.addFieldBtn} onPress={() => setEditingField('new')}>
                <Ionicons name="add" size={16} color={Colors.white} />
                <Text style={s.addFieldTxt}>Add Field</Text>
              </TouchableOpacity>
            </View>
            {currentForm.fields.length === 0 && (
              <Text style={s.noFields}>No fields yet. Add questions clients will answer before their appointment.</Text>
            )}
            {currentForm.fields.map((f, i) => (
              <View key={f.id} style={s.fieldRow}>
                <View style={s.fieldInfo}>
                  <Text style={s.fieldType}>{FIELD_TYPES.find(t => t.type === f.type)?.icon || '📝'} {f.type}</Text>
                  <Text style={s.fieldName}>{f.label}</Text>
                  {f.required && <View style={s.reqBadge}><Text style={s.reqTxt}>Required</Text></View>}
                </View>
                <View style={s.fieldActions}>
                  <TouchableOpacity onPress={() => moveField(f.id, 'up')} disabled={i === 0} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-up" size={18} color={i === 0 ? Colors.border : Colors.soft} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveField(f.id, 'down')} disabled={i === currentForm.fields.length - 1} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-down" size={18} color={i === currentForm.fields.length - 1 ? Colors.border : Colors.soft} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingField(f)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="pencil-outline" size={18} color={Colors.soft} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeField(f.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtnFull} onPress={saveForm} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.saveBtnTxt}>💾 Save Form</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Field editor modal */}
      {editingField !== null && (
        <FieldModal
          field={editingField === 'new' ? {} : editingField}
          onSave={handleSaveField}
          onClose={() => setEditingField(null)}
        />
      )}
    </View>
  );
}

const fm = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.white },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:       { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  cancel:      { fontSize: 15, color: Colors.soft, fontWeight: '600' },
  save:        { fontSize: 15, color: Colors.rose, fontWeight: '800' },
  label:       { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input:       { backgroundColor: Colors.cream, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 4 },
  typeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border },
  typeBtnActive:{ backgroundColor: Colors.rose, borderColor: Colors.rose },
  typeBtnTxt:  { fontSize: 12, fontWeight: '700', color: Colors.charcoal },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
});

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.cream },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  saveBtn:     { backgroundColor: Colors.rose, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  saveTxt:     { color: Colors.white, fontWeight: '800', fontSize: 13 },
  tabBar:      { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 44 },
  tab:         { paddingHorizontal: 16, paddingVertical: 12 },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: Colors.rose },
  tabTxt:      { fontSize: 13, fontWeight: '700', color: Colors.soft },
  tabTxtActive:{ color: Colors.rose },
  scroll:      { padding: 16, gap: 12 },
  card:        { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle:   { fontSize: 15, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia' },
  fieldLabel:  { fontSize: 12, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input:       { backgroundColor: Colors.cream, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  addFieldBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.rose, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  addFieldTxt: { color: Colors.white, fontWeight: '800', fontSize: 12 },
  noFields:    { fontSize: 13, color: Colors.soft, textAlign: 'center', paddingVertical: 16 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  fieldInfo:   { flex: 1, gap: 2 },
  fieldType:   { fontSize: 11, color: Colors.soft, fontWeight: '600' },
  fieldName:   { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  fieldActions:{ flexDirection: 'row', gap: 8, alignItems: 'center' },
  reqBadge:    { backgroundColor: Colors.rose + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' },
  reqTxt:      { fontSize: 10, fontWeight: '700', color: Colors.rose },
  saveBtnFull: { backgroundColor: Colors.rose, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnTxt:  { color: Colors.white, fontWeight: '800', fontSize: 15 },
  emptyBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyEmoji:  { fontSize: 48 },
  emptyTitle:  { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', textAlign: 'center' },
  emptySub:    { fontSize: 14, color: Colors.soft, textAlign: 'center' },
  createBtn:   { backgroundColor: Colors.rose, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  createBtnTxt:{ color: Colors.white, fontWeight: '800', fontSize: 15 },
});
