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

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

function TaskCard({ task, onPress, scale = 1, opacity = 1 }: {
  task: Task; onPress: () => void; scale?: number; opacity?: number;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '⭐';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { borderColor: color, transform: [{ scale }], opacity }]}
    >
      {/* Colored top banner */}
      <View style={[styles.cardBanner, { backgroundColor: color }]}>
        <Text style={styles.cardBannerText}>{CATEGORY_LABELS[task.category]}</Text>
      </View>

      {/* White card body */}
      <View style={styles.cardBody}>
        {/* Icon area */}
        <View style={[styles.iconOuter, { backgroundColor: color }]}>
          <View style={styles.iconInner}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>
        </View>

        {/* Points line */}
        <Text style={styles.pointsLine}>
          Earn <Text style={[styles.pointsHighlight, { color }]}>{task.points} Points</Text>
        </Text>

        {/* Description */}
        <Text style={styles.cardDescription}>{task.description}</Text>
      </View>

      {/* Bottom difficulty label */}
      <View style={styles.cardFooter}>
        <View style={styles.footerDivider} />
        <Text style={styles.difficultyLabel}>{DIFFICULTY_LABELS[task.difficulty]}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ExpandedCardModal({ task, canDiscard, onComplete, onDiscard, onClose }: {
  task: Task; canDiscard: boolean;
  onComplete: () => void; onDiscard: () => void; onClose: () => void;
}) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '⭐';
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.expandedCard, { borderColor: color }]} onPress={e => e.stopPropagation()}>
          {/* Banner */}
          <View style={[styles.expandedBanner, { backgroundColor: color }]}>
            <Text style={styles.expandedBannerText}>{CATEGORY_LABELS[task.category]}</Text>
          </View>

          {/* Body */}
          <View style={styles.expandedBody}>
            <View style={[styles.expandedIconOuter, { backgroundColor: color }]}>
              <View style={styles.expandedIconInner}>
                <Text style={styles.expandedIconEmoji}>{icon}</Text>
              </View>
            </View>

            <Text style={styles.expandedPointsLine}>
              Earn <Text style={[styles.pointsHighlight, { color }]}>{task.points} Points</Text>
            </Text>

            <Text style={styles.expandedDescription}>{task.description}</Text>

            <View style={styles.expandedFooterDivider} />
            <Text style={styles.expandedDifficulty}>{DIFFICULTY_LABELS[task.difficulty]}</Text>
          </View>

          {/* Actions */}
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

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function CardCarousel({ cards, onComplete, onDiscard, discardsRemaining }: {
  cards: Task[]; onComplete: (id: string) => void;
  onDiscard: (id: string) => void; discardsRemaining: number;
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
    backgroundColor: COLORS.cardWhite,
    borderRadius: RADII.card,
    borderWidth: 2,
    overflow: 'hidden',
    minHeight: 240,
    ...SHADOWS.card,
  },
  cardBanner: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardBannerText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconOuter: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconInner: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  pointsLine: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  pointsHighlight: {
    fontWeight: '900',
  },
  cardDescription: {
    color: COLORS.textBody,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  cardFooter: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '80%',
    marginBottom: 8,
  },
  difficultyLabel: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Expanded Modal ────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  expandedCard: {
    width: '92%',
    backgroundColor: COLORS.cardWhite,
    borderRadius: 20,
    borderWidth: 2.5,
    marginBottom: 40,
    overflow: 'hidden',
  },
  expandedBanner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  expandedBannerText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  expandedBody: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  expandedIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedIconInner: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedIconEmoji: {
    fontSize: 36,
  },
  expandedPointsLine: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  expandedDescription: {
    color: COLORS.textBody,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
  },
  expandedFooterDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '60%',
    marginTop: 8,
  },
  expandedDifficulty: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Action Buttons ────────────────────────────────────────────
  expandedActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
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
    backgroundColor: '#666',
    borderBottomColor: '#444',
    opacity: 0.5,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '700',
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
