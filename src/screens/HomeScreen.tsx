import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
/**
 * HomeScreen.tsx — Main landing screen
 *
 * Displays the Side Quest logo, player welcome card, and Start/Continue
 * game buttons. When "New Game" is tapped, a two-page modal walks the
 * player through setup:
 *   Page 1 — Player/team name & Walt Disney World park selection
 *   Page 2 — Pin trading toggle & height filter
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  Modal,
  Dimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';

import { SaveSlot } from '../types';

import NewGameSetup from '../components/NewGameSetup';
import GameButton from '../components/GameButton';
import { useReducedMotion } from '../theme/useAccessibility';
import { FocusHeading } from '../components/ReadingModal';
import GameIcon from '../components/icons/GameIcon';
import { COLORS, FONTS, INK, TABLE } from '../theme/theme';

// ─── Relative time helper ──────────────────────────────────────────────────

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, true, []);

  const navigation = useNavigation<any>();
  const reduced = useReducedMotion();
  const {
    startSession,
    player,
    saveSlots,
    loadSlot,
    deleteSlot,
  } = useGameStore();

  const activeSaves = saveSlots.filter((s): s is SaveSlot => s !== null);
  const allSlotsFull = activeSaves.length >= 3;

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);
  const handleOpenNewGame = () => {
    if (allSlotsFull) {
      setConfirmDeleteSlotId(null);
      setSaveNotice(true);
      setShowContinueModal(true);
      return;
    }
    setSaveNotice(false);
    setShowNewGameModal(true);
  };
  const handleLoadSlot = (slotId: string) => {
    loadSlot(slotId);
    navigation.navigate('Game');
  };

  const handleDeleteSlot = (slotId: string) => {
    deleteSlot(slotId);
    setConfirmDeleteSlotId(null);
    // If no saves left, close the modal
    const remainingSaves = saveSlots.filter((s, idx) => s !== null && s.id !== slotId);
    if (remainingSaves.length === 0) {
      setShowContinueModal(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <ImageBackground
      source={require('../../assets/GameBackgroundImage.jpg')}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Top-right nav icons */}
          <View style={styles.topNav}>
            <TouchableOpacity
              testID="home-profile-btn"
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <GameIcon name="profile" size={28} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="home-settings-btn"
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <GameIcon name="gear" size={28} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoSide}>SIDE</Text>
              <View style={styles.logoDivider}>
                <View style={styles.logoDividerLine} />
                <Text style={styles.logoDividerIcon}>✦</Text>
                <View style={styles.logoDividerLine} />
              </View>
              <Text style={styles.logoQuest}>QUEST</Text>
            </View>
            <Text style={styles.subtitle}>Theme Park Scavenger Hunt</Text>
          </View>

          {/* Player Welcome */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>
              {player.name && player.name !== 'Player Name'
                ? `Welcome back, ${player.name}!`
                : 'Welcome!'}
            </Text>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actions}>
            {activeSaves.length > 0 && (
              <TouchableOpacity
                testID="continue-game-btn"
                accessibilityRole="button"
                style={styles.continueBtn}
                onPress={() => { setSaveNotice(false); setConfirmDeleteSlotId(null); setShowContinueModal(true); }}
              >
                <Text style={styles.continueBtnText}>Continue Game</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              testID="new-game-btn"
              accessibilityRole="button"
              style={styles.startBtn}
              onPress={handleOpenNewGame}
            >
              <Text style={styles.startBtnText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── Continue Game Modal (save slot picker) ── */}
      <Modal
        visible={showContinueModal}
        transparent
        animationType={reduced ? 'none' : 'fade'}
        onRequestClose={() => setShowContinueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            testID="saved-games-panel"
            accessibilityViewIsModal
            style={styles.modalCard}
            contentContainerStyle={styles.modalCardContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FocusHeading title={saveNotice ? 'Saved Games' : 'Continue Game'} />
            <Text style={styles.modalSubtitle}>{saveNotice ? (allSlotsFull ? 'All 3 save slots are full' : 'A save slot is available') : 'Choose a saved game'}</Text>
            {saveNotice && <Text testID="save-slots-full" style={styles.saveNotice}>{allSlotsFull ? 'To start a new game, delete a save you no longer need. Deletion requires confirmation. You can also continue an existing game.' : 'You now have room for a new game. Your remaining saves are still available.'}</Text>}
            <View style={styles.modalDivider} />

            {activeSaves.map((slot, i) => (
              <View key={slot.id}>
                <View style={styles.continueSlotCard}>
                  <Text style={styles.continueSlotName} numberOfLines={1}>{slot.name}</Text>
                  <View style={styles.continueSlotDetails}>
                    <Text style={styles.continueSlotMeta}>
                      Score: {slot.session.sessionScore} pts  •  Tasks: {slot.session.totalCompletions}
                    </Text>
                    <Text style={styles.continueSlotTime}>Last saved: {timeAgo(slot.lastSavedAt)}</Text>
                  </View>

                  {/* Confirm delete inline */}
                  {confirmDeleteSlotId === slot.id ? (
                    <View style={styles.deleteConfirmRow}>
                      <Text style={styles.deleteConfirmText}>Delete this save?</Text>
                      <TouchableOpacity
                        testID={`save-delete-confirm-${i}`}
                        accessibilityRole="button"
                        style={styles.deleteConfirmYes}
                        onPress={() => handleDeleteSlot(slot.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteConfirmYesText}>Yes, Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`save-delete-cancel-${i}`}
                        accessibilityRole="button"
                        style={styles.deleteConfirmNo}
                        onPress={() => setConfirmDeleteSlotId(null)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteConfirmNoText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.slotButtonRow}>
                      <TouchableOpacity
                        testID={`save-select-${i}`}
                        accessibilityRole="button"
                        style={styles.selectSlotBtn}
                        onPress={() => {
                          setShowContinueModal(false);
                          handleLoadSlot(slot.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.selectSlotBtnText}>Select</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`save-delete-${i}`}
                        accessibilityRole="button"
                        style={styles.deleteSlotBtn}
                        onPress={() => setConfirmDeleteSlotId(slot.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteSlotBtnText}>Delete Save File</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {i < activeSaves.length - 1 && <View style={styles.modalDivider} />}
              </View>
            ))}

            <View style={styles.modalActions}>
              {saveNotice && !allSlotsFull && <GameButton testID="save-slots-new-game" label="Create New Game" onPress={() => { setShowContinueModal(false); handleOpenNewGame(); }} />}
              <TouchableOpacity
                testID="saved-games-back"
                accessibilityRole="button"
                style={styles.modalBackBtn}
                onPress={() => setShowContinueModal(false)}
              >
                <Text style={styles.modalBackBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {showNewGameModal && <NewGameSetup onClose={() => setShowNewGameModal(false)} onStart={(gameName, nextSettings, playerName) => {
        if (!startSession(gameName || undefined, { settings: nextSettings, playerName })) return false;
        setShowNewGameModal(false);
        navigation.navigate('Game');
        return true;
      }} />}
    </ImageBackground>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SHORT_SCREEN = SCREEN_H < 720;

const PANEL_BORDER = {
  borderWidth: 3,
  borderBottomWidth: 7,
  borderColor: INK,
};

const chunkyButton = (face: string, edge: string) => ({
  backgroundColor: face,
  borderRadius: 16,
  borderWidth: 2.5,
  borderBottomWidth: 7,
  borderColor: INK,
  borderBottomColor: edge,
  paddingVertical: 14,
  alignItems: 'center' as const,
});

const displayLabel = {
  fontFamily: FONTS.display,
  color: '#FFFFFF',
  fontSize: 22,
  letterSpacing: 0.6,
  textShadowColor: 'rgba(42, 30, 63, 0.55)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 0,
};

const BASE_STYLES = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 80,
  },

  // Logo
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logoSide: {
    fontFamily: FONTS.display,
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: 12,
    textAlign: 'center',
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  logoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -2,
    width: 180,
  },
  logoDividerLine: {
    flex: 1,
    height: 3,
    backgroundColor: TABLE.gold,
    borderRadius: 2,
  },
  logoDividerIcon: {
    fontSize: 20,
    marginHorizontal: 10,
    color: TABLE.gold,
  },
  logoQuest: {
    fontFamily: FONTS.display,
    fontSize: 56,
    color: TABLE.gold,
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: FONTS.display,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    marginTop: 4,
    letterSpacing: 1.5,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },

  // Welcome
  welcomeCard: {
    backgroundColor: TABLE.panel,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    ...PANEL_BORDER,
  },
  welcomeText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
  },
  lifetimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lifetimeLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  lifetimeScore: {
    color: TABLE.gold,
    fontWeight: '800',
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 9, 28, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '100%',
    flexGrow: 0,
    backgroundColor: TABLE.panel,
    borderRadius: 22,
    ...PANEL_BORDER,
  },
  modalCardContent: {
    padding: SHORT_SCREEN ? 16 : 22,
  },
  modalTitle: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  modalSubtitle: {
    fontFamily: FONTS.display,
    color: TABLE.gold,
    fontSize: 14,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  saveNotice: { color: '#FFFFFF', fontSize: 16, lineHeight: 23, marginVertical: 12 },
  modalDivider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
    width: '100%',
  },
  modalActions: {
    marginTop: 20,
    gap: 10,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBackBtn: {
    flex: 1,
    ...chunkyButton('#5B5375', '#3E3756'),
  },
  modalBackBtnText: {
    ...displayLabel,
    fontSize: 20,
  },
  // Actions
  actions: {
    gap: 14,
    marginTop: 8,
  },
  startBtn: {
    ...chunkyButton('#3DBE6E', '#23864A'),
    paddingVertical: 16,
  },
  startBtnText: {
    ...displayLabel,
    fontSize: 26,
  },
  continueBtn: {
    ...chunkyButton('#3B82F6', '#2257B3'),
    paddingVertical: 16,
  },
  continueBtnText: {
    ...displayLabel,
    fontSize: 26,
  },

  // Top nav icons
  topNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  topNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: TABLE.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: INK,
  },

  // Continue Game modal — save slot picker
  continueSlotCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: TABLE.panelLight,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: INK,
    marginTop: 4,
  },
  continueSlotName: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 19,
    marginBottom: 4,
  },
  continueSlotDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  continueSlotMeta: {
    color: TABLE.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  continueSlotTime: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
  slotButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  selectSlotBtn: {
    minHeight: 44,
    justifyContent: 'center',
    ...chunkyButton('#3DBE6E', '#23864A'),
    borderRadius: 12,
    borderBottomWidth: 5,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
  selectSlotBtnText: {
    ...displayLabel,
    fontSize: 16,
  },
  deleteSlotBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(226, 80, 79, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(226, 80, 79, 0.6)',
  },
  deleteSlotBtnText: {
    color: '#FF8A8A',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    minWidth: 100,
  },
  deleteConfirmYes: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E2504F',
    borderWidth: 2,
    borderColor: INK,
  },
  deleteConfirmYesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteConfirmNo: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: TABLE.panelLight,
    borderWidth: 2,
    borderColor: INK,
  },
  deleteConfirmNoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
