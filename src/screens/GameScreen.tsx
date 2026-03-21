import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Badge } from '../types';
import Confetti from '../components/Confetti';
import BadgeUnlockPopup from '../components/BadgeUnlockPopup';
import { useGameStore } from '../store/gameStore';
import CardCarousel from '../components/CardCarousel';
import BigBoard from '../components/BigBoard';
import StreakFlame from '../components/StreakFlame';
import DiscardPips from '../components/DiscardPips';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

// ─── Tips for first-time players ────────────────────────────────────────────

const GAME_TIPS = [
  {
    id: 'tip-hand',
    title: 'Your Hand',
    message: 'Swipe through the cards in your hand. Tap a card to expand it, then mark it complete when you finish the task!',
    icon: 'card',
  },
  {
    id: 'tip-challenge',
    title: 'Challenge Board',
    message: 'The top board shows bonus challenges worth more points. These are bigger tasks like riding rides or meeting characters.',
    icon: '🏆',
  },
  {
    id: 'tip-discard',
    title: 'Discards',
    message: 'Don\'t like a card? Discard it for a new one — but be careful, discards are limited and reset your streak!',
    icon: '🔄',
  },
  {
    id: 'tip-streak',
    title: 'Streaks',
    message: 'Complete tasks in a row to build your streak! Every 5 tasks earns a bonus 10 points. Discarding resets your streak.',
    icon: '🔥',
  },
  {
    id: 'tip-badges',
    title: 'Badges',
    message: 'Earn badges by completing lots of tasks in each category. Check your profile to see your progress!',
    icon: '🏅',
  },
];

