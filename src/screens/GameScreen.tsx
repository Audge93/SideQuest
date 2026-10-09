import { useReducedMotion, useReadingPreferences } from '../theme/useAccessibility';
import { ScrollView } from 'react-native';
import { FocusHeading } from '../components/ReadingModal';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
/**
 * GameScreen.tsx
 *
 * The card table for an active Side Quest session:
 *   1. Score HUD (streak, score, completed)
 *   2. Challenge cards row
 *   3. The player's hand with its action bar
 *   4. Bottom navigation
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
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Badge, Task } from '../types';
import Confetti from '../components/Confetti';
import Minigames from '../components/Minigames';
import BadgeUnlockPopup from '../components/BadgeUnlockPopup';
import CardCarousel, { handCardWidth } from '../components/CardCarousel';
import CardFace from '../components/CardFace';
import CardBurst from '../components/CardBurst';
import DraftPicker from '../components/DraftPicker';
import GameButton from '../components/GameButton';
import GameIcon, { IconName } from '../components/icons/GameIcon';
import { useGameStore } from '../store/gameStore';
import { PARKS } from '../data/parks';
import { CATEGORY_FRAME_COLORS, COLORS, FONTS, INK, TABLE } from '../theme/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SIDE_PAD = 18;
const CHALLENGE_GAP = 12;
const CHALLENGE_W = Math.round(Math.min((SCREEN_W - SIDE_PAD * 2 - CHALLENGE_GAP * 2) / 3, 104, SCREEN_H * 0.11));
const DETAIL_CARD_W = Math.round(Math.min(SCREEN_W * 0.72, 290, SCREEN_H * 0.42));
const SWAP_COST = 25;

const GAME_TIPS: { id: string; title: string; message: string; icon: IconName | 'card' }[] = [
  {
    id: 'tip-hand',
    title: 'Your Hand',
    message: 'Swipe or use Previous and Next to browse your hand. Tap an activity card to enlarge it, or tap trivia to answer. Complete an activity after you’ve done it.',
    icon: 'card',
  },
  {
    id: 'tip-draft',
    title: 'Pick Your Next Quest',
    message: 'Whenever a card leaves your hand you choose its replacement from 3 new cards, so you stay in control of what you do next.',
    icon: 'draft',
  },
  {
    id: 'tip-challenge',
    title: 'Challenges',
    message: 'Challenge cards are bigger quests worth more points. Tap one to view it, complete it, or swap it for 25 points.',
    icon: 'trophy',
  },
  {
    id: 'tip-streak',
    title: 'Streaks',
    message: 'Complete tasks in a row to build your streak. Every 5 in a row earns a +10 bonus.',
    icon: 'flame',
  },
  {
    id: 'tip-badges',
    title: 'Badges',
    message: 'Consistent play unlocks badges over time. See your progress in Profile. Minigames are available whenever you want to play and add to your score.',
    icon: 'medal',
  },
];

export default function GameScreen() {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const reduced = useReducedMotion();
  const { scale: readingScale } = useReadingPreferences();
  const styles = useThemedStyles(BASE_STYLES, true, ['hudScoreLabel','hudScoreValue']);

  const navigation = useNavigation<any>();
  const {
    session,
    settings,
    completeTask,
    discardTask,
    swapChallengeTask,
    answerTrivia,
    useTriviaFiftyFifty,
    chooseDraftCard,
    newlyEarnedBadges,
    clearNewBadges,
    autoSave,
    switchPark,
    showTipsOnNext,
    clearPendingTips,
  } = useGameStore();

  const [showBigFirework, setShowBigFirework] = useState(false);
  useEffect(() => { if (reduced) setShowBigFirework(false); }, [reduced]);
  const [challengeBurst, setChallengeBurst] = useState<{ key: number; task: Task; bonus: number } | null>(null);
  const [showDraft, setShowDraft] = useState(false);
  const [handHeight, setHandHeight] = useState(0);
  const draft = session?.draft ?? null;
  const [expandedChallenge, setExpandedChallenge] = useState<Task | null>(null);
  const [showMinigames, setShowMinigames] = useState(false);
  const [showParkModal, setShowParkModal] = useState(false);
  const [selectedParkId, setSelectedParkId] = useState<string>(PARKS[0].id);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const processedBadgeIdsRef = useRef(new Set<string>());

  const openParkModal = useCallback(() => {
    const current = PARKS.find(p => settings.parkIds.includes(p.id));
    setSelectedParkId(current?.id ?? PARKS[0].id);
    setShowParkModal(true);
  }, [settings.parkIds]);

  const closeParkModal = useCallback(() => {
    setShowParkModal(false);
  }, []);

  const handleConfirmSwitchPark = useCallback(() => {
    switchPark([selectedParkId]);
    closeParkModal();
  }, [closeParkModal, selectedParkId, switchPark]);

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
    if (showTipsOnNext) {
      setCurrentTipIndex(0);
      setShowTips(true);
      clearPendingTips();
    }
  }, [showTipsOnNext]);

  useEffect(() => {
    if (newlyEarnedBadges.length === 0) return;

    const unprocessed = newlyEarnedBadges.filter(b => !processedBadgeIdsRef.current.has(b.id));
    if (unprocessed.length === 0) return;

    const timer = setTimeout(() => {
      for (const b of unprocessed) processedBadgeIdsRef.current.add(b.id);
      setBadgeQueue(prev => [...prev, ...unprocessed]);
    }, 1200);

    return () => clearTimeout(timer);
  }, [newlyEarnedBadges]);

  useEffect(() => {
    if (badgeQueue.length > 0 && !activeBadge && !draft && !showMinigames) {
      setActiveBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    }
  }, [activeBadge, badgeQueue, draft, showMinigames]);

  // Let the card burst and score pop play before the draft takes over the screen.
  useEffect(() => {
    if (!draft) {
      setShowDraft(false);
      return;
    }
    const timer = setTimeout(() => setShowDraft(true), reduced ? 0 : 900);
    return () => clearTimeout(timer);
  }, [draft]);

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

  const currentPark = PARKS.find(p => settings.parkIds.includes(p.id));
  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No active game</Text>
        <GameButton label="Return Home" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })} style={styles.loadingBtn} />
      </View>
    );
  }

  const handleCompleteChallenge = (task: Task) => {
    const bonus = (session.currentStreak + 1) % 5 === 0 ? 10 : 0;
    setExpandedChallenge(null);
    setChallengeBurst({ key: Date.now(), task, bonus });
    completeTask(task.id, true);
    setShowBigFirework(true);
  };


  return (
    <ImageBackground
      source={require('../../assets/HomeScreenBackgroundImage.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.backgroundTint} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

        <View style={styles.screenContent}>
          <ScoreHud
            score={session.sessionScore}
            streak={session.currentStreak}
            completed={session.completedTasks.length}
          />

          <View style={styles.section}>
            <View testID="challenges-heading" style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Challenges</Text>
              <TouchableOpacity testID="minigames-btn" accessibilityRole="button" onPress={() => setShowMinigames(true)} style={{ minHeight: 44, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TABLE.gold, borderRadius: 10, borderWidth: 2, borderColor: INK }}><GameIcon name="controller" size={22}/><Text style={{ fontFamily: FONTS.display, fontSize: 16, color: INK }}>Minigames</Text></TouchableOpacity>

            </View>
            <View style={styles.challengeRow}>
              {session.challengeTasks.map(task => (
                <Pressable
                  key={task.id}
                  testID="challenge-card"
                  accessibilityRole="button"
                  accessibilityLabel={`Challenge: ${task.description}. ${task.points} points. View details.`}
                  onPress={() => setExpandedChallenge(task)}
                  style={({ pressed }) => [{ transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.97 : 1 }] }]}
                >
                  <CardFace task={task} width={CHALLENGE_W} variant="compact" />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.handSection}>
            <View style={[styles.sectionHeadingRow, styles.handHeading]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                <Text style={styles.sectionTitle}>Your Hand</Text>
              </View>
            </View>
            <View style={styles.handArea} onLayout={e => setHandHeight(e.nativeEvent.layout.height)}>
              {handHeight > 0 && (
            <CardCarousel
              cardWidth={readingScale > 1 ? Math.min(handCardWidth(handHeight, readingScale), 110) : handCardWidth(handHeight)}
              cards={session.hand}
              openSlotIndex={draft?.slotIndex ?? null}
              currentStreak={session.currentStreak}
              onComplete={id => completeTask(id, false)}
              onDiscard={id => discardTask(id)}
              onTriviaAnswer={(id, correct) => answerTrivia(id, correct)}
              discardsRemaining={session.discardsRemaining}
              fiftyFiftyUses={session.fiftyFiftyUses}
              triviaEliminatedChoices={session.triviaEliminatedChoices}
              onFiftyFifty={useTriviaFiftyFifty}
            />
              )}
            </View>
          </View>
        </View>

        {challengeBurst && (
          <CardBurst
            key={challengeBurst.key}
            color={CATEGORY_FRAME_COLORS[challengeBurst.task.category] ?? TABLE.gold}
            variant="complete"
            points={challengeBurst.task.points}
            bonus={challengeBurst.bonus}
            onDone={() => setChallengeBurst(null)}
          />
        )}

        {showDraft && draft && (
          <DraftPicker key={draft.options.map(t => t.id).join('|')} options={draft.options} onChoose={chooseDraftCard} />
        )}

        {showBigFirework && !reduced && <Confetti type="big" onDone={() => setShowBigFirework(false)} />}

        <View style={styles.navShell}>
          <View testID="game-nav-bar" style={styles.navBar}>
            <NavItem icon="cards" label="Game" active />
            <NavItem icon={currentPark?.icon ?? 'park-mk'} label="Park" onPress={openParkModal} />
            <NavItem icon="gear" label="Settings" onPress={() => navigation.navigate('Settings')} />
            <NavItem icon="profile" label="Profile" onPress={() => navigation.navigate('Profile')} />
          </View>
        </View>
      </SafeAreaView>

      {showMinigames && <Minigames onClose={() => setShowMinigames(false)} />}
      {activeBadge && <BadgeUnlockPopup key={activeBadge.id} badge={activeBadge} onDismiss={handleBadgeDismiss} />}

      {expandedChallenge && (
        <ChallengeDetailModal
          task={expandedChallenge}
          canSwap={session.sessionScore >= SWAP_COST}
          onComplete={() => handleCompleteChallenge(expandedChallenge)}
          onSwap={() => {
            swapChallengeTask(expandedChallenge.id);
            setExpandedChallenge(null);
          }}
          onClose={() => setExpandedChallenge(null)}
        />
      )}

      <Modal visible={showTips} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={handleSkipTips}>
        <View style={styles.modalOverlay}>
          <View style={[styles.panel, { maxHeight: '92%' }]}>
            <ScrollView style={{ flexShrink: 1, alignSelf: 'stretch' }} contentContainerStyle={{ alignItems: 'center', gap: 12 }}>
            {GAME_TIPS[currentTipIndex].icon === 'card' ? (
              <View style={styles.tipLogoCard}>
                <Text style={styles.tipLogoLetter}>S</Text>
                <Text style={styles.tipLogoStar}>✦</Text>
                <Text style={styles.tipLogoLetter}>Q</Text>
              </View>
            ) : (
              <GameIcon name={GAME_TIPS[currentTipIndex].icon as IconName} size={64} />
            )}

            <FocusHeading title={GAME_TIPS[currentTipIndex].title} />
            <Text style={styles.panelBody}>{GAME_TIPS[currentTipIndex].message}</Text>
            <Text testID="game-tip-position" style={styles.panelBody}>{currentTipIndex + 1} of {GAME_TIPS.length}</Text>
            </ScrollView>

            <View style={styles.tipDots}>
              {GAME_TIPS.map((_, i) => (
                <View key={i} style={[styles.tipDot, i === currentTipIndex && styles.tipDotActive]} />
              ))}
            </View>

            <View style={styles.panelButtons}>
              {currentTipIndex > 0 && <GameButton testID="game-tip-back" label="Back" tone="gray" onPress={handlePrevTip} style={styles.panelSecondary} />}
              <GameButton
                testID="game-tip-next"
                label={currentTipIndex < GAME_TIPS.length - 1 ? 'Next' : 'Let’s Play!'}
                tone="green"
                onPress={handleNextTip}
                style={styles.panelPrimary}
              />
            </View>

            {currentTipIndex < GAME_TIPS.length - 1 && (
              <TouchableOpacity testID="game-tip-skip" accessibilityRole="button" style={[styles.textBtn, { minHeight: 44, justifyContent: 'center' }]} onPress={handleSkipTips}>
                <Text style={styles.textBtnLabel}>Skip Tips</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showParkModal} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={closeParkModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.panel, { maxHeight: '92%' }]}>
            <ScrollView style={{ flexShrink: 1, alignSelf: 'stretch' }} contentContainerStyle={{ alignItems: 'center', gap: 12 }}>
            <FocusHeading title="Switch Parks" />
            <Text style={styles.panelKicker}>WALT DISNEY WORLD</Text>
            <Text style={styles.panelBody}>Switching parks deals new cards. Your score, streak, and rewards carry over.</Text>
            <View style={styles.parkList}>
              {PARKS.map(park => {
                const selected = selectedParkId === park.id;
                return (
                  <TouchableOpacity
                    key={park.id}
                    testID={`switch-park-${park.id}`}
                    accessibilityRole="radio"
                    aria-checked={selected}
                    accessibilityState={{ checked: selected }}
                    style={[styles.parkOption, selected && styles.parkOptionSelected]}
                    onPress={() => setSelectedParkId(park.id)}
                    activeOpacity={0.85}
                  >
                    <GameIcon name={park.icon} size={30} />
                    <Text style={[styles.parkOptionLabel, selected && styles.parkOptionLabelSelected]}>{park.name}</Text>
                    {selected && <Text style={styles.parkOptionCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            </ScrollView>
            <View style={styles.panelButtons}>
              <GameButton label="Cancel" tone="gray" onPress={closeParkModal} style={styles.panelSecondary} />
              <GameButton testID="switch-park-confirm" label="Switch" tone="green" disabled={selectedParkId === currentPark?.id} onPress={handleConfirmSwitchPark} style={styles.panelPrimary} />
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// Counts up to the new score and bumps whenever points are gained.
function useCountUp(value: number) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const anim = useRef(new Animated.Value(value)).current;
  const bump = useRef(new Animated.Value(0)).current;
  const prev = useRef(value);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, []);

  useEffect(() => {
    if (reduced) { anim.stopAnimation(); bump.stopAnimation(); anim.setValue(value); bump.setValue(0); setDisplay(value); prev.current = value; return; }
    const gained = value > prev.current;
    prev.current = value;
    Animated.timing(anim, {
      toValue: value,
      duration: gained ? 650 : 250,
      delay: gained ? 380 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    if (gained) {
      bump.setValue(0);
      Animated.sequence([
        Animated.delay(380),
        Animated.spring(bump, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.timing(bump, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [value, reduced]);

  return { display, bump };
}

function ScoreHud({
  score,
  streak,
  completed,
}: {
  score: number;
  streak: number;
  completed: number;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const reduced = useReducedMotion();
  const styles = useThemedStyles(BASE_STYLES, true, ['hudScoreLabel','hudScoreValue']);

  const { display, bump } = useCountUp(score);
  const streakPips = streak % 5;
  const { scale: readingScale } = useReadingPreferences();
  const scoreTextWidth = (SCREEN_W - SIDE_PAD * 2 - 16) * 1.5 / 3.5 - 18;
  const scoreFontSize = Math.min(34 * readingScale, Math.floor(scoreTextWidth / (Math.max(3, String(display).length) * 0.68)));

  return (
    <View style={styles.hud}>
      <View style={styles.hudRow}>
        <View testID="streak-stat" accessible accessibilityLabel={`Streak: ${streak}. ${5 - streakPips} more consecutive completions to the next 10-point bonus.`} style={[styles.hudCell, styles.hudSide]}>
          <Text style={styles.hudLabel}>STREAK</Text>
          <View style={styles.hudValueRow}>
            <GameIcon name="flame" size={20} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={[styles.hudValue, { flexShrink: 1 }]}>{streak}</Text>
          </View>
          <View style={styles.pips}>
            {Array.from({ length: 5 }, (_, i) => (
              <View testID={`streak-pip-${i}`} key={i} style={[styles.pip, { backgroundColor: dark ? '#625373' : '#CBC2D5' }, i < streakPips && styles.pipOn]} />
            ))}
          </View>
        </View>
        <Animated.View
          testID="score-stat"
          accessible
          accessibilityLabel={`Score: ${score} points`}
          accessibilityLiveRegion="polite"
          aria-live="polite"
          style={[
            styles.hudCell,
            styles.hudScore,
            { transform: [{ scale: bump.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] },
          ]}
        >
          <Text style={[styles.hudLabel, styles.hudScoreLabel]}>SCORE</Text>
          <Text testID="score-value" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.45} style={[styles.hudScoreValue, { fontSize: scoreFontSize, width: '100%', textAlign: 'center', paddingHorizontal: 6 }]}>{display}</Text>
        </Animated.View>
        <View testID="completed-stat" accessible accessibilityLabel={`${completed} quests completed`} style={[styles.hudCell, styles.hudSide]}>
          <Text style={styles.hudLabel}>DONE</Text>
          <View style={styles.hudValueRow}>
            <GameIcon name="check" size={20} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={[styles.hudValue, { flexShrink: 1 }]}>{completed}</Text>
          </View>
          <Text style={styles.hudSub}>quests</Text>
        </View>
      </View>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const reduced = useReducedMotion();
  const styles = useThemedStyles(BASE_STYLES, true, ['hudScoreLabel','hudScoreValue']);

  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} style={styles.navItem} onPress={onPress} activeOpacity={0.8} disabled={active}>
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <GameIcon name={icon} size={28} style={!active && styles.navIconIdle} />
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.navLabel, { maxWidth: '100%' }, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ChallengeDetailModal({
  task,
  canSwap,
  onComplete,
  onSwap,
  onClose,
}: {
  task: Task;
  canSwap: boolean;
  onComplete: () => void;
  onSwap: () => void;
  onClose: () => void;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const reduced = useReducedMotion();
  const styles = useThemedStyles(BASE_STYLES, true, ['hudScoreLabel','hudScoreValue']);

  const { scale: readingScale } = useReadingPreferences();
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { appear.setValue(1); return; }
    Animated.spring(appear, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, []);

  return (
    <Modal transparent animationType={reduced ? 'none' : 'fade'} visible onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable accessibilityViewIsModal onPress={e => e.stopPropagation()} style={[styles.detailWrap, { maxHeight: '92%', backgroundColor: COLORS.surface, padding: 16, borderRadius: 18 }]}>
          <View style={styles.detailKickerPill}>
            <Text style={styles.detailKicker}>CHALLENGE</Text>
          </View>
          <Animated.View
            style={{
              transform: [
                { perspective: 900 },
                { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                { rotateY: appear.interpolate({ inputRange: [0, 1], outputRange: ['70deg', '0deg'] }) },
              ],
              opacity: appear,
            }}
          >
            <CardFace task={task} width={110} variant="compact" />
          </Animated.View>
          <ScrollView style={{ maxHeight: 200, flexShrink: 1, alignSelf: 'stretch' }} contentContainerStyle={{ gap: 8 }}>
            <FocusHeading title={task.description} />
            {!!task.flavorText && <Text style={{ color: COLORS.textBody, fontSize: 16 * readingScale, lineHeight: 24 * readingScale }}>{task.flavorText}</Text>}
          </ScrollView>
          <View style={styles.detailButtons}>
            <GameButton
              testID="challenge-swap-btn"
              label="Swap"
              sublabel={canSwap ? `-${SWAP_COST} pts` : `Need ${SWAP_COST} pts`}
              tone="blue"
              disabled={!canSwap}
              onPress={onSwap}
              style={styles.panelSecondary}
            />
            <GameButton
              testID="challenge-complete-btn"
              label="Complete"
              sublabel={`+${task.points} pts`}
              tone="green"
              onPress={onComplete}
              style={styles.panelPrimary}
            />
          </View>
          <TouchableOpacity testID="challenge-close-btn" accessibilityRole="button" onPress={onClose} style={[styles.textBtn, { minHeight: 44, minWidth: 44, justifyContent: 'center' }]}>
            <Text style={styles.textBtnLabel}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const BASE_STYLES = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 11, 36, 0.64)',
  },
  safe: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 86,
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TABLE.felt,
    gap: 16,
  },
  loadingText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 22,
  },
  loadingBtn: {
    flexGrow: 0,
    minWidth: 200,
  },

  // ── HUD ──
  hud: {
    paddingHorizontal: SIDE_PAD,
    gap: 6,
  },
  parkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: TABLE.panel,
    borderWidth: 2,
    borderColor: INK,
  },
  parkChipText: {
    flexShrink: 1,
    fontFamily: FONTS.display,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  hudRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hudCell: {
    backgroundColor: TABLE.panel,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: INK,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  hudSide: {
    flex: 1,
  },
  hudScore: {
    flex: 1.5,
    backgroundColor: TABLE.chipBlue,
  },
  hudLabel: {
    fontFamily: FONTS.display,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  hudScoreLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  hudValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  hudValue: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 26,
  },
  hudScoreValue: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  hudSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
  pips: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  pip: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ rotate: '45deg' }],
  },
  pipOn: {
    backgroundColor: '#FF9F43',
  },

  // ── Sections ──
  section: {
    paddingHorizontal: SIDE_PAD,
    gap: 8,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handHeading: {
    paddingHorizontal: SIDE_PAD,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 0.5,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  sectionHint: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '800',
  },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingLeft: 6,
  },
  handSection: {
    flex: 1,
  },
  handArea: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  // ── Nav ──
  navShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: TABLE.panel,
    borderRadius: 20,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: INK,
    paddingVertical: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
  },
  navIconIdle: {
    opacity: 0.75,
  },
  navIconWrapActive: {
    backgroundColor: TABLE.gold,
  },
  navLabel: {
    fontFamily: FONTS.display,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  navLabelActive: {
    color: TABLE.gold,
  },

  // ── Shared modal panels ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 9, 28, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: TABLE.panel,
    borderRadius: 22,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: INK,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  panelTitle: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 28,
    textAlign: 'center',
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  panelKicker: {
    fontFamily: FONTS.display,
    color: TABLE.gold,
    fontSize: 13,
    letterSpacing: 2,
    marginTop: -6,
  },
  panelBody: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
  },
  panelButtons: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  panelPrimary: {
    flex: 1.6,
  },
  panelSecondary: {
    flex: 1,
  },
  textBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  textBtnLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Tips ──
  tipLogoCard: {
    width: 70,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#FFF8EC',
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  tipLogoLetter: {
    fontFamily: FONTS.display,
    color: '#7B5FE0',
    fontSize: 26,
    lineHeight: 28,
  },
  tipLogoStar: {
    color: TABLE.gold,
    fontSize: 14,
  },
  tipDots: {
    flexDirection: 'row',
    gap: 6,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tipDotActive: {
    width: 22,
    backgroundColor: TABLE.gold,
  },

  // ── Park switcher ──
  parkList: {
    alignSelf: 'stretch',
    gap: 8,
  },
  parkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: TABLE.panelLight,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: INK,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  parkOptionSelected: {
    backgroundColor: '#FFF8EC',
    borderColor: TABLE.gold,
  },
  parkOptionLabel: {
    flex: 1,
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 18,
  },
  parkOptionLabelSelected: {
    color: INK,
  },
  parkOptionCheck: {
    fontFamily: FONTS.display,
    color: COLORS.greenDark,
    fontSize: 20,
  },

  // ── Challenge detail ──
  detailWrap: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 400,
  },
  detailKickerPill: {
    backgroundColor: TABLE.panel,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  detailKicker: {
    fontFamily: FONTS.display,
    color: TABLE.gold,
    fontSize: 14,
    letterSpacing: 2,
  },
  detailButtons: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
});
