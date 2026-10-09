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

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  Alert,
  Switch,
  Modal,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
// CategoryToggles type used indirectly via updateCategoryToggle
import { SaveSlot } from '../types';
import { PARKS } from '../data/parks';
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
  const {
    settings,
    updateSettings,
    updateCategoryToggle,
    updatePlayerName,
    session,
    startSession,
    player,
    saveSlots,
    loadSlot,
    deleteSlot,
  } = useGameStore();

  const activeSaves = saveSlots.filter((s): s is SaveSlot => s !== null);
  const allSlotsFull = activeSaves.length >= 3;

  // ─── Modal state ────────────────────────────────────────────────────────
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);
  const [modalPage, setModalPage] = useState<1 | 2>(1);
  const [gameNameInput, setGameNameInput] = useState('');
  const [nameInput, setNameInput] = useState(player.name);

  const selectedParkId = settings.parkIds?.[0];
  const selectedPark = PARKS.find(p => p.id === selectedParkId);
  const canAdvance = !!selectedPark;

  const animateLayout = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleOpenNewGame = () => {
    if (allSlotsFull) {
      Alert.alert('Save Slots Full', 'Please delete a save to start a new game.');
      return;
    }
    setNameInput(player.name);
    setGameNameInput('');
    setModalPage(1);
    setShowNewGameModal(true);
  };

  const handleModalNext = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a player or team name.');
      return;
    }
    if (!canAdvance) {
      Alert.alert('Select a Park', 'Please pick a park before continuing.');
      return;
    }
    animateLayout();
    setModalPage(2);
  };

  const handleModalBack = () => {
    if (modalPage === 2) {
      animateLayout();
      setModalPage(1);
    } else {
      setShowNewGameModal(false);
    }
  };

  const handleConfirmStart = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a player or team name.');
      return;
    }
    updatePlayerName(trimmedName);
    setShowNewGameModal(false);
    startSession(gameNameInput.trim() || undefined);
    navigation.navigate('Game');
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
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <GameIcon name="profile" size={28} />
            </TouchableOpacity>
            <TouchableOpacity
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
                style={styles.continueBtn}
                onPress={() => setShowContinueModal(true)}
              >
                <Text style={styles.continueBtnText}>Continue Game</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              testID="new-game-btn"
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
        animationType="fade"
        onRequestClose={() => setShowContinueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalCard}
            contentContainerStyle={styles.modalCardContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>Continue Game</Text>
            <Text style={styles.modalSubtitle}>Choose a saved game</Text>
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
                        style={styles.deleteConfirmYes}
                        onPress={() => handleDeleteSlot(slot.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteConfirmYesText}>Yes, Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
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
              <TouchableOpacity
                style={styles.modalBackBtn}
                onPress={() => setShowContinueModal(false)}
              >
                <Text style={styles.modalBackBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── New Game Setup Modal (2 pages) ── */}
      <Modal
        visible={showNewGameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewGameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalCard}
            contentContainerStyle={styles.modalCardContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>New Game</Text>
            <Text style={styles.modalSubtitle}>
              {modalPage === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </Text>

            {/* ── PAGE 1: Name + Park ── */}
            {modalPage === 1 && (
              <View>
                {/* Welcome tooltip */}
                {!SHORT_SCREEN && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    Welcome to Side Quest, the theme park scavenger hunt.
                    You can play solo or co-op. Pick your park and let's go!
                  </Text>
                </View>
                )}

                {/* Player / Team Name */}
                <View style={styles.modalDivider} />
                <Text style={styles.modalFieldLabel}>PLAYER / TEAM NAME</Text>
                <TextInput
                  style={styles.modalNameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name..."
                  placeholderTextColor="rgba(42, 30, 63, 0.4)"
                  maxLength={24}
                  autoCapitalize="words"
                  selectionColor={COLORS.green}
                />

                {/* Game Name */}
                <Text style={styles.modalFieldLabel}>GAME NAME</Text>
                <TextInput
                  style={styles.modalNameInput}
                  value={gameNameInput}
                  onChangeText={setGameNameInput}
                  placeholder={
                    selectedPark
                      ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date().getMonth()]} ${new Date().getDate()} – ${selectedPark.name}`
                      : 'e.g. Magic Kingdom Day…'
                  }
                  placeholderTextColor="rgba(42, 30, 63, 0.4)"
                  maxLength={30}
                  autoCapitalize="words"
                  selectionColor={COLORS.green}
                />

                {/* Park picker — Walt Disney World only for now */}
                <Text style={styles.modalFieldLabel}>WALT DISNEY WORLD PARK</Text>
                <View style={styles.parkGrid}>
                  {PARKS.map(park => {
                    const isSelected = park.id === selectedParkId;
                    return (
                      <TouchableOpacity
                        key={park.id}
                        testID={`park-option-${park.id}`}
                        style={[styles.parkTile, isSelected && styles.parkTileSelected]}
                        onPress={() => updateSettings({ parkIds: [park.id] })}
                        activeOpacity={0.8}
                      >
                        <GameIcon name={park.icon} size={44} />
                        <Text style={[styles.parkTileName, isSelected && styles.parkTileNameSelected]} numberOfLines={2}>
                          {park.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Page 1 Buttons: Back (dismiss) / Next */}
                <View style={styles.modalActions}>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={handleModalBack}>
                      <Text style={styles.modalBackBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="new-game-next-btn"
                      style={[styles.modalNextBtn, !canAdvance && styles.modalBtnDisabled]}
                      onPress={handleModalNext}
                      disabled={!canAdvance}
                    >
                      <Text style={styles.modalNextBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ── PAGE 2: Toggles (Pin Trading + Height Filter) ── */}
            {modalPage === 2 && (
              <View>
                <View style={styles.modalDivider} />

                {/* Pin Trading Toggle */}
                <>
                    <View style={styles.toggleRow}>
                      <GameIcon name="pins" size={34} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Pin Trading Tasks</Text>
                        <Text style={styles.toggleDesc}>Include pin trading challenges</Text>
                      </View>
                      <Switch
                        value={settings.categoryToggles.pins}
                        onValueChange={v => updateCategoryToggle('pins', v)}
                        trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
                        thumbColor="#fff"
                        style={styles.toggleSwitch}
                      />
                    </View>
                    <View style={styles.modalDivider} />
                </>

                {/* Height Filter */}
                <>
                    <View style={styles.toggleRow}>
                      <GameIcon name="ruler" size={34} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Filter by height</Text>
                        <Text style={styles.toggleDesc}>Hides rides above your shortest rider</Text>
                      </View>
                      <Switch
                        value={settings.heightFilterEnabled}
                        onValueChange={v => updateSettings({ heightFilterEnabled: v })}
                        trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
                        thumbColor="#fff"
                        style={styles.toggleSwitch}
                      />
                    </View>

                    {settings.heightFilterEnabled && (
                      <View style={styles.sliderArea}>
                        <View style={styles.heightDisplay}>
                          <Text style={styles.heightValue}>{settings.minHeightInches}"</Text>
                          <Text style={styles.heightFeet}>
                            ({Math.floor(settings.minHeightInches / 12)}'{settings.minHeightInches % 12}")
                          </Text>
                        </View>
                        <Slider
                          style={styles.slider}
                          minimumValue={32}
                          maximumValue={54}
                          step={1}
                          value={settings.minHeightInches}
                          onValueChange={v => updateSettings({ minHeightInches: v })}
                          minimumTrackTintColor={COLORS.green}
                          maximumTrackTintColor={COLORS.borderMedium}
                          thumbTintColor={COLORS.green}
                        />
                        <View style={styles.sliderLabels}>
                          <Text style={styles.sliderLabel}>32"</Text>
                          <Text style={styles.sliderLabel}>54"</Text>
                        </View>
                      </View>
                    )}
                </>

                {/* Page 2 Buttons: Back / Start Game */}
                <View style={styles.modalActions}>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={handleModalBack}>
                      <Text style={styles.modalBackBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="start-game-btn" style={styles.modalStartBtn} onPress={handleConfirmStart}>
                      <Text style={styles.modalStartBtnText}>Start Game</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    fontSize: 46,
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
  parkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  parkTile: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SHORT_SCREEN ? 8 : 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: INK,
    backgroundColor: TABLE.panelLight,
  },
  parkTileSelected: {
    borderColor: TABLE.gold,
    backgroundColor: '#FFF8EC',
  },
  parkTileName: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  parkTileNameSelected: {
    color: INK,
  },
  modalFieldLabel: {
    fontFamily: FONTS.display,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    letterSpacing: 1.5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  modalNameInput: {
    width: '100%',
    backgroundColor: '#FFF8EC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: '800',
    color: INK,
    borderWidth: 2.5,
    borderColor: INK,
    marginBottom: 16,
  },
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
  modalNextBtn: {
    flex: 1.4,
    ...chunkyButton('#3DBE6E', '#23864A'),
  },
  modalNextBtnText: {
    ...displayLabel,
    fontSize: 20,
  },
  modalStartBtn: {
    flex: 1.4,
    ...chunkyButton('#3DBE6E', '#23864A'),
  },
  modalStartBtnText: {
    ...displayLabel,
    fontSize: 20,
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 17,
  },
  toggleDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  toggleSwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },

  // Height slider
  sliderArea: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  heightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 6,
  },
  heightValue: {
    fontFamily: FONTS.display,
    color: TABLE.gold,
    fontSize: 32,
  },
  heightFeet: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '700',
  },

  // Tooltip
  tooltip: {
    flexDirection: 'row',
    backgroundColor: TABLE.panelLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 2,
    borderColor: INK,
    alignItems: 'flex-start',
  },
  tooltipText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
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
    gap: 10,
    marginTop: 4,
  },
  selectSlotBtn: {
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
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  deleteConfirmYes: {
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
