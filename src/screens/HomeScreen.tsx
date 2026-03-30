/**
 * HomeScreen.tsx — Main landing screen
 *
 * Displays the Side Quest logo, player welcome card, and Start/Continue
 * game buttons. When "New Game" is tapped, a two-page modal walks the
 * player through setup:
 *   Page 1 — Player/team name, resort & park selection
 *   Page 2 — Pin trading toggle (Disney parks only) & height filter
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { COLORS, SHADOWS, RADII } from '../theme/theme';

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

// ─── Resort → Park mapping ──────────────────────────────────────────────────

interface Resort {
  id: string;
  label: string;
  icon: string;
  parkIds: string[];
}

const RESORTS: Resort[] = [
  { id: 'wdw', label: 'Walt Disney World', icon: '🏰', parkIds: ['wdw-mk', 'wdw-hs', 'wdw-ep', 'wdw-ak'] },
  { id: 'dl', label: 'Disneyland Resort', icon: '🎠', parkIds: ['dl-dl', 'dl-dca'] },
  { id: 'uor', label: 'Universal Orlando', icon: '🌍', parkIds: ['uor-us', 'uor-ioa', 'uor-eu'] },
  { id: 'ush', label: 'Universal Hollywood', icon: '🎬', parkIds: ['ush-us'] },
  { id: 'custom', label: 'Any Park', icon: '🎪', parkIds: ['custom'] },
];

// Disney resort IDs — used to conditionally show pin trading toggle
const DISNEY_RESORT_IDS = ['wdw', 'dl'];

// ─── Component ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
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
  const [nameInput, setNameInput] = useState(player.name);

  // ─── Resort / park selection (now lives inside the modal) ───────────────
  const selectedParkId = settings.parkIds?.[0];
  const currentResort = RESORTS.find(r => r.parkIds.includes(selectedParkId || ''));
  const [selectedResortId, setSelectedResortId] = useState<string | null>(currentResort?.id ?? null);

  // When resort changes, auto-select if only one park
  useEffect(() => {
    if (selectedResortId) {
      const resort = RESORTS.find(r => r.id === selectedResortId);
      if (resort && resort.parkIds.length === 1) {
        updateSettings({ parkIds: [resort.parkIds[0]] });
      }
    }
  }, [selectedResortId]);

  const selectedResort = RESORTS.find(r => r.id === selectedResortId);
  const selectedPark = PARKS.find(p => p.id === selectedParkId);
  const parkIsInResort = selectedResort?.parkIds.includes(selectedParkId || '');

  const [resortDropdownOpen, setResortDropdownOpen] = useState(false);
  const [parkDropdownOpen, setParkDropdownOpen] = useState(false);

  const animateLayout = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  // Derived helpers
  const isDisneyResort = DISNEY_RESORT_IDS.includes(selectedResortId || '');
  const canAdvance = !!selectedParkId && !!parkIsInResort;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSelectResort = (resortId: string) => {
    animateLayout();
    setSelectedResortId(resortId);
    setResortDropdownOpen(false);
    // Clear park selection if switching resort
    const resort = RESORTS.find(r => r.id === resortId);
    if (resort && !resort.parkIds.includes(selectedParkId || '')) {
      if (resort.parkIds.length === 1) {
        updateSettings({ parkIds: [resort.parkIds[0]] });
      } else {
        updateSettings({ parkIds: [] });
        // Auto-open park dropdown for multi-park resorts
        setTimeout(() => {
          animateLayout();
          setParkDropdownOpen(true);
        }, 300);
      }
    }
  };

  const handleSelectPark = (parkId: string) => {
    animateLayout();
    updateSettings({ parkIds: [parkId] });
    setParkDropdownOpen(false);
  };

  const handleOpenNewGame = () => {
    if (allSlotsFull) {
      Alert.alert('Save Slots Full', 'Please delete a save to start a new game.');
      return;
    }
    setNameInput(player.name);
    setModalPage(1);
    setResortDropdownOpen(false);
    setParkDropdownOpen(false);
    setShowNewGameModal(true);
  };

  const handleModalNext = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a player or team name.');
      return;
    }
    if (!canAdvance) {
      Alert.alert('Select a Park', 'Please pick a resort and park before continuing.');
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
    startSession();
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
      source={require('../../assets/GameBackgroundImage.png')}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Top-right nav icons */}
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.topNavIcon}>{'\u{1F464}'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <Text style={styles.topNavIcon}>{'\u2699\uFE0F'}</Text>
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
            <View style={styles.lifetimeRow}>
              <Text style={styles.lifetimeLabel}>Lifetime Score</Text>
              <Text style={styles.lifetimeScore}>{player.lifetimeScore.toLocaleString()} pts</Text>
            </View>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actions}>
            {activeSaves.length > 0 && (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => setShowContinueModal(true)}
              >
                <Text style={styles.continueBtnText}>Continue Game</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
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
          <View style={styles.modalCard}>
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
          </View>
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
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Game</Text>
            <Text style={styles.modalSubtitle}>
              {modalPage === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </Text>

            {/* ── PAGE 1: Name + Resort/Park ── */}
            {modalPage === 1 && (
              <View>
                {/* Welcome tooltip */}
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    Welcome to Side Quest, the theme park scavenger hunt.
                    You can play solo or co-op. Pick your park and let's go!
                  </Text>
                </View>

                {/* Player / Team Name */}
                <View style={styles.modalDivider} />
                <Text style={styles.modalFieldLabel}>PLAYER / TEAM NAME</Text>
                <TextInput
                  style={styles.modalNameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name..."
                  placeholderTextColor={COLORS.textLight}
                  maxLength={24}
                  autoCapitalize="words"
                  selectionColor={COLORS.green}
                />

                {/* Resort Dropdown */}
                <View style={styles.modalDivider} />
                <Text style={styles.modalFieldLabel}>RESORT</Text>
                <TouchableOpacity
                  style={styles.modalDropdown}
                  onPress={() => { animateLayout(); setResortDropdownOpen(v => !v); setParkDropdownOpen(false); }}
                  activeOpacity={0.7}
                >
                  {selectedResort ? (
                    <View style={styles.dropdownSelected}>
                      <Text style={styles.dropdownSelectedIcon}>{selectedResort.icon}</Text>
                      <Text style={styles.modalDropdownText}>{selectedResort.label}</Text>
                    </View>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Choose a resort...</Text>
                  )}
                  <Text style={styles.dropdownArrow}>{resortDropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {resortDropdownOpen && (
                  <View style={styles.modalDropdownList}>
                    {RESORTS.map((resort, i) => {
                      const isSelected = selectedResortId === resort.id;
                      return (
                        <TouchableOpacity
                          key={resort.id}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                            i < RESORTS.length - 1 && styles.dropdownItemBorder,
                          ]}
                          onPress={() => handleSelectResort(resort.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownItemIcon}>{resort.icon}</Text>
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                            {resort.label}
                          </Text>
                          {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Park Dropdown (only if resort has multiple parks) */}
                {selectedResort && selectedResort.parkIds.length > 1 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.modalFieldLabel}>PARK</Text>
                    <TouchableOpacity
                      style={styles.modalDropdown}
                      onPress={() => { animateLayout(); setParkDropdownOpen(v => !v); setResortDropdownOpen(false); }}
                      activeOpacity={0.7}
                    >
                      {selectedPark && parkIsInResort ? (
                        <Text style={styles.modalDropdownText}>{selectedPark.name}</Text>
                      ) : (
                        <Text style={styles.dropdownPlaceholder}>Choose a park...</Text>
                      )}
                      <Text style={styles.dropdownArrow}>{parkDropdownOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {parkDropdownOpen && (
                      <View style={styles.modalDropdownList}>
                        {selectedResort.parkIds.map((parkId, i) => {
                          const park = PARKS.find(p => p.id === parkId);
                          if (!park) return null;
                          const isSelected = selectedParkId === parkId;
                          return (
                            <TouchableOpacity
                              key={parkId}
                              style={[
                                styles.dropdownItem,
                                isSelected && styles.dropdownItemSelected,
                                i < selectedResort.parkIds.length - 1 && styles.dropdownItemBorder,
                              ]}
                              onPress={() => handleSelectPark(parkId)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                                {park.name}
                              </Text>
                              {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}

                {/* Page 1 Buttons: Back (dismiss) / Next */}
                <View style={styles.modalActions}>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={handleModalBack}>
                      <Text style={styles.modalBackBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
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

                {/* Pin Trading Toggle — only for Disney parks */}
                {isDisneyResort && (
                  <>
                    <View style={styles.toggleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>📌  Pin Trading Tasks</Text>
                        <Text style={styles.toggleDesc}>Include pin trading challenges</Text>
                      </View>
                      <Switch
                        value={settings.categoryToggles.pin}
                        onValueChange={v => updateCategoryToggle('pin', v)}
                        trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
                        thumbColor="#fff"
                        style={styles.toggleSwitch}
                      />
                    </View>
                    <View style={styles.modalDivider} />
                  </>
                )}

                {/* Height Filter */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>🎢  Filter by height</Text>
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

                {/* Page 2 Buttons: Back / Start Game */}
                <View style={styles.modalActions}>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={handleModalBack}>
                      <Text style={styles.modalBackBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalStartBtn} onPress={handleConfirmStart}>
                      <Text style={styles.modalStartBtnText}>Start Game</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
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
    fontSize: 38,
    fontWeight: '900',
    color: '#B8A9D4',
    letterSpacing: 12,
    textAlign: 'center',
  },
  logoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -2,
    width: 180,
  },
  logoDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D4C4EE',
    borderRadius: 1,
  },
  logoDividerIcon: {
    fontSize: 20,
    marginHorizontal: 10,
    color: '#C8A4F0',
  },
  logoQuest: {
    fontSize: 44,
    fontWeight: '900',
    color: '#9B7FD4',
    letterSpacing: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 1,
    fontWeight: '500',
  },

  // Welcome
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: RADII.panel,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  welcomeText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  lifetimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lifetimeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  lifetimeScore: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.card,
  },
  modalTitle: {
    color: COLORS.textDark,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalFieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  modalNameInput: {
    width: '100%',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
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
    backgroundColor: COLORS.bg,
    borderRadius: RADII.button,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
  },
  modalBackBtnText: {
    color: COLORS.textBody,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  modalNextBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  modalNextBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  modalStartBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  modalStartBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  modalBtnDisabled: {
    opacity: 0.45,
  },

  // Modal Dropdowns
  modalDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
  },
  modalDropdownText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  modalDropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    overflow: 'hidden',
    ...SHADOWS.card,
  },

  // Shared dropdown items (used in modal)
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dropdownPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  dropdownArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(120,212,160,0.12)',
  },
  dropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dropdownItemText: {
    color: COLORS.textBody,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: COLORS.greenDark,
    fontWeight: '700',
  },
  dropdownCheck: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '900',
  },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  toggleLabel: {
    color: COLORS.textBody,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggleSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
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
    color: COLORS.textDark,
    fontSize: 28,
    fontWeight: '900',
  },
  heightFeet: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
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
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // Tooltip
  tooltip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(155,127,212,0.10)',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(155,127,212,0.25)',
    alignItems: 'flex-start',
  },
  tooltipText: {
    flex: 1,
    color: COLORS.textBody,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Actions
  actions: {
    gap: 12,
    marginTop: 8,
  },
  startBtn: {
    backgroundColor: COLORS.green,
    borderRadius: RADII.button,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.button,
  },
  startBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  continueBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: RADII.button,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.blueDark,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  continueBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  // Top nav icons
  topNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  topNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  topNavIcon: {
    fontSize: 18,
  },

  // Continue Game modal — save slot picker
  continueSlotCard: {
    paddingVertical: 12,
  },
  continueSlotName: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  continueSlotDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  continueSlotMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  continueSlotTime: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  slotButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  selectSlotBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.greenDark,
  },
  selectSlotBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteSlotBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(240,144,144,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240,144,144,0.3)',
  },
  deleteSlotBtnText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  deleteConfirmText: {
    color: COLORS.textBody,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  deleteConfirmYes: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.red,
  },
  deleteConfirmYesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteConfirmNo: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  deleteConfirmNoText: {
    color: COLORS.textBody,
    fontSize: 12,
    fontWeight: '700',
  },
});
