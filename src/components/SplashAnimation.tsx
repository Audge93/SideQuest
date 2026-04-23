/**
 * SplashAnimation.tsx — Startup card-flip animation
 *
 * Displays a playing card that flips from its purple diamond-patterned back
 * to the white S ✦ Q logo front. The animation has 4 phases:
 *   1. Float in (fade + translate up)
 *   2. Flip the card 180° on its Y axis
 *   3. Brief hold so the player sees the logo
 *   4. Pop off (scale up + fade out), then call onFinish to unmount
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';

// Card dimensions (points, not responsive — centered on screen)
const CARD_W = 180;
const CARD_H = 240;

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  // ─── Animation values ──────────────────────────────────────────────────────
  const cardOpacity = useRef(new Animated.Value(0)).current;     // Card fade in
  const containerOpacity = useRef(new Animated.Value(1)).current; // Background starts fully opaque
  const flipAnim = useRef(new Animated.Value(0)).current;        // 0 = back face, 1 = front face
  const scaleAnim = useRef(new Animated.Value(1)).current;       // Pop-off scale effect
  const translateY = useRef(new Animated.Value(30)).current;     // Float-up entrance

  // ─── Animation sequence ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      // Phase 1: Fade card in + float up (0.4s) — background stays solid
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Hold so the player reads the back (2.5s)
      Animated.delay(2500),
      // Phase 3: Flip the card over (0.8s)
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Phase 3: Brief pause to show the logo (0.5s)
      Animated.delay(500),
      // Phase 4: Pop off — scale up + fade everything out (0.45s)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.8,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  // ─── Flip interpolation ─────────────────────────────────────────────────
  // Map flipAnim (0→1) to rotation degrees for front and back faces.
  // At the midpoint (0.5) both faces are edge-on; opacity swaps visibility.
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '90deg', '0deg'],
  });
  const backRotation = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });

  // Swap visibility at the midpoint of the flip
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const outlineStyle = {
    textShadow: '-2px -2px 0 #3D2260, 2px -2px 0 #3D2260, -2px 2px 0 #3D2260, 2px 2px 0 #3D2260',
  } as any;

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" />

      {/* Static sticker — present from the first frame, not animated */}
      <View style={styles.sticker}>
        <Text style={[styles.stickerLine, outlineStyle]}>THEME PARK</Text>
        <Text style={[styles.stickerLine, outlineStyle]}>SCAVENGER HUNT</Text>
      </View>

      {/* Card animation group */}
      <Animated.View
        style={[
          styles.cardGroup,
          {
            opacity: cardOpacity,
            transform: [{ translateY }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardWrapper}>
          {/* Back of card (shown first, flips away) */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              {
                opacity: backOpacity,
                transform: [{ perspective: 1000 }, { rotateY: backRotation }],
              },
            ]}
          >
            <View style={styles.backPattern}>
              <View style={styles.backInnerBorder}>
                <Text style={styles.backWordTop}>SIDE</Text>
                <View style={styles.cardDivider}>
                  <View style={styles.backDividerLine} />
                  <Text style={styles.backDividerStar}>✦</Text>
                  <View style={styles.backDividerLine} />
                </View>
                <Text style={styles.backWordBottom}>QUEST</Text>
              </View>
            </View>
          </Animated.View>

          {/* Front of card (logo — revealed by flip) */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardFront,
              {
                opacity: frontOpacity,
                transform: [{ perspective: 1000 }, { rotateY: frontRotation }],
              },
            ]}
          >
            <Text style={styles.cardS}>S</Text>
            <View style={styles.cardDivider}>
              <View style={styles.cardDividerLine} />
              <Text style={styles.cardDividerStar}>✦</Text>
              <View style={styles.cardDividerLine} />
            </View>
            <Text style={styles.cardQ}>Q</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8E0F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 999,
  },
  cardGroup: {
    alignItems: 'center',
  },
  sticker: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#3D2260',
    transform: [{ rotate: '-4deg' }],
    shadowColor: '#2D1A4E',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 0,
    elevation: 8,
    alignItems: 'center',
  },
  stickerLine: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    lineHeight: 26,
  },
  cardWrapper: {
    width: CARD_W,
    height: CARD_H,
  },
  cardFace: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  // Back of card — purple with diamond pattern
  cardBack: {
    backgroundColor: '#9B7FD4',
    borderWidth: 3,
    borderColor: '#B8A9D4',
  },
  backPattern: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  backInnerBorder: {
    width: CARD_W - 28,
    height: CARD_H - 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  backWordTop: {
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 3,
  },
  backWordBottom: {
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 3,
  },
  backDividerLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
  },
  backDividerStar: {
    fontSize: 18,
    marginHorizontal: 8,
    color: 'rgba(255,255,255,0.6)',
  },

  // Front of card — white with S ✦ Q logo
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#D4C4EE',
  },
  cardS: {
    fontSize: 52,
    fontWeight: '900',
    color: '#B8A9D4',
    letterSpacing: 4,
  },
  cardDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: CARD_W - 50,
    marginVertical: 4,
  },
  cardDividerLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#D4C4EE',
    borderRadius: 1,
  },
  cardDividerStar: {
    fontSize: 18,
    marginHorizontal: 8,
    color: '#C8A4F0',
  },
  cardQ: {
    fontSize: 52,
    fontWeight: '900',
    color: '#9B7FD4',
    letterSpacing: 4,
  },
});
