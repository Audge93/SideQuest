import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Task } from '../types';
import { COLORS, SHADOWS, RADII, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../theme/balatro';

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
  const icon = CATEGORY_ICONS[task.category] ?? '⭐';
  return (
    <TouchableOpacity style={[styles.badge, { borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.badgeCircle, { backgroundColor: color }]}>
        <View style={styles.badgeIconInner}>
          <Text style={styles.badgeIcon}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.badgePoints}>{task.points}</Text>
      <Text style={styles.badgePtsLabel}>pts</Text>
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
  const icon = CATEGORY_ICONS[task.category] ?? '⭐';
  const canSwap = sessionScore >= 25;
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
              onPress={canSwap ? onSwap : () => Alert.alert('Not Enough Points', 'You need at least 25 points to swap a Big Task.')}
            >
              <Text style={styles.actionBtnText}>↺  Swap (-25 pts)</Text>
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
      <Text style={styles.sectionTitle}>BIG BOARD</Text>
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
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  // ── Badge (compact) ───────────────────────────────────────────
  badge: {
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 50,
    padding: 4,
    width: 90,
    backgroundColor: COLORS.surface,
    ...SHADOWS.chip,
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeIconInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 22,
  },
  badgePoints: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  badgePtsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
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
  pointsHighlight: {
    fontWeight: '900',
  },
  expandedDescription: {
    color: COLORS.textBody,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '700',
  },
  heightBadge: {
    backgroundColor: 'rgba(245,166,35,0.15)',
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
    backgroundColor: COLORS.red,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.redDark,
    ...SHADOWS.button,
  },
  swapBtn: {
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
});
