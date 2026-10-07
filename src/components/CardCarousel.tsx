/**
 * CardCarousel.tsx — The player's hand
 *
 * Snap-scrolling fanned hand of task cards. The centered card is "held up";
 * the action bar beneath it completes, discards, or answers that card. Closing
 * a card plays its exit animation and burst before the store is updated, and an
 * open slot stands in while the player drafts a replacement.
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
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Task } from '../types';
import { CATEGORY_FRAME_COLORS, FONTS, INK, TABLE } from '../theme/theme';
import CardBurst, { BurstVariant } from './CardBurst';
import CardFace, { CARD_ASPECT } from './CardFace';
import GameButton from './GameButton';
import { haptic } from '../utils/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CARD_WIDTH = Math.round(Math.min(SCREEN_W * 0.66, 270, (SCREEN_H * 0.4) / CARD_ASPECT));
const CARD_HEIGHT = Math.round(CARD_WIDTH * CARD_ASPECT);
const CARD_GAP = 14;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const H_PADDING = Math.round((SCREEN_W - CARD_WIDTH) / 2);
const INACTIVE_SCALE = 0.88;
const FAN_TILT = 7;

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

type ExitKind = 'complete' | 'discard';

const toDeg = (v: Animated.AnimatedInterpolation<number> | Animated.Value) =>
  v.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

// ── Hand card: deals in on mount, punches/shatters or tosses on exit ──
function TaskCard({
  task,
  dealDelay,
  exitKind,
  onExited,
}: {
  task: Task;
  dealDelay: number;
  exitKind: ExitKind | null;
  onExited: () => void;
}) {
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

  return (
    <Animated.View
      testID="hand-card"
      style={{
        opacity: Animated.multiply(deal.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }), exitOpacity),
        transform: [
          { perspective: 900 },
          { translateY: Animated.add(deal.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }), exitY) },
          { translateX: exitX },
          { rotateY: deal.interpolate({ inputRange: [0, 1], outputRange: ['-95deg', '0deg'] }) },
          { rotate: toDeg(exitRotate) },
          { scale: Animated.multiply(deal.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }), exitScale) },
        ],
      }}
    >
      <CardFace task={task} width={CARD_WIDTH}>
        <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
      </CardFace>
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
  const color = CATEGORY_FRAME_COLORS[task.category] ?? '#888';
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const answered = selectedChoice !== null;
  const correct = selectedChoice === task.triviaAnswer;

  const handleChoicePress = (index: number) => {
    if (answered) return;
    setSelectedChoice(index);
    haptic(index === task.triviaAnswer ? 'success' : 'thud');
    setTimeout(() => onTriviaAnswer(index === task.triviaAnswer), 1200);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={answered ? undefined : onClose}>
        <Pressable style={styles.triviaPanel} onPress={e => e.stopPropagation()}>
          <View style={styles.triviaHeader}>
            <View style={[styles.triviaRibbon, { backgroundColor: color }]}>
              <Text style={styles.triviaRibbonText}>TRIVIA</Text>
            </View>
            <View style={styles.triviaCoin}>
              <Text style={styles.triviaCoinText}>{task.points}</Text>
            </View>
          </View>
          <Text style={styles.triviaQuestion}>{task.description}</Text>

          <View style={styles.triviaChoices}>
            {task.triviaChoices!.map((choice, i) => {
              const isAnswer = i === task.triviaAnswer;
              const state = !answered ? 'idle' : isAnswer ? 'right' : i === selectedChoice ? 'wrong' : 'dim';
              return (
                <TouchableOpacity
                  key={i}
                  testID={`trivia-choice-${i}`}
                  style={[
                    styles.triviaChoice,
                    state === 'right' && styles.choiceRight,
                    state === 'wrong' && styles.choiceWrong,
                    state === 'dim' && styles.choiceDim,
                  ]}
                  onPress={() => handleChoicePress(i)}
                  activeOpacity={0.8}
                  disabled={answered}
                >
                  <View style={[styles.choiceLetter, { backgroundColor: color }]}>
                    <Text style={styles.choiceLetterText}>{CHOICE_LETTERS[i]}</Text>
                  </View>
                  <Text style={[styles.choiceText, (state === 'right' || state === 'wrong') && styles.choiceTextLight]}>
                    {choice}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {answered ? (
            <Text style={[styles.triviaResult, { color: correct ? '#5BE08F' : '#FF8A8A' }]}>
              {correct ? `Correct! +${task.points}` : 'Not quite!'}
            </Text>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.triviaLater}>
              <Text style={styles.triviaLaterText}>Not now</Text>
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
      testID="open-slot"
      style={[
        styles.openSlot,
        {
          opacity: Animated.multiply(appear, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })),
          transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        },
      ]}
    >
      <Text style={styles.openSlotStar}>✦</Text>
      <Text style={styles.openSlotText}>Choosing your{'\n'}next quest…</Text>
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
  currentStreak,
  onComplete,
  onDiscard,
  onTriviaAnswer,
  discardsRemaining,
}: {
  cards: Task[];
  openSlotIndex: number | null;
  currentStreak: number;
  onComplete: (id: string) => void;
  onDiscard: (id: string) => void;
  discardsRemaining: number;
  onTriviaAnswer: (id: string, correct: boolean) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [triviaTask, setTriviaTask] = useState<Task | null>(null);
  const [exiting, setExiting] = useState<{ id: string; kind: ExitKind } | null>(null);
  const [bursts, setBursts] = useState<
    { key: number; color: string; variant: BurstVariant; points: number; bonus: number; delay: number; offsetX: number }[]
  >([]);
  const afterExitRef = useRef<(() => void) | null>(null);
  const burstKeyRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  const items: HandItem[] = [...cards];
  if (openSlotIndex != null) items.splice(Math.min(openSlotIndex, items.length), 0, { id: OPEN_SLOT_ID });

  const activeItem = items[Math.min(activeIndex, items.length - 1)];
  const activeTask = activeItem && !isOpenSlot(activeItem) ? activeItem : null;
  const isTrivia = !!activeTask && activeTask.category === 'trivia' && !!activeTask.triviaChoices;
  const busy = exiting !== null || !activeTask;

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
        color: CATEGORY_FRAME_COLORS[task.category] ?? '#888',
        variant: kind,
        points: task.points,
        // Mirrors the store's +10 bonus on every 5th consecutive completion.
        bonus: kind === 'complete' && (currentStreak + 1) % 5 === 0 ? 10 : 0,
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

  const handleComplete = () => {
    if (!activeTask || busy) return;
    if (isTrivia) {
      setTriviaTask(activeTask);
      return;
    }
    beginExit(activeTask, 'complete', () => onComplete(activeTask.id));
  };

  const handleDiscard = () => {
    if (!activeTask || busy || discardsRemaining <= 0) return;
    beginExit(activeTask, 'discard', () => onDiscard(activeTask.id));
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
        flatListRef.current?.scrollToOffset({ offset: nextIndex * SNAP_INTERVAL, animated: false });
      });
    }
  }, [activeIndex, items.length]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (clamped !== activeIndex) setActiveIndex(clamped);
    },
    [activeIndex, items.length]
  );

  const focusCard = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    flatListRef.current?.scrollToOffset({ offset: index * SNAP_INTERVAL, animated: true });
  };

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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
            listener: handleScroll,
          })}
          scrollEventThrottle={16}
          renderItem={({ item, index }: { item: HandItem; index: number }) => {
            const inputRange = [(index - 1) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 1) * SNAP_INTERVAL];
            const scale = scrollX.interpolate({ inputRange, outputRange: [INACTIVE_SCALE, 1, INACTIVE_SCALE], extrapolate: 'clamp' });
            const translateY = scrollX.interpolate({ inputRange, outputRange: [18, 0, 18], extrapolate: 'clamp' });
            const rotate = scrollX.interpolate({
              inputRange,
              outputRange: [`${FAN_TILT}deg`, '0deg', `-${FAN_TILT}deg`],
              extrapolate: 'clamp',
            });
            return (
              <Pressable onPress={() => focusCard(index)} disabled={index === activeIndex}>
                <Animated.View
                  style={{
                    width: CARD_WIDTH,
                    marginHorizontal: CARD_GAP / 2,
                    transform: [{ translateY }, { rotate }, { scale }],
                  }}
                >
                  {isOpenSlot(item) ? (
                    <OpenSlot />
                  ) : (
                    <TaskCard
                      task={item}
                      dealDelay={initialIdsRef.current.has(item.id) ? 150 + index * 90 : 0}
                      exitKind={exiting?.id === item.id ? exiting.kind : null}
                      onExited={handleExited}
                    />
                  )}
                </Animated.View>
              </Pressable>
            );
          }}
        />
        {bursts.map(b => (
          <CardBurst
            key={b.key}
            color={b.color}
            variant={b.variant}
            points={b.points}
            bonus={b.bonus}
            delay={b.delay}
            offsetX={b.offsetX}
            onDone={() => setBursts(list => list.filter(x => x.key !== b.key))}
          />
        ))}
      </Animated.View>

      <View style={styles.dots}>
        {items.map((item, i) => (
          <View key={item.id} style={[styles.dot, isOpenSlot(item) && styles.dotOpen, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actionBar}>
        <GameButton
          testID="discard-btn"
          label="Discard"
          sublabel={`${discardsRemaining} left`}
          tone="red"
          disabled={busy || discardsRemaining <= 0}
          onPress={handleDiscard}
          style={styles.actionSecondary}
        />
        <GameButton
          testID="complete-btn"
          label={isTrivia ? 'Answer' : 'Complete'}
          sublabel={activeTask ? `+${activeTask.points} pts` : undefined}
          tone={isTrivia ? 'gold' : 'green'}
          disabled={busy}
          onPress={handleComplete}
          style={styles.actionPrimary}
        />
      </View>

      {triviaTask && (
        <TriviaModal
          task={triviaTask}
          onTriviaAnswer={correct => {
            const task = triviaTask;
            setTriviaTask(null);
            beginExit(task, correct ? 'complete' : 'discard', () => onTriviaAnswer(task.id, correct));
          }}
          onClose={() => setTriviaTask(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  listWrap: {
    overflow: 'visible',
  },
  list: {
    overflow: 'visible',
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: H_PADDING - CARD_GAP / 2,
    paddingTop: 14,
    paddingBottom: 22,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },

  // ── Open slot ──
  openSlot: {
    height: CARD_HEIGHT,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 212, 92, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openSlotStar: {
    color: TABLE.gold,
    fontSize: 38,
  },
  openSlotText: {
    fontFamily: FONTS.display,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    textAlign: 'center',
  },

  // ── Dots + actions ──
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotOpen: {
    backgroundColor: TABLE.gold,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 12,
  },
  actionSecondary: {
    flex: 2,
  },
  actionPrimary: {
    flex: 3,
  },

  // ── Trivia modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 9, 28, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  triviaPanel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: TABLE.panel,
    borderRadius: 22,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: INK,
    padding: 18,
    gap: 14,
  },
  triviaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triviaRibbon: {
    borderWidth: 2.5,
    borderColor: INK,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  triviaRibbonText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 1.5,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  triviaCoin: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: TABLE.gold,
    borderWidth: 3,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triviaCoinText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 20,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  triviaQuestion: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  triviaChoices: {
    gap: 9,
  },
  triviaChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8EC',
    borderRadius: 14,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: INK,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  choiceRight: {
    backgroundColor: '#3DBE6E',
  },
  choiceWrong: {
    backgroundColor: '#E2504F',
  },
  choiceDim: {
    opacity: 0.45,
  },
  choiceLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceLetterText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 16,
  },
  choiceText: {
    flex: 1,
    color: INK,
    fontSize: 15,
    fontWeight: '800',
  },
  choiceTextLight: {
    color: '#FFFFFF',
  },
  triviaResult: {
    fontFamily: FONTS.display,
    fontSize: 24,
    textAlign: 'center',
  },
  triviaLater: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  triviaLaterText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '800',
  },
});
