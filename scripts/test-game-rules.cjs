const fs = require('fs'), path = require('path'), vm = require('vm'), ts = require('typescript'), assert = require('node:assert/strict');
const cache = new Map();
const storage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
function load(file) {
  file = path.resolve(file); if(cache.has(file)) return cache.get(file).exports;
  const module = {exports:{}}; cache.set(file,module);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
  const localRequire = id => id === '@react-native-async-storage/async-storage' ? {__esModule:true,default:storage}
    : id.startsWith('.') ? load(path.resolve(path.dirname(file),id)+'.ts') : require(id);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})(localRequire,module,module.exports);
  return module.exports;
}
const store = load('src/store/gameStore.ts').useGameStore;
const state = () => store.getState();
state().startSession('Rules test');
assert.equal(state().session.fiftyFiftyUses,2);
const fixture = {id:'rules-trivia',size:'small',category:'trivia',displayCategory:'Trivia',description:'Rules fixture',points:5,difficulty:'easy',triviaChoices:['right','wrong 1','wrong 2','wrong 3'],triviaAnswer:0};
store.setState({session:{...state().session,hand:[fixture,...state().session.hand.slice(1)]}});
state().useTriviaFiftyFifty(fixture.id);
const removed = state().session.triviaEliminatedChoices[fixture.id];
assert.equal(removed.length,2); assert.ok(!removed.includes(0)); assert.equal(new Set(removed).size,2);
assert.equal(state().session.fiftyFiftyUses,1);
state().useTriviaFiftyFifty(fixture.id);assert.equal(state().session.fiftyFiftyUses,1);
const slotId=state().activeSlotId;state().loadSlot(slotId);
assert.deepEqual(state().session.triviaEliminatedChoices[fixture.id],removed);
store.setState({session:{...state().session,totalCompletions:4}});
state().answerTrivia(fixture.id,true);
assert.equal(state().session.totalCompletions,5);assert.equal(state().session.fiftyFiftyUses,2);
assert.equal(state().session.triviaEliminatedChoices[fixture.id],undefined);
store.setState({session:{...state().session,hand:[fixture],totalCompletions:9,fiftyFiftyUses:3}});
state().answerTrivia(fixture.id,false);assert.equal(state().session.totalCompletions,9);assert.equal(state().session.fiftyFiftyUses,3);
store.setState({session:{...state().session,hand:[fixture]}});state().discardTask(fixture.id);
assert.equal(state().session.totalCompletions,9);assert.equal(state().session.fiftyFiftyUses,3);
state().completeTask(state().session.challengeTasks[0].id,true);
assert.equal(state().session.totalCompletions,10);assert.equal(state().session.fiftyFiftyUses,3);
store.setState({session:{...state().session,hand:[{...fixture,triviaAnswer:undefined,triviaAnswers:[0,1]}]}});
state().useTriviaFiftyFifty(fixture.id);assert.equal(state().session.fiftyFiftyUses,3);
store.setState({session:{...state().session,hand:[fixture],fiftyFiftyUses:0}});
state().useTriviaFiftyFifty(fixture.id);assert.equal(state().session.triviaEliminatedChoices[fixture.id],undefined);
state().updateSettings({darkMode:'dark',hapticsEnabled:false});state().loadSlot(slotId);
assert.equal(state().settings.darkMode,'dark');assert.equal(state().settings.hapticsEnabled,false);
for(const key of ['photo','act','trivia'])state().updateCategoryToggle(key,false);
state().updateCategoryToggle('find',false);assert.equal(state().settings.categoryToggles.find,true);
assert.equal(state().saveSlots.find(s=>s?.id===slotId).settings.categoryToggles.photo,false);
console.log('Game rules passed: 50/50 eligibility, spending, persistence, rewards, cap, category safeguard, and saved preferences.');
for (const count of [10, 9, 8, 0]) {
  store.setState({session:{...state().session,triviaSprint:undefined}});
  state().startTriviaSprint();
  const round = state().session.triviaSprint;
  const before = state().session.sessionScore;
  const base = round.questions.slice(0,count).reduce((n,q)=>n+q.points,0);
  for(let i=0;i<10;i++) {
    const q=state().session.triviaSprint.questions[i];
    const right=q.triviaAnswers?.[0] ?? q.triviaAnswer;
    state().answerSprint(i<count ? right : (right+1)%q.triviaChoices.length);
  }
  const earned=base*(count===10?3:count===9?2:1);
  assert.equal(state().session.sessionScore,before+earned);
  state().finishSprint(); assert.equal(state().session.sessionScore,before+earned);
}
store.setState({session:{...state().session,triviaSprint:undefined}});
state().startTriviaSprint();
const inProgress=state().session.triviaSprint;
assert.equal(inProgress.durationSeconds, 60);
assert.ok(inProgress.deadline - Date.now() > 59_000 && inProgress.deadline - Date.now() <= 60_000);
state().finishSprint(); assert.equal(state().session.triviaSprint.finished,false);
state().startTriviaSprint(); assert.equal(state().session.triviaSprint.id,inProgress.id);
state().loadSlot(state().activeSlotId);assert.equal(state().session.triviaSprint.id,inProgress.id);
store.setState({session:{...state().session,triviaSprint:{...inProgress,deadline:Date.now()-1}}});
state().answerSprint(0);assert.equal(state().session.triviaSprint.finished,true);assert.equal(state().session.triviaSprint.answers.length,0);
const reviewScore = state().session.sessionScore;
state().reviewSprintQuestion(9); assert.equal(state().session.triviaSprint.reviewIndex, 9);
for (const invalid of [-1, 10, 1.5]) state().reviewSprintQuestion(invalid);
assert.equal(state().session.triviaSprint.reviewIndex, 9);
state().loadSlot(state().activeSlotId);
assert.equal(state().session.triviaSprint.reviewIndex, 9); assert.equal(state().session.triviaSprint.durationSeconds, 60);
assert.equal(state().session.sessionScore, reviewScore);
state().resetTriviaSprint(); assert.equal(state().session.triviaSprint, undefined);
state().loadSlot(state().activeSlotId); assert.equal(state().session.triviaSprint, undefined);
assert.equal(state().session.sessionScore, reviewScore);
state().startTriviaSprint(); assert.equal(state().session.triviaSprint.durationSeconds, 60);
state().reviewSprintQuestion(2); assert.equal(state().session.triviaSprint.reviewIndex, undefined);
const partial = state().session.triviaSprint; const cardHand = state().session.hand;
state().answerSprint(partial.questions[0].triviaAnswers?.[0] ?? partial.questions[0].triviaAnswer);
state().resetTriviaSprint(); state().loadSlot(state().activeSlotId);
assert.equal(state().session.triviaSprint, undefined); assert.equal(state().session.sessionScore, reviewScore);
assert.deepEqual(state().session.hand, cardHand);
state().finishSprint(); assert.equal(state().session.sessionScore, reviewScore);
state().startTriviaSprint(); assert.notEqual(state().session.triviaSprint.id, partial.id);
assert.deepEqual(state().session.triviaSprint.answers, []);
console.log('Trivia Sprint passed: multiplier thresholds, exactly-once scoring, expiration, fixed minute, and persisted reset without partial rewards.');
const characters = load('src/data/whoAmI.ts').WHO_AM_I;
for(const clues of [1,2,3]) {
  store.setState({session:{...state().session,whoAmI:undefined}});state().startWhoAmI();
  for(let i=1;i<clues;i++) state().revealWhoClue();
  const round=state().session.whoAmI;
  const right=characters.find(c=>c.id===round.characterId).name;
  const before=state().session.sessionScore;
  state().answerWhoAmI(round.choices.indexOf(right));
  assert.equal(state().session.sessionScore,before+(4-clues)*5);
  state().answerWhoAmI(round.choices.indexOf(right));assert.equal(state().session.sessionScore,before+(4-clues)*5);
}
store.setState({session:{...state().session,whoAmI:undefined}});state().startWhoAmI();
state().revealWhoClue();state().loadSlot(state().activeSlotId);assert.equal(state().session.whoAmI.cluesRevealed,2);
const beforeWho=state().session.sessionScore;state().answerWhoAmI(-1);assert.equal(state().session.sessionScore,beforeWho);
state().acknowledgeMinigameHelp('who');state().loadSlot(state().activeSlotId);assert.ok(state().session.minigameHelpSeen.includes('who'));
console.log('Who Am I passed: clue-based scoring, no duplicate awards, reveal, persistence, and remembered help.');
// Retired attractions leave resumed challenge boards; stable IDs get corrected wording.
const liveRide=load('src/data/parks.ts').RIDES.find(r=>r.id==='wdw-hs-rock-n-roller-coaster');
store.setState({session:{...state().session,challengeTasks:[{...fixture,size:'big',category:'ride',id:'ride-'+liveRide.id,rideId:liveRide.id,description:'Old coaster name'}]}});
state().autoSave();state().loadSlot(state().activeSlotId);
assert.equal(state().session.challengeTasks[0].description,'Ride '+liveRide.name);
store.setState({session:{...state().session,challengeTasks:[{...fixture,size:'big',category:'ride',id:'retired-fixture',rideId:'wdw-ak-dinosaur'}]}});
state().autoSave();state().loadSlot(state().activeSlotId);
assert.equal(state().session.challengeTasks.length,3);assert.ok(state().session.challengeTasks.every(t=>t.rideId!=='wdw-ak-dinosaur'));
console.log('Saved content passed: current attraction names and retired ride replacement.');
state().updateSettings({parkIds:['wdw-hs'],heightFilterEnabled:true,minHeightInches:32,categoryToggles:{find:true,photo:false,trivia:false,act:false,ride:true,treat:false,pins:false,meet:false,explore:false,seek:false}});
state().startSession('Height filter check');
for(let i=0;i<8;i++){
  assert.equal(state().session.challengeTasks.length,3);
  assert.ok(state().session.challengeTasks.every(t=>t.category==='ride'&&t.parkId==='wdw-hs'&&t.heightRequirement<=32));
  state().completeTask(state().session.challengeTasks[0].id,true);
}
console.log('Height filtering passed: initial and replacement ride activities respect park and shortest-rider height.');
assert.equal(state().updateSettings({seatedOnly:true}),false);
assert.equal(state().settings.seatedOnly,false);
assert.equal(state().updateSettings({
  seatedOnly:true,lessWalking:true,noPerforming:true,reduceMotion:'on',textSize:'extra-large',readableFont:true,highContrast:true,
  categoryToggles:{find:true,photo:true,trivia:true,act:true,ride:true,treat:true,pins:true,meet:true,explore:true,seek:true},
}),true);
const {matchesActivityPreferences} = load('src/data/activityPreferences.ts');
const {SMALL_TASKS,BIG_TASKS} = load('src/data/tasks.ts');
assert.equal(matchesActivityPreferences(BIG_TASKS.find(t=>t.id==='pins-expansion-15'),{...state().settings,seatedOnly:false,lessWalking:false}),false);
assert.equal(matchesActivityPreferences(SMALL_TASKS.find(t=>t.id==='act-m-2'),state().settings),false);
assert.equal(matchesActivityPreferences(SMALL_TASKS.find(t=>t.id==='photo-m-4'),state().settings),false);
assert.equal(matchesActivityPreferences({...fixture,id:'unknown-task',category:'find'},state().settings),false);
for(const parkId of ['wdw-mk','wdw-ep','wdw-hs','wdw-ak']) {
  state().updateSettings({parkIds:[parkId]});state().startSession('Comfort check');
  for(let i=0;i<8;i++) {
    assert.equal(state().session.hand.length,5);assert.equal(state().session.challengeTasks.length,3);
    assert.ok(state().session.hand.every(t=>matchesActivityPreferences(t,state().settings)));
    assert.ok(state().session.challengeTasks.every(t=>t.id.startsWith('comfort-') || t.id.startsWith('explore-e-1')));
    state().completeTask(state().session.challengeTasks[0].id,true);
  }
}
const comfortSlot=state().activeSlotId;
state().loadSlot(comfortSlot);
assert.equal(state().settings.reduceMotion,'on');assert.equal(state().settings.textSize,'extra-large');
assert.equal(state().updateSettings({seatedOnly:false,lessWalking:true}),true);
assert.equal(matchesActivityPreferences(BIG_TASKS.find(t=>t.id==='treat-expansion-1'),state().settings),true);
console.log('Comfort rules passed: reviewed activity filtering, four-park full boards/refills, incompatible-setting safeguard, and persistence.');

