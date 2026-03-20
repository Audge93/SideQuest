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

const CARD_BACK_INFO: Record<string, { name: string; color: string; threshold: number }> = {
  fireworks: { name: 'Fireworks', color: '#FF6B9D', threshold: 250 },
  retro: { name: 'Retro Poster', color: '#E8A84A', threshold: 500 },
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
      <StatusBar barStyle="light-content" />
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
                placeholderTextColor="rgba(255,255,255,0.3)"
                selectionColor={COLORS.gold}
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
              <Text style={styles.scoreValue}>{player.unlockedThemes.length}</Text>
              <Text style={styles.scoreLabel}>Themes</Text>
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
          {Object.entries(CARD_BACK_INFO).map(([id, info]) => {
            const unlocked = player.unlockedThemes.includes(id);
            return (
              <View key={id} style={[styles.themeRow, unlocked && styles.themeRowUnlocked]}>
                <View style={[styles.themeColorDot, { backgroundColor: info.color }]} />
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{info.name}</Text>
                  <Text style={styles.themeThreshold}>{info.threshold.toLocaleString()} lifetime pts</Text>
                </View>
                <Text style={styles.themeStatus}>{unlocked ? '✓ Unlocked' : '🔒'}</Text>
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
        <Text style={styles.unlockBarText}>🎉 All themes unlocked!</Text>
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
  safe: { flex: 1, backgroundColor: COLORS.felt },
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: {
    color: COLORS.white,
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
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.redDark,
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
    color: COLORS.white,
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
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    paddingVertical: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.red,
    borderRadius: RADII.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.redDark,
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
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '900',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.45)',
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
  },
  unlockBarLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.feltDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  unlockBarProgress: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  unlockBarText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },
  badgeSubheader: {
    color: 'rgba(255,255,255,0.5)',
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
    borderColor: 'rgba(245,166,35,0.4)',
    alignItems: 'center',
  },
  badgeTileLocked: {
    borderColor: COLORS.borderPanel,
    backgroundColor: COLORS.feltDark,
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
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  badgeDescription: {
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: COLORS.feltDark,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    gap: 12,
  },
  themeRowUnlocked: {
    borderColor: 'rgba(245,166,35,0.4)',
    backgroundColor: COLORS.surface,
  },
  themeColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeInfo: { flex: 1 },
  themeName: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  themeThreshold: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  themeStatus: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});
