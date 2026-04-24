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
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { Task } from '../types';
import { COLORS, SHADOWS, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ICON_IMAGES } from '../theme/theme';

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

// ── Animated task card with pop/complete effects ─────────────
function TaskCard({
  task,
  canDiscard,
  onComplete,
  onDiscard,
  onTriviaPress,
}: {
  task: Task;
  canDiscard: boolean;
  onComplete: () => void;
  onDiscard: () => void;
  onTriviaPress: () => void;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '';
  const isTrivia = task.category === 'trivia' && task.triviaChoices && task.triviaAnswer != null;

  // Animation values
  const popAnim = useRef(new Animated.Value(1)).current;
  const completeAnim = useRef(new Animated.Value(1)).current;

  const flavorText =
    task.flavorText ??
    (task.category === 'trivia'
      ? ''
      : task.category === 'photo'
      ? 'Take the photo to complete'
      : task.category === 'find'
      ? 'Spot it to earn points'
      : 'Complete this task to earn points');

  // Pop the card away before notifying the parent so the replacement feels
  // physically tied to the discard action.
  const handleDiscard = () => {
    // Pop animation: scale up then shrink to 0
    Animated.sequence([
      Animated.timing(popAnim, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(popAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      popAnim.setValue(1);
      onDiscard();
    });
  };

  // Quick celebratory pulse before the card disappears from the hand.
  const handleComplete = () => {
    // Celebrate: pulse up then settle
    Animated.sequence([
      Animated.timing(completeAnim, {
        toValue: 1.08,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(completeAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(completeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      completeAnim.setValue(1);
      popAnim.setValue(1);
      onComplete();
    });
  };

  const animatedScale = Animated.multiply(popAnim, completeAnim);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: color,
          transform: [{ scale: animatedScale }],
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
            <View style={styles.iconInner}>
              <Image source={CATEGORY_ICON_IMAGES[task.category]} style={styles.iconImage} resizeMode="contain" />
            </View>
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
            onPress={onTriviaPress}
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
              <View style={styles.modalIconInner}>
                <Image source={CATEGORY_ICON_IMAGES[task.category]} style={styles.modalIconImage} resizeMode="contain" />
              </View>
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

// ── Main Carousel ────────────────────────────────────────────
export default function CardCarousel({
  cards,
  onComplete,
  onDiscard,
  onTriviaAnswer,
  discardsRemaining,
}: {
  cards: Task[];
  onComplete: (id: string) => void;
  onDiscard: (id: string) => void;
  discardsRemaining: number;
  onTriviaAnswer?: (id: string, correct: boolean) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [triviaTask, setTriviaTask] = useState<Task | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cards.length === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > cards.length - 1) {
      const nextIndex = cards.length - 1;
      setActiveIndex(nextIndex);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * SNAP_INTERVAL,
          animated: false,
        });
      });
    }
  }, [activeIndex, cards.length]);

  // Track active card on every scroll frame (auto-select centered card)
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / SNAP_INTERVAL);
      const clamped = Math.max(0, Math.min(idx, cards.length - 1));
      if (clamped !== activeIndex) setActiveIndex(clamped);
    },
    [activeIndex, cards.length]
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={cards}
        keyExtractor={(item: Task) => item.id}
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
        renderItem={({ item, index }: { item: Task; index: number }) => {
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
              <TaskCard
                task={item}
                canDiscard={discardsRemaining > 0}
                onComplete={() => onComplete(item.id)}
                onDiscard={() => onDiscard(item.id)}
                onTriviaPress={() => setTriviaTask(item)}
              />
            </Animated.View>
          );
        }}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Trivia modal */}
      {triviaTask && (
        <TriviaModal
          task={triviaTask}
          onTriviaAnswer={(correct) => {
            if (onTriviaAnswer) {
              onTriviaAnswer(triviaTask.id, correct);
            } else {
              if (correct) onComplete(triviaTask.id);
              else onDiscard(triviaTask.id);
            }
            setTriviaTask(null);
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
    width: Math.round(38 * sw),
    height: Math.round(38 * sw),
    borderRadius: Math.round(10 * sw),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    ...SHADOWS.chip,
  },
  iconInner: {
    width: Math.round(27 * sw),
    height: Math.round(27 * sw),
    borderRadius: Math.round(7 * sw),
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: Math.round(24 * sw),
    height: Math.round(24 * sw),
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
    width: Math.round(64 * sw),
    height: Math.round(64 * sw),
    borderRadius: Math.round(14 * sw),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    ...SHADOWS.button,
  },
  modalIconInner: {
    width: Math.round(44 * sw),
    height: Math.round(44 * sw),
    borderRadius: Math.round(10 * sw),
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconImage: {
    width: Math.round(41 * sw),
    height: Math.round(41 * sw),
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
  dotActive: {
    backgroundColor: COLORS.green,
    width: Math.round(16 * sw),
  },
});
