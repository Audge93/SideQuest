import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
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
  ScrollView,
} from 'react-native';
import { Task } from '../types';
import { CATEGORY_FRAME_COLORS, FONTS, INK, TABLE } from '../theme/theme';
import CardBurst, { BurstVariant } from './CardBurst';
import CardFace, { CARD_ASPECT } from './CardFace';
import GameButton from './GameButton';
import GameIcon from './icons/GameIcon';
import { haptic } from '../utils/haptics';
import { correctTriviaAnswers, requiredTriviaAnswers, isTriviaSelectionCorrect } from '../utils/trivia';

const { width: SCREEN_W } = Dimensions.get('window');

const CARD_GAP = 14;
// Vertical space the carousel uses besides the card itself: list padding, dots, action bar.
const HAND_CHROME = 112;

// Largest hand card that fits the space the hand has been given.
export function handCardWidth(availableHeight: number) {
  return Math.round(Math.max(140, Math.min(SCREEN_W * 0.66, 270, (availableHeight - HAND_CHROME) / CARD_ASPECT)));
}
const INACTIVE_SCALE = 0.88;
const FAN_TILT = 7;

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

type ExitKind = 'complete' | 'discard';

const toDeg = (v: Animated.AnimatedInterpolation<number> | Animated.Value) =>
  v.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

