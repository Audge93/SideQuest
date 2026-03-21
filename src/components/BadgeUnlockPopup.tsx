import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Badge, BadgeTier } from '../types';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TIER_GLOW: Record<BadgeTier, string> = {
  bronze: 'rgba(205,127,50,0.4)',
  silver: 'rgba(192,192,192,0.4)',
  gold: 'rgba(255,215,0,0.5)',
  platinum: 'rgba(229,228,226,0.5)',
};

const SPARKLE_COLORS = ['#FFD700', '#FFF8DC', '#FFFACD', '#F0E68C', '#FFE4B5', '#FFFFFF'];

interface SparkleParticle {
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  startX: number;
  startY: number;
}

function createSparkles(count: number): SparkleParticle[] {
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H * 0.38;
  return Array.from({ length: count }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    startX: cx + (Math.random() - 0.5) * 40,
    startY: cy + (Math.random() - 0.5) * 40,
  }));
}

interface Props {
  badge: Badge;
  onDismiss: () => void;
}

export default function BadgeUnlockPopup({ badge, onDismiss }: Props) {
  const tierColor = TIER_COLORS[badge.tier];
  const tierGlow = TIER_GLOW[badge.tier];

  // Overlay fade
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // Card entrance: scale + translateY
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  // Badge icon: pop + wiggle
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeWiggle = useRef(new Animated.Value(0)).current;
  // Glow ring pulse
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  // Title slide in
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  // Badge name slide in
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(15)).current;
  // Description fade
  const descOpacity = useRef(new Animated.Value(0)).current;
  // Dismiss button
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.8)).current;

  // Sparkle particles
  const sparkles = useMemo(() => createSparkles(16), []);

  useEffect(() => {
    // 1. Overlay fades in
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 2. Card pops in (slight delay)
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. "Badge Unlocked!" title slides up
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
    ]).start();

    // 4. Badge icon pops in with overshoot
    Animated.sequence([
      Animated.delay(550),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 5. Glow ring pulses
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1.3, friction: 5, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();

    // Repeat glow pulse
    Animated.sequence([
      Animated.delay(900),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowScale, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.2, duration: 1200, useNativeDriver: true }),
        ]),
      ),
    ]).start();

    // 6. Wiggle/jiggle animation on the badge
    Animated.sequence([
      Animated.delay(750),
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgeWiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(badgeWiggle, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(badgeWiggle, { toValue: 0.7, duration: 70, useNativeDriver: true }),
          Animated.timing(badgeWiggle, { toValue: -0.7, duration: 70, useNativeDriver: true }),
          Animated.timing(badgeWiggle, { toValue: 0.3, duration: 60, useNativeDriver: true }),
          Animated.timing(badgeWiggle, { toValue: 0, duration: 60, useNativeDriver: true }),
          Animated.delay(2000),
        ]),
        { iterations: -1 },
      ),
    ]).start();

    // 7. Badge name slides in
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(nameTranslateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
    ]).start();

    // 8. Description fades in
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(descOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // 9. Dismiss button appears
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),
    ]).start();

    // 10. Sparkle particles burst outward
    sparkles.forEach((s, i) => {
      const angle = (i / sparkles.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 80;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const delay = 600 + Math.random() * 200;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.spring(s.scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
            Animated.timing(s.scale, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
          Animated.timing(s.x, { toValue: dx, duration: 900, useNativeDriver: true }),
          Animated.timing(s.y, { toValue: dy, duration: 900, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(500),
            Animated.timing(s.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  }, []);

  const wiggleRotation = badgeWiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(cardScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        {/* Sparkle particles */}
        {sparkles.map((s, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: s.startX,
              top: s.startY,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: s.color,
              transform: [
                { translateX: s.x },
                { translateY: s.y },
                { scale: s.scale },
              ],
              opacity: s.opacity,
            }}
          />
        ))}

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              borderColor: tierColor,
              transform: [
                { scale: cardScale },
                { translateY: cardTranslateY },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* "Badge Unlocked!" header */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
          >
            <Text style={styles.unlockTitle}>✨ Badge Unlocked! ✨</Text>
          </Animated.View>

          {/* Glow ring behind badge */}
          <View style={styles.badgeContainer}>
            <Animated.View
              style={[
                styles.glowRing,
                {
                  backgroundColor: tierGlow,
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
            />

            {/* Badge icon with wiggle + pop */}
            <Animated.View
              style={[
                styles.badgeCircle,
                {
                  borderColor: tierColor,
                  transform: [
                    { scale: badgeScale },
                    { rotate: wiggleRotation },
                  ],
                },
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.icon}</Text>
            </Animated.View>
          </View>

          {/* Tier label */}
          <Animated.View
            style={[
              styles.tierPill,
              { backgroundColor: tierColor, opacity: nameOpacity },
            ]}
          >
            <Text style={styles.tierPillText}>
              {badge.tier.toUpperCase()}
            </Text>
          </Animated.View>

          {/* Badge name */}
          <Animated.Text
            style={[
              styles.badgeName,
              {
                opacity: nameOpacity,
                transform: [{ translateY: nameTranslateY }],
              },
            ]}
          >
            {badge.name}
          </Animated.Text>

          {/* Description */}
          <Animated.Text style={[styles.badgeDesc, { opacity: descOpacity }]}>
            {badge.description}
          </Animated.Text>

          {/* Completed progress bar */}
          <Animated.View style={[styles.completedBar, { opacity: descOpacity }]}>
            <View style={styles.completedTrack}>
              <View style={[styles.completedFill, { backgroundColor: tierColor }]} />
            </View>
            <Text style={[styles.completedText, { color: tierColor }]}>Complete!</Text>
          </Animated.View>

          {/* Dismiss button */}
          <Animated.View
            style={{
              opacity: btnOpacity,
              transform: [{ scale: btnScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.dismissBtn, { borderBottomColor: tierColor }]}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: Math.round(300 * sw),
    backgroundColor: COLORS.cardBg,
    borderRadius: Math.round(24 * sw),
    borderWidth: 3,
    paddingTop: Math.round(28 * sh),
    paddingBottom: Math.round(24 * sh),
    paddingHorizontal: Math.round(24 * sw),
    alignItems: 'center',
    ...SHADOWS.cardActive,
  },
  unlockTitle: {
    fontSize: Math.round(18 * sw),
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: Math.round(18 * sh),
    letterSpacing: 0.5,
  },
  badgeContainer: {
    width: Math.round(110 * sw),
    height: Math.round(110 * sw),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Math.round(14 * sh),
    overflow: 'visible',
  },
  glowRing: {
    position: 'absolute',
    width: Math.round(110 * sw),
    height: Math.round(110 * sw),
    borderRadius: Math.round(55 * sw),
  },
  badgeCircle: {
    width: Math.round(88 * sw),
    height: Math.round(88 * sw),
    borderRadius: Math.round(44 * sw),
    backgroundColor: COLORS.white,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    ...SHADOWS.button,
  },
  badgeEmoji: {
    fontSize: Math.round(42 * sw),
    lineHeight: Math.round(50 * sw),
    textAlign: 'center',
  },
  tierPill: {
    paddingHorizontal: Math.round(16 * sw),
    paddingVertical: Math.round(4 * sh),
    borderRadius: Math.round(12 * sw),
    marginBottom: Math.round(8 * sh),
  },
  tierPillText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(11 * sw),
    letterSpacing: 2,
  },
  badgeName: {
    fontSize: Math.round(20 * sw),
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: Math.round(6 * sh),
  },
  badgeDesc: {
    fontSize: Math.round(13 * sw),
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: Math.round(18 * sw),
    marginBottom: Math.round(8 * sh),
  },
  completedBar: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Math.round(16 * sh),
  },
  completedTrack: {
    width: '80%',
    height: Math.round(8 * sh),
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Math.round(6 * sh),
  },
  completedFill: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  completedText: {
    fontWeight: '900',
    fontSize: Math.round(13 * sw),
    letterSpacing: 0.5,
  },
  dismissBtn: {
    backgroundColor: COLORS.green,
    borderRadius: Math.round(14 * sw),
    paddingVertical: Math.round(12 * sh),
    paddingHorizontal: Math.round(40 * sw),
    borderBottomWidth: 4,
    ...SHADOWS.button,
  },
  dismissBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(16 * sw),
    letterSpacing: 0.5,
  },
});
