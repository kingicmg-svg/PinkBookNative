import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './hooks/useAuth';
import Colors from '../constants/Colors';

export default function ForkScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { role, isLoading } = useAuth();

  // Redirect returning users straight to their home screen
  useEffect(() => {
    if (!isLoading && role === 'owner')  router.replace('/(owner-tabs)/calendar');
    if (!isLoading && role === 'client') router.replace('/(consumer-tabs)/discover');
  }, [isLoading, role]);

  if (isLoading || role) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.rose} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>Pink<Text style={styles.logoAccent}>book</Text></Text>
        <Text style={styles.tagline}>Beauty booking, reimagined.</Text>
      </View>

      {/* Fork cards */}
      <View style={styles.cards}>
        <TouchableOpacity
          style={[styles.card, styles.cardPro]}
          onPress={() => router.push('/auth/owner-register')}
          activeOpacity={0.88}
        >
          <Text style={styles.cardIcon}>◈</Text>
          <Text style={styles.cardLabel}>I'm a Beauty Pro</Text>
          <Text style={styles.cardSub}>Manage my business</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardClient]}
          onPress={() => router.push('/(consumer-tabs)/discover')}
          activeOpacity={0.88}
        >
          <Text style={styles.cardIcon}>✦</Text>
          <Text style={styles.cardLabel}>Discover & Book</Text>
          <Text style={styles.cardSub}>Find a salon near me</Text>
        </TouchableOpacity>
      </View>

      {/* Sign-in link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/auth/owner-login')}>
          <Text style={styles.footerLink}>  Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.rose,
    letterSpacing: -1,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  logoAccent: {
    color: Colors.charcoal,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.soft,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  cards: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    borderRadius: 22,
    padding: 28,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  cardPro: {
    backgroundColor: Colors.charcoal,
  },
  cardClient: {
    backgroundColor: Colors.rose,
  },
  cardIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: Colors.soft,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.rose,
  },
});

