import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { ClientApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || null;

export default function ClientRegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const google = useGoogleAuth(GOOGLE_CLIENT_ID);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [phone, setPhone]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!google.idToken) return;
    (async () => {
      setGoogleLoading(true);
      try {
        const res = await ClientApi.googleSignIn(google.idToken!);
        if (!res.token) throw new Error('No token returned');
        await signIn(res.token);
        router.replace('/(consumer-tabs)/discover');
      } catch (e: any) { setError(e.message || 'Google sign-in failed'); }
      finally { setGoogleLoading(false); }
    })();
  }, [google.idToken]);

  const submit = async () => {
    if (!firstName.trim() || !email.trim() || !password) {
      setError('First name, email, and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await ClientApi.register({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        email:      email.trim().toLowerCase(),
        password,
        phone:      phone.trim(),
      });
      if (!res.token) throw new Error('No token returned');
      await signIn(res.token);
      router.replace('/(consumer-tabs)/discover');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
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

        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.sub}>Discover and book with beautiful salons near you.</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane"
              placeholderTextColor={Colors.soft}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Smith"
              placeholderTextColor={Colors.soft}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

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
          placeholder="Min 8 characters"
          placeholderTextColor={Colors.soft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={Colors.soft}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        {google.ready && (
          <TouchableOpacity style={[styles.googleBtn, googleLoading && { opacity: 0.6 }]} onPress={() => google.promptAsync()} disabled={googleLoading}>
            {googleLoading ? <ActivityIndicator color={Colors.rose} size="small" /> : <Text style={styles.googleBtnText}>🌐 Continue with Google</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/auth/client-login')}>
          <Text style={styles.linkText}>Already have an account? Sign in →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:        { flexGrow: 1, paddingHorizontal: 24 },
  back:          { marginBottom: 28 },
  backText:      { color: Colors.rose, fontSize: 14, fontWeight: '600' },
  heading:       { fontSize: 28, fontWeight: '800', color: Colors.charcoal, marginBottom: 6 },
  sub:           { fontSize: 14, color: Colors.soft, marginBottom: 28, lineHeight: 20 },
  error:         { backgroundColor: Colors.error + '15', borderRadius: 10, padding: 12, marginBottom: 16, color: Colors.error, fontSize: 13, fontWeight: '600' },
  label:         { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:         { backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  row:           { flexDirection: 'row', gap: 12 },
  half:          { flex: 1 },
  btn:           { backgroundColor: Colors.rose, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  btnText:       { color: Colors.white, fontWeight: '800', fontSize: 15 },
  googleBtn:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  googleBtnText: { color: Colors.charcoal, fontWeight: '700', fontSize: 14 },
  link:          { alignItems: 'center' },
  linkText:      { color: Colors.rose, fontSize: 13, fontWeight: '600' },
});
