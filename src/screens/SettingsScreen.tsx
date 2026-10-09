import { playSound } from '../utils/sounds';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
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
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { useGameStore } from '../store/gameStore';
import { CategoryToggles } from '../types';
import GameIcon, { IconName } from '../components/icons/GameIcon';
import { COLORS, RADII } from '../theme/theme';

// Metadata used to render the category toggle list without duplicating label
// and icon markup for every individual row in the settings UI.
const CATEGORY_INFO: { key: keyof CategoryToggles; label: string }[] = [
  { key: 'find', label: 'Find' },
  { key: 'photo', label: 'Photo Challenges' },
  { key: 'trivia', label: 'Trivia' },
  { key: 'act', label: 'Act' },
  { key: 'ride', label: 'Ride-Based' },
  { key: 'treat', label: 'Treat' },
  { key: 'pins', label: 'Pin Trading' },
  { key: 'meet', label: 'Character Meet & Greet' },
  { key: 'explore', label: 'Exploration' },
  { key: 'seek', label: 'Seek' },
];

export default function SettingsScreen() {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, false, []);

  const navigation = useNavigation<any>();
  const { settings, updateSettings, updateCategoryToggle, session, triggerTips } = useGameStore();

  const handleReturnToMenu = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };
  const [showAbout, setShowAbout] = useState(false);

  return (
    <SafeAreaView testID="settings-screen" style={styles.safe}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header row: back on left, return-to-menu on right when in-game */}
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
              onPress={handleReturnToMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.returnMenuBtnText}>Main Menu</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.pageTitle}>Settings</Text>
        <SectionCard title="ABOUT SIDE QUEST">
          <TouchableOpacity testID="about-btn" accessibilityRole="button"
            style={styles.showTipsBtn} onPress={() => setShowAbout(true)}>
            <Text style={styles.showTipsBtnText}>About & Credits</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Height filtering changes which ride tasks are allowed to appear when
            the store builds the ride task pool for the session. */}
        <SectionCard title="HEIGHT FILTER">
          <SettingRow
            label="Filter rides by height"
            description="New ride cards match your shortest rider’s height."
          >
            <Switch
              testID="height-filter-switch" accessibilityLabel="Filter rides by height" value={settings.heightFilterEnabled}
              onValueChange={v => updateSettings({ heightFilterEnabled: v })}
              trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
              thumbColor="#fff"
            />
          </SettingRow>
          {settings.heightFilterEnabled && (
            <View style={styles.sliderSection}>
              <View style={styles.sliderSign}>
                <Text style={styles.sliderSignTitle}>SHORTEST RIDER HEIGHT</Text>
                <Text style={styles.sliderSignArrow}>↕</Text>
                <Text style={styles.sliderHeightValue}>{settings.minHeightInches}"</Text>
                <Text style={styles.sliderSignSubtitle}>
                  {Math.floor(settings.minHeightInches / 12)}′ {settings.minHeightInches % 12}″
                </Text>
              </View>
              <Slider
                testID="height-slider" accessibilityLabel="Shortest rider height in inches" style={styles.slider}
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity testID="height-decrease-btn" accessibilityRole="button" accessibilityLabel="Decrease rider height by one inch"
                  disabled={settings.minHeightInches <= 32} style={styles.showTipsBtn}
                  onPress={() => updateSettings({ minHeightInches: Math.max(32, settings.minHeightInches - 1) })}>
                  <Text style={styles.showTipsBtnText}>− 1 inch</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="height-increase-btn" accessibilityRole="button" accessibilityLabel="Increase rider height by one inch"
                  disabled={settings.minHeightInches >= 54} style={styles.showTipsBtn}
                  onPress={() => updateSettings({ minHeightInches: Math.min(54, settings.minHeightInches + 1) })}>
                  <Text style={styles.showTipsBtnText}>+ 1 inch</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Category toggles let the player opt entire task families in or out. */}
        <SectionCard title="TASK CATEGORIES">
          <Text style={styles.sectionDescription}>Choose the cards you want to draw. Changes apply to new cards; cards already dealt stay in your game. Keep at least one hand category and one challenge category enabled.</Text>
          {CATEGORY_INFO.map(({ key, label }) => (
            <View key={key}>
              <SettingRow icon={key as IconName} label={label}>
                <Switch
                  disabled={settings.categoryToggles[key] && (['find','photo','trivia','act'].includes(key)
                    ? ['find','photo','trivia','act'] : ['ride','treat','pins','meet','explore','seek'])
                    .filter(c => settings.categoryToggles[c as keyof CategoryToggles]).length === 1}
                  testID={`category-switch-${key}`} accessibilityLabel={label} value={settings.categoryToggles[key]}
                  onValueChange={v => {
                    const group: (keyof CategoryToggles)[] = ['find','photo','trivia','act'].includes(key)
                      ? ['find','photo','trivia','act'] : ['ride','treat','pins','meet','explore','seek'];
                    if (!v && !group.some(c => c !== key && settings.categoryToggles[c])) {
                      Alert.alert('Keep one category enabled', 'Your hand and challenge board each need at least one category.');
                      return;
                    }
                    updateCategoryToggle(key, v);
                  }}
                  trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
                  thumbColor="#fff"
                />
              </SettingRow>
            </View>
          ))}
        </SectionCard>

        {/* Appearance preferences are stored here even if some theme options are
            only lightly used in the current UI version. */}
        <SectionCard title="APPEARANCE">
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                testID={`theme-${mode}`} aria-checked={settings.darkMode === mode} accessibilityRole="radio" accessibilityState={{ selected: settings.darkMode === mode, checked: settings.darkMode === mode }}
                style={[styles.themeChip, styles.iconRow, settings.darkMode === mode && styles.themeChipSelected]}
                onPress={() => updateSettings({ darkMode: mode })}
              >
                <GameIcon name={mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'gear'} size={22} />
                <Text style={[styles.themeChipText, settings.darkMode === mode && styles.themeChipTextSelected]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Preference toggles for feedback systems that can be respected across
            future interactions, animations, and reward moments. */}
        <SectionCard title="SOUND & HAPTICS">
          <SettingRow icon="speaker" label="Sound Effects" description="Short sounds for answers, cards, and rewards.">
            <Switch
              testID="sound-switch" accessibilityLabel="Sound Effects" value={settings.soundEnabled}
              onValueChange={v => { updateSettings({ soundEnabled: v }); if (v) playSound("select"); }}
              trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
              thumbColor="#fff"
            />
          </SettingRow>
          <SettingRow icon="vibrate" label="Haptic Feedback" description="Gentle vibration on supported phones.">
            <Switch
              testID="haptics-switch" accessibilityLabel="Haptic Feedback" value={settings.hapticsEnabled}
              onValueChange={v => updateSettings({ hapticsEnabled: v })}
              trackColor={{ true: COLORS.green, false: COLORS.borderMedium }}
              thumbColor="#fff"
            />
          </SettingRow>
          <TouchableOpacity testID="sound-preview-btn" accessibilityRole="button" accessibilityState={{ disabled: !settings.soundEnabled }}
            disabled={!settings.soundEnabled} style={[styles.showTipsBtn, !settings.soundEnabled && { opacity: 0.5 }]}
            onPress={() => playSound('success')}>
            <Text style={styles.showTipsBtnText}>Preview sound</Text>
          </TouchableOpacity>
        </SectionCard>

        {session && (
          <SectionCard title="HELP">
            <TouchableOpacity testID="show-tips-btn" accessibilityRole="button"
              style={[styles.showTipsBtn, styles.iconRow]}
              onPress={() => {
                triggerTips();
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <GameIcon name="bulb" size={24} />
              <Text style={styles.showTipsBtnText}>Show Tips</Text>
            </TouchableOpacity>
          </SectionCard>
        )}

      </ScrollView>
      <Modal visible={showAbout} transparent animationType="fade" onRequestClose={() => setShowAbout(false)}>
        <View style={aboutStyles.overlay}>
          <View testID="about-panel" style={[aboutStyles.panel, { backgroundColor: COLORS.surface }]}>
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 16 }}>
              <Text style={styles.pageTitle}>About Side Quest</Text>
              <Text style={[aboutStyles.body, { color: COLORS.textBody }]}>Made by a Disney-loving person who wants to turn time in the parks into more memories, laughs, and little adventures.</Text>
              <Text style={[aboutStyles.heading, { color: COLORS.textDark }]}>An independent fan project</Text>
              <Text style={[aboutStyles.body, { color: COLORS.textBody }]}>Side Quest is not affiliated with, endorsed by, or sponsored by The Walt Disney Company or its subsidiaries. Disney names, characters, and trademarks belong to their respective owners.</Text>
              <Text style={[aboutStyles.heading, { color: COLORS.textDark }]}>Trivia preservation credit</Text>
              <Text style={[aboutStyles.body, { color: COLORS.textBody }]}>Thank you to GooglyBlox for preserving and sharing the Play Disney Parks trivia archive. Some trivia in Side Quest comes from that preservation work. Original Play Disney Parks trivia was created by Disney; preservation credit does not imply ownership or Disney endorsement.</Text>
              <TouchableOpacity testID="about-archive-link" accessibilityRole="link"
                onPress={() => Linking.openURL('https://archive.notaspider.dev/details/play-disney-parks-cdn').catch(() => Alert.alert('Unable to open link', 'Please try again later.'))}>
                <Text style={[aboutStyles.link, { color: dark ? COLORS.blue : "#2257B3" }]}>Visit GooglyBlox’s preservation archive</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity testID="about-close-btn" accessibilityRole="button" style={styles.showTipsBtn} onPress={() => setShowAbout(false)}>
              <Text style={styles.showTipsBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const aboutStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(14,9,28,0.85)' },
  panel: { width: '100%', maxWidth: 420, maxHeight: '90%', padding: 20, gap: 16, borderRadius: 20, backgroundColor: '#FFF8EC' },
  body: { color: '#302642', fontSize: 16, lineHeight: 23 },
  heading: { color: '#302642', fontSize: 18, fontWeight: '800' },
  link: { color: '#2257B3', fontSize: 16, lineHeight: 23, textDecorationLine: 'underline' },
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, false, []);

  return (
    <View style={styles.sectionCard}>
      {/* Shared wrapper so each settings section uses the same visual structure. */}
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({
  icon,
  label,
  description,
  children,
}: {
  icon?: IconName;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, false, []);

  return (
    <View style={styles.settingRow}>
      {/* Left side is descriptive copy; right side is the interactive control
          passed in by the caller, such as a Switch. */}
      {icon && <GameIcon name={icon} size={30} style={styles.settingIcon} />}
      <View style={styles.settingLabelContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {children}
    </View>
  );
}

const BASE_STYLES = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  settingIcon: {
    marginRight: 10,
  },
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 80,
  },
  pageTitle: {
    color: COLORS.textDark,
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
  sectionDescription: { color: COLORS.textBody, fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 12 },
  sectionTitle: {
    color: COLORS.textMuted,
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
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sliderSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  sliderSign: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  sliderSignTitle: {
    color: COLORS.goldDark,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  sliderSignArrow: {
    fontSize: 24,
    marginVertical: 4,
    color: COLORS.textBody,
  },
  sliderHeightValue: {
    color: COLORS.textDark,
    fontSize: 32,
    fontWeight: '900',
  },
  sliderSignSubtitle: {
    color: COLORS.textMuted,
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
    color: COLORS.textMuted,
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
    color: COLORS.textMuted,
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
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  rideMeta: {
    color: COLORS.textMuted,
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
    borderColor: COLORS.borderMedium,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
  },
  themeChipSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.surfaceSecondary,
  },
  themeChipText: {
    color: COLORS.textBody,
    fontSize: 13,
    fontWeight: '600',
  },
  themeChipTextSelected: {
    color: COLORS.greenDark,
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
  showTipsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  showTipsBtnText: {
    color: COLORS.blue,
    fontSize: 15,
    fontWeight: '600',
  },
});
