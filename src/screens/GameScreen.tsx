/**
 * GameScreen.tsx
 *
 * Premium-layout gameplay screen for the active Side Quest session.
 * The screen keeps the same gameplay structure as before, but reorganizes the
 * content into a cleaner card-game hierarchy:
 *   1. Header with park title, streak, and stats
 *   2. Challenge mini-cards near the top
 *   3. One featured active task card in the center
 *   4. A smaller "Your Hand" preview deck near the bottom
 *   5. Bottom navigation
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
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Badge, Task } from '../types';
import Confetti from '../components/Confetti';
import BadgeUnlockPopup from '../components/BadgeUnlockPopup';
import CardCarousel from '../components/CardCarousel';
import { useGameStore } from '../store/gameStore';
import { PARKS } from '../data/parks';
import { CATEGORY_COLORS, CATEGORY_ICONS, COLORS, SHADOWS, RADII } from '../theme/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

const RESORTS = [
  { id: 'wdw', label: 'Walt Disney World', icon: '🏰', parkIds: ['wdw-mk', 'wdw-hs', 'wdw-ep', 'wdw-ak'] },
  { id: 'dl', label: 'Disneyland Resort', icon: '🎠', parkIds: ['dl-dl', 'dl-dca'] },
  { id: 'uor', label: 'Universal Orlando', icon: '🌍', parkIds: ['uor-us', 'uor-ioa', 'uor-eu'] },
  { id: 'ush', label: 'Universal Hollywood', icon: '🎬', parkIds: ['ush-us'] },
  { id: 'custom', label: 'Any Park', icon: '🎪', parkIds: ['custom'] },
];

const GAME_TIPS = [
  {
    id: 'tip-hand',
    title: 'Your Hand',
    message: 'Your hand holds quick tasks. Tap a preview card to bring it into focus, then complete or discard it from the featured card.',
    icon: 'card',
  },
  {
    id: 'tip-tasks',
    title: 'Task Types',
    message: 'Quick tasks live in your hand while bigger goals live in Challenges. Both count toward points, streaks, and badges.',
    icon: '🎯',
  },
  {
    id: 'tip-challenge',
    title: 'Challenges',
    message: 'Challenge cards are your higher-value tasks. Tap any challenge to expand it, complete it, or swap it when you have enough points.',
    icon: '🏆',
  },
  {
    id: 'tip-discard',
    title: 'Discards',
    message: 'If a hand card is not a fit, discard it for something new. Discards are limited, so use them strategically.',
    icon: '🔄',
  },
  {
    id: 'tip-streak',
    title: 'Streaks',
    message: 'Completing tasks in a row builds your streak. Every 5 in a row earns a bonus and helps refill discards.',
    icon: '🔥',
  },
  {
    id: 'tip-badges',
    title: 'Badges',
    message: 'Consistent play unlocks badges over time. Your progress is tracked in your profile.',
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
    newlyEarnedBadges,
    clearNewBadges,
    autoSave,
    switchPark,
  } = useGameStore();

  const parkId = settings.parkIds?.[0];
  const park = PARKS.find(p => p.id === parkId);

  const [showSmallConfetti, setShowSmallConfetti] = useState(false);
  const [showBigFirework, setShowBigFirework] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState<Task | null>(null);
  const [showParkModal, setShowParkModal] = useState(false);
  const [selectedResortId, setSelectedResortId] = useState<string>(RESORTS[0].id);
  const [selectedParkId, setSelectedParkId] = useState<string>(RESORTS[0].parkIds[0]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const processedBadgeIdsRef = useRef(new Set<string>());
  const sessionIdRef = useRef(session?.id);

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
    const newParkIds = resort.parkIds.length === 1 ? resort.parkIds : [selectedParkId];
    switchPark(newParkIds);
    closeParkModal();
  }, [closeParkModal, selectedParkId, selectedResortId, switchPark]);

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

  useEffect(() => {
    if (session?.id && session.id !== sessionIdRef.current) {
      sessionIdRef.current = session.id;
      setCurrentTipIndex(0);
      setShowTips(true);
    }
  }, [session?.id]);

  useEffect(() => {
    if (newlyEarnedBadges.length === 0) return;

    const unprocessed = newlyEarnedBadges.filter(b => !processedBadgeIdsRef.current.has(b.id));
    if (unprocessed.length === 0) return;

    for (const b of unprocessed) {
      processedBadgeIdsRef.current.add(b.id);
    }

    const timer = setTimeout(() => {
      setBadgeQueue(prev => [...prev, ...unprocessed]);
    }, 1200);

    return () => clearTimeout(timer);
  }, [newlyEarnedBadges]);

  useEffect(() => {
    if (badgeQueue.length > 0 && !activeBadge) {
      setActiveBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    }
  }, [activeBadge, badgeQueue]);

  const handleBadgeDismiss = useCallback(() => {
    setActiveBadge(null);
    if (badgeQueue.length === 0) {
      processedBadgeIdsRef.current.clear();
      clearNewBadges();
    }
  }, [badgeQueue.length, clearNewBadges]);

  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

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
      resizeMode="cover"
    >
      <View style={styles.backgroundTopOverlay} pointerEvents="none" />
      <View style={styles.backgroundBottomOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.screenContent}>
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <Text style={styles.parkTitle}>{park?.name ?? '?'}</Text>
              <View style={styles.statsRow}>
                <HeaderStatPill value={`${session.currentStreak}`} label="Streak" />
                <HeaderStatPill value={`${session.sessionScore} pts`} label="Points" />
                <HeaderStatPill value={`${session.completedTasks.length}`} label="Completed" />
              </View>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Challenges</Text>
              <Text style={styles.sectionHint}>{session.challengeTasks.length} live</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.challengeRow}
            >
              {session.challengeTasks.map(task => (
                <ChallengeMiniCard
                  key={task.id}
                  task={task}
                  onPress={() => setExpandedChallenge(task)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={[styles.sectionBlock, styles.handSection]}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Your Hand ({session.hand.length})</Text>
              <DiscardBadge remaining={session.discardsRemaining} />
            </View>
            <View style={styles.carouselShell}>
              <CardCarousel
                cards={session.hand}
                onComplete={handleCompleteSmall}
                onDiscard={id => discardTask(id)}
                onTriviaAnswer={(id, correct) => answerTrivia(id, correct)}
                discardsRemaining={session.discardsRemaining}
              />
            </View>
          </View>
        </View>

        {showSmallConfetti && (
          <Confetti type="small" onDone={() => setShowSmallConfetti(false)} />
        )}

        {showBigFirework && (
          <Confetti type="big" onDone={() => setShowBigFirework(false)} />
        )}

        <View style={styles.navShell}>
          <View style={styles.navBar}>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={0.8}>
              <View style={styles.navActivePill}>
                <View style={styles.navCardIcon}>
                  <Text style={styles.navCardS}>S</Text>
                  <View style={styles.navCardDivider}>
                    <View style={styles.navCardDividerLine} />
                    <Text style={styles.navCardStar}>✦</Text>
                    <View style={styles.navCardDividerLine} />
                  </View>
                  <Text style={styles.navCardQ}>Q</Text>
                </View>
              </View>
              <Text style={[styles.navLabel, styles.navLabelActive]}>Game</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={openParkModal} activeOpacity={0.8}>
              <Text style={styles.navIcon}>🏰</Text>
              <Text style={styles.navLabel}>Park</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <Text style={styles.navIcon}>⚙️</Text>
              <Text style={styles.navLabel}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.navIcon}>👤</Text>
              <Text style={styles.navLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      
      {activeBadge && (
        <BadgeUnlockPopup
          key={activeBadge.id}
          badge={activeBadge}
          onDismiss={handleBadgeDismiss}
        />
      )}

      {expandedChallenge && (
        <ChallengeDetailModal
          task={expandedChallenge}
          sessionScore={session.sessionScore}
          onComplete={() => {
            handleCompleteBig(expandedChallenge.id);
            setExpandedChallenge(null);
          }}
          onSwap={() => {
            swapChallengeTask(expandedChallenge.id);
            setExpandedChallenge(null);
          }}
          onClose={() => setExpandedChallenge(null)}
        />
      )}

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

            <View style={styles.tipButtonRow}>
              {currentTipIndex > 0 && (
                <TouchableOpacity style={styles.tipBackBtn} onPress={handlePrevTip}>
                  <Text style={styles.tipBackBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.tipNextBtn} onPress={handleNextTip}>
                <Text style={styles.tipNextBtnText}>
                  {currentTipIndex < GAME_TIPS.length - 1 ? 'Next' : 'Let’s Play!'}
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

function HeaderStatPill({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statPill}>
      <View>
        <Text style={styles.statPillValue}>{value}</Text>
        <Text style={styles.statPillLabel}>{label}</Text>
      </View>
    </View>
  );
}

function DiscardBadge({ remaining }: { remaining: number }) {
  return (
    <View style={styles.discardBadge}>
      <Text style={styles.discardBadgeLabel}>Discards</Text>
      <View style={styles.discardDots}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.discardDot,
              index < remaining ? styles.discardDotActive : styles.discardDotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function ChallengeMiniCard({
  task,
  onPress,
}: {
  task: Task;
  onPress: () => void;
}) {
  const accent = CATEGORY_COLORS[task.category] ?? COLORS.gold;
  return (
    <TouchableOpacity style={styles.challengeCard} onPress={onPress} activeOpacity={0.88}>
      <Text style={styles.challengeCategory}>{task.displayCategory.toUpperCase()}</Text>
      <View style={[styles.challengeIconShell, { backgroundColor: `${accent}20` }]}>
        <View style={[styles.challengeIconCore, { backgroundColor: accent }]}>
          <Text style={styles.challengeIcon}>{CATEGORY_ICONS[task.category] ?? '✨'}</Text>
        </View>
      </View>
      <Text style={[styles.challengePoints, { color: accent }]}>{task.points} pts</Text>
    </TouchableOpacity>
  );
}

function ChallengeDetailModal({
  task,
  sessionScore,
  onComplete,
  onSwap,
  onClose,
}: {
  task: Task;
  sessionScore: number;
  onComplete: () => void;
  onSwap: () => void;
  onClose: () => void;
}) {
  const accent = CATEGORY_COLORS[task.category] ?? COLORS.gold;
  const canSwap = sessionScore >= 25;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable style={styles.detailCard} onPress={e => e.stopPropagation()}>
          <View style={[styles.detailIconShell, { backgroundColor: `${accent}18` }]}>
            <View style={[styles.detailIconCore, { backgroundColor: accent }]}>
              <Text style={styles.detailIcon}>{CATEGORY_ICONS[task.category] ?? '✨'}</Text>
            </View>
          </View>

          <Text style={styles.detailLabel}>{task.displayCategory.toUpperCase()}</Text>
          <Text style={[styles.detailPoints, { color: accent }]}>{task.points} pts</Text>
          <Text style={styles.detailDescription}>{task.description}</Text>

          {task.heightRequirement ? (
            <View style={styles.detailMetaChip}>
              <Text style={styles.detailMetaText}>Min height {task.heightRequirement}"</Text>
            </View>
          ) : null}

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={[
                styles.detailSecondaryButton,
                !canSwap && styles.detailSecondaryButtonDisabled,
              ]}
              onPress={canSwap ? onSwap : undefined}
              activeOpacity={canSwap ? 0.85 : 1}
            >
              <Text
                style={[
                  styles.detailSecondaryButtonText,
                  !canSwap && styles.detailSecondaryButtonTextDisabled,
                ]}
              >
                Swap (-25 pts)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailPrimaryButton}
              onPress={onComplete}
              activeOpacity={0.9}
            >
              <Text style={styles.detailPrimaryButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  backgroundTopOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32, 24, 56, 0.24)',
  },
  backgroundBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
    backgroundColor: 'rgba(16, 18, 34, 0.40)',
  },
  safe: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: Math.round(18 * sw),
    paddingTop: Math.round(8 * sh),
    paddingBottom: Math.round(104 * sh),
    gap: Math.round(10 * sh),
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

  headerCard: {
    backgroundColor: 'rgba(34, 29, 63, 0.52)',
    borderRadius: 24,
    paddingHorizontal: Math.round(14 * sw),
    paddingVertical: Math.round(12 * sh),
    shadowColor: '#050816',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.26,
    shadowRadius: 26,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parkTitle: {
    color: COLORS.white,
    fontSize: Math.round(22 * sw),
    lineHeight: Math.round(26 * sw),
    fontWeight: '900',
    flexShrink: 1,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Math.round(6 * sw),
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: Math.round(62 * sw),
    alignItems: 'center',
  },
  statPillValue: {
    color: COLORS.textDark,
    fontSize: Math.round(13 * sw),
    fontWeight: '900',
    textAlign: 'center',
  },
  statPillLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(9 * sw),
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },

  sectionBlock: {
    gap: Math.round(6 * sh),
  },
  handSection: {
    flex: 1,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: Math.round(16 * sw),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionHint: {
    color: 'rgba(239,237,255,0.72)',
    fontSize: Math.round(11 * sw),
    fontWeight: '600',
  },

  challengeRow: {
    paddingRight: 8,
    gap: Math.round(8 * sw),
  },
  challengeCard: {
    width: Math.round(100 * sw),
    height: Math.round(88 * sw),
    borderRadius: 20,
    backgroundColor: 'rgba(255,251,247,0.96)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#111324',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 5,
  },
  challengeCategory: {
    color: COLORS.textMuted,
    fontSize: Math.round(9 * sw),
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  challengeIconShell: {
    width: Math.round(40 * sw),
    height: Math.round(40 * sw),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIconCore: {
    width: Math.round(30 * sw),
    height: Math.round(30 * sw),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIcon: {
    fontSize: Math.round(15 * sw),
  },
  challengePoints: {
    fontSize: Math.round(12 * sw),
    fontWeight: '900',
  },

  discardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  discardBadgeLabel: {
    color: COLORS.white,
    fontSize: Math.round(11 * sw),
    fontWeight: '700',
    marginRight: 8,
  },
  discardDots: {
    flexDirection: 'row',
    gap: 5,
  },
  discardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  discardDotActive: {
    backgroundColor: '#4CC2FF',
  },
  discardDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  carouselShell: {
    flex: 1,
    minHeight: 0,
    marginTop: Math.round(8 * sh),
    marginHorizontal: -Math.round(18 * sw),
  },

  navShell: {
    position: 'absolute',
    left: Math.round(16 * sw),
    right: Math.round(16 * sw),
    bottom: Math.round(14 * sh),
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 241, 252, 0.96)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#090c17',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navItemActive: {
    transform: [{ translateY: -1 }],
  },
  navActivePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(155,127,212,0.14)',
  },
  navIcon: {
    fontSize: Math.round(21 * sw),
  },
  navLabel: {
    color: '#7A7F93',
    fontSize: Math.round(10 * sw),
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#63507B',
  },
  navCardIcon: {
    width: 24,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4C4EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navCardS: {
    fontSize: 8,
    fontWeight: '900',
    color: '#B8A9D4',
    lineHeight: 9,
  },
  navCardDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 15,
  },
  navCardDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4C4EE',
  },
  navCardStar: {
    fontSize: 5,
    color: '#C8A4F0',
    marginHorizontal: 1,
  },
  navCardQ: {
    fontSize: 8,
    fontWeight: '900',
    color: '#9B7FD4',
    lineHeight: 9,
  },

  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 18, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  detailCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF9F4',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.cardActive,
  },
  detailIconShell: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  detailIconCore: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {
    fontSize: 28,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  detailPoints: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  detailDescription: {
    color: COLORS.textDark,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailMetaChip: {
    backgroundColor: '#F3F5FA',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 20,
  },
  detailMetaText: {
    color: COLORS.textBody,
    fontSize: 12,
    fontWeight: '700',
  },
  detailActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  detailPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  detailPrimaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  detailSecondaryButton: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  detailSecondaryButtonDisabled: {
    opacity: 0.5,
  },
  detailSecondaryButtonText: {
    color: COLORS.textBody,
    fontSize: 15,
    fontWeight: '700',
  },
  detailSecondaryButtonTextDisabled: {
    color: COLORS.textMuted,
  },

  triviaCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF9F4',
    borderRadius: 28,
    padding: 24,
    ...SHADOWS.cardActive,
  },
  triviaQuestion: {
    color: COLORS.textDark,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  triviaChoiceList: {
    gap: 10,
  },
  triviaChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F5FA',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  triviaChoiceCorrect: {
    backgroundColor: '#1DAA63',
  },
  triviaChoiceWrong: {
    backgroundColor: '#E98B97',
  },
  triviaLetterBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  triviaLetterText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '900',
  },
  triviaChoiceText: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  triviaChoiceTextActive: {
    color: COLORS.white,
  },

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
