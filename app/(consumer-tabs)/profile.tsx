import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ClientApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

function initials(first: string, last: string) {
  return `${(first[0] || '').toUpperCase()}${(last[0] || '').toUpperCase()}` || '?';
}

function UnauthState({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <View style={styles.unauthCenter}>
      <Text style={styles.unauthHeading}>Your Profile</Text>
      <Text style={styles.unauthSub}>Sign in to manage your bookings, preferences, and account.</Text>
      <TouchableOpacity style={styles.signInBtn} onPress={onSignIn}>
        <Text style={styles.signInText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signUpBtn} onPress={onSignUp}>
        <Text style={styles.signUpText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, signOut } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    ClientApi.me(token)
      .then(res => setClient((res as any).client || (res as any).user || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
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

  if (!token && !loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <UnauthState
          onSignIn={() => router.push('/auth/client-login')}
          onSignUp={() => router.push('/auth/client-register')}
        />
      </View>
    );
  }

  const first = client?.first_name || '';
  const last  = client?.last_name  || '';
  const name  = client ? `${first} ${last}`.trim() || client.email : '';
  const email = client?.email || '';
  const phone = client?.phone || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.heading}>Profile</Text></View>

      {loading ? (
        <ActivityIndicator color={Colors.rose} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(first, last)}</Text>
            </View>
            <Text style={styles.profileName}>{name}</Text>
            {!!email && <Text style={styles.profileEmail}>{email}</Text>}
            {!!phone && <Text style={styles.profileEmail}>{phone}</Text>}
          </View>

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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity style={styles.row}>
              <Text style={styles.rowLabel}>Help Center</Text>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row}>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.cream },
  header:       { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading:      { fontSize: 26, fontWeight: '800', color: Colors.charcoal },
  scroll:       { padding: 20 },
  profileCard:  { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText:   { fontSize: 24, fontWeight: '700', color: Colors.rose },
  profileName:  { fontSize: 18, fontWeight: '700', color: Colors.charcoal },
  profileEmail: { fontSize: 13, color: Colors.soft, marginTop: 4 },
  section:      { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.soft, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  rowLabel:     { fontSize: 14, color: Colors.charcoal, fontWeight: '500' },
  rowArrow:     { fontSize: 18, color: Colors.soft },
  signOutBtn:   { backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '40' },
  signOutText:  { color: Colors.error, fontSize: 14, fontWeight: '700' },
  unauthCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  unauthHeading:{ fontSize: 22, fontWeight: '800', color: Colors.charcoal, marginBottom: 10 },
  unauthSub:    { fontSize: 14, color: Colors.soft, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  signInBtn:    { width: '100%', backgroundColor: Colors.rose, paddingVertical: 14, borderRadius: 100, alignItems: 'center', marginBottom: 10 },
  signInText:   { color: Colors.white, fontWeight: '700', fontSize: 15 },
  signUpBtn:    { width: '100%', backgroundColor: Colors.white, paddingVertical: 14, borderRadius: 100, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.rose },
  signUpText:   { color: Colors.rose, fontWeight: '700', fontSize: 15 },
});
