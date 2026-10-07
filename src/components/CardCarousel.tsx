/**
 * CardCarousel.tsx — Horizontal swipeable card hand
 *
 * Renders the player's 5 hand cards as a snap-scrolling horizontal carousel.
 * The centered card scales up (active), while off-screen cards scale down.
 * Each card shows task info with Complete/Discard buttons. Trivia cards
 * open a separate answer modal. Dot indicators show current position.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Alert,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { Task } from '../types';
import { COLORS, SHADOWS, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ICON_IMAGES } from '../theme/theme';
import CardBurst, { BurstVariant } from './CardBurst';
import { haptic } from '../utils/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

const CARD_WIDTH = Math.round(Math.min(SCREEN_W * 0.76, 310));
const CARD_GAP = Math.round(10 * sw);
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const H_PADDING = Math.round((SCREEN_W - CARD_WIDTH) / 2);
const ACTIVE_SCALE = 1.0;
const INACTIVE_SCALE = 0.9;

// Labels shown beside each multiple-choice answer in the trivia modal.
const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

type ExitKind = 'complete' | 'discard';

const toDeg = (v: Animated.AnimatedInterpolation<number> | Animated.Value) =>
  v.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

// ── Animated task card: deals in on mount, punches/shatters or tosses on exit ──
function TaskCard({
  task,
  canDiscard,
  dealDelay,
  exitKind,
  onExited,
  onComplete,
  onDiscard,
  onTriviaPress,
}: {
  task: Task;
  canDiscard: boolean;
  dealDelay: number;
  exitKind: ExitKind | null;
  onExited: () => void;
  onComplete: () => void;
  onDiscard: () => void;
  onTriviaPress: () => void;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const isTrivia = task.category === 'trivia' && task.triviaChoices && task.triviaAnswer != null;
  const busy = exitKind !== null;

  const deal = useRef(new Animated.Value(0)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitRotate = useRef(new Animated.Value(0)).current;
  const exitY = useRef(new Animated.Value(0)).current;
  const exitX = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(dealDelay),
      Animated.spring(deal, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (exitKind === 'complete') {
      // Anticipation squash → overshoot punch with white flash → collapse into the burst.
      Animated.sequence([
        Animated.parallel([
          Animated.timing(exitScale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
          Animated.timing(exitRotate, { toValue: -3, duration: 70, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(exitScale, { toValue: 1.13, duration: 120, easing: Easing.out(Easing.back(3)), useNativeDriver: true }),
          Animated.timing(exitRotate, { toValue: 4, duration: 120, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0.9, duration: 120, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(exitScale, { toValue: 0, duration: 200, easing: Easing.in(Easing.back(2)), useNativeDriver: true }),
          Animated.timing(exitRotate, { toValue: 16, duration: 200, useNativeDriver: true }),
          Animated.timing(exitOpacity, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start(onExited);
    } else if (exitKind === 'discard') {
      // Small lift, then toss the card off the bottom with a spin.
      Animated.sequence([
        Animated.parallel([
          Animated.timing(exitY, { toValue: -14, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(exitRotate, { toValue: 3, duration: 90, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(exitY, { toValue: 260, duration: 340, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(exitX, { toValue: -40, duration: 340, useNativeDriver: true }),
          Animated.timing(exitRotate, { toValue: -22, duration: 340, useNativeDriver: true }),
          Animated.timing(exitScale, { toValue: 0.85, duration: 340, useNativeDriver: true }),
          Animated.timing(exitOpacity, { toValue: 0, duration: 340, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start(onExited);
    } else {
      for (const v of [exitRotate, exitY, exitX, flash]) v.setValue(0);
      exitScale.setValue(1);
      exitOpacity.setValue(1);
    }
  }, [exitKind]);

  const flavorText =
    task.flavorText ??
    (task.category === 'trivia'
      ? ''
      : task.category === 'photo'
      ? 'Take the photo to complete'
      : task.category === 'find'
      ? 'Spot it to earn points'
      : 'Complete this task to earn points');

  const handleDiscard = busy ? () => {} : onDiscard;
  const handleComplete = busy ? () => {} : onComplete;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: color,
          opacity: Animated.multiply(
            deal.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
            exitOpacity,
          ),
          transform: [
            { perspective: 900 },
            { translateY: Animated.add(deal.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }), exitY) },
            { translateX: exitX },
            { rotateY: deal.interpolate({ inputRange: [0, 1], outputRange: ['-95deg', '0deg'] }) },
            { rotate: toDeg(exitRotate) },
            { scale: Animated.multiply(deal.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }), exitScale) },
          ],
        },
      ]}
    >
      {/* Category header */}
      <View style={[styles.cardHeader, { backgroundColor: color }]}>
        <Text style={styles.cardHeaderText}>{task.displayCategory}</Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.iconPtsRow}>
          <View style={[styles.iconOuter, { backgroundColor: color }]}>
            <Image source={CATEGORY_ICON_IMAGES[task.category]} style={styles.iconImage} resizeMode="contain" />
          </View>
          <Text style={[styles.ptsText, { color }]}>{task.points} pts</Text>
        </View>
        <Text style={styles.cardDescription} numberOfLines={4}>
          {task.description}
        </Text>
        {flavorText ? <Text style={styles.cardFlavor}>{flavorText}</Text> : null}
      </View>

      {/* Action buttons */}
      {isTrivia ? (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardActionBtn, styles.completeBtn]}
            onPress={busy ? undefined : onTriviaPress}
            activeOpacity={0.8}
          >
            <Text style={styles.completeBtnText}>Answer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardActionBtn,
              styles.discardBtn,
              !canDiscard && styles.disabledBtn,
            ]}
            onPress={
              canDiscard
                ? handleDiscard
                : () =>
                    Alert.alert(
                      'No Discards Remaining',
                      'Complete a task to restore your discards!'
                    )
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.discardBtnText,
                !canDiscard && { color: COLORS.textMuted },
              ]}
            >
              Discard
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardActionBtn, styles.completeBtn]}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.completeBtnText}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardActionBtn,
              styles.discardBtn,
              !canDiscard && styles.disabledBtn,
            ]}
            onPress={
              canDiscard
                ? handleDiscard
                : () =>
                    Alert.alert(
                      'No Discards Remaining',
                      'Complete a task to restore your discards!'
                    )
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.discardBtnText,
                !canDiscard && { color: COLORS.textMuted },
              ]}
            >
              Discard
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
    </Animated.View>
  );
}

