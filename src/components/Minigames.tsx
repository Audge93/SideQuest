import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, AppState } from 'react-native';
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
    'Closing the panel does not pause the clock. Review every answer afterward at your own pace. Play unlimited rounds!'], },
  who: { title: 'How to play Who Am I?', steps: [
    'Identify a Disney character from the clues. You start with one clue and four possible characters.',
    'Guess correctly after one clue for 15 points, two clues for 10, or all three for 5. Reveal another clue whenever you need one.',
    'You have one guess per round. A wrong guess or Show Answer earns no points. There is no timer; read the answer and play again whenever you like.'], },
};

export default function Minigames({ onClose }: { onClose: () => void }) {
  const { colors } = useAppTheme();
  const { session, startTriviaSprint, answerSprint, finishSprint, startWhoAmI, revealWhoClue, answerWhoAmI, acknowledgeMinigameHelp } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [help, setHelp] = useState<Game | null>(null);
  const [now, setNow] = useState(Date.now());
  const [seconds, setSeconds] = useState<30 | 60>(30);
  const scroll = useRef<ScrollView>(null);
  const round = session?.triviaSprint;
  const who = session?.whoAmI;
  const character = WHO_AM_I.find(c => c.id === who?.characterId);
  useEffect(() => {
    const tick = () => { setNow(Date.now()); finishSprint(); };
    tick(); const timer = setInterval(tick, 200);
    const listener = AppState.addEventListener('change', tick);
    return () => { clearInterval(timer); listener.remove(); };
  }, [finishSprint]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [game, round?.answers.length, who?.characterId]);
  const select = (selected: Game) => {
    setGame(selected);
    if (!session?.minigameHelpSeen?.includes(selected)) setHelp(selected);
  };
  const question = round?.questions[round.answers.length];
  const correctCount = round?.questions.filter((q, i) => correctTriviaAnswers(q).includes(round.answers[i])).length ?? 0;
  const text = [styles.text, { color: colors.textDark }];
  const title = [text, styles.title];
  return <Modal transparent animationType="fade" onRequestClose={() => help ? setHelp(null) : game ? setGame(null) : onClose()}>
    <View style={styles.overlay}>
      <View accessibilityElementsHidden={!!help} importantForAccessibility={help ? 'no-hide-descendants' : 'auto'} testID="minigames-panel" style={[styles.panel, { backgroundColor: colors.surface }]}>
        <View style={styles.heading}>
          <Text style={title}>{game === 'sprint' ? 'Trivia Sprint' : game === 'who' ? 'Who Am I?' : 'Minigames'}</Text>
          {game && <GameButton testID="minigame-help" label="Help" tone="gray" style={{ flexGrow: 0 }} onPress={() => setHelp(game)} />}
        </View>
        <ScrollView ref={scroll} style={styles.body} contentContainerStyle={styles.content}>
          {!game && <>
            <Text style={text}>A little Disney fun, wherever you are. Play as often as you like and add points to your game.</Text>
            <GameButton testID="choose-sprint" label="Trivia Sprint" sublabel="10 questions against the clock" tone="blue" onPress={() => select('sprint')} />
            {round && !round.finished && <Text style={text}>Your Sprint is in progress. Its clock is still running.</Text>}
            <GameButton testID="choose-who" label="Who Am I?" sublabel="Guess the character from clues" tone="gold" onPress={() => select('who')} />
          </>}
          {game === 'sprint' && (!round || round.finished) && <>
            {round?.finished && <View testID="sprint-results">
              <Text style={title}>{correctCount}/10 correct · +{round.earnedPoints} points</Text>
              <Text style={text}>{correctCount === 10 ? 'Perfect round! 3× points' : correctCount === 9 ? 'Great round! 2× points' : 'Normal points for every correct answer'}</Text>
              {round.questions.map((q, i) => <View key={q.id} style={styles.review}>
                <Text style={text}>{i + 1}. {q.description}</Text>
                <Text style={text}>{round.answers[i] === undefined ? 'Unanswered' : correctTriviaAnswers(q).includes(round.answers[i]) ? 'Correct' : `Your answer: ${q.triviaChoices?.[round.answers[i]]}`}</Text>
                <Text style={[text, styles.answer]}>Correct answer: {correctTriviaAnswers(q).map(n => q.triviaChoices?.[n]).join(', ')}</Text>
                {q.triviaExplanation && <Text style={text}>{q.triviaExplanation}</Text>}
              </View>)}
            </View>}
            {!round && <Text style={text}>10 questions. 10 right earns 3× points; 9 right earns 2×. Choose your timer below.</Text>}
          </>}
          {game === 'sprint' && round && !round.finished && question && <>
            <Text testID="sprint-timer" accessibilityRole="timer" style={title}>{Math.max(0, Math.ceil((round.deadline - now) / 1000))} seconds · {round.answers.length + 1}/10</Text>
            <Text testID="sprint-question" style={[text, styles.question]}>{question.description}</Text>
            {question.triviaChoices?.map((choice, i) => <GameButton key={`${question.id}-${i}`} testID={`sprint-choice-${i}`} multiline label={choice} onPress={() => answerSprint(i, question.id)} tone="blue" />)}
          </>}
          {game === 'who' && (!who || !character) && <Text style={text}>One character, three clues. Guess with fewer clues to earn more points. There is no timer.</Text>}
          {game === 'who' && who && character && <>
            <Text style={title}>{who.finished ? `+${who.earnedPoints} points` : `Clue ${who.cluesRevealed}/3 · ${5 * (4 - who.cluesRevealed)} points`}</Text>
            {character.clues.slice(0, who.finished ? 3 : who.cluesRevealed).map((clue, i) => <Text key={i} testID="who-clue" style={text}>{i + 1}. {clue}</Text>)}
            {who.finished ? <View testID="who-results" style={styles.review}>
              <Text style={title}>{who.earnedPoints ? 'You got it!' : who.answer === -1 ? 'Character revealed' : 'Not quite!'}</Text>
              {who.answer !== undefined && who.answer >= 0 && !who.earnedPoints && <Text style={text}>Your answer: {who.choices[who.answer]}</Text>}
              <Text style={[text, styles.answer]}>Correct answer: {character.name}</Text>
            </View> : <>
              {who.choices.map((choice, i) => <GameButton key={`${character.id}-${i}`} testID={`who-choice-${i}`} label={choice} multiline tone="blue" onPress={() => answerWhoAmI(i)} />)}
              <GameButton testID="who-next-clue" label="Reveal Next Clue" disabled={who.cluesRevealed >= 3} tone="gold" onPress={revealWhoClue} />
              <GameButton testID="who-give-up" label="Show Answer" tone="gray" onPress={() => answerWhoAmI(-1)} />
            </>}
          </>}
        </ScrollView>
        {game === 'sprint' && (!round || round.finished) && <>
          <View style={styles.row}>
            <GameButton testID="sprint-30" label="30 seconds" tone={seconds === 30 ? 'blue' : 'gray'} onPress={() => setSeconds(30)} />
            <GameButton testID="sprint-60" label="60 seconds" tone={seconds === 60 ? 'blue' : 'gray'} onPress={() => setSeconds(60)} />
          </View>
          <GameButton testID="sprint-start" label={round ? 'Play Again' : 'Start Trivia Sprint'} onPress={() => { setNow(Date.now()); startTriviaSprint(seconds); }} />
        </>}
        {game === 'who' && (!who || who.finished) && <GameButton testID="who-start" label={who ? 'Play Again' : 'Start Who Am I?'} tone="gold" onPress={startWhoAmI} />}
        <GameButton testID="minigames-close" label={game ? 'Back to Minigames' : 'Back to Challenges'} onPress={() => game ? setGame(null) : onClose()} tone="gray" />
      </View>
      {help && <View style={[styles.helpOverlay, styles.overlay]}>
        <View testID="minigame-tips" accessibilityViewIsModal style={[styles.panel, { backgroundColor: colors.surface }]}>
          <Text style={title}>{HELP[help].title}</Text>
          <ScrollView style={styles.body} contentContainerStyle={styles.content}>{HELP[help].steps.map((step, i) => <Text key={i} style={text}>{i + 1}. {step}</Text>)}</ScrollView>
          <GameButton testID="minigame-tips-dismiss" label="Got It!" onPress={() => { acknowledgeMinigameHelp(help); setHelp(null); }} />
        </View>
      </View>}
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
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