export default function GameScreen() {
  const {
    session,
    settings,
    completeTask,
    discardTask,
    swapChallengeTask,
    answerTrivia,
    startSession,
    newlyEarnedBadges,
    clearNewBadges,
  } = useGameStore();

  const parkId = settings.parkIds?.[0];
  const park = PARKS.find(p => p.id === parkId);

  const [showSmallConfetti, setShowSmallConfetti] = useState(false);
  const [showBigFirework, setShowBigFirework] = useState(false);

  // ─── Tips system ────────────────────────────────────────────────────────
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTips, setShowTips] = useState(true);

  const handleNextTip = useCallback(() => {
    if (currentTipIndex < GAME_TIPS.length - 1) {
      setCurrentTipIndex(i => i + 1);
    } else {
      setShowTips(false);
    }
  }, [currentTipIndex]);

  const handleSkipTips = useCallback(() => {
    setShowTips(false);
  }, []);

  // Reset tips when session changes (new game started)
  const sessionIdRef = useRef(session?.id);
  useEffect(() => {
    if (session?.id && session.id !== sessionIdRef.current) {
      sessionIdRef.current = session.id;
      setCurrentTipIndex(0);
      setShowTips(true);
    }
  }, [session?.id]);

  // ─── Badge popup system (simplified) ──────────────────────────────────
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const processedBadgeIdsRef = useRef(new Set<string>());

  // Watch for new badges — add unprocessed ones to queue
  useEffect(() => {
    if (newlyEarnedBadges.length === 0) return;

    const unprocessed = newlyEarnedBadges.filter(
      b => !processedBadgeIdsRef.current.has(b.id)
    );
    if (unprocessed.length === 0) return;

    // Mark as processed immediately
    for (const b of unprocessed) {
      processedBadgeIdsRef.current.add(b.id);
    }

    // Delay popup so confetti plays first
    const timer = setTimeout(() => {
      setBadgeQueue(prev => [...prev, ...unprocessed]);
    }, 1200);

    return () => clearTimeout(timer);
  }, [newlyEarnedBadges]);

  // Show next badge in queue when no active badge
  useEffect(() => {
    if (badgeQueue.length > 0 && !activeBadge) {
      setActiveBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    }
  }, [badgeQueue, activeBadge]);

  const handleBadgeDismiss = useCallback(() => {
    setActiveBadge(null);
    // If this was the last badge and queue is empty, clean up
    if (badgeQueue.length === 0) {
      processedBadgeIdsRef.current.clear();
      clearNewBadges();
    }
  }, [badgeQueue.length, clearNewBadges]);

  useEffect(() => {
    if (!session?.active) {
      startSession();
    }
  }, []);

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const handleCompleteSmall = (id: string) => {
    completeTask(id, false);
    setShowSmallConfetti(true);
  };

  const handleCompleteBig = (id: string) => {
    completeTask(id, true);
    setShowBigFirework(true);
  };

  return (
    <ImageBackground
      source={require('../../assets/HomeScreenBackgroundImage.png')}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <StreakFlame streak={session.currentStreak} />
          <Text style={styles.parkName}>{park?.name ?? '?'}</Text>
          <View style={styles.scoreBubble}>
            <Text style={styles.scoreValue}>{session.sessionScore}</Text>
            <Text style={styles.scorePts}>pts</Text>
          </View>
        </View>

        {/* Challenge Tasks */}
        <View style={styles.bigBoardWrapper}>
          <BigBoard
            tasks={session.challengeTasks}
            sessionScore={session.sessionScore}
            onComplete={handleCompleteBig}
            onSwap={id => swapChallengeTask(id)}
          />
        </View>

        {/* Divider + Hand label */}
        <View style={styles.divider} />
        <View style={styles.handHeader}>
          <Text style={styles.handLabel}>YOUR HAND</Text>
          <DiscardPips remaining={session.discardsRemaining} />
        </View>

        {/* Card Carousel */}
        <View style={styles.carouselWrapper}>
          <CardCarousel
            cards={session.hand}
            onComplete={handleCompleteSmall}
            onDiscard={id => discardTask(id)}
            onTriviaAnswer={(id, correct) => answerTrivia(id, correct)}
            discardsRemaining={session.discardsRemaining}
          />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <StatItem label="Completed" value={session.completedTasks.length} />
          <StatItem label="Streak" value={session.currentStreak} />
          <StatItem label="Session" value={`${session.sessionScore} pts`} />
        </View>

        {/* Small confetti for hand card completion */}
        {showSmallConfetti && (
          <Confetti type="small" onDone={() => setShowSmallConfetti(false)} />
        )}

        {/* Big firework for challenge task completion */}
        {showBigFirework && (
          <Confetti type="big" onDone={() => setShowBigFirework(false)} />
        )}

      </SafeAreaView>

      {/* Badge unlock popup — rendered outside SafeAreaView for full-screen overlay */}
      {activeBadge && (
        <BadgeUnlockPopup
          key={activeBadge.id}
          badge={activeBadge}
          onDismiss={handleBadgeDismiss}
        />
      )}

      {/* Tips modal for new players */}
      <Modal
        visible={showTips}
        transparent
        animationType="fade"
        onRequestClose={handleSkipTips}
      >
        <View style={styles.tipOverlay}>
          <View style={styles.tipCard}>
            {GAME_TIPS[currentTipIndex].icon === 'card' ? (
              <View style={styles.tipLogoCard}>
                <Text style={styles.tipLogoS}>S</Text>
                <View style={styles.tipLogoDivider}>
                  <View style={styles.tipLogoDividerLine} />
                  <Text style={styles.tipLogoDividerStar}>✦</Text>
                  <View style={styles.tipLogoDividerLine} />
                </View>
                <Text style={styles.tipLogoQ}>Q</Text>
              </View>
            ) : (
              <Text style={styles.tipIcon}>{GAME_TIPS[currentTipIndex].icon}</Text>
            )}
            <Text style={styles.tipTitle}>{GAME_TIPS[currentTipIndex].title}</Text>
            <Text style={styles.tipMessage}>{GAME_TIPS[currentTipIndex].message}</Text>

            <View style={styles.tipDots}>
              {GAME_TIPS.map((_, i) => (
                <View
                  key={i}
                  style={[styles.tipDot, i === currentTipIndex && styles.tipDotActive]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.tipNextBtn} onPress={handleNextTip}>
              <Text style={styles.tipNextBtnText}>
                {currentTipIndex < GAME_TIPS.length - 1 ? 'Next' : 'Let\'s Play!'}
              </Text>
            </TouchableOpacity>

            {currentTipIndex < GAME_TIPS.length - 1 && (
              <TouchableOpacity style={styles.tipSkipBtn} onPress={handleSkipTips}>
                <Text style={styles.tipSkipBtnText}>Skip Tips</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  safe: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.textBody,
    fontSize: Math.round(16 * sw),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(12 * sw),
    paddingVertical: Math.round(10 * sh),
    marginTop: Math.round(8 * sh),
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.chip,
  },
  parkName: {
    color: COLORS.textDark,
    fontWeight: '900',
    fontSize: Math.round(13 * sw),
    letterSpacing: 0.5,
    flexShrink: 1,
    textAlign: 'center',
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: RADII.chip,
    paddingHorizontal: Math.round(10 * sw),
    paddingVertical: Math.round(3 * sh),
    minWidth: Math.round(52 * sw),
    borderBottomWidth: 2,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.chip,
  },
  scoreValue: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(16 * sw),
    lineHeight: Math.round(20 * sw),
  },
  scorePts: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Math.round(8 * sw),
    fontWeight: '600',
  },
  bigBoardWrapper: {
    marginTop: Math.round(8 * sh),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: Math.round(20 * sw),
    marginTop: Math.round(10 * sh),
    marginBottom: Math.round(6 * sh),
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(20 * sw),
    marginBottom: Math.round(8 * sh),
  },
  handLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(10 * sw),
    fontWeight: '700',
    letterSpacing: 2,
  },
  carouselWrapper: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    marginHorizontal: Math.round(16 * sw),
    borderRadius: RADII.panel,
    paddingVertical: Math.round(6 * sh),
    marginTop: Math.round(6 * sh),
    marginBottom: Math.round(70 * sh),
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: Math.round(14 * sw),
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(9 * sw),
    marginTop: 1,
  },

  // Tips modal
  tipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  tipCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  tipIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  tipLogoCard: {
    width: 56,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#D4C4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tipLogoS: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B8A9D4',
    letterSpacing: 1,
  },
  tipLogoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 36,
    marginVertical: 1,
  },
  tipLogoDividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#D4C4EE',
    borderRadius: 1,
  },
  tipLogoDividerStar: {
    fontSize: 8,
    marginHorizontal: 3,
    color: '#C8A4F0',
  },
  tipLogoQ: {
    fontSize: 18,
    fontWeight: '900',
    color: '#9B7FD4',
    letterSpacing: 1,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  tipMessage: {
    fontSize: 15,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  tipDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderMedium,
  },
  tipDotActive: {
    backgroundColor: COLORS.green,
    width: 20,
  },
  tipNextBtn: {
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  tipNextBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  tipSkipBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  tipSkipBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