const originalSave = JSON.parse(JSON.stringify(state().saveSlots.find(Boolean)));
store.setState({ saveSlots: [originalSave, null, null], activeSlotId: originalSave.id, session: originalSave.session, settings: originalSave.settings });
const setupSettings = { ...state().settings, parkIds: ['wdw-ak'], seatedOnly: false, lessWalking: false, noPerforming: false,
  heightFilterEnabled: true, minHeightInches: 0, categoryToggles: { ...state().settings.categoryToggles, pins: false } };
const beforeSetup = JSON.stringify({ settings: state().settings, player: state().player, session: state().session, saves: state().saveSlots });
assert.equal(state().startSession('Invalid name', { settings: setupSettings, playerName: '  ' }), false);
assert.equal(state().startSession('Invalid pool', { settings: { ...setupSettings, categoryToggles: Object.fromEntries(Object.keys(setupSettings.categoryToggles).map(key => [key, false])) }, playerName: 'New Player' }), false);
assert.equal(JSON.stringify({ settings: state().settings, player: state().player, session: state().session, saves: state().saveSlots }), beforeSetup);
assert.equal(state().startSession('  Family Day  ', { settings: setupSettings, playerName: '  New Player  ' }), true);
assert.deepEqual(state().saveSlots[0], originalSave);
assert.equal(state().player.name, 'New Player');
assert.equal(state().saveSlots[1].name, 'Family Day');
assert.deepEqual(state().session.parkIds, ['wdw-ak']);
assert.equal(state().session.hand.length, 5); assert.equal(state().session.challengeTasks.length, 3);
assert.ok(state().session.challengeTasks.every(task => task.category !== 'pins' && (task.category !== 'ride' || !task.heightRequirement)));
state().loadSlot(originalSave.id);
assert.deepEqual(state().settings.parkIds, originalSave.settings.parkIds);
assert.equal(state().settings.categoryToggles.pins, originalSave.settings.categoryToggles.pins);
store.setState({ saveSlots: [originalSave, { ...originalSave, id: 'full-2' }, { ...originalSave, id: 'full-3' }] });
const fullBefore = JSON.stringify(state().saveSlots);
assert.equal(state().startSession('No space', { settings: setupSettings, playerName: 'Another Player' }), false);
assert.equal(JSON.stringify(state().saveSlots), fullBefore);
console.log('New-game setup passed: atomic creation, validation, prior-save isolation, zero-height filtering, and full-slot protection.');

