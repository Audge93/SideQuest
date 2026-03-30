/**
 * GameScreen.tsx — Active gameplay screen
 *
 * Shows the top bar (streak flame, park name, score), challenge task board,
 * card carousel (the player's "hand"), and stats bar. Also manages:
 *  - Tips modal for first-time players (resets each new session)
 *  - Badge unlock popup queue (fires after task completion confetti)
 *  - Confetti/firework effects on task completion
 *  - Game menu (switch parks, save game, exit to home)
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
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Badge, SaveSlot } from '../types';
import Confetti from '../components/Confetti';
import BadgeUnlockPopup from '../components/BadgeUnlockPopup';
import { useGameStore } from '../store/gameStore';
import CardCarousel from '../components/CardCarousel';
import BigBoard from '../components/BigBoard';
import StreakFlame from '../components/StreakFlame';
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
    saveGame,
    activeSlotId,
    saveSlots,
  } = useGameStore();

  const parkId = settings.parkIds?.[0];
  const park = PARKS.find(p => p.id === parkId);

  const [showSmallConfetti, setShowSmallConfetti] = useState(false);
  const [showBigFirework, setShowBigFirework] = useState(false);

  // ─── Game Menu state ─────────────────────────────────────────────────────
  const [showMenu, setShowMenu] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'switchPark' | 'saveGame'>('main');

  // Switch Parks sub-view state
  const [selectedResortId, setSelectedResortId] = useState<string>(RESORTS[0].id);
  const [selectedParkId, setSelectedParkId] = useState<string>(RESORTS[0].parkIds[0]);

  // Save Game sub-view state
  const [saveName, setSaveName] = useState('');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const openMenu = useCallback(() => {
    setMenuView('main');
    setShowMenu(true);
  }, []);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setMenuView('main');
    setShowSavedFeedback(false);
  }, []);

  const handleSwitchParkTap = useCallback(() => {
    // Pre-select the current resort/park if possible
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
    setMenuView('switchPark');
  }, [settings.parkIds]);

  const handleSaveGameTap = useCallback(() => {
    const currentSlot = saveSlots.find((s): s is SaveSlot => s !== null && s.id === activeSlotId);
    setSaveName(currentSlot?.name ?? 'My Game');
    setShowSavedFeedback(false);
    setMenuView('saveGame');
  }, [saveSlots, activeSlotId]);

  const handleConfirmSwitchPark = useCallback(() => {
    const resort = RESORTS.find(r => r.id === selectedResortId);
    if (!resort) return;
    // If resort has multiple parks and user picked one, send just that; otherwise send all
    const newParkIds = resort.parkIds.length === 1
      ? resort.parkIds
      : [selectedParkId];
    switchPark(newParkIds);
    closeMenu();
  }, [selectedResortId, selectedParkId, switchPark, closeMenu]);

  const handleConfirmSave = useCallback(() => {
    if (!activeSlotId) return;
    saveGame(activeSlotId, saveName.trim() || undefined);
    setShowSavedFeedback(true);
    setTimeout(() => {
      closeMenu();
    }, 800);
  }, [activeSlotId, saveName, saveGame, closeMenu]);

  const handleExitToHome = useCallback(() => {
    autoSave();
    closeMenu();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [autoSave, closeMenu, navigation]);

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

        {/* Top Bar */}
        <View style={styles.topBar}>
          <StreakFlame streak={session.currentStreak} />
          <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>{'\u2630'}</Text>
          </TouchableOpacity>
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

      {/* Game Menu modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.menuOverlay}>
          <View style={styles.menuCard}>

            {/* ── Main menu view ─────────────────────────────── */}
            {menuView === 'main' && (
              <>
                <Text style={styles.menuTitle}>Game Menu</Text>

                <TouchableOpacity style={styles.menuRow} onPress={handleSwitchParkTap}>
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuRowIcon}>{'\uD83C\uDFDE\uFE0F'}</Text>
                    <Text style={styles.menuRowLabel}>Switch Parks</Text>
                  </View>
                  <Text style={styles.menuRowChevron}>{'\u203A'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} onPress={handleSaveGameTap}>
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuRowIcon}>{'\uD83D\uDCBE'}</Text>
                    <Text style={styles.menuRowLabel}>Save Game</Text>
                  </View>
                  <Text style={styles.menuRowChevron}>{'\u203A'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Settings'); }}>
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuRowIcon}>{'\u2699\uFE0F'}</Text>
                    <Text style={styles.menuRowLabel}>Settings</Text>
                  </View>
                  <Text style={styles.menuRowChevron}>{'\u203A'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Profile'); }}>
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuRowIcon}>{'\uD83D\uDC64'}</Text>
                    <Text style={styles.menuRowLabel}>Profile</Text>
                  </View>
                  <Text style={styles.menuRowChevron}>{'\u203A'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuRow, styles.menuRowLast]} onPress={handleExitToHome}>
                  <View style={styles.menuRowLeft}>
                    <Text style={styles.menuRowIcon}>{'\uD83C\uDFE0'}</Text>
                    <Text style={styles.menuRowLabel}>Exit to Home</Text>
                  </View>
                  <Text style={styles.menuRowChevron}>{'\u203A'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuCloseBtn} onPress={closeMenu}>
                  <Text style={styles.menuCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Switch Parks sub-view ──────────────────────── */}
            {menuView === 'switchPark' && (
              <>
                <Text style={styles.menuTitle}>Switch Parks</Text>

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
                <TouchableOpacity style={styles.menuBackBtn} onPress={() => setMenuView('main')}>
                  <Text style={styles.menuBackBtnText}>Back</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Save Game sub-view ─────────────────────────── */}
            {menuView === 'saveGame' && (
              <>
                <Text style={styles.menuTitle}>Save Game</Text>

                {showSavedFeedback ? (
                  <Text style={styles.savedFeedback}>Saved!</Text>
                ) : (
                  <>
                    <Text style={styles.menuSubLabel}>Save Name</Text>
                    <TextInput
                      style={styles.menuTextInput}
                      value={saveName}
                      onChangeText={setSaveName}
                      placeholder="Enter save name..."
                      placeholderTextColor={COLORS.textMuted}
                      maxLength={30}
                    />

                    <TouchableOpacity style={styles.menuConfirmBtn} onPress={handleConfirmSave}>
                      <Text style={styles.menuConfirmBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuBackBtn} onPress={() => setMenuView('main')}>
                      <Text style={styles.menuBackBtnText}>Back</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

/** Simple stat display used in the bottom stats bar (Completed, Streak, Session) */
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
  menuButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuButtonText: {
    fontSize: Math.round(20 * sw),
    color: COLORS.textDark,
    fontWeight: '700',
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
    marginBottom: Math.round(16 * sh),
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

  // Game Menu modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  menuCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRowIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  menuRowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  menuRowChevron: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  menuCloseBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
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
  menuTextInput: {
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADII.chip,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  savedFeedback: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.green,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
