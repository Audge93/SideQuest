import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Task } from '../types';
import { COLORS, SHADOWS, RADII, CATEGORY_COLORS, CATEGORY_ICONS } from '../theme/balatro';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

interface BigTaskBadgeProps {
  task: Task;
  onPress: () => void;
}

function BigTaskBadge({ task, onPress }: BigTaskBadgeProps) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.badge, { borderColor: color, transform: [{ scale: pulseAnim }] }]}>
        <View style={[styles.badgeCircle, { backgroundColor: color }]}>
          <View style={styles.badgeIconInner}>
            <Text style={styles.badgeIcon}>{icon}</Text>
          </View>
        </View>
        <Text style={styles.badgePoints}>{task.points}</Text>
        <Text style={styles.badgePtsLabel}>pts</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface ExpandedBigTaskProps {
  task: Task;
  sessionScore: number;
  onComplete: () => void;
  onSwap: () => void;
  onClose: () => void;
}

function ExpandedBigTask({ task, sessionScore, onComplete, onSwap, onClose }: ExpandedBigTaskProps) {
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const icon = CATEGORY_ICONS[task.category] ?? '';
  const canSwap = sessionScore >= 25;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.expandedCard, { borderColor: color }]} onPress={e => e.stopPropagation()}>
          {/* Banner */}
          <View style={[styles.expandedBanner, { backgroundColor: color }]}>
            <Text style={styles.expandedBannerText}>{task.displayCategory}</Text>
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

            {task.heightRequirement ? (
              <View style={styles.heightBadge}>
                <Text style={styles.heightBadgeText}>Min height: {task.heightRequirement}"</Text>
              </View>
            ) : null}

            <View style={styles.expandedFooterDivider} />
            <Text style={styles.expandedDifficulty}>
              {DIFFICULTY_LABELS[task.difficulty]}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.expandedActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.swapBtn, !canSwap && styles.disabledBtn]}
              onPress={canSwap ? onSwap : () => Alert.alert('Not Enough Points', 'You need at least 25 points to swap a Challenge Task.')}
            >
              <Text style={[styles.swapBtnText, !canSwap && { color: COLORS.textMuted }]}>
                {'\u21BA'}  Swap (-25 pts)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={onComplete}>
              <Text style={styles.completeBtnText}>{'\u2713'}  Complete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{'\u2715'}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface Props {
  tasks: Task[];
  sessionScore: number;
  onComplete: (id: string) => void;
  onSwap: (id: string) => void;
}

export default function BigBoard({ tasks, sessionScore, onComplete, onSwap }: Props) {
  const [expanded, setExpanded] = useState<Task | null>(null);

  const handleComplete = () => {
    if (!expanded) return;
    onComplete(expanded.id);
    setExpanded(null);
  };

  const handleSwap = () => {
    if (!expanded) return;
    onSwap(expanded.id);
    setExpanded(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>CHALLENGE TASKS</Text>
      <View style={styles.row}>
        {tasks.map(task => (
          <BigTaskBadge key={task.id} task={task} onPress={() => setExpanded(task)} />
        ))}
      </View>
      {expanded && (
        <ExpandedBigTask
          task={expanded}
          sessionScore={sessionScore}
          onComplete={handleComplete}
          onSwap={handleSwap}
          onClose={() => setExpanded(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Math.round(16 * sw),
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: Math.round(9 * sw),
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: Math.round(6 * sh),
    marginTop: Math.round(4 * sh),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  // ── Badge (compact) ────────────────────────────────────────
  badge: {
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: Math.round(44 * sw),
    padding: Math.round(3 * sw),
    width: Math.round(78 * sw),
    backgroundColor: COLORS.white,
    ...SHADOWS.chip,
  },
  badgeCircle: {
    width: Math.round(48 * sw),
    height: Math.round(48 * sw),
    borderRadius: Math.round(24 * sw),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Math.round(1 * sh),
  },
  badgeIconInner: {
    width: Math.round(32 * sw),
    height: Math.round(32 * sw),
    borderRadius: Math.round(16 * sw),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: Math.round(18 * sw),
  },
  badgePoints: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: Math.round(11 * sw),
  },
  badgePtsLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(8 * sw),
    fontWeight: '600',
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
    width: 94,
    height: 94,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
  },
  expandedIconInner: {
    width: 66,
    height: 66,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedIconEmoji: {
    fontSize: 36,
  },
  expandedPointsLine: {
    color: COLORS.textBody,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  pointsHighlight: {
    fontWeight: '900',
  },
  expandedDescription: {
    color: COLORS.textDark,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '700',
  },
  heightBadge: {
    backgroundColor: 'rgba(240,216,120,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heightBadgeText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  expandedFooterDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    width: '60%',
    marginTop: 8,
  },
  expandedDifficulty: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Actions ───────────────────────────────────────────────────
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
    backgroundColor: '#78D4A0',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  completeBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  swapBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.button,
  },
  swapBtnText: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.borderLight,
    opacity: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '700',
  },
});
