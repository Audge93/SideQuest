/**
 * DiscardPips.tsx — Visual discard counter (pip dots)
 *
 * Shows up to 2 small dots representing available discards.
 * Blue = available, gray = used. Displayed next to "YOUR HAND" label.
 * Players earn discards back every 5 completed tasks (up to max 2).
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SHADOWS } from '../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const sw = SCREEN_W / 390;

interface Props {
  remaining: number;
}

export default function DiscardPips({ remaining }: Props) {
  const max = 2;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>DISCARDS</Text>
      <View style={styles.pips}>
        {Array.from({ length: max }).map((_, i) => (
          <View
            key={i}
            style={[styles.pip, i < remaining ? styles.pipActive : styles.pipUsed]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: Math.round(12 * sw),
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
    paddingHorizontal: Math.round(8 * sw),
    paddingVertical: Math.round(4 * sw),
    ...SHADOWS.chip,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: Math.round(7 * sw),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Math.round(3 * sw),
  },
  pips: {
    flexDirection: 'row',
    gap: Math.round(4 * sw),
  },
  pip: {
    width: Math.round(7 * sw),
    height: Math.round(7 * sw),
    borderRadius: Math.round(3.5 * sw),
  },
  pipActive: {
    backgroundColor: '#009DFF',
  },
  pipUsed: {
    backgroundColor: '#E2E8F0',
  },
});
