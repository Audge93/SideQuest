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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import CardCarousel from '../components/CardCarousel';
import BigBoard from '../components/BigBoard';
import StreakFlame from '../components/StreakFlame';
import DiscardPips from '../components/DiscardPips';
import { PARKS } from '../data/parks';
import { COLORS, SHADOWS, RADII } from '../theme/balatro';

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
          <Text style={styles.parkName}>{park?.shortName ?? '?'}</Text>
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.textBody,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.chip,
  },
  parkName: {
    color: COLORS.textDark,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: RADII.chip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 70,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.greenDark,
    ...SHADOWS.chip,
  },
  scoreValue: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 26,
  },
  scorePts: {
    color: 'rgba(255,255,255,0.8)',
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
    color: COLORS.textMuted,
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
    ...SHADOWS.card,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: 18,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  endBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: RADII.button,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  endBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: 15,
  },
});
