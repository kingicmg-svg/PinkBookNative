import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi, SettingsApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const C = Colors;
const API_URL = process.env.EXPO_PUBLIC_PINKBOOK_API_URL?.replace(/\/$/, '') || 'https://www.pinkbook.app';

const CATS  = ['hair','nails','lashes','brows','skin','makeup','waxing'];
const FONTS = ['Default (DM Sans)','Playfair Display','Georgia','Raleway','Cormorant Garamond'];
const COLOR_PRESETS = [
  { name:'Rose',    primary:'#C85D7A', accent:'#FDE8EF' },
  { name:'Charcoal',primary:'#1C1C1E', accent:'#F5F5F5' },
  { name:'Gold',    primary:'#C9A96E', accent:'#FFF8EC' },
  { name:'Sage',    primary:'#7C9A7E', accent:'#EEF4EF' },
  { name:'Navy',    primary:'#1B3A6B', accent:'#EEF2F8' },
  { name:'Plum',    primary:'#6B2D5E', accent:'#F5EEF4' },
];
const STEPS = ['Identity','Visual','Booking Link','Your Voice','Gallery','Preview'];

export default function BrandStudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Step 0 — Identity
  const [studioName, setStudioName]   = useState('');
  const [tagline, setTagline]         = useState('');
  const [bio, setBio]                 = useState('');
  const [city, setCity]               = useState('');
  const [category, setCategory]       = useState('');
  const [onDiscovery, setOnDiscovery] = useState(true);

  // Step 1 — Visual
  const [primaryColor, setPrimary] = useState(C.rose);
  const [accentColor,  setAccent]  = useState(C.pinkLight);
  const [displayFont, setDisplayFont] = useState(FONTS[0]);

  // Step 2 — Booking Link
  const [slug, setSlug]           = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok]       = useState('');

  // Step 3 — Voice
  const [senderName, setSenderName]           = useState('');
  const [confirmNote, setConfirmNote]         = useState('');
  const [cancelNote,  setCancelNote]          = useState('');
  const [announcementText, setAnnouncement]   = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Step 4 — Gallery
  const [galleryTab, setGalleryTab]   = useState<'portfolio'|'before-after'>('portfolio');
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [tier, setTier]               = useState('starter');

  useEffect(() => {
    if (!token) return;
    Promise.all([SettingsApi.get(token)]).then(([r]) => {
      const st = r?.settings || {};
      setStudioName(st.studioName||''); setTagline(st.tagline||''); setBio(st.bio||'');
      setCity(st.city||''); setCategory(st.category||''); setOnDiscovery(st.onDiscovery!==false);
      setPrimary(st.primaryColor||C.rose); setAccent(st.accentColor||C.pinkLight);
      setDisplayFont(st.displayFont||FONTS[0]);
      setSlug(st.bookingSlug||''); setInstagram(st.instagram||''); setTiktok(st.tiktok||'');
      setSenderName(st.senderName||''); setConfirmNote(st.confirmationNote||'');
      setCancelNote(st.cancellationNote||''); setAnnouncement(st.announcementText||'');
      setShowAnnouncement(!!st.showAnnouncement);
      setTier(st.subscription_tier||st.subscriptionTier||'starter');
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [token]);

  const loadGallery = useCallback(async () => {
    if (!token) return;
    setGalleryLoading(true);
    try {
      const r = await OwnerApi.brandGallery(token);
      setGalleryItems(Array.isArray(r.gallery) ? r.gallery : []);
    } catch {}
    finally { setGalleryLoading(false); }
  }, [token]);

  useEffect(() => { if (step === 4) loadGallery(); }, [step, loadGallery]);

  const save = async () => {
    if (!token) return; setSaving(true);
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
    } catch(e:any) { Alert.alert('Error', e.message||'Save failed'); }
    finally { setSaving(false); }
  };

  // ── Gallery helpers ───────────────────────────────────────────────────────
  const isElite = tier === 'studio_elite';

  const pickAndUpload = async (opts: { isBefore?: boolean; pairId?: string | null; caption?: string }) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to upload images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, quality: 0.75, base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setUploading(true);
    try {
      const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const r = await OwnerApi.brandGalleryUpload(token!, {
        imageData,
        caption: opts.caption || '',
        isBefore: !!opts.isBefore,
        pairId: opts.pairId || null,
      });
      await loadGallery();
      return r.image?.id;
    } catch(e:any) { Alert.alert('Upload Failed', e.message||'Please try again.'); }
    finally { setUploading(false); }
  };

  const deleteItem = (id: string) => {
    Alert.alert('Delete Photo', 'Remove this image from your gallery?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { await OwnerApi.brandGalleryDelete(token!, id); await loadGallery(); }
        catch(e:any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const imageUrl = (id: string) => `${API_URL}/api/v1/brand-studio/public/gallery/image/${id}`;

  // ── Render Gallery Step ───────────────────────────────────────────────────
  const renderGallery = () => {
    const portfolioItems = galleryItems.filter(i => !i.is_before && !i.pair_id);
    const beforeItems    = galleryItems.filter(i => i.is_before);
    const afterMap: Record<string, any> = {};
    galleryItems.filter(i => i.pair_id).forEach(i => { afterMap[i.pair_id] = i; });

    return (
      <>
        <Text style={s.stepTitle}>Service Gallery</Text>
        <Text style={s.stepSub}>Portfolio photos and before/after sets appear on your booking page and discover listing.</Text>

        {!isElite && (
          <View style={s.lockBanner}>
            <Text style={{ fontSize: 20, marginBottom: 6 }}>🔒</Text>
            <Text style={s.lockTitle}>Studio Elite feature</Text>
            <Text style={s.lockSub}>Upgrade to Studio Elite to upload gallery photos and before/after sets.</Text>
            <TouchableOpacity style={s.lockBtn} onPress={() => router.push('/owner/upgrade')}>
              <Text style={s.lockBtnTxt}>View Plans →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab switcher */}
        <View style={s.galleryTabs}>
          {(['portfolio','before-after'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.galleryTab, galleryTab===t && s.galleryTabOn]} onPress={() => setGalleryTab(t)}>
              <Text style={[s.galleryTabTxt, galleryTab===t && s.galleryTabTxtOn]}>
                {t==='portfolio' ? `📸 Portfolio (${portfolioItems.length})` : `🔄 Before & After (${beforeItems.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {galleryLoading ? <ActivityIndicator color={C.rose} style={{ marginTop: 20 }} /> : (

          galleryTab === 'portfolio' ? (
            <>
              {/* Portfolio grid */}
              {portfolioItems.length === 0 && (
                <View style={s.emptyGallery}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
                  <Text style={s.galleryEmptyTxt}>No portfolio photos yet.</Text>
                  <Text style={s.galleryEmptySub}>Add photos to show clients your best work.</Text>
                </View>
              )}
              <View style={s.imageGrid}>
                {portfolioItems.map(item => (
                  <View key={item.id} style={s.imageThumbWrap}>
                    <Image source={{ uri: imageUrl(item.id) }} style={s.imageThumb} />
                    <TouchableOpacity style={s.deleteOverlay} onPress={() => deleteItem(item.id)}>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>✕</Text>
                    </TouchableOpacity>
                    {!!item.caption && <Text style={s.thumbCaption} numberOfLines={1}>{item.caption}</Text>}
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[s.uploadBtn, (!isElite || uploading) && { opacity: 0.5 }]}
                onPress={() => isElite && pickAndUpload({ isBefore: false })}
                disabled={!isElite || uploading}
              >
                {uploading ? <ActivityIndicator color={C.white} size="small" /> : <Text style={s.uploadBtnTxt}>+ Add Portfolio Photo</Text>}
              </TouchableOpacity>
              <Text style={s.galleryLimit}>Up to 20 photos · Studio Elite only</Text>
            </>
          ) : (
            <>
              {/* Before / After pairs */}
              {beforeItems.length === 0 && (
                <View style={s.emptyGallery}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🔄</Text>
                  <Text style={s.galleryEmptyTxt}>No before & after sets yet.</Text>
                  <Text style={s.galleryEmptySub}>Show clients your transformations.</Text>
                </View>
              )}
              {beforeItems.map(beforeItem => {
                const afterItem = afterMap[beforeItem.id] || null;
                return (
                  <View key={beforeItem.id} style={s.baPair}>
                    {/* Before slot */}
                    <View style={s.baSlot}>
                      <Text style={s.baLabel}>BEFORE</Text>
                      <Image source={{ uri: imageUrl(beforeItem.id) }} style={s.baImage} />
                      <TouchableOpacity style={s.baDeleteBtn} onPress={() => deleteItem(beforeItem.id)}>
                        <Text style={s.baDeleteTxt}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 20, color: C.rose, alignSelf: 'center' }}>→</Text>
                    {/* After slot */}
                    <View style={s.baSlot}>
                      <Text style={s.baLabel}>AFTER</Text>
                      {afterItem ? (
                        <>
                          <Image source={{ uri: imageUrl(afterItem.id) }} style={s.baImage} />
                          <TouchableOpacity style={s.baDeleteBtn} onPress={() => deleteItem(afterItem.id)}>
                            <Text style={s.baDeleteTxt}>Remove</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={[s.baUploadSlot, (!isElite || uploading) && { opacity: 0.5 }]}
                          onPress={() => isElite && pickAndUpload({ pairId: beforeItem.id })}
                          disabled={!isElite || uploading}
                        >
                          <Text style={{ fontSize: 24, color: C.rose }}>+</Text>
                          <Text style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>Add After</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
              {beforeItems.length < 5 && (
                <TouchableOpacity
                  style={[s.uploadBtn, (!isElite || uploading) && { opacity: 0.5 }]}
                  onPress={() => isElite && pickAndUpload({ isBefore: true })}
                  disabled={!isElite || uploading}
                >
                  {uploading ? <ActivityIndicator color={C.white} size="small" /> : <Text style={s.uploadBtnTxt}>+ Add Before Photo</Text>}
                </TouchableOpacity>
              )}
              <Text style={s.galleryLimit}>Up to 5 before/after sets · Studio Elite only</Text>
            </>
          )
        )}
      </>
    );
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={C.rose} size="large" /></View>;

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <Text style={s.stepTitle}>Tell us about your business</Text>
          <Text style={s.stepSub}>This info appears on your booking page and client emails.</Text>
          <Text style={s.label}>Studio Name *</Text>
          <TextInput style={s.input} value={studioName} onChangeText={setStudioName} placeholder="My Studio" placeholderTextColor={C.soft} />
          <Text style={s.label}>Tagline</Text>
          <TextInput style={s.input} value={tagline} onChangeText={setTagline} placeholder="Short and punchy" placeholderTextColor={C.soft} />
          <Text style={s.label}>Short Bio (max 150 chars)</Text>
          <TextInput style={[s.input,{height:80,textAlignVertical:'top'}]} value={bio} onChangeText={t=>setBio(t.slice(0,150))} placeholder="What makes you unique..." placeholderTextColor={C.soft} multiline />
          <Text style={s.charCount}>{bio.length}/150</Text>
          <Text style={s.label}>City</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="Toronto, ON" placeholderTextColor={C.soft} />
          <Text style={s.label}>Service Category</Text>
          <View style={s.chipRow}>
            {CATS.map(c => <TouchableOpacity key={c} style={[s.chip, category===c && s.chipOn]} onPress={()=>setCategory(c)}><Text style={[s.chipTxt, category===c && s.chipTxtOn]}>{c}</Text></TouchableOpacity>)}
          </View>
          <View style={s.toggleRow}>
            <View style={{flex:1}}>
              <Text style={s.toggleLabel}>List on PinkBook Discovery</Text>
              <Text style={s.toggleSub}>Clients can find and book you via discovery</Text>
            </View>
            <Switch value={onDiscovery} onValueChange={setOnDiscovery} trackColor={{false:C.border,true:C.rose}} thumbColor={C.white} />
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
              <TouchableOpacity key={c.name} style={[s.colorSwatch,{backgroundColor:c.primary,borderWidth:primaryColor===c.primary?3:0,borderColor:C.charcoal}]} onPress={()=>{setPrimary(c.primary);setAccent(c.accent);}}>
                <Text style={{fontSize:10,color:'#fff',fontWeight:'700',textAlign:'center'}}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.colorPreview}>
            <View style={[s.colorDot,{backgroundColor:primaryColor}]} />
            <Text style={s.colorCode}>{primaryColor}</Text>
            <View style={[s.colorDot,{backgroundColor:accentColor,borderWidth:1,borderColor:C.border}]} />
            <Text style={s.colorCode}>{accentColor}</Text>
          </View>
          <Text style={s.label}>Display / Heading Font</Text>
          {FONTS.map(f => (
            <TouchableOpacity key={f} style={[s.fontRow, displayFont===f && s.fontRowOn]} onPress={()=>setDisplayFont(f)}>
              <Text style={[s.fontName, displayFont===f&&{color:C.rose}]}>{f}</Text>
              <Text style={[s.fontSample, displayFont===f&&{color:C.rose}]}>Aa Bb Cc</Text>
            </TouchableOpacity>
          ))}
        </>
      );
      case 2: return (
        <>
          <Text style={s.stepTitle}>Claim your booking link</Text>
          <Text style={s.stepSub}>Your PinkBook address: pinkbook.app/[your-slug]</Text>
          <Text style={s.label}>Booking Slug</Text>
          <View style={s.slugRow}>
            <Text style={s.slugPrefix}>pinkbook.app/</Text>
            <TextInput style={[s.input,{flex:1}]} value={slug} onChangeText={t=>setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="my-studio" placeholderTextColor={C.soft} autoCapitalize="none" />
          </View>
          <Text style={s.label}>Instagram (optional)</Text>
          <TextInput style={s.input} value={instagram} onChangeText={setInstagram} placeholder="@yourstudio" placeholderTextColor={C.soft} autoCapitalize="none" />
          <Text style={s.label}>TikTok (optional)</Text>
          <TextInput style={s.input} value={tiktok} onChangeText={setTiktok} placeholder="@yourstudio" placeholderTextColor={C.soft} autoCapitalize="none" />
        </>
      );
      case 3: return (
        <>
          <Text style={s.stepTitle}>How you communicate</Text>
          <Text style={s.stepSub}>Customise messages so they sound like you.</Text>
          <Text style={s.label}>Sender Name</Text>
          <TextInput style={s.input} value={senderName} onChangeText={setSenderName} placeholder="Jane at My Studio" placeholderTextColor={C.soft} />
          <Text style={s.label}>Booking Confirmation Note (max 200)</Text>
          <TextInput style={[s.input,{height:80,textAlignVertical:'top'}]} value={confirmNote} onChangeText={t=>setConfirmNote(t.slice(0,200))} placeholder="Can't wait to see you! Please arrive 5 min early." placeholderTextColor={C.soft} multiline />
          <Text style={s.charCount}>{confirmNote.length}/200</Text>
          <Text style={s.label}>Cancellation Note (max 200)</Text>
          <TextInput style={[s.input,{height:80,textAlignVertical:'top'}]} value={cancelNote} onChangeText={t=>setCancelNote(t.slice(0,200))} placeholder="Sorry to see you go! Feel free to rebook anytime." placeholderTextColor={C.soft} multiline />
          <Text style={s.charCount}>{cancelNote.length}/200</Text>
          <Text style={s.label}>Announcement Banner</Text>
          <TextInput style={[s.input,{height:60,textAlignVertical:'top'}]} value={announcementText} onChangeText={setAnnouncement} placeholder="🌸 Now accepting new clients for spring!" placeholderTextColor={C.soft} multiline />
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Show on booking page</Text>
            <Switch value={showAnnouncement} onValueChange={setShowAnnouncement} trackColor={{false:C.border,true:C.rose}} thumbColor={C.white} />
          </View>
        </>
      );
      case 4: return renderGallery();
      case 5: return (
        <>
          <Text style={s.stepTitle}>Your booking page preview</Text>
          <Text style={s.stepSub}>This is how clients see your page. Save to apply changes.</Text>
          <View style={[s.previewCard,{borderColor:primaryColor,borderWidth:2}]}>
            <View style={[s.previewHeader,{backgroundColor:primaryColor}]}>
              <Text style={s.previewLogo}>{studioName||'My Studio'}</Text>
              {!!tagline && <Text style={s.previewTagline}>{tagline}</Text>}
            </View>
            <View style={s.previewBody}>
              {!!bio && <Text style={s.previewBio}>{bio}</Text>}
              {!!city && <Text style={s.previewCity}>📍 {city}</Text>}
              {!!category && <View style={[s.previewCat,{backgroundColor:accentColor}]}><Text style={[s.previewCatTxt,{color:primaryColor}]}>{category.toUpperCase()}</Text></View>}
              <View style={[s.previewBookBtn,{backgroundColor:primaryColor}]}>
                <Text style={s.previewBookTxt}>Book Now</Text>
              </View>
            </View>
          </View>
          {!!slug && <Text style={s.previewLink}>🔗 pinkbook.app/{slug}</Text>}
          <TouchableOpacity style={[s.saveBtn,{backgroundColor:C.charcoal}]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={C.white} size="small" /> : <Text style={s.saveBtnTxt}>Save All Changes</Text>}
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[s.container,{paddingTop:insets.top}]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={()=>router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Brand Studio</Text>
          {step < STEPS.length - 1
            ? <TouchableOpacity onPress={save} disabled={saving}><Text style={s.saveTop}>{saving?'Saving…':'Save'}</Text></TouchableOpacity>
            : <View style={{width:60}}/>}
        </View>

        {/* Step bar */}
        <View style={s.stepBar}>
          {STEPS.map((name,i) => (
            <TouchableOpacity key={i} style={[s.stepDot, i===step&&s.stepDotActive, i<step&&s.stepDotDone]} onPress={()=>setStep(i)}>
              <Text style={[s.stepNum, (i===step||i<step)&&{color:C.white}]}>{i<step?'✓':i+1}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.stepLabel}>
          <Text style={s.stepLabelTxt}>Step {step+1} of {STEPS.length}: {STEPS[step]}</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {renderStep()}
          <View style={{height:40}}/>
        </ScrollView>

        {/* Nav */}
        <View style={[s.navBar,{paddingBottom:insets.bottom+8}]}>
          {step > 0 && <TouchableOpacity style={s.navBack} onPress={()=>setStep(s=>s-1)}><Text style={s.navBackTxt}>← Back</Text></TouchableOpacity>}
          {step < STEPS.length - 1
            ? <TouchableOpacity style={s.navNext} onPress={()=>setStep(s=>s+1)}><Text style={s.navNextTxt}>Next: {STEPS[step+1]} →</Text></TouchableOpacity>
            : <TouchableOpacity style={[s.navNext,{backgroundColor:C.charcoal}]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color={C.white} size="small" /> : <Text style={s.navNextTxt}>Save & Finish</Text>}
              </TouchableOpacity>
          }
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:     {flex:1,backgroundColor:C.cream},
  center:        {flex:1,alignItems:'center',justifyContent:'center'},
  topBar:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border,backgroundColor:C.cream},
  back:          {color:C.rose,fontWeight:'700',fontSize:14,width:60},
  title:         {fontSize:17,fontWeight:'900',color:C.charcoal},
  saveTop:       {color:C.rose,fontWeight:'700',fontSize:14,width:60,textAlign:'right'},
  stepBar:       {flexDirection:'row',justifyContent:'center',paddingVertical:10,gap:6},
  stepDot:       {width:28,height:28,borderRadius:14,backgroundColor:C.white,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},
  stepDotActive: {backgroundColor:C.rose,borderColor:C.rose},
  stepDotDone:   {backgroundColor:'rgba(200,93,122,0.3)',borderColor:C.rose},
  stepNum:       {fontSize:11,fontWeight:'800',color:C.soft},
  stepLabel:     {alignItems:'center',paddingBottom:6},
  stepLabelTxt:  {fontSize:12,color:C.mid,fontWeight:'600'},
  scroll:        {padding:20},
  stepTitle:     {fontSize:22,fontWeight:'900',color:C.charcoal,fontFamily:'Georgia',marginBottom:6},
  stepSub:       {fontSize:13,color:C.mid,lineHeight:18,marginBottom:20},
  label:         {fontSize:11,fontWeight:'800',color:C.rose,textTransform:'uppercase',letterSpacing:0.8,marginBottom:6,marginTop:14},
  input:         {backgroundColor:C.white,borderRadius:12,paddingHorizontal:14,paddingVertical:13,fontSize:14,color:C.charcoal,borderWidth:1,borderColor:C.border,marginBottom:4},
  charCount:     {fontSize:11,color:C.soft,textAlign:'right',marginBottom:4},
  chipRow:       {flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},
  chip:          {paddingHorizontal:14,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.white},
  chipOn:        {backgroundColor:C.rose,borderColor:C.rose},
  chipTxt:       {fontSize:13,color:C.mid,textTransform:'capitalize',fontWeight:'600'},
  chipTxtOn:     {color:C.white},
  toggleRow:     {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:C.border,marginTop:8},
  toggleLabel:   {fontSize:14,fontWeight:'700',color:C.charcoal},
  toggleSub:     {fontSize:12,color:C.soft,marginTop:2},
  colorGrid:     {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:12},
  colorSwatch:   {width:80,height:50,borderRadius:10,alignItems:'center',justifyContent:'center'},
  colorPreview:  {flexDirection:'row',alignItems:'center',gap:8,marginBottom:16},
  colorDot:      {width:24,height:24,borderRadius:12},
  colorCode:     {fontSize:12,color:C.mid,fontWeight:'600'},
  fontRow:       {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderRadius:12,borderWidth:1,borderColor:C.border,marginBottom:8,backgroundColor:C.white},
  fontRowOn:     {borderColor:C.rose,backgroundColor:C.pinkLight},
  fontName:      {fontSize:14,fontWeight:'700',color:C.charcoal},
  fontSample:    {fontSize:14,color:C.soft},
  slugRow:       {flexDirection:'row',alignItems:'center',gap:4,marginBottom:4},
  slugPrefix:    {fontSize:13,color:C.soft,fontWeight:'600'},
  previewCard:   {borderRadius:16,overflow:'hidden',marginBottom:16},
  previewHeader: {padding:20,alignItems:'center'},
  previewLogo:   {fontSize:20,fontWeight:'900',color:'#fff',fontFamily:'Georgia'},
  previewTagline:{fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:4},
  previewBody:   {padding:16,backgroundColor:C.white,gap:8},
  previewBio:    {fontSize:13,color:C.mid,lineHeight:18},
  previewCity:   {fontSize:12,color:C.soft},
  previewCat:    {alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:4,borderRadius:6},
  previewCatTxt: {fontSize:11,fontWeight:'700',letterSpacing:0.5},
  previewBookBtn:{paddingVertical:12,borderRadius:999,alignItems:'center',marginTop:4},
  previewBookTxt:{color:'#fff',fontWeight:'800',fontSize:14},
  previewLink:   {textAlign:'center',color:C.rose,fontSize:13,fontWeight:'600',marginBottom:20},
  saveBtn:       {borderRadius:999,paddingVertical:16,alignItems:'center',marginTop:8},
  saveBtnTxt:    {color:C.white,fontWeight:'800',fontSize:16},
  navBar:        {flexDirection:'row',paddingHorizontal:16,paddingTop:12,gap:10,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.cream},
  navBack:       {paddingVertical:13,paddingHorizontal:18,borderRadius:999,borderWidth:1,borderColor:C.border},
  navBackTxt:    {fontSize:14,fontWeight:'700',color:C.mid},
  navNext:       {flex:1,paddingVertical:14,borderRadius:999,backgroundColor:C.rose,alignItems:'center'},
  navNextTxt:    {color:C.white,fontWeight:'800',fontSize:14},
  // Gallery
  galleryTabs:   {flexDirection:'row',backgroundColor:C.white,borderRadius:12,borderWidth:1,borderColor:C.border,padding:3,gap:3,marginBottom:16},
  galleryTab:    {flex:1,paddingVertical:9,borderRadius:9,alignItems:'center'},
  galleryTabOn:  {backgroundColor:C.rose},
  galleryTabTxt: {fontSize:12,fontWeight:'700',color:C.soft},
  galleryTabTxtOn:{color:C.white},
  emptyGallery:  {alignItems:'center',padding:32,backgroundColor:C.white,borderRadius:14,borderWidth:1,borderColor:C.border,marginBottom:12},
  galleryEmptyTxt:{fontSize:15,fontWeight:'700',color:C.charcoal,marginBottom:4},
  galleryEmptySub:{fontSize:12,color:C.soft,textAlign:'center'},
  imageGrid:     {flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
  imageThumbWrap:{width:96,height:96,borderRadius:10,overflow:'hidden'},
  imageThumb:    {width:96,height:96},
  deleteOverlay: {position:'absolute',top:4,right:4,width:22,height:22,borderRadius:11,backgroundColor:'rgba(0,0,0,0.55)',alignItems:'center',justifyContent:'center'},
  thumbCaption:  {position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.5)',fontSize:9,color:'#fff',padding:3,textAlign:'center'},
  uploadBtn:     {backgroundColor:C.rose,borderRadius:999,paddingVertical:14,alignItems:'center',marginTop:4},
  uploadBtnTxt:  {color:C.white,fontWeight:'800',fontSize:14},
  galleryLimit:  {textAlign:'center',color:C.soft,fontSize:11,marginTop:6,marginBottom:8},
  baPair:        {flexDirection:'row',alignItems:'flex-start',gap:8,marginBottom:16,backgroundColor:C.white,borderRadius:14,padding:12,borderWidth:1,borderColor:C.border},
  baSlot:        {flex:1,alignItems:'center',gap:6},
  baLabel:       {fontSize:10,fontWeight:'800',color:C.rose,textTransform:'uppercase',letterSpacing:0.8},
  baImage:       {width:'100%',aspectRatio:1,borderRadius:10},
  baDeleteBtn:   {paddingVertical:4},
  baDeleteTxt:   {fontSize:11,color:C.error,fontWeight:'700'},
  baUploadSlot:  {width:'100%',aspectRatio:1,borderRadius:10,borderWidth:2,borderColor:C.border,borderStyle:'dashed',alignItems:'center',justifyContent:'center'},
  lockBanner:    {backgroundColor:C.pinkLight,borderRadius:14,padding:20,alignItems:'center',marginBottom:16,borderWidth:1,borderColor:C.border},
  lockTitle:     {fontSize:16,fontWeight:'900',color:C.charcoal,marginBottom:4},
  lockSub:       {fontSize:13,color:C.mid,textAlign:'center',lineHeight:18,marginBottom:12},
  lockBtn:       {backgroundColor:C.rose,paddingHorizontal:20,paddingVertical:10,borderRadius:999},
  lockBtnTxt:    {color:C.white,fontWeight:'800',fontSize:13},
});