// ── Trivia modal ─────────────────────────────────────────────
function TriviaModal({
  task,
  onTriviaAnswer,
  onClose,
}: {
  task: Task;
  onTriviaAnswer: (correct: boolean) => void;
  onClose: () => void;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '';
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Locks the question after one answer, reveals correctness state, then hands
  // the result to the parent so scoring/replacement can happen centrally.
  const handleChoicePress = (index: number) => {
    if (answered) return;
    setSelectedChoice(index);
    setAnswered(true);
    const correct = index === task.triviaAnswer;
    setTimeout(() => onTriviaAnswer(correct), 1200);
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={answered ? undefined : onClose}>
        <Pressable style={[styles.modalCard, { borderColor: color }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.modalHeader, { backgroundColor: color }]}>
            <Text style={styles.modalHeaderText}>{task.displayCategory}</Text>
          </View>
          <View style={styles.modalBody}>
            <View style={[styles.modalIconOuter, { backgroundColor: color }]}>
              <Image source={CATEGORY_ICON_IMAGES[task.category]} style={styles.modalIconImage} resizeMode="contain" />
            </View>
            <Text style={[styles.modalPts, { color }]}>{task.points} pts</Text>
            <Text style={styles.modalDescription}>{task.description}</Text>
          </View>
          <View style={styles.triviaChoicesContainer}>
            {task.triviaChoices!.map((choice, i) => {
              const isSelected = selectedChoice === i;
              const isCorrectAnswer = i === task.triviaAnswer;
              let choiceStyle = styles.triviaChoice;
              let choiceTextStyle = styles.triviaChoiceText;
              let letterStyle = styles.triviaChoiceLetter;

              if (answered) {
                if (isCorrectAnswer) {
                  choiceStyle = { ...styles.triviaChoice, ...styles.triviaChoiceCorrect };
                  choiceTextStyle = { ...styles.triviaChoiceText, color: COLORS.white };
                  letterStyle = { ...styles.triviaChoiceLetter, ...styles.triviaChoiceLetterAnswered };
                } else if (isSelected && !isCorrectAnswer) {
                  choiceStyle = { ...styles.triviaChoice, ...styles.triviaChoiceWrong };
                  choiceTextStyle = { ...styles.triviaChoiceText, color: COLORS.white };
                  letterStyle = { ...styles.triviaChoiceLetter, ...styles.triviaChoiceLetterAnswered };
                }
              }

              return (
                <TouchableOpacity
                  key={i}
                  style={choiceStyle}
                  onPress={() => handleChoicePress(i)}
                  activeOpacity={answered ? 1 : 0.7}
                  disabled={answered}
                >
                  <View style={letterStyle}>
                    <Text style={styles.triviaChoiceLetterText}>{CHOICE_LETTERS[i]}</Text>
                  </View>
                  <Text style={choiceTextStyle}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
            {answered && (
              <Text
                style={[
                  styles.triviaResultText,
                  selectedChoice === task.triviaAnswer
                    ? styles.triviaResultCorrect
                    : styles.triviaResultWrong,
                ]}
              >
                {selectedChoice === task.triviaAnswer
                  ? '\u2713 Correct! +' + task.points + ' pts'
                  : '\u2715 Wrong answer!'}
              </Text>
            )}
          </View>
          {!answered && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{'\u2715'}</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Open slot shown while the player drafts a replacement ────
function OpenSlot() {
  const pulse = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={[
        styles.openSlot,
        {
          opacity: Animated.multiply(appear, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })),
          transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        },
      ]}
    >
      <Text style={styles.openSlotStar}>✦</Text>
      <Text style={styles.openSlotText}>Choosing your next quest…</Text>
    </Animated.View>
  );
}

const OPEN_SLOT_ID = '__open_slot__';
type HandItem = Task | { id: typeof OPEN_SLOT_ID };
const isOpenSlot = (item: HandItem): item is { id: typeof OPEN_SLOT_ID } => item.id === OPEN_SLOT_ID;

// ── Main Carousel ────────────────────────────────────────────
export default function CardCarousel({
  cards,
  openSlotIndex,
  onComplete,
  onDiscard,
  onTriviaAnswer,
  discardsRemaining,
}: {
  cards: Task[];
  openSlotIndex: number | null;
  onComplete: (id: string) => void;
  onDiscard: (id: string) => void;
  discardsRemaining: number;
  onTriviaAnswer?: (id: string, correct: boolean) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [triviaTask, setTriviaTask] = useState<Task | null>(null);
  const [exiting, setExiting] = useState<{ id: string; kind: ExitKind } | null>(null);
  const [bursts, setBursts] = useState<
    { key: number; color: string; variant: BurstVariant; points: number; delay: number; offsetX: number }[]
  >([]);
  const afterExitRef = useRef<(() => void) | null>(null);
  const burstKeyRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  const items: HandItem[] = [...cards];
  if (openSlotIndex != null) items.splice(Math.min(openSlotIndex, items.length), 0, { id: OPEN_SLOT_ID });

  // Opening hand staggers its deal; cards added later deal in immediately.
  const initialIdsRef = useRef(new Set(cards.map(c => c.id)));
  const prevIdsRef = useRef(cards.map(c => c.id));

  useEffect(() => {
    const prev = new Set(prevIdsRef.current);
    prevIdsRef.current = cards.map(c => c.id);
    if (prev.size === 0) return;
    const newIndex = cards.findIndex(c => !prev.has(c.id));
    if (newIndex === -1) return;
    setActiveIndex(newIndex);
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: newIndex * SNAP_INTERVAL, animated: true });
    });
  }, [cards]);

  const beginExit = (task: Task, kind: ExitKind, after: () => void) => {
    if (exiting) return;
    const index = items.findIndex(c => c.id === task.id);
    afterExitRef.current = after;
    setExiting({ id: task.id, kind });
    haptic(kind === 'complete' ? 'success' : 'thud');
    const delay = kind === 'complete' ? 190 : 120;
    if (kind === 'complete') {
      Animated.sequence([
        Animated.delay(delay),
        ...[7, -6, 4, -2, 0].map(x => Animated.timing(shake, { toValue: x, duration: 45, useNativeDriver: true })),
      ]).start();
    }
    const key = ++burstKeyRef.current;
    setBursts(b => [
      ...b,
      {
        key,
        color: CATEGORY_COLORS[task.category] ?? '#888',
        variant: kind,
        points: task.points,
        delay,
        offsetX: (index - activeIndex) * SNAP_INTERVAL,
      },
    ]);
  };

  const handleExited = () => {
    const after = afterExitRef.current;
    afterExitRef.current = null;
    setExiting(null);
    after?.();
  };

  useEffect(() => {
    if (items.length === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > items.length - 1) {
      const nextIndex = items.length - 1;
      setActiveIndex(nextIndex);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * SNAP_INTERVAL,
          animated: false,
        });
      });
    }
  }, [activeIndex, items.length]);

  // Track active card on every scroll frame (auto-select centered card)
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / SNAP_INTERVAL);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (clamped !== activeIndex) setActiveIndex(clamped);
    },
    [activeIndex, items.length]
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.listWrap, { transform: [{ translateX: shake }] }]}>
        <Animated.FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item: HandItem) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          bounces={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: true,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }: { item: HandItem; index: number }) => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [INACTIVE_SCALE, ACTIVE_SCALE, INACTIVE_SCALE],
              extrapolate: 'clamp',
            });
            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [12, -8, 12],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                style={{
                  width: CARD_WIDTH,
                  marginHorizontal: CARD_GAP / 2,
                  transform: [{ translateY }, { scale }],
                }}
              >
                {isOpenSlot(item) ? (
                  <OpenSlot />
                ) : (
                  <TaskCard
                    task={item}
                    canDiscard={discardsRemaining > 0}
                    dealDelay={initialIdsRef.current.has(item.id) ? 150 + index * 90 : 0}
                    exitKind={exiting?.id === item.id ? exiting.kind : null}
                    onExited={handleExited}
                    onComplete={() => beginExit(item, 'complete', () => onComplete(item.id))}
                    onDiscard={() => beginExit(item, 'discard', () => onDiscard(item.id))}
                    onTriviaPress={() => setTriviaTask(item)}
                  />
                )}
              </Animated.View>
            );
          }}
        />
        {bursts.map(b => (
          <CardBurst
            key={b.key}
            color={b.color}
            variant={b.variant}
            points={b.points}
            delay={b.delay}
            offsetX={b.offsetX}
            onDone={() => setBursts(list => list.filter(x => x.key !== b.key))}
          />
        ))}
      </Animated.View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {items.map((item, i) => (
          <View
            key={item.id}
            style={[styles.dot, isOpenSlot(item) && styles.dotOpen, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Trivia modal */}
      {triviaTask && (
        <TriviaModal
          task={triviaTask}
          onTriviaAnswer={(correct) => {
            const task = triviaTask;
            setTriviaTask(null);
            beginExit(task, correct ? 'complete' : 'discard', () => {
              if (onTriviaAnswer) onTriviaAnswer(task.id, correct);
              else if (correct) onComplete(task.id);
              else onDiscard(task.id);
            });
          }}
          onClose={() => setTriviaTask(null)}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Math.round(16 * sh),
    paddingBottom: Math.round(4 * sh),
    overflow: 'visible',
  },
  list: {
    overflow: 'visible',
  },
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: Math.round(10 * sh),
    paddingBottom: Math.round(6 * sh),
  },

  // ── Inline Card ────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: Math.round(16 * sw),
    borderWidth: 1.5,
    minHeight: Math.round(316 * sh),
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardHeader: {
    paddingVertical: Math.round(6 * sh),
    alignItems: 'center',
  },
  cardHeaderText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(20 * sw),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: Math.round(14 * sw),
    paddingTop: Math.round(8 * sh),
    paddingBottom: Math.round(4 * sh),
    alignItems: 'center',
    justifyContent: 'center',
    gap: Math.round(5 * sh),
  },
  iconPtsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(8 * sw),
  },
  iconOuter: {
    width: Math.round(46 * sw),
    height: Math.round(46 * sw),
    borderRadius: Math.round(12 * sw),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.chip,
  },
  iconImage: {
    width: Math.round(38 * sw),
    height: Math.round(38 * sw),
  },
  ptsText: {
    fontWeight: '900',
    fontSize: Math.round(18 * sw),
  },
  cardDescription: {
    color: COLORS.textDark,
    fontSize: Math.round(15 * sw),
    lineHeight: Math.round(19 * sw),
    textAlign: 'center',
    fontWeight: '800',
  },
  cardFlavor: {
    color: COLORS.textMuted,
    fontSize: Math.round(11 * sw),
    lineHeight: Math.round(14 * sw),
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
    paddingHorizontal: Math.round(5 * sw),
  },
  cardActions: {
    flexDirection: 'row',
    gap: Math.round(8 * sw),
    paddingHorizontal: Math.round(12 * sw),
    paddingTop: Math.round(16 * sh),
    paddingBottom: Math.round(14 * sh),
  },
  cardActionBtn: {
    flex: 1,
    paddingVertical: Math.round(9.2 * sh),
    borderRadius: Math.round(12 * sw),
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    backgroundColor: '#78D4A0',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  completeBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: Math.round(15 * sw),
  },
  discardBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.chip,
  },
  discardBtnText: {
    color: COLORS.textBody,
    fontWeight: '700',
    fontSize: Math.round(15 * sw),
  },
  disabledBtn: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.borderLight,
    opacity: 0.45,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  listWrap: {
    overflow: 'visible',
  },
  openSlot: {
    minHeight: Math.round(316 * sh),
    borderRadius: Math.round(16 * sw),
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 212, 92, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openSlotStar: {
    color: '#FFD45C',
    fontSize: Math.round(34 * sw),
  },
  openSlotText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Math.round(14 * sw),
    fontWeight: '800',
  },

  // ── Trivia Modal ───────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '92%',
    backgroundColor: COLORS.cardBg,
    borderRadius: Math.round(20 * sw),
    borderWidth: 2,
    marginBottom: Math.round(40 * sh),
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: Math.round(14 * sh),
    alignItems: 'center',
  },
  modalHeaderText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(20 * sw),
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  modalBody: {
    padding: Math.round(20 * sw),
    paddingBottom: Math.round(10 * sh),
    alignItems: 'center',
    gap: Math.round(8 * sh),
  },
  modalIconOuter: {
    width: Math.round(77 * sw),
    height: Math.round(77 * sw),
    borderRadius: Math.round(17 * sw),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  modalIconImage: {
    width: Math.round(63 * sw),
    height: Math.round(63 * sw),
  },
  modalPts: {
    fontWeight: '900',
    fontSize: Math.round(16 * sw),
  },
  modalDescription: {
    color: COLORS.textDark,
    fontSize: Math.round(17 * sw),
    lineHeight: Math.round(24 * sw),
    textAlign: 'center',
    fontWeight: '800',
  },
  triviaChoicesContainer: {
    padding: Math.round(14 * sw),
    paddingTop: Math.round(4 * sh),
    gap: Math.round(8 * sh),
  },
  triviaChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: Math.round(12 * sw),
    paddingVertical: Math.round(11 * sh),
    paddingHorizontal: Math.round(12 * sw),
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    gap: Math.round(10 * sw),
  },
  triviaChoiceCorrect: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  triviaChoiceWrong: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.redDark,
  },
  triviaChoiceText: {
    color: COLORS.textDark,
    fontSize: Math.round(14 * sw),
    fontWeight: '600',
    flex: 1,
  },
  triviaChoiceLetter: {
    width: Math.round(26 * sw),
    height: Math.round(26 * sw),
    borderRadius: Math.round(13 * sw),
    backgroundColor: COLORS.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  triviaChoiceLetterAnswered: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  triviaChoiceLetterText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: Math.round(12 * sw),
  },
  triviaResultText: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: Math.round(15 * sw),
    marginTop: Math.round(4 * sh),
    marginBottom: Math.round(8 * sh),
  },
  triviaResultCorrect: {
    color: '#16A34A',
  },
  triviaResultWrong: {
    color: COLORS.redDark,
  },
  closeBtn: {
    position: 'absolute',
    top: Math.round(10 * sh),
    right: Math.round(14 * sw),
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Math.round(20 * sw),
    fontWeight: '900',
  },

  // ── Dots ───────────────────────────────────────────────────
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Math.round(6 * sw),
    marginTop: Math.round(4 * sh),
  },
  dot: {
    width: Math.round(5 * sw),
    height: Math.round(5 * sw),
    borderRadius: Math.round(3 * sw),
    backgroundColor: COLORS.borderMedium,
  },
  dotOpen: {
    backgroundColor: '#FFD45C',
  },
  dotActive: {
    backgroundColor: COLORS.green,
    width: Math.round(16 * sw),
  },
});
