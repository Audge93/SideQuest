import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import CardCarousel from '../components/CardCarousel';
import BigBoard from '../components/BigBoard';
import StreakFlame from '../components/StreakFlame';
import DiscardPips from '../components/DiscardPips';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;
const sh = SCREEN_H / 844;

export default function GameScreen() {
  const navigation = useNavigation<any>();
  const {
    session,
    settings,
    completeTask,
    discardTask,
    swapChallengeTask,
    answerTrivia,
    endSession,
    startSession,
  } = useGameStore();

  const parkId = settings.parkIds?.[0];
  const park = PARKS.find(p => p.id === parkId);

  useEffect(() => {
    if (!session?.active) {
      startSession();
    }
  }, []);

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const handleEndSession = () => {
    Alert.alert(
      'End Session?',
      'Your session score will be added to your lifetime total.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            endSession();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/HomeScreenBackgroundImage.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <StreakFlame streak={session.currentStreak} />
          <Text style={styles.parkName}>{park?.name ?? '?'}</Text>
          <View style={styles.scoreBubble}>
            <Text style={styles.scoreValue}>{session.sessionScore}</Text>
            <Text style={styles.scorePts}>pts</Text>
          </View>
        </View>

        {/* Big Board */}
        <View style={styles.bigBoardWrapper}>
          <BigBoard
            tasks={session.challengeTasks}
            sessionScore={session.sessionScore}
            onComplete={id => completeTask(id, true)}
            onSwap={id => swapChallengeTask(id)}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Hand Section Label */}
        <View style={styles.handHeader}>
          <Text style={styles.handLabel}>YOUR HAND</Text>
          <DiscardPips remaining={session.discardsRemaining} max={2} />
        </View>

        {/* Card Carousel */}
        <CardCarousel
          cards={session.hand}
          onComplete={id => completeTask(id, false)}
          onDiscard={id => discardTask(id)}
          onTriviaAnswer={(id, correct) => answerTrivia(id, correct)}
          discardsRemaining={session.discardsRemaining}
        />

        {/* Session Stats Bar */}
        <View style={styles.statsBar}>
          <StatItem label="Completed" value={session.completedTasks.length} />
          <StatItem label="Streak" value={session.currentStreak} />
          <StatItem label="Session" value={`${session.sessionScore} pts`} />
        </View>

        {/* End Session */}
        <TouchableOpacity style={styles.endBtn} onPress={handleEndSession}>
          <Text style={styles.endBtnText}>End Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    paddingBottom: Math.round(16 * sh),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.textBody,
    fontSize: Math.round(16 * sw),
  },
  // Top bar: ~44pt height
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(12 * sw),
    height: Math.round(44 * sh),
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.chip,
  },
  parkName: {
    color: COLORS.textDark,
    fontWeight: '900',
    fontSize: Math.round(14 * sw),
    letterSpacing: 0.5,
    flexShrink: 1,
    textAlign: 'center',
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: RADII.chip,
    paddingHorizontal: Math.round(12 * sw),
    paddingVertical: Math.round(4 * sh),
    minWidth: Math.round(60 * sw),
    borderBottomWidth: 3,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.chip,
  },
  scoreValue: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(18 * sw),
    lineHeight: Math.round(22 * sw),
  },
  scorePts: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Math.round(9 * sw),
    fontWeight: '600',
  },
  // Challenge Tasks row: ~100pt
  bigBoardWrapper: {
    marginBottom: Math.round(2 * sh),
  },
  // Divider + label + pips: ~36pt total
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: Math.round(20 * sw),
    marginVertical: Math.round(6 * sh),
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(20 * sw),
    marginBottom: Math.round(2 * sh),
    height: Math.round(24 * sh),
  },
  handLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(11 * sw),
    fontWeight: '700',
    letterSpacing: 2,
  },
  // Stats bar: ~40pt
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    marginHorizontal: Math.round(16 * sw),
    borderRadius: RADII.panel,
    paddingVertical: Math.round(8 * sh),
    marginTop: Math.round(10 * sh),
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
    ...SHADOWS.card,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: Math.round(16 * sw),
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(10 * sw),
    marginTop: 1,
  },
  // End Session button: ~50pt
  endBtn: {
    marginHorizontal: Math.round(16 * sw),
    marginTop: Math.round(10 * sh),
    paddingVertical: Math.round(12 * sh),
    borderRadius: RADII.button,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  endBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: Math.round(14 * sw),
  },
});
