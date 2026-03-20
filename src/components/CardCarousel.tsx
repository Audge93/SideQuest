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
import { COLORS, SHADOWS, RADII, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../theme/balatro';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.62;
const CARD_PEEK = (width - CARD_WIDTH) / 2 - 8;

// Card colors: category color header (set inline), blue body
const CARD_BODY_BG = '#3B5998';
const CARD_BORDER = '#111111';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Common',
  medium: 'Uncommon',
  hard: 'Rare',
};

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

// Halftone dot decoration for retro texture
function HalftoneDots({ side }: { side: 'left' | 'right' }) {
  const dots = [];
  const rows = 5;
  const cols = 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const opacity = 0.12 - (c * 0.03) - (r * 0.015);
      const size = 4 - c * 0.5;
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `rgba(255,255,255,${Math.max(opacity, 0.02)})`,
            top: 60 + r * 12,
            [side]: 6 + c * 10,
          }}
        />
      );
    }
  }
  return <>{dots}</>;
}

function TaskCard({ task, onPress, scale = 1, opacity = 1 }: {
  task: Task; onPress: () => void; scale?: number; opacity?: number;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '⭐';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { transform: [{ scale }], opacity }]}
    >
      {/* Halftone texture dots */}
      <HalftoneDots side="left" />
      <HalftoneDots side="right" />

      {/* Category-colored header zone */}
      <View style={[styles.cardHeader, { backgroundColor: color }]}>
        <Text style={styles.cardHeaderText}>{CATEGORY_LABELS[task.category]}</Text>
      </View>

      {/* Subtle divider between header and body */}
      <View style={styles.headerBodyDivider} />

      {/* Lighter body zone */}
      <View style={styles.cardBody}>
        {/* Elevated icon tile */}
        <View style={[styles.iconOuter, { backgroundColor: color }]}>
          <View style={styles.iconInner}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>
        </View>

        {/* Points line — medium weight, accent color for key terms */}
        <Text style={styles.pointsLine}>
          Earn <Text style={[styles.pointsAccent, { color }]}>{task.points} Points</Text>
        </Text>

        {/* Main description — bold, prominent */}
        <Text style={styles.cardDescription}>{task.description}</Text>

        {/* Flavor/helper text — smaller, lighter */}
        <Text style={styles.cardFlavor}>
          {task.category === 'trivia' ? 'Tap to answer the question' :
           task.category === 'photo' ? 'Take the photo to complete' :
           task.category === 'observation' ? 'Spot it to earn points' :
           'Complete this task to earn points'}
        </Text>
      </View>

      {/* Bottom rarity/difficulty bookend — bold, grounding */}
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
  const icon = CATEGORY_ICONS[task.category] ?? '⭐';
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
        <Pressable style={styles.expandedCard} onPress={e => e.stopPropagation()}>
          {/* Halftone texture */}
          <HalftoneDots side="left" />
          <HalftoneDots side="right" />

          {/* Category-colored header */}
          <View style={[styles.expandedHeader, { backgroundColor: color }]}>
            <Text style={styles.expandedHeaderText}>{CATEGORY_LABELS[task.category]}</Text>
          </View>

          <View style={styles.headerBodyDivider} />

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
                  {selectedChoice === task.triviaAnswer ? '✓ Correct! +' + task.points + ' pts' : '✕ Wrong answer!'}
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
                <Text style={styles.actionBtnText}>{canDiscard ? '✕  Discard' : 'No Discards Left'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={onComplete}>
                <Text style={styles.actionBtnText}>✓  Complete</Text>
              </TouchableOpacity>
            </View>
          )}

          {!answered && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
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
  // Solid black border, rounded corners, contained feel
  card: {
    backgroundColor: CARD_BODY_BG,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    minHeight: 290,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 8,
  },

  // Header zone — colored per category (bg set inline)
  cardHeader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Visible divider between header and body zones
  headerBodyDivider: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // Lighter body zone
  cardBody: {
    flex: 1,
    padding: 16,
    paddingTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  // Icon — rounded-square with thick black border + drop shadow (elevated tile)
  iconOuter: {
    width: 78,
    height: 78,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 3,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 1,
    elevation: 6,
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

  // Points — medium weight, accent color for key terms
  pointsLine: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '500',
  },
  pointsAccent: {
    fontWeight: '900',
  },

  // Main description — bold, prominent
  cardDescription: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '800',
  },

  // Flavor text — smaller, lighter weight
  cardFlavor: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '400',
    marginTop: 2,
    paddingHorizontal: 8,
  },

  // Bottom rarity/difficulty — bold bookend, grounding element
  cardFooter: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.3)',
  },
  difficultyLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // ── Expanded Modal ────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  expandedCard: {
    width: '92%',
    backgroundColor: CARD_BODY_BG,
    borderRadius: 20,
    borderWidth: 3.5,
    borderColor: CARD_BORDER,
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
    fontSize: 20,
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
    borderWidth: 3.5,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 8,
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
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
  },
  expandedDescription: {
    color: COLORS.white,
    fontSize: 19,
    lineHeight: 27,
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 2,
  },
  expandedFlavor: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '400',
    paddingHorizontal: 12,
    marginTop: 4,
  },

  // Rarity bookend at bottom of card body
  expandedRarity: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.3)',
  },
  expandedRarityText: {
    color: 'rgba(255,255,255,0.85)',
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
    borderWidth: 2,
    borderColor: CARD_BORDER,
  },
  completeBtn: {
    backgroundColor: COLORS.red,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.redDark,
    ...SHADOWS.button,
  },
  discardBtn: {
    backgroundColor: COLORS.blue,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.blueDark,
    ...SHADOWS.button,
  },
  disabledBtn: {
    backgroundColor: '#555',
    borderBottomColor: '#333',
    opacity: 0.5,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: RADII.button,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
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
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  triviaChoiceLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  triviaChoiceLetterAnswered: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  triviaChoiceLetterText: {
    color: COLORS.white,
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
    color: '#4ADE80',
  },
  triviaResultWrong: {
    color: '#FCA5A5',
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
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: COLORS.red,
    width: 18,
  },
});