// Badge thresholds, ending/resuming, and minigame score unlocks use the same progress rules.
const { gameBadgeStats, badgeProgress } = load('src/utils/badges.ts');
store.setState({session:null,activeSlotId:null,saveSlots:[null,null,null],newlyEarnedBadges:[]});
state().startSession('Badge rules');
const badgeSlot = state().saveSlots.find(s=>s);
const blankBadges = badgeSlot.badges.map(b=>({...b,earned:false,earnedAt:undefined}));
function badgeScenario(count, score=0, streak=0, parks=['wdw-mk']) {
  const completedTasks = Array.from({length:count},(_,i)=>({...fixture,id:'badge-card-'+i,category:'find'}));
  store.setState({session:{...badgeSlot.session,completedTasks,totalCompletions:count,sessionScore:score,currentStreak:streak,parkIds:parks},
    activeSlotId:badgeSlot.id,saveSlots:[{...badgeSlot,badges:blankBadges,categoryCompletions:{},visitedParks:parks},null,null],newlyEarnedBadges:[]});
  state().refreshBadges(); return state().saveSlots[0];
}
for(const [tier,goal] of [['bronze',10],['silver',25],['gold',50],['platinum',100]]) {
  assert.equal(badgeScenario(goal-1).badges.find(b=>b.id==='sharp-eye-'+tier).earned,false);
  assert.equal(badgeScenario(goal).badges.find(b=>b.id==='sharp-eye-'+tier).earned,true);
}
for(const [tier,goal] of [['bronze',100],['silver',500],['gold',1000],['platinum',5000]]) {
  assert.equal(badgeScenario(0,goal-1).badges.find(b=>b.id==='score-'+tier).earned,false);
  assert.equal(badgeScenario(0,goal).badges.find(b=>b.id==='score-'+tier).earned,true);
}
for(const [tier,goal] of [['bronze',5],['silver',10],['gold',20],['platinum',30]]) {
  assert.equal(badgeScenario(0,0,goal-1).badges.find(b=>b.id==='streak-'+tier).earned,false);
  assert.equal(badgeScenario(0,0,goal).badges.find(b=>b.id==='streak-'+tier).earned,true);
}
badgeScenario(9,95,4); state().endSession();
const endedSlot = state().saveSlots[0];
assert.equal(gameBadgeStats(endedSlot,state().session).categoryCounts.find,9);
state().loadSlot(endedSlot.id); state().completeTask(state().session.hand[0].id,false);
assert.equal(gameBadgeStats(state().saveSlots[0],state().session).completions,10);
const scoreSlot=badgeScenario(0,95);
state().startWhoAmI(); const whoRound=state().session.whoAmI;
const whoName=characters.find(c=>c.id===whoRound.characterId).name;
state().answerWhoAmI(whoRound.choices.indexOf(whoName));
assert.equal(state().saveSlots[0].badges.find(b=>b.id==='score-bronze').earned,true);
assert.equal(state().session.totalCompletions,0);
const awardTime=state().saveSlots[0].badges.find(b=>b.id==='score-bronze').earnedAt;
state().refreshBadges();assert.equal(state().newlyEarnedBadges.filter(b=>b.id==='score-bronze').length,1);
assert.equal(state().saveSlots[0].badges.find(b=>b.id==='score-bronze').earnedAt,awardTime);
const allCats = ['find','photo','trivia','act','ride','treat','pins','meet','explore','seek'];
const tasks = allCats.flatMap(category=>Array.from({length:100},(_,i)=>({...fixture,id:category+i,category})));
store.setState({session:{...state().session,completedTasks:tasks,totalCompletions:1000,sessionScore:5000,currentStreak:30,parkIds:['wdw-mk','wdw-hs','wdw-ep','wdw-ak']}});
state().refreshBadges(); assert.ok(state().saveSlots[0].badges.every(b=>b.earned));
const snapshot=gameBadgeStats(state().saveSlots[0],state().session);
assert.equal(badgeProgress(blankBadges.find(b=>b.id==='completionist-platinum'),snapshot,state().saveSlots[0].badges).current,10);
console.log('Badges passed: every category/score/streak threshold, completionist tiers, per-game counts, no double counting, minigame unlocks, and exactly-once awards.');

