import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useGameStore } from '../store/gameStore';
import { CategoryToggles } from '../types';
import { RIDES } from '../data/parks';
import { COLORS, RADII } from '../theme/balatro';

const CATEGORY_INFO: { key: keyof CategoryToggles; label: string; icon: string }[] = [
  { key: 'observation', label: 'Observation', icon: '👁️' },
  { key: 'photo', label: 'Photo Challenges', icon: '📸' },
  { key: 'trivia', label: 'Trivia', icon: '🧠' },
  { key: 'ride', label: 'Ride-Based', icon: '🎢' },
  { key: 'food', label: 'Food & Treat', icon: '🍦' },
  { key: 'pin', label: 'Pin Trading', icon: '📌' },
  { key: 'character', label: 'Character Meet & Greet', icon: '🎭' },
  { key: 'exploration', label: 'Exploration', icon: '🗺️' },
  { key: 'scavenger', label: 'Scavenger', icon: '🔍' },
];

export default function SettingsScreen() {
  const { settings, updateSettings, updateCategoryToggle, toggleRide } = useGameStore();
  const [showRideDrilldown, setShowRideDrilldown] = useState(false);

  const parkRides = RIDES.filter(r => r.parkId === settings.parkId);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Height Filter */}
        <SectionCard title="HEIGHT FILTER 📏">
          <SettingRow
            label="Enable Height Filtering"
            description="Hides rides taller than your shortest rider"
          >
            <Switch
              value={settings.heightFilterEnabled}
              onValueChange={v => updateSettings({ heightFilterEnabled: v })}
              trackColor={{ true: COLORS.red, false: COLORS.feltDark }}
              thumbColor="#fff"
            />
          </SettingRow>
          {settings.heightFilterEnabled && (
            <View style={styles.sliderSection}>
              <View style={styles.sliderSign}>
                <Text style={styles.sliderSignTitle}>YOU MUST BE THIS TALL</Text>
                <Text style={styles.sliderSignArrow}>↕</Text>
                <Text style={styles.sliderHeightValue}>{settings.minHeightInches}"</Text>
                <Text style={styles.sliderSignSubtitle}>
                  {Math.floor(settings.minHeightInches / 12)}′ {settings.minHeightInches % 12}″
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={32}
                maximumValue={54}
                step={1}
                value={settings.minHeightInches}
                onValueChange={v => updateSettings({ minHeightInches: v })}
                minimumTrackTintColor={COLORS.red}
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor={COLORS.gold}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>32"</Text>
                <Text style={styles.sliderLabel}>54"</Text>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Categories */}
        <SectionCard title="TASK CATEGORIES">
          {CATEGORY_INFO.map(({ key, label, icon }) => (
            <View key={key}>
              <SettingRow label={`${icon}  ${label}`}>
                <Switch
                  value={settings.categoryToggles[key]}
                  onValueChange={v => updateCategoryToggle(key, v)}
                  trackColor={{ true: COLORS.red, false: COLORS.feltDark }}
                  thumbColor="#fff"
                />
              </SettingRow>
              {key === 'ride' && settings.categoryToggles.ride && (
                <TouchableOpacity
                  style={styles.drilldownToggle}
                  onPress={() => setShowRideDrilldown(v => !v)}
                >
                  <Text style={styles.drilldownToggleText}>
                    {showRideDrilldown ? '▲ Hide' : '▼ Show'} Individual Rides
                  </Text>
                </TouchableOpacity>
              )}
              {key === 'ride' && showRideDrilldown && settings.categoryToggles.ride && (
                <View style={styles.rideDrilldown}>
                  {parkRides.length === 0 ? (
                    <Text style={styles.noRidesText}>No rides available for this park.</Text>
                  ) : (
                    parkRides.map(ride => (
                      <View key={ride.id} style={styles.rideRow}>
                        <View style={styles.rideInfo}>
                          <Text style={styles.rideName}>{ride.name}</Text>
                          <Text style={styles.rideMeta}>
                            {ride.heightRequirement > 0 ? `${ride.heightRequirement}"+ ` : 'Any height · '}
                            {ride.intensity} · {ride.points} pts
                          </Text>
                        </View>
                        <Switch
                          value={!settings.disabledRideIds.includes(ride.id)}
                          onValueChange={v => toggleRide(ride.id, v)}
                          trackColor={{ true: COLORS.red, false: COLORS.feltDark }}
                          thumbColor="#fff"
                          style={styles.rideSwitch}
                        />
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="APPEARANCE">
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.themeChip, settings.darkMode === mode && styles.themeChipSelected]}
                onPress={() => updateSettings({ darkMode: mode })}
              >
                <Text style={styles.themeChipText}>
                  {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '⚙️'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Sound & Haptics */}
        <SectionCard title="SOUND & HAPTICS">
          <SettingRow label="🔊  Sound Effects">
            <Switch
              value={settings.soundEnabled}
              onValueChange={v => updateSettings({ soundEnabled: v })}
              trackColor={{ true: COLORS.red, false: COLORS.feltDark }}
              thumbColor="#fff"
            />
          </SettingRow>
          <SettingRow label="📳  Haptic Feedback">
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={v => updateSettings({ hapticsEnabled: v })}
              trackColor={{ true: COLORS.red, false: COLORS.feltDark }}
              thumbColor="#fff"
            />
          </SettingRow>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabelContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.felt,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  sliderSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  sliderSign: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  sliderSignTitle: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  sliderSignArrow: {
    fontSize: 24,
    marginVertical: 4,
  },
  sliderHeightValue: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '900',
  },
  sliderSignSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
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
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  drilldownToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  drilldownToggleText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  rideDrilldown: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  noRidesText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    paddingVertical: 8,
  },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  rideInfo: {
    flex: 1,
    marginRight: 8,
  },
  rideName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  rideMeta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  rideSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 8,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderPanel,
    alignItems: 'center',
    backgroundColor: COLORS.feltLight,
  },
  themeChipSelected: {
    borderColor: COLORS.red,
    backgroundColor: 'rgba(254,95,85,0.2)',
  },
  themeChipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
