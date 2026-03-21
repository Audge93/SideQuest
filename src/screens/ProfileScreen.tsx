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
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const THEME_INFO: Record<string, { name: string; color: string; threshold: number }> = {
  fireworks: { name: 'Fireworks', color: '#FF6B9D', threshold: 250 },
  twilight: { name: 'Twilight', color: '#7C6BC4', threshold: 500 },
  'gold-foil': { name: 'Gold Foil', color: '#FFD700', threshold: 1000 },
};

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
  const unearnedBadges = player.badges.filter(b => !b.earned);

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

        {/* Progress to next unlock */}
        <NextUnlockBar lifetimeScore={player.lifetimeScore} unlockedThemes={player.unlockedThemes} />

        {/* Badges */}
        <SectionHeader title="BADGES" />

        {earnedBadges.length > 0 && (
          <>
            <Text style={styles.badgeSubheader}>Earned</Text>
            <View style={styles.badgeGrid}>
              {earnedBadges.map(badge => (
                <BadgeTile key={badge.id} badge={badge} earned />
              ))}
            </View>
          </>
        )}

        {unearnedBadges.length > 0 && (
          <>
            <Text style={styles.badgeSubheader}>Locked</Text>
            <View style={styles.badgeGrid}>
              {unearnedBadges.map(badge => (
                <BadgeTile key={badge.id} badge={badge} earned={false} />
              ))}
            </View>
          </>
        )}

        {/* Unlockable Themes */}
        <SectionHeader title="UNLOCKABLE THEMES" />
        <View style={styles.themesList}>
          {Object.entries(THEME_INFO).map(([id, info]) => {
            const unlocked = player.unlockedThemes.includes(id);
            return (
              <View key={id} style={[styles.themeRow, unlocked && styles.themeRowUnlocked]}>
                <View style={[styles.themeColorDot, { backgroundColor: info.color }]} />
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{info.name}</Text>
                  <Text style={styles.themeThreshold}>{info.threshold.toLocaleString()} lifetime pts</Text>
                </View>
                <Text style={[styles.themeStatus, unlocked && styles.themeStatusUnlocked]}>
                  {unlocked ? '✓ Unlocked' : '🔒'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeTile({ badge, earned }: { badge: any; earned: boolean }) {
  return (
    <View style={[styles.badgeTile, !earned && styles.badgeTileLocked]}>
      <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>{badge.icon}</Text>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function NextUnlockBar({ lifetimeScore, unlockedThemes }: { lifetimeScore: number; unlockedThemes: string[] }) {
  const thresholds = [250, 500, 1000];
  const nextThreshold = thresholds.find(t => lifetimeScore < t);
  if (!nextThreshold) {
    return (
      <View style={styles.unlockBar}>
        <Text style={styles.unlockBarText}>All themes unlocked!</Text>
      </View>
    );
  }
  const progress = Math.min(lifetimeScore / nextThreshold, 1);
  return (
    <View style={styles.unlockBar}>
      <Text style={styles.unlockBarLabel}>Next unlock at {nextThreshold.toLocaleString()} pts</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.unlockBarProgress}>{lifetimeScore} / {nextThreshold}</Text>
    </View>
  );
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
  unlockBar: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.panel,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  unlockBarLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
  unlockBarProgress: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  unlockBarText: {
    color: COLORS.green,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },
  badgeSubheader: {
    color: COLORS.textBody,
    fontSize: 12,
    marginBottom: 10,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  badgeTile: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.panel,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.green,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  badgeTileLocked: {
    borderColor: COLORS.borderPanel,
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
  themesList: {
    gap: 10,
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    gap: 12,
  },
  themeRowUnlocked: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  themeColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeInfo: { flex: 1 },
  themeName: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 14,
  },
  themeThreshold: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  themeStatus: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  themeStatusUnlocked: {
    color: COLORS.green,
  },
});
