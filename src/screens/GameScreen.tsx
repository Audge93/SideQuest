import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import CardCarousel from '../components/CardCarousel';
import BigBoard from '../components/BigBoard';
import StreakFlame from '../components/StreakFlame';
import DiscardPips from '../components/DiscardPips';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

const GAME_BG = require('../../assets/HomeScreenBackgroundImage.png');

export default function GameScreen() {
  const navigation = useNavigation<any>();
  const {
    session,
    activePlayerSession,
    settings,
    completeTask,
    discardTask,
    swapBigTask,
    answerTrivia,
    endSession,
    startSession,
  } = useGameStore();

  const park = PARKS.find(p => p.id === settings.parkId);

  useEffect(() => {
    if (!session?.active) {
      startSession();
    }
  }, []);

  const ps = activePlayerSession ?? session?.players?.[0];

  if (!session || !ps) {
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

  const maxDiscards = getMaxDiscards(ps.sessionScore);

  return (
    <ImageBackground source={GAME_BG} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <StreakFlame streak={ps.currentStreak} />
            <Text style={styles.parkName}>{park?.shortName ?? '?'}</Text>
            <View style={styles.scoreBubble}>
              <Text style={styles.scoreValue}>{ps.sessionScore}</Text>
              <Text style={styles.scorePts}>pts</Text>
            </View>
          </View>

          {/* Big Board */}
          <View style={styles.bigBoardWrapper}>
            <BigBoard
              tasks={session.bigBoard}
              sessionScore={ps.sessionScore}
              onComplete={id => completeTask(id, true)}
              onSwap={id => swapBigTask(id)}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Hand Section Label */}
          <View style={styles.handHeader}>
            <Text style={styles.handLabel}>YOUR HAND</Text>
            <DiscardPips remaining={ps.discardsRemaining} max={maxDiscards} />
          </View>

          {/* Card Carousel */}
          <CardCarousel
            cards={ps.hand}
            onComplete={id => completeTask(id, false)}
            onDiscard={id => discardTask(id)}
            onTriviaAnswer={(id, correct) => answerTrivia(id, correct)}
            discardsRemaining={ps.discardsRemaining}
          />

          {/* Session Stats Bar */}
          <View style={styles.statsBar}>
            <StatItem label="Completed" value={ps.completedTasks.length} />
            <StatItem label="Streak" value={ps.currentStreak} />
            <StatItem label="Session" value={`${ps.sessionScore} pts`} />
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

function getMaxDiscards(score: number): number {
  if (score <= 50) return 5;
  if (score <= 150) return 4;
  if (score <= 300) return 3;
  if (score <= 500) return 2;
  return 1;
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 20, 0.75)',
  },
  safe: { flex: 1 },
  scroll: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.felt,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  parkName: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: COLORS.red,
    borderRadius: RADII.chip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 70,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.redDark,
    ...SHADOWS.chip,
  },
  scoreValue: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 26,
  },
  scorePts: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  bigBoardWrapper: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  handLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: RADII.panel,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.borderPanel,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.gold,
    fontWeight: '800',
    fontSize: 18,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  endBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
    backgroundColor: COLORS.red,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.redDark,
    ...SHADOWS.button,
  },
  endBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
