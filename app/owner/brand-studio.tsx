import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const CATS  = ['hair','nails','lashes','brows','skin','makeup','waxing'];
const FONTS = ['Default (DM Sans)','Playfair Display','Georgia','Raleway','Cormorant Garamond'];
const COLOR_PRESETS = [
  { name: 'Rose', primary: '#C85D7A', accent: '#FDE8EF' },
  { name: 'Charcoal', primary: '#1C1C1E', accent: '#F5F5F5' },
  { name: 'Gold', primary: '#C9A96E', accent: '#FFF8EC' },
  { name: 'Sage', primary: '#7C9A7E', accent: '#EEF4EF' },
  { name: 'Navy', primary: '#1B3A6B', accent: '#EEF2F8' },
  { name: 'Plum', primary: '#6B2D5E', accent: '#F5EEF4' },
];
const STEPS = ['Identity','Visual','Booking Link','Your Voice','Gallery','Preview'];

export default function BrandStudioScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Step 1 — Identity
  const [studioName, setStudioName] = useState('');
  const [tagline, setTagline]       = useState('');
  const [bio, setBio]               = useState('');
  const [city, setCity]             = useState('');
  const [category, setCategory]     = useState('');
  const [onDiscovery, setOnDiscovery] = useState(true);

  // Step 2 — Visual
  const [primaryColor, setPrimary]  = useState(Colors.rose);
  const [accentColor, setAccent]    = useState(Colors.pinkLight);
  const [displayFont, setDisplayFont] = useState(FONTS[0]);

  // Step 3 — Booking Link
  const [slug, setSlug]             = useState('');
  const [instagram, setInstagram]   = useState('');
  const [tiktok, setTiktok]         = useState('');

  // Step 4 — Voice
  const [senderName, setSenderName]       = useState('');
  const [confirmNote, setConfirmNote]     = useState('');
  const [cancelNote, setCancelNote]       = useState('');
  const [announcementText, setAnnouncement] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    if (!token) return;
    SettingsApi.get(token).then(r => {
      const st = r?.settings || {};
      setStudioName(st.studioName || '');
      setTagline(st.tagline || '');
      setBio(st.bio || '');
      setCity(st.city || '');
      setCategory(st.category || '');
      setOnDiscovery(st.onDiscovery !== false);
      setPrimary(st.primaryColor || Colors.rose);
      setAccent(st.accentColor  || Colors.pinkLight);
      setDisplayFont(st.displayFont || FONTS[0]);
      setSlug(st.bookingSlug || '');
      setInstagram(st.instagram || '');
      setTiktok(st.tiktok || '');
      setSenderName(st.senderName || '');
      setConfirmNote(st.confirmationNote || '');
      setCancelNote(st.cancellationNote || '');
      setAnnouncement(st.announcementText || '');
      setShowAnnouncement(!!st.showAnnouncement);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await SettingsApi.save(token, {
        studioName, tagline, bio, city, category, onDiscovery,
        primaryColor, accentColor, displayFont,
        bookingSlug: slug.toLowerCase().replace(/[^a-z0-9-]/g,''),
        instagram, tiktok, senderName,
        confirmationNote: confirmNote, cancellationNote: cancelNote,
        announcementText, showAnnouncement,
      });
      Alert.alert('Saved!', 'Your brand settings have been updated.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.rose} size="large" /></View>;

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <Text style={s.stepTitle}>Tell us about your business</Text>
          <Text style={s.stepSub}>This info appears on your booking page and client emails.</Text>
          <Text style={s.label}>Studio Name *</Text>
          <TextInput style={s.input} value={studioName} onChangeText={setStudioName} placeholder="My Studio" placeholderTextColor={Colors.soft} />
          <Text style={s.label}>Tagline</Text>
          <TextInput style={s.input} value={tagline} onChangeText={setTagline} placeholder="Short and punchy" placeholderTextColor={Colors.soft} />
          <Text style={s.label}>Short Bio (max 150 chars)</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={bio} onChangeText={t => setBio(t.slice(0,150))} placeholder="What makes you unique..." placeholderTextColor={Colors.soft} multiline />
          <Text style={s.charCount}>{bio.length}/150</Text>
          <Text style={s.label}>City</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="Toronto, ON" placeholderTextColor={Colors.soft} />
          <Text style={s.label}>Service Category</Text>
          <View style={s.chipRow}>
            {CATS.map(c => <TouchableOpacity key={c} style={[s.chip, category===c && s.chipOn]} onPress={() => setCategory(c)}><Text style={[s.chipTxt, category===c && s.chipTxtOn]}>{c}</Text></TouchableOpacity>)}
          </View>
          <View style={s.toggleRow}>
            <View>
              <Text style={s.toggleLabel}>List on PinkBook Discovery</Text>
              <Text style={s.toggleSub}>Clients can find and book you via discovery</Text>
            </View>
            <Switch value={onDiscovery} onValueChange={setOnDiscovery} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
          </View>
        </>
      );
      case 1: return (
        <>
          <Text style={s.stepTitle}>Your visual identity</Text>
          <Text style={s.stepSub}>Choose brand colors and font for your booking page.</Text>
          <Text style={s.label}>Brand Color Preset</Text>
          <View style={s.colorGrid}>
            {COLOR_PRESETS.map(c => (
              <TouchableOpacity key={c.name} style={[s.colorSwatch, { backgroundColor: c.primary, borderWidth: primaryColor===c.primary ? 3 : 0, borderColor: Colors.charcoal }]} onPress={() => { setPrimary(c.primary); setAccent(c.accent); }}>
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700', textAlign: 'center' }}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.colorPreview}>
            <View style={[s.colorDot, { backgroundColor: primaryColor }]} />
            <Text style={s.colorCode}>{primaryColor}</Text>
            <View style={[s.colorDot, { backgroundColor: accentColor, borderWidth: 1, borderColor: Colors.border }]} />
            <Text style={s.colorCode}>{accentColor}</Text>
          </View>
          <Text style={s.label}>Display / Heading Font</Text>
          {FONTS.map(f => (
            <TouchableOpacity key={f} style={[s.fontRow, displayFont===f && s.fontRowOn]} onPress={() => setDisplayFont(f)}>
              <Text style={[s.fontName, displayFont===f && { color: Colors.rose }]}>{f}</Text>
              <Text style={[s.fontSample, { fontFamily: f.includes('Georgia') ? 'Georgia' : undefined }, displayFont===f && { color: Colors.rose }]}>Aa Bb Cc</Text>
            </TouchableOpacity>
          ))}
        </>
      );
      case 2: return (
        <>
          <Text style={s.stepTitle}>Claim your booking link</Text>
          <Text style={s.stepSub}>Your Pinkbook address: pinkbook.app/[your-slug]</Text>
          <Text style={s.label}>Booking Slug</Text>
          <View style={s.slugRow}>
            <Text style={s.slugPrefix}>pinkbook.app/</Text>
            <TextInput style={[s.input, { flex: 1 }]} value={slug} onChangeText={t => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="my-studio" placeholderTextColor={Colors.soft} autoCapitalize="none" />
          </View>
          <Text style={s.label}>Instagram (optional)</Text>
          <TextInput style={s.input} value={instagram} onChangeText={setInstagram} placeholder="@yourstudio" placeholderTextColor={Colors.soft} autoCapitalize="none" />
          <Text style={s.label}>TikTok (optional)</Text>
          <TextInput style={s.input} value={tiktok} onChangeText={setTiktok} placeholder="@yourstudio" placeholderTextColor={Colors.soft} autoCapitalize="none" />
        </>
      );
      case 3: return (
        <>
          <Text style={s.stepTitle}>How you communicate</Text>
          <Text style={s.stepSub}>Customise messages clients receive so they sound like you.</Text>
          <Text style={s.label}>Sender Name</Text>
          <TextInput style={s.input} value={senderName} onChangeText={setSenderName} placeholder="Jane at My Studio" placeholderTextColor={Colors.soft} />
          <Text style={s.label}>Booking Confirmation Note (max 200)</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={confirmNote} onChangeText={t => setConfirmNote(t.slice(0,200))} placeholder="Can't wait to see you! Please arrive 5 min early." placeholderTextColor={Colors.soft} multiline />
          <Text style={s.charCount}>{confirmNote.length}/200</Text>
          <Text style={s.label}>Cancellation Note (max 200)</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={cancelNote} onChangeText={t => setCancelNote(t.slice(0,200))} placeholder="Sorry to see you go! Feel free to rebook anytime." placeholderTextColor={Colors.soft} multiline />
          <Text style={s.charCount}>{cancelNote.length}/200</Text>
          <Text style={s.label}>Announcement Banner</Text>
          <TextInput style={[s.input, { height: 60, textAlignVertical: 'top' }]} value={announcementText} onChangeText={setAnnouncement} placeholder="🌸 Now accepting new clients for spring!" placeholderTextColor={Colors.soft} multiline />
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Show announcement on booking page</Text>
            <Switch value={showAnnouncement} onValueChange={setShowAnnouncement} trackColor={{ false: Colors.border, true: Colors.rose }} thumbColor={Colors.white} />
          </View>
        </>
      );
      case 4: return (
        <>
          <Text style={s.stepTitle}>Service Gallery</Text>
          <Text style={s.stepSub}>Your portfolio photos appear on your discover listing and booking page.</Text>
          <View style={s.galleryPlaceholder}>
            <Text style={{ fontSize: 40 }}>📸</Text>
            <Text style={s.galleryTitle}>Upload Portfolio Photos</Text>
            <Text style={s.gallerySub}>Photo upload coming in the next update. Add gallery images from pinkbook.app on desktop.</Text>
          </View>
        </>
      );
      case 5: return (
        <>
          <Text style={s.stepTitle}>Your booking page preview</Text>
          <Text style={s.stepSub}>This is how clients see your page. Save to apply changes.</Text>
          <View style={[s.previewCard, { borderColor: primaryColor, borderWidth: 2 }]}>
            <View style={[s.previewHeader, { backgroundColor: primaryColor }]}>
              <Text style={s.previewLogo}>{studioName || 'My Studio'}</Text>
              {!!tagline && <Text style={s.previewTagline}>{tagline}</Text>}
            </View>
            <View style={s.previewBody}>
              {!!bio && <Text style={s.previewBio}>{bio}</Text>}
              {!!city && <Text style={s.previewCity}>📍 {city}</Text>}
              {!!category && <View style={[s.previewCat, { backgroundColor: accentColor }]}><Text style={[s.previewCatTxt, { color: primaryColor }]}>{category.toUpperCase()}</Text></View>}
              <View style={[s.previewBookBtn, { backgroundColor: primaryColor }]}>
                <Text style={s.previewBookTxt}>Book Now</Text>
              </View>
            </View>
          </View>
          {!!slug && <Text style={s.previewLink}>🔗 pinkbook.app/{slug}</Text>}
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: Colors.charcoal }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.saveBtnTxt}>Save All Changes</Text>}
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Brand Studio</Text>
          <View style={{ width: 60 }} />
        </View>
        {/* Step progress bar */}
        <View style={s.stepBar}>
          {STEPS.map((name, i) => (
            <TouchableOpacity key={i} style={[s.stepDot, i === step && s.stepDotActive, i < step && s.stepDotDone]} onPress={() => setStep(i)}>
              <Text style={[s.stepNum, (i === step || i < step) && { color: Colors.white }]}>{i < step ? '✓' : i+1}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.stepLabel}>
          <Text style={s.stepLabelTxt}>Step {step+1} of {STEPS.length}: {STEPS[step]}</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          {renderStep()}
          <View style={{ height: 20 }} />
        </ScrollView>
        <View style={[s.navBar, { paddingBottom: insets.bottom + 8 }]}>
          {step > 0 && <TouchableOpacity style={s.navBack} onPress={() => setStep(s => s-1)}><Text style={s.navBackTxt}>← Back</Text></TouchableOpacity>}
          {step < STEPS.length-1
            ? <TouchableOpacity style={s.navNext} onPress={() => setStep(s => s+1)}><Text style={s.navNextTxt}>Next: {STEPS[step+1]} →</Text></TouchableOpacity>
            : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.cream },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:           { color: Colors.rose, fontWeight: '700', fontSize: 14, width: 60 },
  title:          { fontSize: 16, fontWeight: '800', color: Colors.charcoal },
  stepBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 20 },
  stepDot:        { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:  { backgroundColor: Colors.rose, borderColor: Colors.rose },
  stepDotDone:    { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  stepNum:        { fontSize: 12, fontWeight: '800', color: Colors.soft },
  stepLabel:      { paddingHorizontal: 20, paddingBottom: 10 },
  stepLabelTxt:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.rose },
  scroll:         { padding: 20, gap: 4 },
  stepTitle:      { fontSize: 20, fontWeight: '900', color: Colors.charcoal, fontFamily: 'Georgia', marginBottom: 6 },
  stepSub:        { fontSize: 13, color: Colors.soft, lineHeight: 18, marginBottom: 20 },
  label:          { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginTop: 16, marginBottom: 6 },
  input:          { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border },
  charCount:      { fontSize: 11, color: Colors.soft, textAlign: 'right', marginTop: 4 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipOn:         { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt:        { fontSize: 12, fontWeight: '600', color: Colors.soft },
  chipTxtOn:      { color: Colors.white, fontWeight: '700' },
  toggleRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  toggleLabel:    { fontSize: 14, fontWeight: '700', color: Colors.charcoal, flex: 1, marginRight: 12 },
  toggleSub:      { fontSize: 12, color: Colors.soft, marginTop: 2 },
  colorGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorSwatch:    { width: 70, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  colorPreview:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 14, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  colorDot:       { width: 32, height: 32, borderRadius: 16 },
  colorCode:      { fontSize: 12, fontWeight: '700', color: Colors.charcoal, flex: 1 },
  fontRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, marginTop: 6, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  fontRowOn:      { borderColor: Colors.rose, backgroundColor: Colors.pinkLight + '30' },
  fontName:       { fontSize: 13, fontWeight: '600', color: Colors.charcoal, flex: 1 },
  fontSample:     { fontSize: 16, color: Colors.soft },
  slugRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slugPrefix:     { fontSize: 13, color: Colors.soft, fontWeight: '600' },
  galleryPlaceholder: { alignItems: 'center', padding: 40, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', gap: 10 },
  galleryTitle:   { fontSize: 16, fontWeight: '700', color: Colors.charcoal },
  gallerySub:     { fontSize: 13, color: Colors.soft, textAlign: 'center', lineHeight: 20 },
  previewCard:    { borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.white, marginTop: 8 },
  previewHeader:  { padding: 20, alignItems: 'center' },
  previewLogo:    { fontSize: 22, fontWeight: '900', color: Colors.white, fontFamily: 'Georgia' },
  previewTagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  previewBody:    { padding: 20, gap: 10 },
  previewBio:     { fontSize: 13, color: Colors.mid, lineHeight: 19 },
  previewCity:    { fontSize: 12, color: Colors.soft },
  previewCat:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  previewCatTxt:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  previewBookBtn: { borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  previewBookTxt: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  previewLink:    { textAlign: 'center', fontSize: 13, color: Colors.rose, fontWeight: '600', marginTop: 12 },
  saveBtn:        { borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnTxt:     { color: Colors.white, fontWeight: '800', fontSize: 15 },
  navBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  navBack:        { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  navBackTxt:     { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  navNext:        { flex: 1, paddingVertical: 13, borderRadius: 999, backgroundColor: Colors.rose, alignItems: 'center', marginLeft: 8 },
  navNextTxt:     { fontSize: 14, fontWeight: '800', color: Colors.white },
});
