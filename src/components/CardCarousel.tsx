import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { Task } from '../types';
import { COLORS, SHADOWS, RADII, CATEGORY_COLORS, CATEGORY_ICONS } from '../theme/balatro';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.62;
const CARD_PEEK = (width - CARD_WIDTH) / 2 - 8;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Common',
  medium: 'Uncommon',
  hard: 'Rare',
};

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

function TaskCard({ task, onPress, scale = 1, opacity = 1 }: {
  task: Task; onPress: () => void; scale?: number; opacity?: number;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { borderColor: color, transform: [{ scale }], opacity }]}
    >
      {/* Category-colored header zone */}
      <View style={[styles.cardHeader, { backgroundColor: color }]}>
        <Text style={styles.cardHeaderText}>{task.displayCategory}</Text>
      </View>

      {/* Body zone */}
      <View style={styles.cardBody}>
        {/* Elevated icon tile */}
        <View style={[styles.iconOuter, { backgroundColor: color }]}>
          <View style={styles.iconInner}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>
        </View>

        {/* Points line */}
        <Text style={styles.pointsLine}>
          Earn <Text style={[styles.pointsAccent, { color }]}>{task.points} Points</Text>
        </Text>

        {/* Main description */}
        <Text style={styles.cardDescription}>{task.description}</Text>

        {/* Flavor/helper text */}
        <Text style={styles.cardFlavor}>
          {task.category === 'trivia' ? 'Tap to answer the question' :
           task.category === 'photo' ? 'Take the photo to complete' :
           task.category === 'observation' ? 'Spot it to earn points' :
           'Complete this task to earn points'}
        </Text>
      </View>

      {/* Bottom rarity/difficulty bookend */}
      <View style={styles.cardFooter}>
        <Text style={styles.difficultyLabel}>{DIFFICULTY_LABELS[task.difficulty]}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ExpandedCardModal({ task, canDiscard, onComplete, onDiscard, onTriviaAnswer, onClose }: {
  task: Task; canDiscard: boolean;
  onComplete: () => void; onDiscard: () => void;
  onTriviaAnswer: (correct: boolean) => void; onClose: () => void;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '';
  const isTrivia = task.category === 'trivia' && task.triviaChoices && task.triviaAnswer != null;
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleChoicePress = (index: number) => {
    if (answered) return;
    setSelectedChoice(index);
    setAnswered(true);
    const correct = index === task.triviaAnswer;
    setTimeout(() => {
      onTriviaAnswer(correct);
    }, 1200);
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={answered ? undefined : onClose}>
        <Pressable style={[styles.expandedCard, { borderColor: color }]} onPress={e => e.stopPropagation()}>
          {/* Category-colored header */}
          <View style={[styles.expandedHeader, { backgroundColor: color }]}>
            <Text style={styles.expandedHeaderText}>{task.displayCategory}</Text>
          </View>

          {/* Body */}
          <View style={styles.expandedBody}>
            <View style={[styles.expandedIconOuter, { backgroundColor: color }]}>
              <View style={styles.expandedIconInner}>
                <Text style={styles.expandedIconEmoji}>{icon}</Text>
              </View>
            </View>

            <Text style={styles.expandedPointsLine}>
              Earn <Text style={[styles.pointsAccent, { color }]}>{task.points} Points</Text>
            </Text>

            <Text style={styles.expandedDescription}>{task.description}</Text>

            <Text style={styles.expandedFlavor}>
              {task.category === 'trivia' ? 'Choose the correct answer below' :
               task.category === 'photo' ? 'Take the photo to complete this challenge' :
               task.category === 'observation' ? 'Look around you to spot it' :
               'Complete this task to earn your points'}
            </Text>
          </View>

          {/* Rarity bookend */}
          <View style={styles.expandedRarity}>
            <Text style={styles.expandedRarityText}>{DIFFICULTY_LABELS[task.difficulty]}</Text>
          </View>

          {isTrivia ? (
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
                <Text style={[styles.triviaResultText, selectedChoice === task.triviaAnswer ? styles.triviaResultCorrect : styles.triviaResultWrong]}>
                  {selectedChoice === task.triviaAnswer ? '\u2713 Correct! +' + task.points + ' pts' : '\u2715 Wrong answer!'}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.expandedActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.discardBtn, !canDiscard && styles.disabledBtn]}
                onPress={canDiscard
                  ? onDiscard
                  : () => Alert.alert('No Discards Remaining', 'Complete a task to restore your discards!')}
              >
                <Text style={[styles.discardBtnText, !canDiscard && { color: COLORS.textMuted }]}>
                  {canDiscard ? '\u2715  Discard' : 'No Discards Left'}
                </Text>
                {canDiscard && <Text style={styles.discardNote}>resets streak</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={onComplete}>
                <Text style={styles.completeBtnText}>{'\u2713'}  Complete</Text>
              </TouchableOpacity>
            </View>
          )}

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

export default function CardCarousel({ cards, onComplete, onDiscard, onTriviaAnswer, discardsRemaining }: {
  cards: Task[]; onComplete: (id: string) => void;
  onDiscard: (id: string) => void; discardsRemaining: number;
  onTriviaAnswer?: (id: string, correct: boolean) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState<Task | null>(null);
  const flatListRef = useRef<FlatList>(null);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={cards}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: CARD_PEEK }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
          setActiveIndex(Math.max(0, Math.min(idx, cards.length - 1)));
        }}
        renderItem={({ item, index }) => {
          const distance = Math.abs(index - activeIndex);
          return (
            <View style={{ width: CARD_WIDTH, marginHorizontal: 8 }}>
              <TaskCard
                task={item}
                onPress={() => { setActiveIndex(index); setExpanded(item); }}
                scale={distance === 0 ? 1 : 0.88}
                opacity={distance === 0 ? 1 : 0.6}
              />
            </View>
          );
        }}
      />
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      {expanded && (
        <ExpandedCardModal
          task={expanded}
          canDiscard={discardsRemaining > 0}
          onComplete={() => { onComplete(expanded.id); setExpanded(null); }}
          onDiscard={() => { onDiscard(expanded.id); setExpanded(null); }}
          onTriviaAnswer={(correct) => {
            if (onTriviaAnswer) {
              onTriviaAnswer(expanded.id, correct);
            } else {
              if (correct) onComplete(expanded.id);
              else onDiscard(expanded.id);
            }
            setExpanded(null);
          }}
          onClose={() => setExpanded(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  // ── Compact Card ──────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.card,
    borderWidth: 2,
    overflow: 'hidden',
    minHeight: 290,
    ...SHADOWS.card,
  },

  // Header zone — colored per category (bg set inline)
  cardHeader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Body zone — cream background with dark text
  cardBody: {
    flex: 1,
    padding: 16,
    paddingTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  // Icon — rounded-square with category color bg
  iconOuter: {
    width: 78,
    height: 78,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.button,
  },
  iconInner: {
    width: 54,
    height: 54,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 30,
  },

  // Points — dark text with category-colored accent
  pointsLine: {
    color: COLORS.textBody,
    fontSize: 14,
    fontWeight: '500',
  },
  pointsAccent: {
    fontWeight: '900',
  },

  // Main description — bold, dark text
  cardDescription: {
    color: COLORS.textDark,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '800',
  },

  // Flavor text — italic, lighter gray
  cardFlavor: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 2,
    paddingHorizontal: 8,
  },

  // Bottom rarity/difficulty
  cardFooter: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  difficultyLabel: {
    color: COLORS.textBody,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // ── Expanded Modal ────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  expandedCard: {
    width: '92%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.card,
    borderWidth: 2,
    marginBottom: 40,
    overflow: 'hidden',
  },
  expandedHeader: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  expandedHeaderText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  expandedBody: {
    padding: 24,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  expandedIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.button,
  },
  expandedIconInner: {
    width: 70,
    height: 70,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedIconEmoji: {
    fontSize: 40,
  },
  expandedPointsLine: {
    color: COLORS.textBody,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
  },
  expandedDescription: {
    color: COLORS.textDark,
    fontSize: 19,
    lineHeight: 27,
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 2,
  },
  expandedFlavor: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
    paddingHorizontal: 12,
    marginTop: 4,
  },

  // Rarity bookend at bottom of card body
  expandedRarity: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  expandedRarityText: {
    color: COLORS.textBody,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // ── Action Buttons ────────────────────────────────────────────
  expandedActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
  },
  completeBtn: {
    backgroundColor: '#78D4A0',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  completeBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  discardBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.button,
  },
  discardBtnText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: 15,
  },
  discardNote: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  disabledBtn: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.borderLight,
    opacity: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
    fontWeight: '900',
  },

  // ── Trivia Multiple Choice ────────────────────────────────────
  triviaChoicesContainer: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  triviaChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADII.button,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    gap: 12,
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
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  triviaChoiceLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 13,
  },
  triviaResultText: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  triviaResultCorrect: {
    color: '#16A34A',
  },
  triviaResultWrong: {
    color: COLORS.redDark,
  },

  // ── Dot Indicators ────────────────────────────────────────────
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderMedium,
  },
  dotActive: {
    backgroundColor: COLORS.green,
    width: 18,
  },
});