// A browser/tab can close before the 30-second timer. Every card action must
// update the save slot that Continue Game actually loads, immediately.
store.setState({session:null,activeSlotId:null,saveSlots:[null,null,null],newlyEarnedBadges:[]});
state().startSession('Immediate saves');
function assertImmediateResume() {
  const expected = JSON.parse(JSON.stringify(state().session));
  const active = state().saveSlots.find(s => s?.id === state().activeSlotId);
  assert.deepEqual(active.session, expected);
  state().loadSlot(active.id);
  assert.deepEqual(state().session, expected);
}
function finishDraft() {
  const draft = state().session.draft;
  assert.ok(draft);
  const chosen = draft.options[0];
  state().chooseDraftCard(chosen.id);
  assertImmediateResume();
  assert.equal(state().session.hand[draft.slotIndex].id, chosen.id);
  assert.equal(state().session.hand.length, 5);
  assert.equal(state().session.draft, null);
}
state().completeTask(state().session.hand[0].id, false);
assertImmediateResume(); finishDraft();
state().discardTask(state().session.hand[0].id);
assertImmediateResume(); finishDraft();
state().answerTrivia(state().session.hand[0].id, false);
assertImmediateResume(); finishDraft();
state().completeTask(state().session.challengeTasks[0].id, true);
assertImmediateResume();
state().swapChallengeTask(state().session.challengeTasks[0].id);
assertImmediateResume();
console.log('Immediate saves passed: completion, discard, wrong trivia, replacement choice, and challenge completion/swap survive resuming without waiting for the timer.');
