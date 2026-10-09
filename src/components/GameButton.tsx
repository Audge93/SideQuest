import { useReducedMotion, useReadingPreferences } from '../theme/useAccessibility';
import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated, ViewStyle, StyleProp } from 'react-native';
import { FONTS, INK } from '../theme/theme';
import { playSound } from '../utils/sounds';

const TONES = {
  green: { face: '#3DBE6E', edge: '#23864A' },
  red: { face: '#E2504F', edge: '#A3302F' },
  blue: { face: '#3B82F6', edge: '#2257B3' },
  gold: { face: '#F2B830', edge: '#B07E12' },
  gray: { face: '#5B5375', edge: '#3E3756' },
} as const;

export type ButtonTone = keyof typeof TONES;

interface Props {
  label: string;
  multiline?: boolean;
  stretch?: boolean;
  sublabel?: string;
  tone?: ButtonTone;
  onPress?: () => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  /** Providing selected makes this a radio option. */
  selected?: boolean;
}

export default function GameButton({ multiline, stretch, label, sublabel, tone = 'green', onPress, disabled, size = 'md', style, testID, accessibilityLabel, selected }: Props) {
  const reduced = useReducedMotion();
  const { scale, readableFont, highContrast } = useReadingPreferences();
  const press = useRef(new Animated.Value(0)).current;
  const colors = highContrast ? { face: disabled ? '#444444' : '#111111', edge: '#000000' } : disabled ? TONES.gray : TONES[tone];
  const depth = size === 'lg' ? 6 : 5;

  const animate = (to: number) =>
    Animated.timing(press, { toValue: to, duration: reduced ? 0 : 70, useNativeDriver: true }).start();

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={disabled ? undefined : () => { playSound('tap'); onPress?.(); }}
      onPressIn={() => !disabled && animate(1)}
      onPressOut={() => animate(0)}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      aria-checked={selected}
      accessibilityLabel={accessibilityLabel ?? [label, sublabel].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: !!disabled, ...(selected === undefined ? {} : { checked: selected }) }}
      style={[styles.wrap, style]}
    >
      <Animated.View
        style={[
          styles.edge,
          stretch && { flexGrow: 1 },
          { backgroundColor: colors.edge, paddingBottom: depth },
        ]}
      >
        <Animated.View
          style={[
            styles.face,
            stretch && { flexGrow: 1 },
            size === 'lg' && styles.faceLg,
            {
              backgroundColor: colors.face,
              transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, depth - 1] }) }],
            },
          ]}
        >
          <Text style={[styles.label, size === 'lg' && styles.labelLg, disabled && styles.dimmed, { fontSize: (size === 'lg' ? 22 : 20) * scale, fontFamily: readableFont ? 'System' : FONTS.display, textAlign: 'center', textShadowColor: highContrast || readableFont ? 'transparent' : 'rgba(42,30,63,0.55)' }]} numberOfLines={multiline || scale > 1 ? undefined : 1}>
            {label}
          </Text>
          {sublabel ? <Text style={[styles.sublabel, disabled && styles.dimmed, { fontSize: 11 * scale }]}>{sublabel}</Text> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
  },
  edge: {
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: INK,
    overflow: 'hidden',
  },
  face: {
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  faceLg: {
    paddingVertical: 12,
    minHeight: 52,
  },
  label: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 0.6,
    textShadowColor: 'rgba(42, 30, 63, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  labelLg: {
    fontSize: 22,
  },
  dimmed: {
    opacity: 0.55,
  },
  sublabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: -1,
  },
});
