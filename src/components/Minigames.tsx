import { useReducedMotion } from '../theme/useAccessibility';
import { useThemedStyles } from '../theme/useAppTheme';
import { FocusHeading } from './ReadingModal';
import { openSupport } from '../utils/support';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, AppState, AccessibilityInfo, Platform } from 'react-native';
import GameButton from './GameButton';
import { useGameStore } from '../store/gameStore';
import { useAppTheme } from '../theme/useAppTheme';
import { correctTriviaAnswers } from '../utils/trivia';
import { WHO_AM_I } from '../data/whoAmI';
import { FONTS } from '../theme/theme';

type Game = 'sprint' | 'who';
const HELP = {
  sprint: { title: 'How to play Trivia Sprint', steps: [
    'Choose 30 or 60 seconds, then tap Start. Answer 10 single-answer Disney questions before the clock runs out.',
    'Each correct answer earns that question’s normal points. Get all 10 right for 3× those points, or 9 right for 2×. Unanswered questions earn no points.',
    'Closing the panel or opening Help does not pause the clock. Review each answer afterward using Previous and Next, at your own pace. Play unlimited rounds!',
    'Minigame points add to your score. They do not change your card streak, passes, 50/50 uses, or card-completion totals.'], },
  who: { title: 'How to play Who Am I?', steps: [
    'Identify a Disney character from the clues. You start with one clue and four possible characters.',
    'Guess correctly after one clue for 15 points, two clues for 10, or all three for 5. Reveal another clue whenever you need one.',
    'You have one guess per round. A wrong guess or Show Answer earns no points. There is no timer; read the answer and play again whenever you like.',
    'Minigame points add to your score. They do not change your card streak, passes, 50/50 uses, or card-completion totals.'], },
};

