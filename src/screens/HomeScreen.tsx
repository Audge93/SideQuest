import React from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const PARK_DISPLAY_GROUPS = [
  {
    label: 'Walt Disney World',
    parks: ['wdw-mk', 'wdw-hs', 'wdw-ep', 'wdw-ak'],
  },
  {
    label: 'Disneyland Resort',
    parks: ['dl-dl', 'dl-dca'],
  },
  {
    label: 'Universal Orlando',
    parks: ['uor-us', 'uor-ioa', 'uor-eu'],
  },
  {
    label: 'Universal Hollywood',
    parks: ['ush-us'],
  },
  {
    label: 'Other',
    parks: ['custom'],
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings, session, startSession, endSession, player } = useGameStore();

  const selectedParkId = settings.parkIds?.[0];
  const selectedPark = PARKS.find(p => p.id === selectedParkId);

  const handleSelectPark = (parkId: string) => {
    updateSettings({ parkIds: [parkId] });
  };

  const handleStartGame = () => {
    startSession();
    navigation.navigate('Game');
  };

  const handleContinueGame = () => {
    navigation.navigate('Game');
  };

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

          {/* Park Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SELECT YOUR PARK</Text>
            {PARK_DISPLAY_GROUPS.map(group => (
              <View key={group.label} style={styles.parkGroup}>
                <Text style={styles.parkGroupLabel}>{group.label}</Text>
                <View style={styles.parkRow}>
                  {group.parks.map(parkId => {
                    const park = PARKS.find(p => p.id === parkId);
                    if (!park) return null;
                    const selected = selectedParkId === parkId;
                    return (
                      <TouchableOpacity
                        key={parkId}
                        style={[styles.parkChip, selected && styles.parkChipSelected]}
                        onPress={() => handleSelectPark(parkId)}
                      >
                        <Text style={[styles.parkChipText, selected && styles.parkChipTextSelected]}>
                          {park.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            {selectedPark && (
              <Text style={styles.selectedParkName}>{selectedPark.name}</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {session?.active && (
              <TouchableOpacity style={styles.continueBtn} onPress={handleContinueGame}>
                <Text style={styles.continueBtnText}>Continue Game</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.startBtn} onPress={handleStartGame}>
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
  welcomeCard: {
    backgroundColor: COLORS.surface,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  parkGroup: {
    marginBottom: 10,
  },
  parkGroupLabel: {
    color: COLORS.textBody,
    fontSize: 12,
    marginBottom: 6,
  },
  parkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  parkChip: {
    borderWidth: 1.5,
    borderColor: COLORS.borderMedium,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.surfaceSecondary,
  },
  parkChipSelected: {
    borderColor: COLORS.green,
    backgroundColor: '#E8F8EF',
  },
  parkChipText: {
    color: COLORS.textBody,
    fontWeight: '600',
    fontSize: 13,
  },
  parkChipTextSelected: {
    color: COLORS.greenDark,
  },
  selectedParkName: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
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
  endSessionBtn: {
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  endSessionBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: 15,
  },
});
