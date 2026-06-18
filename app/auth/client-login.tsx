import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ClientApi } from '../services/ApiService';
import Colors from '../../constants/Colors';

export default function ClientLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await ClientApi.login({ email: email.trim().toLowerCase(), password });
      if (!res.token) throw new Error('No token returned');
      await signIn(res.token);
      router.replace('/(consumer-tabs)/discover');
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

        <Text style={styles.heading}>Sign In</Text>
        <Text style={styles.sub}>Find and book with your favourite beauty pros.</Text>

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

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/auth/client-register')}>
          <Text style={styles.linkText}>New here? Create a free account →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flexGrow: 1, paddingHorizontal: 24 },
  back:     { marginBottom: 28 },
  backText: { color: Colors.rose, fontSize: 14, fontWeight: '600' },
  heading:  { fontSize: 28, fontWeight: '800', color: Colors.charcoal, marginBottom: 6 },
  sub:      { fontSize: 14, color: Colors.soft, marginBottom: 28, lineHeight: 20 },
  error:    { backgroundColor: Colors.error + '15', borderRadius: 10, padding: 12, marginBottom: 16, color: Colors.error, fontSize: 13, fontWeight: '600' },
  label:    { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:    { backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  btn:      { backgroundColor: Colors.rose, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  btnText:  { color: Colors.white, fontWeight: '800', fontSize: 15 },
  link:     { alignItems: 'center' },
  linkText: { color: Colors.rose, fontSize: 13, fontWeight: '600' },
});
