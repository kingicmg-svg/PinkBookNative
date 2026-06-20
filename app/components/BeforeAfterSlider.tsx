import React, { useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, PanResponder, LayoutChangeEvent,
} from 'react-native';

/**
 * BeforeAfterSlider
 * An interactive image-comparison slider. The "after" image is shown full,
 * and the "before" image is revealed up to the draggable handle position.
 * Uses the built-in PanResponder (no extra gesture libraries).
 */
export default function BeforeAfterSlider({
  beforeUri,
  afterUri,
  height = 240,
  accent = '#D4417A',
  rounded = 16,
}: {
  beforeUri: string;
  afterUri: string;
  height?: number;
  accent?: string;
  rounded?: number;
}) {
  const [width, setWidth] = useState(0);
  // Reveal position in px (how much of the "before" image is visible from the left).
  const [pos, setPos] = useState(0);
  const widthRef = useRef(0);
  const posRef = useRef(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
    // Default the handle to the middle on first measure.
    const mid = w / 2;
    posRef.current = mid;
    setPos(mid);
  };

  const clamp = (x: number) => Math.max(0, Math.min(widthRef.current, x));

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = clamp(e.nativeEvent.locationX);
        posRef.current = x;
        setPos(x);
      },
      onPanResponderMove: (e) => {
        // locationX is the touch position relative to the slider's left edge.
        const next = clamp(e.nativeEvent.locationX);
        posRef.current = next;
        setPos(next);
      },
    }),
  ).current;

  if (!beforeUri || !afterUri) {
    return (
      <View style={[styles.fallback, { height, borderRadius: rounded }]}>
        <Image
          source={{ uri: afterUri || beforeUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: rounded }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  const revealWidth = width ? pos : 0;

  return (
    <View
      style={[styles.wrap, { height, borderRadius: rounded }]}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      {/* AFTER image (full background) */}
      <Image source={{ uri: afterUri }} style={[styles.img, { borderRadius: rounded }]} resizeMode="cover" />
      <View style={[styles.tag, styles.tagRight, { backgroundColor: '#00000080' }]}>
        <Text style={styles.tagTxt}>AFTER</Text>
      </View>

      {/* BEFORE image clipped to reveal width */}
      {width > 0 && (
        <View style={[styles.beforeClip, { width: revealWidth, borderTopLeftRadius: rounded, borderBottomLeftRadius: rounded }]}>
          <Image source={{ uri: beforeUri }} style={[styles.img, { width }]} resizeMode="cover" />
          <View style={[styles.tag, styles.tagLeft, { backgroundColor: '#00000080' }]}>
            <Text style={styles.tagTxt}>BEFORE</Text>
          </View>
        </View>
      )}

      {/* Drag handle */}
      {width > 0 && (
        <View pointerEvents="none" style={[styles.handleLine, { left: revealWidth - 1, backgroundColor: '#FFFFFF' }]} />
      )}
      {width > 0 && (
        <View pointerEvents="none" style={[styles.handleKnob, { left: revealWidth - 16, borderColor: accent }]}>
          <Text style={[styles.handleArrows, { color: accent }]}>‹ ›</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },
  fallback: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },
  img: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  beforeClip: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden', backgroundColor: '#000' },
  tag: { position: 'absolute', top: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagLeft: { left: 10 },
  tagRight: { right: 10 },
  tagTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  handleLine: { position: 'absolute', top: 0, bottom: 0, width: 2 },
  handleKnob: {
    position: 'absolute', top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  handleArrows: { fontSize: 14, fontWeight: '900' },
});
