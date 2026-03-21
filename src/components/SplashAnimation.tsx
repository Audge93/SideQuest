import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';

// Card dimensions
const CARD_W = 180;
const CARD_H = 240;

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  // Single master opacity that drives both float-in and pop-out
  const masterOpacity = useRef(new Animated.Value(0)).current;
  // Flip animation: 0 = back face showing, 1 = front face showing
  const flipAnim = useRef(new Animated.Value(0)).current;
  // Scale for the pop-off effect
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Float translate
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Fade in + float up (0.4s)
      Animated.parallel([
        Animated.timing(masterOpacity, {
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
      // Phase 2: Flip the card over (0.8s)
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Phase 3: Brief pause to show the logo (0.5s)
      Animated.delay(500),
      // Phase 4: Pop off — scale up + fade out (0.45s)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.8,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(masterOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  // Flip interpolation — full 180-degree Y rotation
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

  return (
    <Animated.View style={[styles.container, { opacity: masterOpacity }]}>
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [
              { translateY },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
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
              <Text style={styles.backDiamond}>✦</Text>
              <Text style={styles.backDiamond}>✦</Text>
              <Text style={styles.backDiamond}>✦</Text>
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
  backDiamond: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
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