export default function Minigames({ onClose }: { onClose: () => void }) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const styles = useThemedStyles(BASE_STYLES);
  const { session, startTriviaSprint, answerSprint, finishSprint, reviewSprintQuestion, startWhoAmI, revealWhoClue, answerWhoAmI, acknowledgeMinigameHelp } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [help, setHelp] = useState<Game | null>(null);
  const [now, setNow] = useState(Date.now());
  const [seconds, setSeconds] = useState<30 | 60>(session?.triviaSprint?.durationSeconds ?? 30);
  const scroll = useRef<ScrollView>(null);
  const round = session?.triviaSprint;
  const who = session?.whoAmI;
  const reviewIndex = Math.max(0, Math.min(round?.reviewIndex ?? 0, (round?.questions.length ?? 1) - 1));
  const character = WHO_AM_I.find(c => c.id === who?.characterId);
  useEffect(() => {
    if (Platform.OS === 'web' || !who || !character || game !== 'who' || help) return;
    AccessibilityInfo.announceForAccessibility(who.finished
      ? `${who.earnedPoints ? 'Correct.' : who.answer === -1 ? 'Character revealed.' : 'Not quite.'} ${character.name}. ${who.earnedPoints} points added.`
      : `Clue ${who.cluesRevealed} of 3. ${character.clues[who.cluesRevealed - 1]} ${5 * (4 - who.cluesRevealed)} points for a correct guess.`);
  }, [who?.characterId, who?.cluesRevealed, who?.finished, game, help]);
  useEffect(() => {
    const tick = () => { setNow(Date.now()); finishSprint(); };
    tick(); const timer = setInterval(tick, 200);
    const listener = AppState.addEventListener('change', tick);
    return () => { clearInterval(timer); listener.remove(); };
  }, [finishSprint]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [game, round?.answers.length, round?.finished, who?.characterId, who?.finished, reviewIndex]);
  const select = (selected: Game) => {
    setGame(selected);
    if (!session?.minigameHelpSeen?.includes(selected)) setHelp(selected);
  };
  const question = round?.questions[round.answers.length];
  const correctCount = round?.questions.filter((q, i) => correctTriviaAnswers(q).includes(round.answers[i])).length ?? 0;
  const basePoints = round?.questions.reduce((sum, q, i) => sum + (correctTriviaAnswers(q).includes(round.answers[i]) ? q.points : 0), 0) ?? 0;
  const multiplier = correctCount === 10 ? 3 : correctCount === 9 ? 2 : 1;
  const remaining = Math.max(0, Math.ceil(((round?.deadline ?? now) - now) / 1000));
  const reviewed = round?.questions[reviewIndex];
  const text = [styles.text, { color: colors.textDark }];
  const title = [text, styles.title];
  return <Modal transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => help ? setHelp(null) : game ? setGame(null) : onClose()}>
    <View style={styles.overlay}>
      <View accessibilityViewIsModal aria-hidden={!!help} accessibilityElementsHidden={!!help} importantForAccessibility={help ? 'no-hide-descendants' : 'auto'} testID="minigames-panel" style={[styles.panel, { backgroundColor: colors.surface }]}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={title}>{game === 'sprint' ? 'Trivia Sprint' : game === 'who' ? 'Who Am I?' : 'Minigames'}</Text>
          {game && <GameButton testID="minigame-help" label="Help" tone="gray" style={{ flexGrow: 0 }} onPress={() => setHelp(game)} />}
        </View>
        {game === 'sprint' && round && !round.finished && <Text testID="sprint-timer" accessibilityRole="timer" style={title}>{remaining} seconds · {round.answers.length + 1}/10</Text>}
        <ScrollView ref={scroll} style={styles.body} contentContainerStyle={styles.content}>
          {!game && <>
            <Text style={text}>A little Disney fun, wherever you are. Play as often as you like and add points to your game.</Text>
            <GameButton testID="choose-sprint" label="Trivia Sprint" sublabel={round ? round.finished ? 'View your results or play again' : `Resume · ${round.answers.length}/10 answered` : '10 questions against the clock'} tone="blue" onPress={() => select('sprint')} />
            {round && !round.finished && <Text testID="sprint-resume-status" style={text}>Your Sprint has {remaining} seconds left. Its clock is still running.</Text>}
            <GameButton testID="choose-who" label="Who Am I?" sublabel={who ? who.finished ? 'View your answer or play again' : `Resume · ${who.cluesRevealed}/3 clues revealed` : 'Guess the character · no timer'} tone="gold" onPress={() => select('who')} />
            <Text style={text}>These games add score without changing your card streak or earning passes and 50/50 uses.</Text>
          </>}
          {game === 'sprint' && (!round || round.finished) && <>
            {round?.finished && <View testID="sprint-results" accessibilityLiveRegion="polite">
              {!help ? <FocusHeading title={round.answers.length < 10 ? 'Time’s Up!' : 'Sprint Complete!'} /> : <Text style={title}>{round.answers.length < 10 ? 'Time’s Up!' : 'Sprint Complete!'}</Text>}
              <Text style={title}>{correctCount}/10 correct · +{round.earnedPoints} points</Text>
              <Text style={text}>{correctCount === 10 ? 'Perfect round! 3× points' : correctCount === 9 ? 'Great round! 2× points' : 'Normal points for every correct answer'}</Text>
              <Text testID="sprint-score-breakdown" style={text}>{basePoints} question points × {multiplier} = {round.earnedPoints} points added to your score.</Text>
              <Text style={text}>{round.answers.length - correctCount} wrong · {10 - round.answers.length} unanswered. Your card streak and reward balances are unchanged.</Text>
              {reviewed && <View testID="sprint-review-card" style={styles.review}>
                <Text testID="sprint-review-position" style={text}>Review {reviewIndex + 1} of {round.questions.length}</Text>
                <Text testID="sprint-review-question" accessibilityRole="header" accessibilityLiveRegion="polite" style={[text, styles.answer]}>{reviewed.description}</Text>
                <Text style={text}>{round.answers[reviewIndex] === undefined ? 'Unanswered' : correctTriviaAnswers(reviewed).includes(round.answers[reviewIndex]) ? 'Correct' : 'Not quite'}</Text>
                {round.answers[reviewIndex] !== undefined && <Text style={text}>Your answer: {reviewed.triviaChoices?.[round.answers[reviewIndex]]}</Text>}
                <Text style={[text, styles.answer]}>Correct answer: {correctTriviaAnswers(reviewed).map(n => reviewed.triviaChoices?.[n]).join(', ')}</Text>
                {reviewed.triviaExplanation && <Text style={text}>{reviewed.triviaExplanation}</Text>}
                <View style={styles.row}>
                  <GameButton testID="sprint-review-previous" label="Previous" tone="gray" disabled={reviewIndex === 0} onPress={() => reviewSprintQuestion(reviewIndex - 1)} />
                  <GameButton testID="sprint-review-next" label="Next" tone="blue" disabled={reviewIndex >= round.questions.length - 1} onPress={() => reviewSprintQuestion(reviewIndex + 1)} />
                </View>
                <GameButton testID="sprint-report-btn" multiline label="Report Question (public GitHub draft)" tone="gray" onPress={() => openSupport(reviewed)} />
              </View>}
            </View>}
            {!round && <Text style={text}>10 questions. 10 right earns 3× points; 9 right earns 2×. Choose your timer below.</Text>}
          </>}
          {game === 'sprint' && round && !round.finished && question && <>
            <View testID="sprint-question"><FocusHeading title={question.description} /></View>
            {question.triviaChoices?.map((choice, i) => <GameButton key={`${question.id}-${i}`} testID={`sprint-choice-${i}`} multiline label={choice} onPress={() => answerSprint(i, question.id)} tone="blue" />)}
          </>}
          {game === 'who' && (!who || !character) && <Text style={text}>One character, three clues. Guess with fewer clues to earn more points. There is no timer.</Text>}
          {game === 'who' && who && character && <>
            <Text testID="who-point-status" accessibilityLiveRegion="polite" style={title}>{who.finished ? `+${who.earnedPoints} points added` : `Clue ${who.cluesRevealed}/3 · ${5 * (4 - who.cluesRevealed)} points for a correct guess`}</Text>
            {character.clues.slice(0, who.finished ? 3 : who.cluesRevealed).map((clue, i) => <Text key={i} testID="who-clue" style={text}>{i + 1}. {clue}</Text>)}
            {who.finished ? <View testID="who-results" accessibilityLiveRegion="polite" style={styles.review}>
              <Text style={title}>{who.earnedPoints ? 'You got it!' : who.answer === -1 ? 'Character revealed' : 'Not quite!'}</Text>
              {who.answer !== undefined && who.answer >= 0 && !who.earnedPoints && <Text style={text}>Your answer: {who.choices[who.answer]}</Text>}
              <Text style={[text, styles.answer]}>Correct answer: {character.name}</Text>
              <Text style={text}>{who.earnedPoints ? `Correct after ${who.cluesRevealed} ${who.cluesRevealed === 1 ? 'clue' : 'clues'}: ${who.earnedPoints} points.` : 'No points this round.'} Your card streak and reward balances are unchanged.</Text>
            </View> : <>
              {who.choices.map((choice, i) => <GameButton key={`${character.id}-${i}`} testID={`who-choice-${i}`} label={choice} multiline tone="blue" onPress={() => answerWhoAmI(i)} />)}
              <GameButton testID="who-next-clue" label={who.cluesRevealed >= 3 ? 'All Clues Revealed' : 'Reveal Next Clue'} sublabel={who.cluesRevealed < 3 ? `${5 * (3 - who.cluesRevealed)} points if your next guess is correct` : undefined} disabled={who.cluesRevealed >= 3} tone="gold" onPress={revealWhoClue} />
              <GameButton testID="who-give-up" label="Show Answer" tone="gray" onPress={() => answerWhoAmI(-1)} />
            </>}
          </>}
          {game === 'sprint' && (!round || round.finished) && <>
            <Text testID="sprint-duration-label" style={text}>Timer for your next round: {seconds} seconds</Text>
            <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Trivia Sprint duration">
              <GameButton testID="sprint-30" label="30 seconds" selected={seconds === 30} tone={seconds === 30 ? 'blue' : 'gray'} onPress={() => setSeconds(30)} />
              <GameButton testID="sprint-60" label="60 seconds" selected={seconds === 60} tone={seconds === 60 ? 'blue' : 'gray'} onPress={() => setSeconds(60)} />
            </View>
          </>}
        </ScrollView>
        {game === 'sprint' && (!round || round.finished) && <>
          <GameButton testID="sprint-start" label={round ? 'Play Again' : 'Start Trivia Sprint'} onPress={() => { setNow(Date.now()); startTriviaSprint(seconds); }} />
        </>}
        {game === 'who' && (!who || who.finished) && <GameButton testID="who-start" label={who ? 'Play Again' : 'Start Who Am I?'} tone="gold" onPress={startWhoAmI} />}
        <GameButton testID="minigames-close" label={game ? 'Back to Minigames' : 'Back to Challenges'} onPress={() => game ? setGame(null) : onClose()} tone="gray" />
      </View>
      {help && <View style={[styles.helpOverlay, styles.overlay]}>
        <View testID="minigame-tips" accessibilityViewIsModal style={[styles.panel, { backgroundColor: colors.surface }]}>
          <FocusHeading title={HELP[help].title} />
          <ScrollView style={styles.body} contentContainerStyle={styles.content}>{HELP[help].steps.map((step, i) => <Text key={i} style={text}>{i + 1}. {step}</Text>)}{help === 'sprint' && round && !round.finished && <Text testID="sprint-help-clock" style={[text, styles.answer]}>Your Sprint clock is still running while Help is open.</Text>}</ScrollView>
          <GameButton testID="minigame-tips-dismiss" label="Got It!" onPress={() => { acknowledgeMinigameHelp(help); setHelp(null); }} />
        </View>
      </View>}
    </View>
  </Modal>;
}
const BASE_STYLES = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  helpOverlay: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  panel: { width: '100%', maxWidth: 520, maxHeight: '92%', padding: 18, borderRadius: 22, gap: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  body: { flexShrink: 1 }, content: { gap: 14 },
  text: { fontSize: 16, lineHeight: 23 }, title: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 29, flexShrink: 1 },
  question: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 28 },
  row: { flexDirection: 'row', gap: 8 }, review: { gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#888888' },
  answer: { fontWeight: 'bold' },
});