// ── Hand card: deals in on mount, punches/shatters or tosses on exit ──
function TaskCard({
  task,
  width,
  dealDelay,
  exitKind,
  onExited,
}: {
  task: Task;
  width: number;
  dealDelay: number;
  exitKind: ExitKind | null;
  onExited: () => void;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, true, ['choiceTextLight']);

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
      <CardFace task={task} width={width}>
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
  passed = false,
  fiftyFiftyUses,
  eliminatedChoices,
  onFiftyFifty,
}: {
  task: Task;
  onTriviaAnswer: (correct: boolean) => void;
  onClose: () => void;
  passed?: boolean;
  fiftyFiftyUses: number;
  eliminatedChoices: number[];
  onFiftyFifty: () => void;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, true, ['choiceTextLight']);

  const color = CATEGORY_FRAME_COLORS[task.category] ?? '#888';
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [answered, setAnswered] = useState(passed);
  const answers = correctTriviaAnswers(task);
  const required = requiredTriviaAnswers(task);
  const multiple = required > 1;
  const correct = !passed && isTriviaSelectionCorrect(task, selectedChoices);
  const submittedRef = useRef(false);

  const finish = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onTriviaAnswer(correct);
  };

  const reveal = (choices: number[]) => {
    setSelectedChoices(choices);
    setAnswered(true);
    haptic(isTriviaSelectionCorrect(task, choices) ? 'success' : 'thud');
  };

  const handleChoicePress = (index: number) => {
    if (answered) return;
    if (!multiple) {
      reveal([index]);
      return;
    }
    setSelectedChoices(choices => choices.includes(index)
      ? choices.filter(i => i !== index) : [...choices, index]);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={answered ? finish : onClose}>
      <View style={styles.overlay}>
        <View testID="trivia-panel" style={[styles.triviaPanel, { maxHeight: '92%' }]}>
          <ScrollView contentContainerStyle={{ gap: 14 }} style={{ flexShrink: 1 }}>
          <View style={styles.triviaHeader}>
            <View style={[styles.triviaRibbon, { backgroundColor: color }]}>
              <Text style={styles.triviaRibbonText}>TRIVIA</Text>
            </View>
            <View style={styles.triviaCoin}>
              <Text style={styles.triviaCoinText}>{task.points}</Text>
            </View>
          </View>
          <Text style={styles.triviaQuestion}>{task.description}</Text>
          <Text style={styles.triviaLaterText}>
            {answered ? (answers.length > 1 ? 'Correct answers are highlighted below.' : 'The correct answer is highlighted below.')
              : multiple ? `Select ${required} answers, then submit.` : 'Choose one answer.'}
          </Text>

          <View style={styles.triviaChoices}>
            {task.triviaChoices!.map((choice, i) => {
              const isAnswer = answers.includes(i);
              const selected = selectedChoices.includes(i);
              const eliminated = !answered && eliminatedChoices.includes(i);
              const state = !answered ? 'idle' : isAnswer ? 'right' : selected ? 'wrong' : 'dim';
              return (
                <TouchableOpacity
                  key={i}
                  testID={`trivia-choice-${i}`}
                  style={[
                    styles.triviaChoice,
                    !answered && selected && { borderColor: TABLE.gold, backgroundColor: '#FFE6A0' },
                    state === 'right' && styles.choiceRight,
                    state === 'wrong' && styles.choiceWrong,
                    state === 'dim' && styles.choiceDim,
                    eliminated && { opacity: 0.35 },
                  ]}
                  onPress={() => handleChoicePress(i)}
                  activeOpacity={0.8}
                  disabled={answered || eliminated}
                  accessibilityRole={multiple ? 'checkbox' : 'button'}
                  accessibilityState={{ checked: selected, disabled: answered || eliminated }}
                >
                  <View style={[styles.choiceLetter, { backgroundColor: color }]}>
                    <Text style={styles.choiceLetterText}>{CHOICE_LETTERS[i]}</Text>
                  </View>
                  <Text style={[styles.choiceText, (state === 'right' || state === 'wrong') && styles.choiceTextLight, !answered && selected && { color: INK }]}>
                    {choice}
                  </Text>
                  {eliminated && <Text style={{ color: INK, fontSize: 12, fontWeight: '700' }}>Removed</Text>}
                  {answered && (isAnswer || selected) && (
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                      {isAnswer ? 'Correct' : 'Your pick'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {answered ? (
            <Text testID="trivia-result" style={[styles.triviaResult, { color: passed ? (dark ? TABLE.gold : '#836211') : correct ? (dark ? '#5BE08F' : '#237B48') : (dark ? '#FF8A8A' : '#B62828') }]}>
              {passed ? 'Passed — here’s the answer' : correct ? `Correct! +${task.points}` : 'Not quite!'}
            </Text>
          ) : null}
          {answered && task.triviaExplanation ? <Text testID="trivia-explanation" style={styles.triviaLaterText}>{task.triviaExplanation}</Text> : null}
          </ScrollView>
          {answered ? (
            <GameButton testID="trivia-dismiss-btn" label="Dismiss" tone="blue" onPress={finish} style={{ flexGrow: 0 }} />
          ) : (
            <View style={{ gap: 10 }}>
              {task.triviaChoices?.length === 4 && answers.length === 1 && (
                <>
                  <GameButton testID="trivia-fifty-fifty-btn" label={eliminatedChoices.length ? '50/50 used' : `50/50 (${fiftyFiftyUses} left)`}
                    tone="blue" disabled={fiftyFiftyUses <= 0 || eliminatedChoices.length > 0} onPress={onFiftyFifty} style={{ flexGrow: 0 }} />
                  <Text style={styles.triviaLaterText}>Earn 1 every 5 completed cards. Hold up to 3.</Text>
                </>
              )}
              {multiple && <GameButton testID="trivia-submit-btn" label="Submit answers" tone="gold"
                disabled={selectedChoices.length !== required} onPress={() => reveal(selectedChoices)} style={{ flexGrow: 0 }} />}
              <TouchableOpacity testID="trivia-not-now-btn" onPress={onClose} style={styles.triviaLater}>
                <Text style={styles.triviaLaterText}>Not now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Open slot shown while the player drafts a replacement ────
function OpenSlot({ height }: { height: number }) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, true, ['choiceTextLight']);

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
          height,
          opacity: Animated.multiply(appear, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })),
          transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        },
      ]}
    >
      <GameIcon name="sparkle" size={44} />
      <Text style={styles.openSlotText}>Choosing your{'\n'}next quest…</Text>
    </Animated.View>
  );
}

const OPEN_SLOT_ID = '__open_slot__';
type HandItem = Task | { id: typeof OPEN_SLOT_ID };
const isOpenSlot = (item: HandItem): item is { id: typeof OPEN_SLOT_ID } => item.id === OPEN_SLOT_ID;

// ── Main Carousel ────────────────────────────────────────────
export default function CardCarousel({
  cardWidth,
  cards,
  openSlotIndex,
  currentStreak,
  onComplete,
  onDiscard,
  onTriviaAnswer,
  discardsRemaining,
  fiftyFiftyUses,
  triviaEliminatedChoices,
  onFiftyFifty,
}: {
  cardWidth: number;
  cards: Task[];
  openSlotIndex: number | null;
  currentStreak: number;
  onComplete: (id: string) => void;
  onDiscard: (id: string) => void;
  discardsRemaining: number;
  fiftyFiftyUses: number;
  triviaEliminatedChoices: Record<string, number[]>;
  onFiftyFifty: (id: string) => void;
  onTriviaAnswer: (id: string, correct: boolean) => void;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, true, ['choiceTextLight']);

  const SNAP_INTERVAL = cardWidth + CARD_GAP;
  const sidePadding = Math.round((SCREEN_W - cardWidth) / 2) - CARD_GAP / 2;
  const [activeIndex, setActiveIndex] = useState(0);
  const [triviaTask, setTriviaTask] = useState<Task | null>(null);
  const [triviaPassed, setTriviaPassed] = useState(false);
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
      setTriviaPassed(false);
      setTriviaTask(activeTask);
      return;
    }
    beginExit(activeTask, 'complete', () => onComplete(activeTask.id));
  };

  const handleDiscard = () => {
    if (!activeTask || busy || discardsRemaining <= 0) return;
    if (isTrivia) {
      setTriviaPassed(true);
      setTriviaTask(activeTask);
      return;
    }
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
          contentContainerStyle={[styles.listContent, { paddingHorizontal: sidePadding }]}
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
                    width: cardWidth,
                    marginHorizontal: CARD_GAP / 2,
                    transform: [{ translateY }, { rotate }, { scale }],
                  }}
                >
                  {isOpenSlot(item) ? (
                    <OpenSlot height={Math.round(cardWidth * CARD_ASPECT)} />
                  ) : (
                    <TaskCard
                      task={item}
                      width={cardWidth}
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
          label={isTrivia ? 'Pass' : 'Discard'}
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
          key={triviaTask.id + String(triviaPassed)}
          task={triviaTask}
          passed={triviaPassed}
          fiftyFiftyUses={fiftyFiftyUses}
          eliminatedChoices={triviaEliminatedChoices[triviaTask.id] ?? []}
          onFiftyFifty={() => onFiftyFifty(triviaTask.id)}
          onTriviaAnswer={correct => {
            const task = triviaTask;
            setTriviaTask(null);
            if (triviaPassed) {
              beginExit(task, 'discard', () => onDiscard(task.id));
            } else {
              beginExit(task, correct ? 'complete' : 'discard', () => onTriviaAnswer(task.id, correct));
            }
          }}
          onClose={() => setTriviaTask(null)}
        />
      )}
    </View>
  );
}

const BASE_STYLES = StyleSheet.create({
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
    paddingTop: 12,
    paddingBottom: 18,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },

  // ── Open slot ──
  openSlot: {
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 212, 92, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    marginTop: 10,
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
