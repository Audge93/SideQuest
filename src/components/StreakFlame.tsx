import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../theme/balatro';

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
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 54,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.chip,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontWeight: '800',
    fontSize: 15,
  },
  zeroText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
});
