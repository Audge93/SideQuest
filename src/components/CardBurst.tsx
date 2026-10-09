import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '../theme/useAccessibility';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { FONTS, INK as THEME_INK, TABLE } from '../theme/theme';

export type BurstVariant = 'complete' | 'discard';

const GOLD = TABLE.gold;
const INK = THEME_INK;

interface Particle {
  angle: number;
  distance: number;
  spin: number;
  w: number;
  h: number;
  color: string;
  duration: number;
}

function makeShards(color: string, count: number): Particle[] {
  const palette = [color, color, GOLD, '#FFFFFF'];
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 120 + Math.random() * 110,
    spin: (Math.random() - 0.5) * 720,
    w: 12 + Math.random() * 12,
    h: 8 + Math.random() * 8,
    color: palette[i % palette.length],
    duration: 620 + Math.random() * 260,
  }));
}

function makeDust(color: string, count: number): Particle[] {
  const palette = [color, '#B8B2C8', '#D9D4E4'];
  return Array.from({ length: count }, (_, i) => ({
    angle: Math.PI / 2 + (Math.random() - 0.5) * 2.2,
    distance: 50 + Math.random() * 110,
    spin: (Math.random() - 0.5) * 360,
    w: 4 + Math.random() * 6,
    h: 4 + Math.random() * 6,
    color: palette[i % palette.length],
    duration: 520 + Math.random() * 240,
  }));
}

function ShardView({ p, delay, gravity, outlined }: { p: Particle; delay: number; gravity: number; outlined: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: p.duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const dx = Math.cos(p.angle) * p.distance;
  const dy = Math.sin(p.angle) * p.distance;
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: p.w,
          height: p.h,
          marginLeft: -p.w / 2,
          marginTop: -p.h / 2,
          backgroundColor: p.color,
          borderWidth: outlined ? 2 : 0,
          borderColor: INK,
          opacity: t.interpolate({ inputRange: [0, 0.01, 0.65, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, dy, dy + gravity] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            { scale: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.2, 0.3] }) },
          ],
        },
      ]}
    />
  );
}

function Sparkle({ index, count, delay }: { index: number; count: number; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const { angle, distance, size } = useMemo(
    () => ({
      angle: (index / count) * Math.PI * 2 + Math.random() * 0.6,
      distance: 70 + Math.random() * 80,
      size: 14 + Math.random() * 10,
    }),
    [],
  );
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 700,
      delay: delay + 60 + index * 25,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          fontSize: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          opacity: t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: Math.cos(angle) * distance },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [Math.sin(angle) * distance, Math.sin(angle) * distance - 20] }) },
            { scale: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.3, 0] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
          ],
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
}

function Ring({ color, delay, maxScale, width }: { color: string; delay: number; maxScale: number; width: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          borderColor: color,
          borderWidth: width,
          opacity: t.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 1, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.25, maxScale] }) }],
        },
      ]}
    />
  );
}

function Flash({ delay }: { delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 280, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.flash,
        {
          opacity: t.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.95, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) }],
        },
      ]}
    />
  );
}

function ScorePop({ label, chipColor, delay, offsetY = 0, small }: { label: string; chipColor: string; delay: number; offsetY?: number; small?: boolean }) {
  const pop = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay + 40),
      Animated.parallel([
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
        Animated.timing(rise, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.scoreWrap,
        {
          opacity: Animated.multiply(
            pop.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
            rise.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
          ),
          transform: [
            { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [offsetY, offsetY - 90] }) },
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
            { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '-4deg'] }) },
          ],
        },
      ]}
    >
      <View style={[styles.scoreChip, { backgroundColor: chipColor }]}>
        <Text style={[styles.scoreText, small && styles.scoreTextSmall]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

interface Props {
  color: string;
  variant: BurstVariant;
  points?: number;
  bonus?: number;
  delay?: number;
  offsetX?: number;
  onDone: () => void;
}

export default function CardBurst(props: Props) {
  const reduced = useReducedMotion();
  return reduced ? <QuietFeedback {...props} /> : <AnimatedBurst {...props} />;
}
function QuietFeedback({ variant, points = 0, bonus = 0, onDone }: Props) {
  useEffect(() => { const timer = setTimeout(onDone, 1000); return () => clearTimeout(timer); }, [onDone]);
  return <View pointerEvents="none" style={{ position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: '#111111', padding: 12, borderRadius: 8 }}>
    <Text accessibilityLiveRegion="polite" style={{ color: '#FFFFFF', fontSize: 18 }}>{variant === 'complete' ? `+${points + bonus} points` : 'Card discarded'}</Text>
  </View>;
}
function AnimatedBurst({ color, variant, points, bonus = 0, delay = 0, offsetX = 0, onDone }: Props) {
  const isComplete = variant === 'complete';
  const particles = useMemo(() => (isComplete ? makeShards(color, 26) : makeDust(color, 16)), []);

  useEffect(() => {
    const timer = setTimeout(onDone, delay + (isComplete ? 1300 : 850));
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.origin, { transform: [{ translateX: offsetX }] }]}>
        {isComplete && <Flash delay={delay} />}
        {isComplete && <Ring color="#FFFFFF" delay={delay} maxScale={3.2} width={6} />}
        {isComplete && <Ring color={color} delay={delay + 80} maxScale={2.5} width={10} />}
        {isComplete && <Ring color={GOLD} delay={delay + 160} maxScale={1.9} width={4} />}
        {particles.map((p, i) => (
          <ShardView key={i} p={p} delay={delay} gravity={isComplete ? 40 : 60} outlined={isComplete} />
        ))}
        {isComplete && Array.from({ length: 9 }, (_, i) => <Sparkle key={i} index={i} count={9} delay={delay} />)}
        {isComplete && points != null && <ScorePop label={`+${points}`} chipColor={TABLE.chipBlue} delay={delay} />}
        {isComplete && bonus > 0 && (
          <ScorePop label={`STREAK +${bonus}`} chipColor={TABLE.multRed} delay={delay + 260} offsetY={52} small />
        )}
      </View>
    </View>
  );
}

const RING_SIZE = 120;
const FLASH_SIZE = 170;

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
  sparkle: {
    position: 'absolute',
    color: GOLD,
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    marginLeft: -RING_SIZE / 2,
    marginTop: -RING_SIZE / 2,
  },
  flash: {
    position: 'absolute',
    width: FLASH_SIZE,
    height: FLASH_SIZE,
    borderRadius: FLASH_SIZE / 2,
    marginLeft: -FLASH_SIZE / 2,
    marginTop: -FLASH_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  scoreWrap: {
    position: 'absolute',
    width: 220,
    marginLeft: -110,
    marginTop: -34,
    alignItems: 'center',
  },
  scoreChip: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: INK,
    borderBottomWidth: 6,
  },
  scoreTextSmall: {
    fontSize: 22,
  },
  scoreText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 40,
    letterSpacing: 1,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
});
