/**
 * GameScreen.tsx — Active gameplay screen
 *
 * Shows the top bar (streak flame, park name, score), challenge task board,
 * card carousel (the player's "hand"), and stats bar. Also manages:
 *  - Tips modal for first-time players (resets each new session)
 *  - Badge unlock popup queue (fires after task completion confetti)
 *  - Confetti/firework effects on task completion
 *  - Bottom nav bar (Game, Park, Settings, Profile)
 *  - Auto-save every 30 seconds
 */

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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../types';
import Confetti from '../components/Confetti';
import BadgeUnlockPopup from '../components/BadgeUnlockPopup';
import { useGameStore } from '../store/gameStore';
import CardCarousel from '../components/CardCarousel';
import BigBoard from '../components/BigBoard';
import DiscardPips from '../components/DiscardPips';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

// ─── Resorts for Switch Parks ──────────────────────────────────────────────

const RESORTS = [
  { id: 'wdw', label: 'Walt Disney World', icon: '🏰', parkIds: ['wdw-mk', 'wdw-hs', 'wdw-ep', 'wdw-ak'] },
  { id: 'dl', label: 'Disneyland Resort', icon: '🎠', parkIds: ['dl-dl', 'dl-dca'] },
  { id: 'uor', label: 'Universal Orlando', icon: '🌍', parkIds: ['uor-us', 'uor-ioa', 'uor-eu'] },
  { id: 'ush', label: 'Universal Hollywood', icon: '🎬', parkIds: ['ush-us'] },
  { id: 'custom', label: 'Any Park', icon: '🎪', parkIds: ['custom'] },
];

// ─── Tips for first-time players ────────────────────────────────────────────

