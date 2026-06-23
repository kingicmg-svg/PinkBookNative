/**
 * AnimatedPress — drop-in replacement for TouchableOpacity that adds a
 * subtle scale-down on press (0.95 by default, 120 ms spring). Works with
 * any children and accepts all TouchableOpacity props.
 */
import React, { useRef } from 'react';
import { Animated, TouchableOpacity, ViewStyle } from 'react-native';
import type { TouchableOpacityProps } from 'react-native';

interface Props extends Omit<TouchableOpacityProps, 'style'> {
  scale?: number;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function AnimatedPress({ scale = 0.95, children, style, ...rest }: Props) {
  const anim = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(anim, { toValue: scale, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 5 }).start();

  return (
    <TouchableOpacity {...rest} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale: anim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
