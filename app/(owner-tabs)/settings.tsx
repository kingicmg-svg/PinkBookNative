import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function initials(name: string) {
  return (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function SettingsScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const { token, signOut } = useAuth();
  const [user, setUser]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    OwnerApi.me(token)
      .then(res => setUser(res.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const name  = user?.name || user?.email || '—';
  const email = user?.email || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={Colors.rose} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Edit Profile</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Business Settings</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Help Center</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Contact Support</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  header:       { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading:      { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  scroll:       { padding: 20 },
  profile:      { alignItems: 'center', marginBottom: 28 },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText:   { fontSize: 22, fontWeight: '700', color: Colors.rose },
  profileName:  { fontSize: 18, fontWeight: '700', color: Colors.charcoal },
  profileEmail: { fontSize: 13, color: Colors.soft, marginTop: 2 },
  section:      { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  rowLabel:     { fontSize: 14, color: Colors.charcoal, fontWeight: '500' },
  rowArrow:     { fontSize: 18, color: Colors.soft },
  signOutBtn:   { backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: Colors.error + '40' },
  signOutText:  { color: Colors.error, fontSize: 14, fontWeight: '700' },
});