const GAME_TIPS = [
  {
    id: 'tip-hand',
    title: 'Your Hand',
    message: 'Swipe through the cards in your hand. Tap a card to expand it, then mark it complete when you finish the task!',
    icon: 'card',
  },
  {
    id: 'tip-tasks',
    title: 'Task Types',
    message: 'Your hand has quick tasks — observations, photos, trivia, and action dares. The challenge board has bigger quests like riding rides, finding food, meeting characters, exploring the park, and scavenger hunts!',
    icon: '🎯',
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
  const navigation = useNavigation<any>();

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
    autoSave,
    switchPark,
  } = useGameStore();

  const parkId = settings.parkIds?.[0];
  const park = PARKS.find(p => p.id === parkId);

  const [showSmallConfetti, setShowSmallConfetti] = useState(false);
  const [showBigFirework, setShowBigFirework] = useState(false);

  // ─── Park modal state ─────────────────────────────────────────────────────
  const [showParkModal, setShowParkModal] = useState(false);
  const [selectedResortId, setSelectedResortId] = useState<string>(RESORTS[0].id);
  const [selectedParkId, setSelectedParkId] = useState<string>(RESORTS[0].parkIds[0]);

  const openParkModal = useCallback(() => {
    const currentParkIds = settings.parkIds;
    const matchedResort = RESORTS.find(r => r.parkIds.some(pid => currentParkIds.includes(pid)));
    if (matchedResort) {
      setSelectedResortId(matchedResort.id);
      const matchedPark = matchedResort.parkIds.find(pid => currentParkIds.includes(pid));
      setSelectedParkId(matchedPark ?? matchedResort.parkIds[0]);
    } else {
      setSelectedResortId(RESORTS[0].id);
      setSelectedParkId(RESORTS[0].parkIds[0]);
    }
    setShowParkModal(true);
  }, [settings.parkIds]);

  const closeParkModal = useCallback(() => {
    setShowParkModal(false);
  }, []);

  const handleConfirmSwitchPark = useCallback(() => {
    const resort = RESORTS.find(r => r.id === selectedResortId);
    if (!resort) return;
    const newParkIds = resort.parkIds.length === 1
      ? resort.parkIds
      : [selectedParkId];
    switchPark(newParkIds);
    closeParkModal();
  }, [selectedResortId, selectedParkId, switchPark, closeParkModal]);

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

  const handlePrevTip = useCallback(() => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(i => i - 1);
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

  // ─── Auto-save every 30 seconds ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // ─── No active session — show return home ────────────────────────────
  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No active game</Text>
        <TouchableOpacity
          style={styles.returnHomeBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Text style={styles.returnHomeBtnText}>Return Home</Text>
        </TouchableOpacity>
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

  // Derive park options for the selected resort
  const selectedResort = RESORTS.find(r => r.id === selectedResortId);
  const resortParkOptions = selectedResort
    ? selectedResort.parkIds.map(pid => {
        const p = PARKS.find(pk => pk.id === pid);
        return { id: pid, label: p?.name ?? pid };
      })
    : [];

  return (
    <ImageBackground
      source={require('../../assets/HomeScreenBackgroundImage.png')}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        {/* Stats Bar (top) */}
        <View style={styles.statsBar}>
          <StatItem label="Completed" value={session.completedTasks.length} />
          <StatItem label="Points" value={session.sessionScore} />
          <StatItem label="Streak" value={session.currentStreak} />
        </View>

        {/* Park Name */}
        <View style={styles.parkNameBar}>
          <Text style={styles.parkName}>{park?.name ?? '?'}</Text>
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

        {/* Small confetti for hand card completion */}
        {showSmallConfetti && (
          <Confetti type="small" onDone={() => setShowSmallConfetti(false)} />
        )}

        {/* Big firework for challenge task completion */}
        {showBigFirework && (
          <Confetti type="big" onDone={() => setShowBigFirework(false)} />
        )}

        {/* Bottom Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <View style={styles.navCardIcon}>
              <Text style={styles.navCardS}>S</Text>
              <View style={styles.navCardDivider}>
                <View style={styles.navCardDividerLine} />
                <Text style={styles.navCardStar}>✦</Text>
                <View style={styles.navCardDividerLine} />
              </View>
              <Text style={styles.navCardQ}>Q</Text>
            </View>
            <Text style={[styles.navLabel, styles.navLabelActive]}>Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={openParkModal} activeOpacity={0.7}>
            <Text style={styles.navIcon}>🏰</Text>
            <Text style={styles.navLabel}>Park</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

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
                  <Text style={styles.tipLogoDividerStar}>{'\u2726'}</Text>
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

            <View style={styles.tipButtonRow}>
              {currentTipIndex > 0 && (
                <TouchableOpacity style={styles.tipBackBtn} onPress={handlePrevTip}>
                  <Text style={styles.tipBackBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.tipNextBtn, currentTipIndex === 0 && { flex: 0, paddingHorizontal: 48 }]} onPress={handleNextTip}>
                <Text style={styles.tipNextBtnText}>
                  {currentTipIndex < GAME_TIPS.length - 1 ? 'Next' : 'Let\'s Play!'}
                </Text>
              </TouchableOpacity>
            </View>

            {currentTipIndex < GAME_TIPS.length - 1 && (
              <TouchableOpacity style={styles.tipSkipBtn} onPress={handleSkipTips}>
                <Text style={styles.tipSkipBtnText}>Skip Tips</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Park modal — switch parks */}
      <Modal
        visible={showParkModal}
        transparent
        animationType="slide"
        onRequestClose={closeParkModal}
      >
        <View style={styles.parkModalOverlay}>
          <View style={styles.parkModalCard}>
            <Text style={styles.parkModalTitle}>Switch Parks</Text>

            <Text style={styles.menuSubLabel}>Resort</Text>
            <ScrollView style={styles.menuPickerScroll} nestedScrollEnabled>
              {RESORTS.map(resort => (
                <TouchableOpacity
                  key={resort.id}
                  style={[
                    styles.menuPickerOption,
                    selectedResortId === resort.id && styles.menuPickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedResortId(resort.id);
                    setSelectedParkId(resort.parkIds[0]);
                  }}
                >
                  <Text style={styles.menuPickerIcon}>{resort.icon}</Text>
                  <Text
                    style={[
                      styles.menuPickerLabel,
                      selectedResortId === resort.id && styles.menuPickerLabelSelected,
                    ]}
                  >
                    {resort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {resortParkOptions.length > 1 && (
              <>
                <Text style={[styles.menuSubLabel, { marginTop: 12 }]}>Park</Text>
                <ScrollView style={styles.menuPickerScroll} nestedScrollEnabled>
                  {resortParkOptions.map(po => (
                    <TouchableOpacity
                      key={po.id}
                      style={[
                        styles.menuPickerOption,
                        selectedParkId === po.id && styles.menuPickerOptionSelected,
                      ]}
                      onPress={() => setSelectedParkId(po.id)}
                    >
                      <Text
                        style={[
                          styles.menuPickerLabel,
                          selectedParkId === po.id && styles.menuPickerLabelSelected,
                        ]}
                      >
                        {po.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity style={styles.menuConfirmBtn} onPress={handleConfirmSwitchPark}>
              <Text style={styles.menuConfirmBtnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBackBtn} onPress={closeParkModal}>
              <Text style={styles.menuBackBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

/** Simple stat display used in the top stats bar (Completed, Points, Streak) */
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
    marginBottom: 16,
  },
  returnHomeBtn: {
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  returnHomeBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
  },
  parkNameBar: {
    alignItems: 'center',
    paddingVertical: Math.round(4 * sh),
  },
  parkName: {
    color: COLORS.textDark,
    fontWeight: '900',
    fontSize: Math.round(13 * sw),
    letterSpacing: 0.5,
    textAlign: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.82)',
    marginHorizontal: Math.round(16 * sw),
    borderRadius: RADII.panel,
    paddingVertical: Math.round(8 * sh),
    marginTop: Math.round(8 * sh),
    marginBottom: Math.round(4 * sh),
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

  // Bottom Nav Bar
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderPanel,
    paddingVertical: Math.round(8 * sh),
    paddingBottom: Math.round(4 * sh),
    ...SHADOWS.card,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: Math.round(22 * sw),
    marginBottom: 2,
  },
  navLabel: {
    fontSize: Math.round(10 * sw),
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: COLORS.green,
    fontWeight: '800',
  },
  navCardIcon: {
    width: 22,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4C4EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    marginBottom: 2,
  },
  navCardS: {
    fontSize: 8,
    fontWeight: '900',
    color: '#B8A9D4',
    letterSpacing: 0.5,
    lineHeight: 9,
  },
  navCardDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 14,
    marginVertical: 0.5,
  },
  navCardDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4C4EE',
    borderRadius: 0.5,
  },
  navCardStar: {
    fontSize: 5,
    marginHorizontal: 1,
    color: '#C8A4F0',
  },
  navCardQ: {
    fontSize: 8,
    fontWeight: '900',
    color: '#9B7FD4',
    letterSpacing: 0.5,
    lineHeight: 9,
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
  tipButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  tipBackBtn: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.button,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
  },
  tipBackBtnText: {
    color: COLORS.textBody,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  tipNextBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 14,
    alignItems: 'center',
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

  // Park modal
  parkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  parkModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  parkModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  menuSubLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuPickerScroll: {
    maxHeight: 160,
  },
  menuPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.chip,
    marginBottom: 4,
  },
  menuPickerOptionSelected: {
    backgroundColor: 'rgba(76,175,80,0.12)',
  },
  menuPickerIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  menuPickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  menuPickerLabelSelected: {
    color: COLORS.green,
    fontWeight: '800',
  },
  menuConfirmBtn: {
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  menuConfirmBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
  },
  menuBackBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
