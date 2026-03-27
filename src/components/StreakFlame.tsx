/**
 * StreakFlame.tsx — Streak counter with color-coded fire emoji
 *
 * Displays the current task completion streak with escalating visual feedback:
 *  0 = gray dash, 1-4 = orange 🔥, 5-9 = red-orange 🔥, 10-14 = double 🔥🔥,
 *  15-19 = triple 🔥🔥🔥, 20+ = cyan 💙🔥 (legendary streak)
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SHADOWS } from '../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const sw = SCREEN_W / 390;

interface Props {
  streak: number;
}

function getFlameEmoji(streak: number): string {
  if (streak === 0) return '';
  if (streak < 5) return '\uD83D\uDD25';
  if (streak < 10) return '\uD83D\uDD25';
  if (streak < 15) return '\uD83D\uDD25\uD83D\uDD25';
  if (streak < 20) return '\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25';
  return '\uD83D\uDC99\uD83D\uDD25';
}

function getFlameColor(streak: number): string {
  if (streak === 0) return '#A0AEC0'; // Gray
  if (streak < 5) return '#FF6B35';   // Orange
  if (streak < 10) return '#FF4500';  // Red-Orange
  if (streak < 15) return '#FF2200';  // Red
  if (streak < 20) return '#FF0000';  // Bright Red
  return '#00BFFF';                    // Cyan
}

export default function StreakFlame({ streak }: Props) {
  if (streak === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.zeroText}>{'\u2014'}</Text>
      </View>
    );
  }

  const flameColor = getFlameColor(streak);
  const emoji = getFlameEmoji(streak);

  return (
    <View style={[styles.container, { borderColor: flameColor }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.count, { color: flameColor }]}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: Math.round(14 * sw),
    borderWidth: 1.5,
    paddingHorizontal: Math.round(6 * sw),
    paddingVertical: Math.round(2 * sw),
    minWidth: Math.round(38 * sw),
    borderColor: COLORS.borderMedium,
    ...SHADOWS.chip,
  },
  emoji: {
    fontSize: Math.round(12 * sw),
  },
  count: {
    fontWeight: '800',
    fontSize: Math.round(11 * sw),
  },
  zeroText: {
    color: COLORS.textMuted,
    fontSize: Math.round(14 * sw),
    fontWeight: '700',
  },
});
