import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../theme/balatro';

interface Props {
  streak: number;
}

function getFlameEmoji(streak: number): string {
  if (streak === 0) return '';
  if (streak < 3) return '🔥';
  if (streak < 6) return '🔥';
  if (streak < 9) return '🔥🔥';
  if (streak < 12) return '🔥🔥🔥';
  return '💙🔥';
}

function getFlameColor(streak: number): string {
  if (streak === 0) return 'transparent';
  if (streak < 3) return '#FF6B35';
  if (streak < 6) return '#FF4500';
  if (streak < 9) return '#FF2200';
  if (streak < 12) return '#FF0000';
  return '#00BFFF';
}

export default function StreakFlame({ streak }: Props) {
  if (streak === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.zeroText}>—</Text>
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
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 54,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.chip,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontWeight: '800',
    fontSize: 15,
    color: '#fff',
  },
  zeroText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
});
