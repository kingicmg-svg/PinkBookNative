import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing, Dimensions, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');
const ROSE     = '#C85D7A';
const CHARCOAL = '#1C1C1E';
const CREAM    = '#FDF6F0';
const MID      = '#5C5058';

interface Props { onDone: () => void; }

export default function AnimatedSplash({ onDone }: Props) {
  // Core animated values
  const logoScale    = useRef(new Animated.Value(0.35)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const dotScale     = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const shimmer      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash now that AnimatedSplash is painted
    SplashScreen.hideAsync().catch(() => {});

    // Phase 1 — logo bounces in (0–650ms)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 42,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2 — dot pops in (350ms delay)
    Animated.sequence([
      Animated.delay(350),
      Animated.spring(dotScale, {
        toValue: 1,
        tension: 65,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 3 — tagline fades in (680ms delay)
    Animated.sequence([
      Animated.delay(680),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 4 — shimmer pulse on the dot (820ms delay, then loop 2x)
    Animated.sequence([
      Animated.delay(820),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 650, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 650, useNativeDriver: true }),
        ]),
        { iterations: 2 }
      ),
    ]).start();

    // Phase 5 — screen fades out (2200ms delay)
    Animated.sequence([
      Animated.delay(2200),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 540,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, []);

  const dotBrightness = shimmer.interpolate({ inputRange: [0, 1], outputRange: ['#C9A96E', '#FFE0A0'] });

  return (
    <Animated.View style={[s.container, { opacity: screenOpacity }]}>
      {/* Soft radial glow on cream */}
      <View style={s.glowPatch} />

      {/* Logo block */}
      <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        {/* Wordmark — exactly matches PWA: Pink (rose) + book (charcoal), Playfair Display */}
        <View style={s.wordmarkRow}>
          <Text style={s.wordPink}>Pink</Text>
          <Text style={s.wordBook}>book</Text>
          {/* Animated gold dot */}
          <Animated.Text style={[s.dot, { transform: [{ scale: dotScale }], color: dotBrightness as any }]}>
            ◆
          </Animated.Text>
        </View>
        {/* Thin divider line below wordmark */}
        <View style={s.divider} />
      </Animated.View>

      {/* Tagline — matches PWA hero eyebrow exactly */}
      <Animated.Text style={[s.tagline, { opacity: tagOpacity }]}>
        Booking, Reimagined for Beauty Pros
      </Animated.Text>

      {/* Bottom brand footer */}
      <Animated.Text style={[s.footer, { opacity: tagOpacity }]}>
        pinkbook.app
      </Animated.Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowPatch: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: 'rgba(200,93,122,0.06)',
    top: height * 0.05,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // Matches PWA .nav-logo exactly: Playfair Display, weight 900
  wordPink: {
    fontSize: 54,
    fontWeight: '900',
    color: ROSE,
    letterSpacing: -1,
    includeFontPadding: false,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  wordBook: {
    fontSize: 54,
    fontWeight: '900',
    color: CHARCOAL,
    letterSpacing: -1,
    includeFontPadding: false,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dot: {
    fontSize: 14,
    marginLeft: 6,
    marginBottom: 11,
    color: '#C9A96E',
  },
  divider: {
    width: 48,
    height: 1.5,
    backgroundColor: ROSE,
    opacity: 0.35,
    marginTop: 10,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 11,
    color: ROSE,
    letterSpacing: 2.2,
    fontWeight: '600',
    marginTop: 18,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  footer: {
    position: 'absolute',
    bottom: 52,
    fontSize: 12,
    color: 'rgba(92,80,88,0.45)',
    letterSpacing: 1.2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});
