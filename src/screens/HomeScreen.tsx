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
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/theme';

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

// ─── Only these categories are toggleable ───────────────────────────────────

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
  } = useGameStore();

  // Derive which resort is currently selected
  const selectedParkId = settings.parkIds?.[0];
  const currentResort = RESORTS.find(r => r.parkIds.includes(selectedParkId || ''));
  const [selectedResortId, setSelectedResortId] = useState<string | null>(currentResort?.id ?? null);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);

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

  const handleStartGame = () => {
    if (!selectedParkId || !parkIsInResort) {
      Alert.alert('Select a Park', 'Please pick a resort and park before starting.');
      return;
    }
    setNameInput(player.name);
    setShowNewGameModal(true);
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

  const handleContinueGame = () => {
    navigation.navigate('Game');
  };

  const canStart = !!selectedParkId && !!parkIsInResort;

  return (
    <ImageBackground
      source={require('../../assets/GameBackgroundImage.png')}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.subtitle}>Turn wait times into play time</Text>
          </View>

          {/* Player Welcome */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>
              {player.name && player.name !== 'Player 1'
                ? `Welcome back, ${player.name}!`
                : 'Welcome!'}
            </Text>
            <View style={styles.lifetimeRow}>
              <Text style={styles.lifetimeLabel}>Lifetime Score</Text>
              <Text style={styles.lifetimeScore}>{player.lifetimeScore.toLocaleString()} pts</Text>
            </View>
          </View>

          {/* ── Step 1: Resort Dropdown ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHERE ARE YOU?</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => { animateLayout(); setResortDropdownOpen(v => !v); }}
              activeOpacity={0.7}
            >
              {selectedResort ? (
                <View style={styles.dropdownSelected}>
                  <Text style={styles.dropdownSelectedIcon}>{selectedResort.icon}</Text>
                  <Text style={styles.dropdownSelectedText}>{selectedResort.label}</Text>
                </View>
              ) : (
                <Text style={styles.dropdownPlaceholder}>Choose a resort...</Text>
              )}
              <Text style={styles.dropdownArrow}>{resortDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {resortDropdownOpen && (
              <View style={styles.dropdownList}>
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
          </View>

          {/* ── Step 2: Park Dropdown (only if resort has multiple parks) ── */}
          {selectedResort && selectedResort.parkIds.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECT YOUR PARK</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => { animateLayout(); setParkDropdownOpen(v => !v); }}
                activeOpacity={0.7}
              >
                {selectedPark && parkIsInResort ? (
                  <Text style={styles.dropdownSelectedText}>{selectedPark.name}</Text>
                ) : (
                  <Text style={styles.dropdownPlaceholder}>Choose a park...</Text>
                )}
                <Text style={styles.dropdownArrow}>{parkDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {parkDropdownOpen && (
                <View style={styles.dropdownList}>
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

          {/* ── Action Buttons ── */}
          <View style={styles.actions}>
            {session?.active && (
              <TouchableOpacity style={styles.continueBtn} onPress={handleContinueGame}>
                <Text style={styles.continueBtnText}>Continue Game</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
              onPress={handleStartGame}
              disabled={!canStart}
            >
              <Text style={styles.startBtnText}>
                {session?.active ? 'New Game' : 'Start Game'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── New Game Setup Modal ── */}
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
              {selectedPark?.name ?? 'Selected Park'}
            </Text>

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

            {/* Pin Trading Toggle */}
            <View style={styles.modalDivider} />
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

            {/* Height Filter */}
            <View style={styles.modalDivider} />
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

            {/* Tooltip */}
            <View style={styles.tooltip}>
              <Text style={styles.tooltipIcon}>💡</Text>
              <Text style={styles.tooltipText}>
                Welcome to Side Quest. This game can be played solo or co-op. To customize your gameplay to your theme park day, please indicate the height of your smallest player. The game will make sure not to give you tasks that are too tall.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalStartBtn} onPress={handleConfirmStart}>
                <Text style={styles.modalStartBtnText}>Start Game</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNewGameModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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

  // Sections
  section: {
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    padding: 12,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dropdownSelectedText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
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
  dropdownList: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    ...SHADOWS.card,
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
  modalStartBtn: {
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
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
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
  heightDivider: {
    height: 1,
    backgroundColor: COLORS.borderMedium,
    marginVertical: 12,
  },
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
  tooltipIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
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
  startBtnDisabled: {
    opacity: 0.45,
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
});
