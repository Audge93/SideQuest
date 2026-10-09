import React, { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Settings } from '../types';
import { PARKS } from '../data/parks';
import { useGameStore } from '../store/gameStore';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import { useReadingPreferences, useReducedMotion } from '../theme/useAccessibility';
import { defaultGameName } from '../utils/gameSetup';
import { FocusHeading } from './ReadingModal';
import GameButton from './GameButton';
import GameIcon from './icons/GameIcon';
import { COLORS, FONTS, INK, TABLE } from '../theme/theme';

export default function NewGameSetup({ onClose, onStart }: {
  onClose: () => void;
  onStart: (gameName: string, settings: Settings, playerName: string) => boolean;
}) {
  const initial = useGameStore.getState();
  // Keep every choice local until the player confirms. Cancel never changes a save.
  const [draft, setDraft] = useState<Settings>(() => ({ ...initial.settings, parkIds: [initial.settings.parkIds[0]], categoryToggles: { ...initial.settings.categoryToggles } }));
  const [name, setName] = useState(initial.player.name);
  const [gameName, setGameName] = useState('');
  const [page, setPage] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const starting = useRef(false);
  const gameNameRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const reduced = useReducedMotion();
  const { scale } = useReadingPreferences();
  const { colors, dark } = useAppTheme();
  const styles = useThemedStyles(BASE_STYLES, true, []);
  const park = PARKS.find(p => p.id === draft.parkIds[0]);
  const valid = !!name.trim() && !!park;
  const automaticName = defaultGameName(draft.parkIds[0]);
  const preferences = [draft.seatedOnly && 'Seated-friendly', draft.lessWalking && 'Less walking', draft.noPerforming && 'No speaking/performing'].filter(Boolean);
  const changePage = (next: 1 | 2) => { Keyboard.dismiss(); setPage(next); setError(''); scrollRef.current?.scrollTo({ y: 0, animated: false }); };
  const start = () => {
    if (starting.current || !valid) return;
    starting.current = true;
    Keyboard.dismiss();
    if (!onStart(gameName.trim(), draft, name.trim())) {
      starting.current = false;
      setError('This game could not start. Check that a save slot is free and your activity preferences leave enough cards. Keep Explore or Seek enabled in Settings.');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: !reduced }));
    }
  };
  return <Modal visible transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View testID="new-game-setup" accessibilityViewIsModal style={styles.panel}>
        <ScrollView ref={scrollRef} style={{ flexShrink: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <FocusHeading title={page === 1 ? 'New Game' : 'Ready to Play?'} />
          <Text testID="setup-step" style={styles.kicker}>Step {page} of 2 · {page === 1 ? 'Name & park' : 'Review & options'}</Text>
          {page === 1 ? <>
            <Text style={styles.body}>Play solo or share one game with your group. Choose where you’re starting; you can switch parks during play.</Text>
            <Text style={styles.label}>PLAYER / TEAM NAME</Text>
            <TextInput testID="setup-player-name" accessibilityLabel="Player or team name, required" value={name} onChangeText={setName} style={styles.input} placeholder="Enter your name..." placeholderTextColor={colors.textMuted} maxLength={24} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => gameNameRef.current?.focus()} selectionColor={colors.green} />
            {!name.trim() && <Text testID="setup-name-error" accessibilityLiveRegion="polite" style={styles.body}>Enter a player or team name to continue.</Text>}
            <Text style={styles.label}>GAME NAME (OPTIONAL)</Text>
            <TextInput ref={gameNameRef} testID="setup-game-name" accessibilityLabel="Game name, optional" value={gameName} onChangeText={setGameName} style={styles.input} placeholder={automaticName} placeholderTextColor={colors.textMuted} maxLength={30} autoCapitalize="words" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} selectionColor={colors.green} />
            <Text style={styles.hint}>Leave this blank to use the date and park name.</Text>
            <Text style={styles.label}>WALT DISNEY WORLD PARK</Text>
            <View style={styles.parks}>
              {PARKS.map(p => {
                const selected = p.id === park?.id;
                return <TouchableOpacity key={p.id} testID={`park-option-${p.id}`} accessibilityRole="radio" accessibilityLabel={p.name} aria-checked={selected} accessibilityState={{ checked: selected }} onPress={() => setDraft(value => ({ ...value, parkIds: [p.id] }))} style={[styles.park, scale > 1 && { width: '100%' }, selected && { borderColor: colors.textDark, borderWidth: 3, backgroundColor: colors.surface }]}>
                  <GameIcon name={p.icon} size={32} /><Text style={styles.parkName}>{p.name}</Text>
                  {selected && <Text style={styles.hint}>Selected</Text>}
                </TouchableOpacity>;
              })}
            </View>
          </> : <>
            <View testID="setup-review" style={styles.review}>
              <Text style={styles.label}>{park?.name}</Text>
              <Text style={styles.body}>Playing as {name.trim()}</Text>
              <Text style={styles.body}>Saved as {gameName.trim() || automaticName}</Text>
            </View>
            <View style={styles.toggleRow}>
              <GameIcon name="pins" size={28} /><View style={{ flex: 1 }}><Text style={styles.label}>Pin Trading Tasks</Text><Text style={styles.hint}>Include challenges that use your trading pins.</Text></View>
              <Switch testID="setup-pins" accessibilityLabel="Include pin trading tasks" value={draft.categoryToggles.pins} onValueChange={pins => setDraft(value => ({ ...value, categoryToggles: { ...value.categoryToggles, pins } }))} trackColor={{ true: colors.green, false: colors.borderMedium }} />
            </View>
            <View style={styles.toggleRow}>
              <GameIcon name="ruler" size={28} /><View style={{ flex: 1 }}><Text style={styles.label}>Filter by Height</Text><Text style={styles.hint}>Exclude ride tasks above the shortest rider’s height.</Text></View>
              <Switch testID="setup-height-filter" accessibilityLabel="Filter ride tasks by height" value={draft.heightFilterEnabled} onValueChange={heightFilterEnabled => setDraft(value => ({ ...value, heightFilterEnabled }))} trackColor={{ true: colors.green, false: colors.borderMedium }} />
            </View>
            {draft.heightFilterEnabled && <View>
              <Text testID="setup-height-value" style={styles.body}>Shortest rider: {draft.minHeightInches} inches ({Math.round(draft.minHeightInches * 2.54)} cm)</Text>
              <Slider testID="setup-height-slider" accessibilityLabel="Shortest rider height in inches" minimumValue={0} maximumValue={54} step={1} value={draft.minHeightInches} onValueChange={minHeightInches => setDraft(value => ({ ...value, minHeightInches }))} minimumTrackTintColor={colors.green} maximumTrackTintColor={colors.borderMedium} thumbTintColor={colors.green} style={{ height: 44 }} />
              <View style={styles.heightButtons}><GameButton testID="setup-height-minus" label="−" accessibilityLabel="Decrease height by one inch" tone="gray" disabled={draft.minHeightInches <= 0} onPress={() => setDraft(value => ({ ...value, minHeightInches: value.minHeightInches - 1 }))} /><GameButton testID="setup-height-plus" label="+" accessibilityLabel="Increase height by one inch" tone="gray" disabled={draft.minHeightInches >= 54} onPress={() => setDraft(value => ({ ...value, minHeightInches: value.minHeightInches + 1 }))} /></View>
              <Text style={styles.hint}>0 inches includes only rides without a minimum height.</Text>
            </View>}
            {!!preferences.length && <Text testID="setup-comfort-summary" style={styles.body}>Activity preferences: {preferences.join(' · ')}</Text>}
            <Text style={styles.hint}>Other activity choices follow your Settings. You can change options during play.</Text>
            <Text style={styles.body}>Your game saves automatically on this device. Find it under Continue Game.</Text>
          </>}
          {!!error && <Text testID="setup-error" accessibilityRole="alert" style={[styles.body, { color: dark ? '#FF8A8A' : '#B62828' }]}>{error}</Text>}
        </ScrollView>
        <View style={styles.actions}>
          <GameButton testID="setup-back-btn" label={page === 1 ? 'Cancel' : 'Back'} tone="gray" onPress={() => page === 1 ? onClose() : changePage(1)} style={{ flex: 1 }} />
          <GameButton testID={page === 1 ? 'new-game-next-btn' : 'start-game-btn'} label={page === 1 ? 'Next' : 'Start Game'} tone="green" disabled={!valid} onPress={() => page === 1 ? changePage(2) : start()} style={{ flex: 1.4 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const BASE_STYLES = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(14, 9, 28, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  panel: { width: '100%', maxWidth: 420, maxHeight: '92%', backgroundColor: TABLE.panel, borderRadius: 22, borderWidth: 3, borderBottomWidth: 7, borderColor: INK },
  content: { padding: 18, gap: 12 },
  kicker: { color: TABLE.gold, fontSize: 14, fontWeight: '800' },
  body: { color: '#FFFFFF', fontSize: 16, lineHeight: 23 },
  hint: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, lineHeight: 19 },
  label: { color: '#FFFFFF', fontFamily: FONTS.display, fontSize: 16 },
  input: { backgroundColor: '#FFF8EC', color: INK, borderColor: INK, borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 17, minHeight: 48 },
  parks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  park: { width: '47%', flexGrow: 1, minHeight: 100, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6, borderWidth: 2, borderColor: INK, borderRadius: 14, backgroundColor: TABLE.panelLight },
  parkName: { color: '#FFFFFF', fontFamily: FONTS.display, fontSize: 16, textAlign: 'center' },
  review: { backgroundColor: TABLE.panelLight, padding: 12, borderRadius: 12, gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  heightButtons: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  actions: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderMedium },
});
