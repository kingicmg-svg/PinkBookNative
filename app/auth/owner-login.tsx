import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { OwnerApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || null;

export default function OwnerLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const bio = useBiometricAuth();
  const google = useGoogleAuth(GOOGLE_CLIENT_ID);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google Sign-In response
  useEffect(() => {
    if (!google.idToken) return;
    (async () => {
      setGoogleLoading(true);
      setError(null);
      try {
        const res = await OwnerApi.googleSignIn(google.idToken!);
        if (!res.token) throw new Error('No token returned');
        await signIn(res.token);
        router.replace('/(owner-tabs)/calendar');
      } catch (e: any) {
        setError(e.message || 'Google sign-in failed');
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [google.idToken]);

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [bioLoading, setBioLoading]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Auto-prompt Face ID on load if credentials are saved
  useEffect(() => {
    if (bio.available && bio.hasSavedCredentials) {
      handleBiometricLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bio.available, bio.hasSavedCredentials]);

  const handleBiometricLogin = async () => {
    setBioLoading(true);
    setError(null);
    try {
      const creds = await bio.authenticateAndGetCredentials();
      if (!creds) return; // cancelled
      const res = await OwnerApi.login({ email: creds.email, password: creds.password });
      if (!res.token) throw new Error('No token returned');
      await signIn(res.token);
      router.replace('/(owner-tabs)/calendar');
    } catch (e: any) {
      setError(e.message || 'Sign in failed');
    } finally {
      setBioLoading(false);
    }
  };

  const submit = async () => {
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await OwnerApi.login({ email: email.trim().toLowerCase(), password });
      if (!res.token) throw new Error('No token returned');
      await signIn(res.token);

      // Offer Face ID setup after first password login (if available and not yet saved)
      if (bio.available && !bio.hasSavedCredentials) {
        Alert.alert(
          `Enable ${bio.biometricLabel}?`,
          `Sign in faster next time with ${bio.biometricLabel}. Your credentials are stored securely on this device.`,
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.replace('/(owner-tabs)/calendar') },
            { text: `Enable ${bio.biometricLabel}`, onPress: async () => {
              await bio.saveCredentials(email.trim().toLowerCase(), password);
              router.replace('/(owner-tabs)/calendar');
            }},
          ],
        );
      } else {
        router.replace('/(owner-tabs)/calendar');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
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

        <Text style={styles.heading}>Pro Sign In</Text>
        <Text style={styles.sub}>Sign in to your PinkBook business account.</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Email</Text>
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

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.soft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        {/* Face ID / Touch ID button — shown when credentials are saved */}
        {bio.available && bio.hasSavedCredentials && (
          <TouchableOpacity
            style={[styles.bioBtn, bioLoading && { opacity: 0.6 }]}
            onPress={handleBiometricLogin}
            disabled={bioLoading}
          >
            {bioLoading
              ? <ActivityIndicator color={Colors.rose} size="small" />
              : <Text style={styles.bioBtnText}>🔓 Sign in with {bio.biometricLabel}</Text>}
          </TouchableOpacity>
        )}
        {/* Google Sign-In */}
        {google.ready && (
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && { opacity: 0.6 }]}
            onPress={() => google.promptAsync()}
            disabled={googleLoading}
          >
            {googleLoading
              ? <ActivityIndicator color={Colors.charcoal} size="small" />
              : <Text style={styles.googleBtnText}>🌐 Continue with Google</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.link} onPress={() => router.replace('/auth/owner-register')}>
          <Text style={styles.linkText}>New to PinkBook? Create a free account →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.link, { marginTop: 12 }]} onPress={() => router.push('/auth/forgot-password')}>
          <Text style={[styles.linkText, { color: Colors.soft }]}>Forgot password?</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flexGrow: 1, paddingHorizontal: 24 },
  back:        { marginBottom: 28 },
  backText:    { color: Colors.rose, fontSize: 14, fontWeight: '600' },
  heading:     { fontSize: 28, fontWeight: '800', color: Colors.charcoal, marginBottom: 6 },
  sub:         { fontSize: 14, color: Colors.soft, marginBottom: 28, lineHeight: 20 },
  error:       { backgroundColor: Colors.error + '15', borderRadius: 10, padding: 12, marginBottom: 16, color: Colors.error, fontSize: 13, fontWeight: '600' },
  label:       { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:       { backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  btn:         { backgroundColor: Colors.charcoal, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnText:     { color: Colors.white, fontWeight: '800', fontSize: 15 },
  bioBtn:      { borderWidth: 1.5, borderColor: Colors.rose, borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  bioBtnText:  { color: Colors.rose, fontWeight: '700', fontSize: 14 },
  googleBtn:   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  googleBtnText: { color: Colors.charcoal, fontWeight: '700', fontSize: 14 },
  link:        { alignItems: 'center' },
  linkText:    { color: Colors.rose, fontSize: 13, fontWeight: '600' },
});
