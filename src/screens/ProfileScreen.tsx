import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
/**
 * ProfileScreen.tsx — Player profile and badge collection
 *
 * Displays the player avatar, editable name, per-game stats (points, badges,
 * parks visited), and a tiered badge grid with progress bars for unearned
 * badges. Includes game-save deletion with confirmation.
 */

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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { Badge, BadgeTier, SaveSlot } from '../types';
import { COLORS, SHADOWS, RADII } from '../theme/theme';
import { PARKS } from '../data/parks';
import GameButton from '../components/GameButton';
import ReadingModal from '../components/ReadingModal';
import { useReadingPreferences } from '../theme/useAccessibility';
import { badgeProgress, gameBadgeStats, BadgeStats } from '../utils/badges';
import GameIcon, { badgeIconName } from '../components/icons/GameIcon';

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

// Fixed ordering so tiers always render from easiest to hardest.
const TIER_LABELS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export default function ProfileScreen() {
  const { colors: COLORS, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, false, []);

  const navigation = useNavigation<any>();
  const { player, session, saveSlots, activeSlotId, updatePlayerName, renameActiveSlot, deleteSlot } = useGameStore();
  const { scale } = useReadingPreferences();
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [nameError, setNameError] = useState('');
  const [gameNameError, setGameNameError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const [editingGameName, setEditingGameName] = useState(false);
  const [gameNameInput, setGameNameInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeSlot = saveSlots.find(s => s && s.id === activeSlotId) ?? null;

  const handleSaveGameName = () => {
    const trimmed = gameNameInput.trim();
    if (!trimmed) {
      setGameNameError('Enter a game name, or choose Cancel.');
      return;
    }
    renameActiveSlot(trimmed); setGameNameError('');
    setEditingGameName(false);
  };

  // Saves the edited profile name back into global state after basic validation.
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Enter a nickname, or choose Cancel.');
      return;
    }
    updatePlayerName(trimmed); setNameError('');
    setEditingName(false);
  };

  // Show the active slot's badges; fall back to the most recently saved slot,
  // then to an empty state if no games have been played yet.
  const displaySlot: SaveSlot | null = saveSlots.find(s => s && s.id === activeSlotId)
    ?? [...saveSlots]
        .filter((s): s is SaveSlot => s !== null)
        .sort((a, b) => b.lastSavedAt - a.lastSavedAt)[0]
    ?? null;

  const slotBadges = displaySlot?.badges ?? [];
  const earnedBadges = slotBadges.filter(b => b.earned);
  const visitedParks = (displaySlot?.visitedParks ?? []).filter(id => PARKS.some(p => p.id === id));

  const stats = displaySlot ? gameBadgeStats(displaySlot, session) : null;
  // Group slot badges by tier
  const badgesByTier: Record<BadgeTier, Badge[]> = {
    bronze: [],
    silver: [],
    gold: [],
    platinum: [],
  };
  slotBadges.forEach(b => {
    if (filter === 'all' || (filter === 'earned' ? b.earned : !b.earned)) badgesByTier[b.tier].push(b);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header row: back on left, main menu on right when in-game */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
          {session && (
            <TouchableOpacity
              style={styles.returnMenuBtn}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              activeOpacity={0.7}
            >
              <Text style={styles.returnMenuBtnText}>Main Menu</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text accessibilityRole="header" style={styles.pageTitle}>Profile</Text>
        <Text testID="profile-save-context" style={styles.contextText}>{displaySlot ? `Progress for “${displaySlot.name}”. Badges belong to this game save.` : 'Your nickname is shared across games. Start a game to begin collecting badges.'}</Text>

        {/* Current game name — only shown when there is an active session */}
        {session && activeSlot && (
          <View style={styles.playerCard}>
            <Text style={[styles.scoreLabel, { marginBottom: 6 }]}>CURRENT GAME</Text>
            {editingGameName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  testID="profile-game-name-input" accessibilityLabel="Game name" value={gameNameInput} onSubmitEditing={handleSaveGameName}
                  onChangeText={setGameNameInput}
                  autoFocus
                  maxLength={30}
                  placeholderTextColor={COLORS.textLight}
                  selectionColor={COLORS.green}
                />
                <GameButton testID="profile-game-name-save" label="Save Game Name" onPress={handleSaveGameName} />
                <GameButton testID="profile-game-name-cancel" label="Cancel" tone="gray" onPress={() => { setEditingGameName(false); setGameNameError(''); }} />
                {!!gameNameError && <Text accessibilityLiveRegion="polite" style={styles.errorText}>{gameNameError}</Text>}
              </View>
            ) : (
              <TouchableOpacity
                testID="profile-edit-game-name" accessibilityRole="button" accessibilityLabel="Edit game name" style={styles.nameRow}
                onPress={() => { setGameNameInput(activeSlot.name); setEditingGameName(true); }}
              >
                <Text style={styles.playerName}>{activeSlot.name}</Text>
                <GameIcon name="pencil" size={22} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* High-level identity and progression snapshot for the current player. */}
        <View style={styles.playerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{player.name.charAt(0).toUpperCase()}</Text>
          </View>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                testID="profile-name-input" accessibilityLabel="Player nickname" value={nameInput} onSubmitEditing={handleSaveName}
                onChangeText={setNameInput}
                autoFocus
                maxLength={20}
                placeholderTextColor={COLORS.textLight}
                selectionColor={COLORS.green}
              />
              <GameButton testID="profile-name-save" label="Save Nickname" onPress={handleSaveName} />
              <GameButton testID="profile-name-cancel" label="Cancel" tone="gray" onPress={() => { setEditingName(false); setNameError(''); }} />
              {!!nameError && <Text accessibilityLiveRegion="polite" style={styles.errorText}>{nameError}</Text>}
            </View>
          ) : (
            <TouchableOpacity testID="profile-edit-name" accessibilityRole="button" accessibilityLabel="Edit player nickname" style={styles.nameRow} onPress={() => { setNameInput(player.name); setEditingName(true); }}>
              <Text style={styles.playerName}>{player.name}</Text>
              <GameIcon name="pencil" size={22} />
            </TouchableOpacity>
          )}
          <View style={styles.scoresRow}>
            <View style={styles.scoreItem}>
              <Text testID="profile-badges-earned" style={styles.scoreValue}>{earnedBadges.length}</Text>
              <Text style={styles.scoreLabel}>Badges Earned</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text testID="parks-visited" style={styles.scoreValue}>{visitedParks.length}</Text>
              <Text style={styles.scoreLabel}>Parks Visited</Text>
            </View>
          </View>
        </View>

        {stats && <View style={styles.playerCard}>
          <Text testID="profile-score" style={styles.scoreValue}>{stats.score} points</Text>
          <Text testID="profile-completions" style={styles.contextText}>{stats.completions} completed cards · current streak {stats.streak}</Text>
          <Text style={styles.contextText}>Minigames count toward point badges. Category badges and streaks count completed cards.</Text>
          <Text style={styles.contextText}>Parks visited: {visitedParks.map(id => PARKS.find(p => p.id === id)?.name).join(', ') || 'None yet'}. Switching parks in the app counts as a visit.</Text>
        </View>}
        {/* Badge collection grouped by tier so progress is easy to scan. */}
        <SectionHeader title="BADGES" />
        {!!displaySlot && <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Badge filter">
          {(['all', 'earned', 'locked'] as const).map(value => <GameButton key={value} testID={`badge-filter-${value}`} label={value === 'all' ? 'All Badges' : value === 'earned' ? 'Earned' : 'In Progress'} selected={filter === value} tone={filter === value ? 'blue' : 'gray'} onPress={() => setFilter(value)} />)}
        </View>}
        {!!displaySlot && Object.values(badgesByTier).every(list => list.length === 0) && <Text style={styles.noBadgesText}>{filter === 'earned' ? 'No badges earned yet. Choose In Progress to see your next goals.' : 'You have earned every badge in this game!'}</Text>}
        {slotBadges.length === 0 && (
          <Text style={styles.noBadgesText}>Start a game to earn badges!</Text>
        )}
        {TIER_LABELS.map(tier => {
          const tierBadges = badgesByTier[tier];
          if (tierBadges.length === 0) return null;
          const allTierBadges = slotBadges.filter(b => b.tier === tier);
          const earnedCount = allTierBadges.filter(b => b.earned).length;
          return (
            <View key={tier} style={styles.tierSection}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[tier] }]} />
                <Text style={styles.tierLabel}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Text>
                <Text style={styles.tierCount}>
                  {earnedCount} / {allTierBadges.length} earned
                </Text>
              </View>
              <View style={styles.badgeGrid}>
                {tierBadges.map(badge => (
                  <BadgeTile
                    key={badge.id}
                    badge={badge}
                    tierColor={TIER_COLORS[tier]}
                    stats={stats!}
                    badges={slotBadges}
                    wide={scale > 1}
                  />
                ))}
              </View>
            </View>
          );
        })}
        {displaySlot && (
          <TouchableOpacity
            testID="profile-delete-save" accessibilityRole="button" style={styles.resetBtn}
            onPress={() => setShowDeleteConfirm(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.resetBtnText}>Delete Game Save</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showDeleteConfirm && <ReadingModal testID="profile-delete-confirm" title="Delete Game Save?" closeLabel="Cancel" closeTestID="profile-delete-cancel" onClose={() => setShowDeleteConfirm(false)}>
        <Text style={styles.contextText}>“{displaySlot?.name}” and its score, badges, and progress will be permanently deleted. Other saves and your nickname stay on this device. This cannot be undone.</Text>
        <GameButton testID="profile-delete-confirm-btn" label="Yes, Delete This Save" multiline tone="red" onPress={() => {
          if (displaySlot) deleteSlot(displaySlot.id);
          setShowDeleteConfirm(false); navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }} />
      </ReadingModal>}
    </SafeAreaView>
  );
}

function BadgeTile({ badge, tierColor, stats, badges, wide }: { badge: Badge; tierColor: string; stats: BadgeStats; badges: Badge[]; wide: boolean }) {
  const styles = useThemedStyles(BASE_STYLES);
  const { colors } = useAppTheme();
  const { highContrast } = useReadingPreferences();
  const progress = badgeProgress(badge, stats, badges);
  const current = progress ? Math.min(progress.current, progress.goal) : 0;
  const validDate = badge.earnedAt && Number.isFinite(new Date(badge.earnedAt).getTime());
  return <View testID={`badge-${badge.id}`} style={[styles.badgeTile, wide && { width: '100%' }, badge.earned ? { borderColor: tierColor } : styles.badgeTileLocked]}>
    <GameIcon name={badgeIconName(badge.id)} size={38} style={styles.badgeIcon} />
    <Text style={styles.badgeName}>{badge.name}</Text>
    <Text style={styles.badgeDescription}>{badge.description}</Text>
    <Text style={styles.progressText}>{badge.earned ? 'Earned' : 'In progress'}</Text>
    {!badge.earned && progress && <View style={styles.progressContainer}>
      <View accessibilityRole="progressbar" accessibilityLabel={badge.name} accessibilityValue={{ min: 0, max: progress.goal, now: current, text: `${current} of ${progress.goal} ${progress.unit}` }} style={[styles.progressTrack, highContrast && { backgroundColor: colors.surface, borderColor: colors.textDark, borderWidth: 1 }]}>
        <View style={[styles.progressFill, { width: `${current / progress.goal * 100}%`, backgroundColor: highContrast ? colors.textDark : tierColor }]} />
      </View>
      <Text testID={`badge-progress-${badge.id}`} style={styles.progressText}>{current} / {progress.goal} {progress.unit}</Text>
    </View>}
    {!!validDate && <Text style={styles.badgeDate}>Earned {new Date(badge.earnedAt!).toLocaleDateString()}</Text>}
  </View>;
}

function SectionHeader({ title }: { title: string }) {
  const { colors: COLORS, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, false, []);

  // Small reusable heading used between major profile sections.
  return <Text accessibilityRole="header" style={styles.sectionHeader}>{title}</Text>;
}

const BASE_STYLES = StyleSheet.create({
  contextText: { color: COLORS.textBody, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  errorText: { color: COLORS.textDark, fontSize: 15, lineHeight: 22 },
  filters: { gap: 8, marginBottom: 16 },
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  playerName: {
    flexShrink: 1,
    color: COLORS.textDark,
    fontSize: 22,
    fontWeight: '700',
  },
  nameEditRow: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  nameInput: {
    width: '100%',
    minHeight: 48,
    color: COLORS.textDark,
    fontSize: 20,
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.green,
    paddingVertical: 4,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreValue: {
    color: COLORS.textDark,
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
    marginBottom: 6,
  },
  badgeName: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
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
  badgeDate: {
    color: COLORS.textLight,
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  resetBtn: {
    marginTop: 32,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.red,
    backgroundColor: COLORS.surface,
  },
  resetBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: 15,
  },
  noBadgesText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: RADII.button,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.blueDark,
  },
  backBtnText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '800',
  },
  returnMenuBtn: {
    backgroundColor: COLORS.red,
    borderRadius: RADII.button,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#d06060',
  },
  returnMenuBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
