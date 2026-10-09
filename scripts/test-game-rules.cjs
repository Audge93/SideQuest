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
  state().startTriviaSprint(30);
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
state().startTriviaSprint(30);
const inProgress=state().session.triviaSprint;
state().finishSprint(); assert.equal(state().session.triviaSprint.finished,false);
state().startTriviaSprint(60); assert.equal(state().session.triviaSprint.id,inProgress.id);
state().loadSlot(state().activeSlotId);assert.equal(state().session.triviaSprint.id,inProgress.id);
store.setState({session:{...state().session,triviaSprint:{...inProgress,deadline:Date.now()-1}}});
state().answerSprint(0);assert.equal(state().session.triviaSprint.finished,true);assert.equal(state().session.triviaSprint.answers.length,0);
console.log('Trivia Sprint passed: multiplier thresholds, exactly-once scoring, expiration, unlimited replay, and save/resume.');
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
