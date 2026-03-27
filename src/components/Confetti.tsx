/**
 * Confetti.tsx — Particle celebration effects
 *
 * Two modes:
 *  - "small": Gentle confetti burst from mid-screen (for hand card completions)
 *  - "big": Full-screen firework shower from the top (for challenge completions)
 *
 * Particles animate with random spread, rotation, and fade. Auto-cleans up
 * after the animation duration by calling onDone.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#78D4A0', '#FFD700', '#FF6B6B', '#4FC3F7',
  '#AB47BC', '#FF8A65', '#FF4081', '#00E5FF',
];

const FIREWORK_COLORS = [
  '#FFD700', '#FF4500', '#FF69B4', '#00CED1',
  '#7B68EE', '#32CD32', '#FF6347', '#FFA500',
];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'rect';
}

function createPieces(count: number, colors: string[], originY: number): ConfettiPiece[] {
  return Array.from({ length: count }, () => ({
    x: new Animated.Value(SCREEN_W * (0.2 + Math.random() * 0.6)),
    y: new Animated.Value(originY),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface Props {
  type: 'small' | 'big';
  onDone?: () => void;
}

export default function Confetti({ type, onDone }: Props) {
  const isSmall = type === 'small';
  const count = isSmall ? 40 : 100;
  const colors = isSmall ? CONFETTI_COLORS : FIREWORK_COLORS;
  const originY = isSmall ? SCREEN_H * 0.35 : -20;
  const duration = isSmall ? 1800 : 3000;

  const pieces = useMemo(() => createPieces(count, colors, originY), []);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const animations = pieces.map((p) => {
      const spreadX = (Math.random() - 0.5) * SCREEN_W * (isSmall ? 0.8 : 1.2);
      const fallDistance = SCREEN_H * (isSmall ? 0.6 : 1.1);
      const delay = Math.random() * (isSmall ? 100 : 300);

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: (p.x as any)._value + spreadX,
          duration: duration + delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: originY + fallDistance,
          duration: duration + delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: 3 + Math.random() * 6,
          duration: duration + delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.6 + delay),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(isSmall ? 15 : 10, animations).start();

    timerRef.current = setTimeout(() => {
      onDone?.();
    }, duration + 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const spin = p.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const w = p.shape === 'rect' ? p.size * 1.8 : p.size;
        const h = p.size;
        const borderRadius = p.shape === 'circle' ? p.size / 2 : 2;

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: w,
              height: h,
              borderRadius,
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: spin },
              ],
              opacity: p.opacity,
            }}
          />
        );
      })}
    </View>
  );
}
