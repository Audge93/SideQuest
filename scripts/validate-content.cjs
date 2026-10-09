const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function readData(name) {
  const filename = path.join(__dirname, '..', 'src', 'data', `${name}.ts`);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const output = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(output, output.exports, id => id.startsWith('.') ? readData(path.basename(id)) : require(id));
  return output.exports;
}

const { SMALL_TASKS, BIG_TASKS, RIDE_ACTIVITY_TASKS, generateRideTasks } = readData('tasks');
const { TRIVIA_TASKS } = readData('trivia');
const { PARKS, RIDES } = readData('parks');
const groups = [
  [SMALL_TASKS, 'small', ['find', 'photo', 'act']],
  [TRIVIA_TASKS, 'small', ['trivia']],
  [BIG_TASKS, 'big', ['treat', 'pins', 'meet', 'explore', 'seek']],
  [RIDE_ACTIVITY_TASKS, 'big', ['ride']],
  [generateRideTasks(RIDES), 'big', ['ride']],
];
const ids = new Set();
const descriptions = new Set();
for (const [tasks, size, categories] of groups) {
  for (const task of tasks) {
    assert(task.id && !ids.has(task.id), `Duplicate or empty ID: ${task.id}`);
    ids.add(task.id);
    assert.equal(task.size, size, task.id);
    assert(categories.includes(task.category), `Wrong content array: ${task.id}`);
    assert(task.displayCategory && task.description.trim(), `Missing text: ${task.id}`);
    // Ride names can recur across parks; compare those within their park.
    const normalized = (task.category === 'ride' ? `${task.parkId}:` : '') +
      task.description.toLowerCase().replace(/[^a-z0-9]/g, '');
    assert(!descriptions.has(normalized), `Duplicate wording: ${task.id}`);
    descriptions.add(normalized);
    const tier = ['easy', 'medium', 'hard'].indexOf(task.difficulty);
    assert(tier >= 0, `Invalid difficulty: ${task.id}`);
    assert.equal(task.points, (size === 'small' ? [5, 10, 15] : [25, 50, 75])[tier], task.id);
    assert(task.tag === undefined || task.tag === 'disney', `Invalid tag: ${task.id}`);
    if (task.parkId) assert(PARKS.some(p => p.id === task.parkId), `Invalid park: ${task.id}`);
    if (task.category === 'ride') {
      const ride = RIDES.find(r => r.id === task.rideId);
      assert(ride, `Invalid ride: ${task.id}`);
      assert.equal(task.parkId, ride.parkId, task.id);
      assert.equal(task.heightRequirement, ride.heightRequirement, task.id);
    }
    if (task.category === 'trivia') {
      const count = task.triviaChoices?.length;
      assert(count >= 2 && count <= 4, `Expected 2–4 choices: ${task.id}`);
      assert(task.triviaChoices.every(c => c.trim()), `Empty choice: ${task.id}`);
      assert.equal(new Set(task.triviaChoices.map(c => c.trim().toLowerCase())).size, count, task.id);
      assert(!(task.triviaAnswers && task.triviaAnswer !== undefined), `Use one answer format: ${task.id}`);
      const answers = task.triviaAnswers ?? [task.triviaAnswer];
      assert(answers.length && new Set(answers).size === answers.length &&
        answers.every(i => Number.isInteger(i) && i >= 0 && i < count), `Invalid answer indices: ${task.id}`);
      const required = task.triviaRequiredAnswers ?? answers.length;
      assert(Number.isInteger(required) && required >= 1 && required <= answers.length,
        `Invalid required count: ${task.id}`);
    }
  }
}
console.log(`Validated ${ids.size} tasks: ${SMALL_TASKS.filter(t => t.category === 'act').length} actions, ${TRIVIA_TASKS.length} trivia questions.`);
const minimums={photo:30,find:40,act:50,ride:30,treat:20,pins:20,meet:20,explore:20,seek:20};
const counts={};
for(const park of PARKS){
 const tasks=[...SMALL_TASKS,...BIG_TASKS,...TRIVIA_TASKS,...RIDE_ACTIVITY_TASKS.filter(t=>t.parkId===park.id),...generateRideTasks(RIDES.filter(r=>r.parkId===park.id))];
 counts[park.name]=Object.fromEntries(['trivia',...Object.keys(minimums)].map(category=>[category,tasks.filter(t=>t.category===category).length]));
 for(const [category,min]of Object.entries(minimums))assert(counts[park.name][category]>=min,`${park.name} ${category} below ${min}`);
}
console.table(counts);
const { WHO_AM_I }=readData('whoAmI');
assert.equal(new Set(WHO_AM_I.map(c=>c.id)).size,WHO_AM_I.length,'Who Am I IDs must be unique');
assert.equal(new Set(WHO_AM_I.map(c=>c.name)).size,WHO_AM_I.length,'Who Am I names must be unique');
for(const character of WHO_AM_I)assert(character.clues.length===3 && character.clues.every(c=>c.trim()),character.id);
