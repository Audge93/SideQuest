import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Dimensions,
} from 'react-native';
import Confetti from '../components/Confetti';
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
  const {
    session,
    settings,
    completeTask,
    discardTask,
    swapChallengeTask,
    answerTrivia,
    startSession,
  } = useGameStore();

  const parkId = settings.parkIds?.[0];
  const park = PARKS.find(p => p.id === parkId);

  const [showSmallConfetti, setShowSmallConfetti] = useState(false);
  const [showBigFirework, setShowBigFirework] = useState(false);

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

  const handleCompleteSmall = (id: string) => {
    completeTask(id, false);
    setShowSmallConfetti(true);
  };

  const handleCompleteBig = (id: string) => {
    completeTask(id, true);
    setShowBigFirework(true);
  };

  return (
    <ImageBackground
      source={require('../../assets/HomeScreenBackgroundImage.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <StreakFlame streak={session.currentStreak} />
          <Text style={styles.parkName}>{park?.name ?? '?'}</Text>
          <View style={styles.scoreBubble}>
            <Text style={styles.scoreValue}>{session.sessionScore}</Text>
            <Text style={styles.scorePts}>pts</Text>
          </View>
        </View>

        {/* Challenge Tasks */}
        <View style={styles.bigBoardWrapper}>
          <BigBoard
            tasks={session.challengeTasks}
            sessionScore={session.sessionScore}
            onComplete={handleCompleteBig}
            onSwap={id => swapChallengeTask(id)}
          />
        </View>

        {/* Divider + Hand label */}
        <View style={styles.divider} />
        <View style={styles.handHeader}>
          <Text style={styles.handLabel}>YOUR HAND</Text>
          <DiscardPips remaining={session.discardsRemaining} />
        </View>

        {/* Card Carousel */}
        <View style={styles.carouselWrapper}>
          <CardCarousel
            cards={session.hand}
            onComplete={handleCompleteSmall}
            onDiscard={id => discardTask(id)}
            onTriviaAnswer={(id, correct) => answerTrivia(id, correct)}
            discardsRemaining={session.discardsRemaining}
          />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <StatItem label="Completed" value={session.completedTasks.length} />
          <StatItem label="Streak" value={session.currentStreak} />
          <StatItem label="Session" value={`${session.sessionScore} pts`} />
        </View>

        {/* Small confetti for hand card completion */}
        {showSmallConfetti && (
          <Confetti type="small" onDone={() => setShowSmallConfetti(false)} />
        )}

        {/* Big firework for challenge task completion */}
        {showBigFirework && (
          <Confetti type="big" onDone={() => setShowBigFirework(false)} />
        )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(12 * sw),
    paddingVertical: Math.round(10 * sh),
    marginTop: Math.round(8 * sh),
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.chip,
  },
  parkName: {
    color: COLORS.textDark,
    fontWeight: '900',
    fontSize: Math.round(13 * sw),
    letterSpacing: 0.5,
    flexShrink: 1,
    textAlign: 'center',
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: RADII.chip,
    paddingHorizontal: Math.round(10 * sw),
    paddingVertical: Math.round(3 * sh),
    minWidth: Math.round(52 * sw),
    borderBottomWidth: 2,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.chip,
  },
  scoreValue: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: Math.round(16 * sw),
    lineHeight: Math.round(20 * sw),
  },
  scorePts: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Math.round(8 * sw),
    fontWeight: '600',
  },
  bigBoardWrapper: {
    marginTop: Math.round(8 * sh),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: Math.round(20 * sw),
    marginTop: Math.round(10 * sh),
    marginBottom: Math.round(6 * sh),
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(20 * sw),
    marginBottom: Math.round(8 * sh),
  },
  handLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(10 * sw),
    fontWeight: '700',
    letterSpacing: 2,
  },
  carouselWrapper: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    marginHorizontal: Math.round(16 * sw),
    borderRadius: RADII.panel,
    paddingVertical: Math.round(6 * sh),
    marginTop: Math.round(6 * sh),
    marginBottom: Math.round(8 * sh),
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
    fontSize: Math.round(14 * sw),
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: Math.round(9 * sw),
    marginTop: 1,
  },
});
