import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

const API_URL = (process.env.EXPO_PUBLIC_PINKBOOK_API_URL || 'https://www.pinkbook.app').replace(/\/$/, '');

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [mode, setMode]       = useState<'owner' | 'client'>('client');

  const submit = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'owner'
        ? `${API_URL}/api/v1/auth/forgot-password`
        : `${API_URL}/api/client/auth/forgot-password`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || body.message || 'Request failed');
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.sub}>Enter your email and we'll send a reset link.</Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Check your inbox! A reset link has been sent to {email}.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
              <Text style={styles.btnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.toggle}>
              <TouchableOpacity style={[styles.toggleBtn, mode === 'client' && styles.toggleActive]} onPress={() => setMode('client')}>
                <Text style={[styles.toggleTxt, mode === 'client' && styles.toggleActiveTxt]}>Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, mode === 'owner' && styles.toggleActive]} onPress={() => setMode('owner')}>
                <Text style={[styles.toggleTxt, mode === 'owner' && styles.toggleActiveTxt]}>Business Pro</Text>
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.soft}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:          { flexGrow: 1, paddingHorizontal: 24 },
  back:            { marginBottom: 28 },
  backText:        { color: Colors.rose, fontSize: 14, fontWeight: '600' },
  heading:         { fontSize: 28, fontWeight: '800', color: Colors.charcoal, marginBottom: 6 },
  sub:             { fontSize: 14, color: Colors.soft, marginBottom: 28, lineHeight: 20 },
  toggle:          { flexDirection: 'row', backgroundColor: Colors.pinkLight, borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleActive:    { backgroundColor: Colors.white },
  toggleTxt:       { fontSize: 13, fontWeight: '600', color: Colors.soft },
  toggleActiveTxt: { color: Colors.charcoal },
  error:           { backgroundColor: Colors.error + '15', borderRadius: 10, padding: 12, marginBottom: 16, color: Colors.error, fontSize: 13, fontWeight: '600' },
  label:           { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:           { backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  btn:             { backgroundColor: Colors.rose, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText:         { color: Colors.white, fontWeight: '800', fontSize: 15 },
  successBox:      { backgroundColor: Colors.success + '15', borderRadius: 14, padding: 20, marginTop: 8 },
  successText:     { color: Colors.success, fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 20 },
});
