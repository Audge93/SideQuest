import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Badge, BadgeTier } from '../types';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TIER_LABELS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];

// Maps badge base id → task category for progress tracking
const BADGE_TO_CATEGORY: Record<string, string> = {
  'sharp-eye': 'observation',
  'shutterbug': 'photo',
  'brain-box': 'trivia',
  'scene-stealer': 'action',
  'thrill-seeker': 'ride',
  'foodie': 'food',
  'pin-pro': 'pin',
  'star-struck': 'character',
  'trailblazer': 'exploration',
  'treasure-hunter': 'scavenger',
};

// Extracts threshold from badge description like "Complete 5 Find tasks"
function getThreshold(badge: Badge): number | null {
  const match = badge.description.match(/^Complete (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Gets the category for a badge id like "sharp-eye-bronze"
function getCategoryForBadge(badgeId: string): string | null {
  for (const [baseId, category] of Object.entries(BADGE_TO_CATEGORY)) {
    if (badgeId.startsWith(baseId)) return category;
  }
  return null;
}

export default function ProfileScreen() {
  const { player, session, updatePlayerName } = useGameStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a name.');
      return;
    }
    updatePlayerName(trimmed);
    setEditingName(false);
  };

  const earnedBadges = player.badges.filter(b => b.earned);

  // Build combined category counts (lifetime + current session)
  const combinedCounts: Record<string, number> = { ...(player.categoryCompletions || {}) };
  if (session) {
    for (const t of session.completedTasks) {
      combinedCounts[t.category] = (combinedCounts[t.category] || 0) + 1;
    }
  }

  // Group badges by tier
  const badgesByTier: Record<BadgeTier, Badge[]> = {
    bronze: [],
    silver: [],
    gold: [],
    platinum: [],
  };
  player.badges.forEach(b => {
    badgesByTier[b.tier].push(b);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Player Card */}
        <View style={styles.playerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{player.name.charAt(0).toUpperCase()}</Text>
          </View>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={20}
                placeholderTextColor={COLORS.textLight}
                selectionColor={COLORS.green}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => { setNameInput(player.name); setEditingName(true); }}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
          <View style={styles.scoresRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{player.lifetimeScore.toLocaleString()}</Text>
              <Text style={styles.scoreLabel}>Lifetime Points</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{earnedBadges.length}</Text>
              <Text style={styles.scoreLabel}>Badges Earned</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{player.visitedParks?.length ?? 0}</Text>
              <Text style={styles.scoreLabel}>Parks Visited</Text>
            </View>
          </View>
        </View>

        {/* Badges by tier */}
        <SectionHeader title="BADGES" />
        {TIER_LABELS.map(tier => {
          const tierBadges = badgesByTier[tier];
          if (tierBadges.length === 0) return null;
          const earnedCount = tierBadges.filter(b => b.earned).length;
          return (
            <View key={tier} style={styles.tierSection}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[tier] }]} />
                <Text style={styles.tierLabel}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Text>
                <Text style={styles.tierCount}>
                  {earnedCount} / {tierBadges.length}
                </Text>
              </View>
              <View style={styles.badgeGrid}>
                {tierBadges.map(badge => (
                  <BadgeTile
                    key={badge.id}
                    badge={badge}
                    tierColor={TIER_COLORS[tier]}
                    categoryCounts={combinedCounts}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeTile({
  badge,
  tierColor,
  categoryCounts,
}: {
  badge: Badge;
  tierColor: string;
  categoryCounts: Record<string, number>;
}) {
  const earned = badge.earned;
  const category = getCategoryForBadge(badge.id);
  const threshold = getThreshold(badge);
  const current = category ? (categoryCounts[category] || 0) : null;
  const showProgress = category && threshold !== null && !earned;
  const progressPct = showProgress ? Math.min((current! / threshold!) * 100, 100) : 0;

  return (
    <View style={[styles.badgeTile, earned ? { borderColor: tierColor } : styles.badgeTileLocked]}>
      <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>{badge.icon}</Text>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>

      {/* Progress counter for category badges */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%`, backgroundColor: tierColor },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {current} / {threshold}
          </Text>
        </View>
      )}

      {/* Earned counter for completed category badges */}
      {earned && category && threshold !== null && (
        <Text style={[styles.progressTextEarned, { color: tierColor }]}>
          ✓ {threshold} / {threshold}
        </Text>
      )}

      {earned && badge.earnedAt && (
        <Text style={styles.badgeDate}>
          {new Date(badge.earnedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 80 },
  pageTitle: {
    color: COLORS.textDark,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 8,
  },
  playerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.chip,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '900',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  playerName: {
    color: COLORS.textDark,
    fontSize: 22,
    fontWeight: '700',
  },
  editIcon: { fontSize: 16 },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 20,
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.green,
    paddingVertical: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreValue: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: '900',
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.borderLight,
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },
  tierSection: {
    marginBottom: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tierLabel: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  tierCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeTile: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.panel,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  badgeTileLocked: {
    borderColor: COLORS.borderPanel,
    borderWidth: 1,
    backgroundColor: COLORS.surfaceSecondary,
  },
  badgeIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  badgeIconLocked: {
    opacity: 0.3,
    fontSize: 30,
  },
  badgeName: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: COLORS.textLight,
  },
  badgeDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  progressTextEarned: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
  badgeDate: {
    color: COLORS.textLight,
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
