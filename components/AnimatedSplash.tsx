import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');
const ROSE  = '#C85D7A';
const CREAM = '#FDF6F0';

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

    // Phase 1 — logo bounces in (0–500ms)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2 — dot pops in (250ms delay)
    Animated.sequence([
      Animated.delay(250),
      Animated.spring(dotScale, {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 3 — tagline fades in (500ms delay)
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 4 — shimmer pulse on the dot (600ms delay, then loop 2x)
    Animated.sequence([
      Animated.delay(600),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        { iterations: 2 }
      ),
    ]).start();

    // Phase 5 — screen fades out (1700ms delay)
    Animated.sequence([
      Animated.delay(1700),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, []);

  const dotBrightness = shimmer.interpolate({ inputRange: [0, 1], outputRange: ['#C9A96E', '#FFE0A0'] });

  return (
    <Animated.View style={[s.container, { opacity: screenOpacity }]}>
      {/* Radial-ish glow bg patch */}
      <View style={s.glowPatch} />

      {/* Logo block */}
      <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        {/* Wordmark */}
        <View style={s.wordmarkRow}>
          <Text style={s.wordPink}>pink</Text>
          <Text style={s.wordBook}>book</Text>
          {/* Animated gold dot */}
          <Animated.Text style={[s.dot, { transform: [{ scale: dotScale }], color: dotBrightness as any }]}>
            ◆
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[s.tagline, { opacity: tagOpacity }]}>
        Book beauty. Effortlessly.
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ROSE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowPatch: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: height * 0.15,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  wordPink: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  wordBook: {
    fontSize: 52,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  dot: {
    fontSize: 14,
    marginLeft: 5,
    marginBottom: 10,
    color: '#C9A96E',
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.4,
    fontWeight: '400',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 52,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});
