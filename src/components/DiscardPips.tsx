import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../theme/balatro';

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
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...SHADOWS.chip,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pips: {
    flexDirection: 'row',
    gap: 4,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipActive: {
    backgroundColor: '#009DFF',
  },
  pipUsed: {
    backgroundColor: '#E2E8F0',
  },
});
