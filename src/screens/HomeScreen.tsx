import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { CategoryToggles } from '../types';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

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

// ─── Category toggle info ───────────────────────────────────────────────────

const CATEGORY_INFO: { key: keyof CategoryToggles; label: string; icon: string }[] = [
  { key: 'observation', label: 'Find', icon: '🔍' },
  { key: 'photo', label: 'Photo', icon: '📸' },
  { key: 'trivia', label: 'Trivia', icon: '🧠' },
  { key: 'action', label: 'Act', icon: '🎬' },
  { key: 'ride', label: 'Rides', icon: '🎢' },
  { key: 'food', label: 'Treat', icon: '🍦' },
  { key: 'pin', label: 'Pins', icon: '📌' },
  { key: 'character', label: 'Meet', icon: '🎭' },
  { key: 'exploration', label: 'Explore', icon: '🗺️' },
  { key: 'scavenger', label: 'Seek', icon: '🎯' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    settings,
    updateSettings,
    updateCategoryToggle,
    session,
    startSession,
    endSession,
    player,
  } = useGameStore();

  // Derive which resort is currently selected
  const selectedParkId = settings.parkIds?.[0];
  const currentResort = RESORTS.find(r => r.parkIds.includes(selectedParkId || ''));
  const [selectedResortId, setSelectedResortId] = useState<string | null>(currentResort?.id ?? null);
  const [showOptions, setShowOptions] = useState(false);

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

  const handleSelectResort = (resortId: string) => {
    setSelectedResortId(resortId);
    // Clear park selection if switching resort
    const resort = RESORTS.find(r => r.id === resortId);
    if (resort && !resort.parkIds.includes(selectedParkId || '')) {
      if (resort.parkIds.length === 1) {
        updateSettings({ parkIds: [resort.parkIds[0]] });
      } else {
        updateSettings({ parkIds: [] });
      }
    }
  };

  const handleSelectPark = (parkId: string) => {
    updateSettings({ parkIds: [parkId] });
  };

  const handleStartGame = () => {
    if (!selectedParkId || !parkIsInResort) {
      Alert.alert('Select a Park', 'Please pick a resort and park before starting.');
      return;
    }
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
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Side Quest</Text>
            <Text style={styles.subtitle}>Turn wait times into play time</Text>
          </View>

          {/* Player Welcome */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Welcome back, {player.name}!</Text>
            <View style={styles.lifetimeRow}>
              <Text style={styles.lifetimeLabel}>Lifetime Score</Text>
              <Text style={styles.lifetimeScore}>{player.lifetimeScore.toLocaleString()} pts</Text>
            </View>
          </View>

          {/* ── Step 1: Resort Selection ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHERE ARE YOU?</Text>
            <View style={styles.resortList}>
              {RESORTS.map(resort => {
                const isSelected = selectedResortId === resort.id;
                return (
                  <TouchableOpacity
                    key={resort.id}
                    style={[styles.resortChip, isSelected && styles.resortChipSelected]}
                    onPress={() => handleSelectResort(resort.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resortIcon}>{resort.icon}</Text>
                    <Text style={[styles.resortLabel, isSelected && styles.resortLabelSelected]}>
                      {resort.label}
                    </Text>
                    {isSelected && <Text style={styles.resortCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Step 2: Park Selection (only if resort has multiple parks) ── */}
          {selectedResort && selectedResort.parkIds.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECT YOUR PARK</Text>
              <View style={styles.parkChipRow}>
                {selectedResort.parkIds.map(parkId => {
                  const park = PARKS.find(p => p.id === parkId);
                  if (!park) return null;
                  const isSelected = selectedParkId === parkId;
                  return (
                    <TouchableOpacity
                      key={parkId}
                      style={[styles.parkChip, isSelected && styles.parkChipSelected]}
                      onPress={() => handleSelectPark(parkId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.parkChipText, isSelected && styles.parkChipTextSelected]}>
                        {park.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Game Options (collapsible) ── */}
          {canStart && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.optionsToggle}
                onPress={() => setShowOptions(v => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>GAME OPTIONS</Text>
                <Text style={styles.optionsArrow}>{showOptions ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showOptions && (
                <View style={styles.optionsCard}>
                  {/* Category Toggles */}
                  <Text style={styles.optionsSubheader}>Task Categories</Text>
                  {CATEGORY_INFO.map(({ key, label, icon }) => (
                    <View key={key} style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{icon}  {label}</Text>
                      <Switch
                        value={settings.categoryToggles[key]}
                        onValueChange={v => updateCategoryToggle(key, v)}
                        trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
                        thumbColor="#fff"
                        style={styles.toggleSwitch}
                      />
                    </View>
                  ))}

                  {/* Height Filter */}
                  <View style={styles.heightDivider} />
                  <Text style={styles.optionsSubheader}>Height Filter</Text>
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
            {session?.active && (
              <TouchableOpacity
                style={styles.endSessionBtn}
                onPress={() =>
                  Alert.alert(
                    'End Session?',
                    'Your session score will be added to your lifetime total.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'End Session', style: 'destructive', onPress: () => endSession() },
                    ]
                  )
                }
              >
                <Text style={styles.endSessionBtnText}>End Session</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 80,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.textDark,
    letterSpacing: -1,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5,
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
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },

  // Resort selection
  resortList: {
    gap: 8,
  },
  resortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
    ...SHADOWS.chip,
  },
  resortChipSelected: {
    borderColor: COLORS.green,
    backgroundColor: 'rgba(232,248,239,0.92)',
  },
  resortIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  resortLabel: {
    flex: 1,
    color: COLORS.textBody,
    fontSize: 16,
    fontWeight: '600',
  },
  resortLabelSelected: {
    color: COLORS.greenDark,
    fontWeight: '700',
  },
  resortCheck: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: '900',
  },

  // Park chip selection
  parkChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  parkChip: {
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.88)',
    ...SHADOWS.chip,
  },
  parkChipSelected: {
    borderColor: COLORS.green,
    backgroundColor: 'rgba(232,248,239,0.92)',
  },
  parkChipText: {
    color: COLORS.textBody,
    fontWeight: '600',
    fontSize: 14,
  },
  parkChipTextSelected: {
    color: COLORS.greenDark,
    fontWeight: '700',
  },

  // Options toggle
  optionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionsArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },

  // Options card
  optionsCard: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: RADII.panel,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  optionsSubheader: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 2,
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
  endSessionBtn: {
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  endSessionBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: 15,
  },
});
