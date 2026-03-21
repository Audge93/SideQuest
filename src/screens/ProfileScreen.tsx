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

export default function ProfileScreen() {
  const { player, updatePlayerName } = useGameStore();
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
                  <BadgeTile key={badge.id} badge={badge} tierColor={TIER_COLORS[tier]} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeTile({ badge, tierColor }: { badge: Badge; tierColor: string }) {
  const earned = badge.earned;
  return (
    <View style={[styles.badgeTile, earned ? { borderColor: tierColor } : styles.badgeTileLocked]}>
      <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>{badge.icon}</Text>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
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
  scroll: { padding: 16, paddingBottom: 40 },
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
  badgeDate: {
    color: COLORS.textLight,
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
