// Usage: node scripts/import-archive-trivia.cjs path/to/questions.json
// Input is the questions.json supplied by the user, extracted from their ZIP.
const fs=require('fs'),path=require('path'),ts=require('typescript');
const input=process.argv[2];if(!input)throw Error('Provide the extracted questions.json path');
function load(name){const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(`src/data/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports,id=>id.startsWith('.')?load(path.basename(id)):require(id));return m.exports;}
const cleanText=s=>s.replace(/<\/?[a-z][^>]*>/gi,'').replace(/&(amp|quot|apos|nbsp|lt|gt);/g,(_,entity)=>({amp:'&',quot:'"',apos:"'",nbsp:' ',lt:'<',gt:'>'})[entity]).trim();
const normalize=s=>cleanText(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const original=load('trivia').TRIVIA_TASKS.filter(t=>!t.id.startsWith('tri-play-bulk-'));
const seen=new Set(original.map(t=>normalize(t.description)));
const questions=JSON.parse(fs.readFileSync(input,'utf8'))['en-US'];
const added=[],excluded=[];
const voices={mickey:'Mickey Mouse',minnie:'Minnie Mouse',donald:'Donald Duck',daisy:'Daisy Duck',goofy:'Goofy'};
const skip=(id,reason)=>excluded.push({id,reason});
for(const [id,record] of Object.entries(questions)){
 const d=record.questionData??{};
 if(record.type!=='multipleChoiceText'){skip(id,'unsupported visual or sequence format');continue;}
 if(['rec094iTASP1duciT','rec18BGqY9HeKOds5'].includes(id)){skip(id,'already imported pilot');continue;}
 const answers=Object.values(d.answers??{});
 if(!d.question?.trim()||answers.length<2||answers.length>4||answers.some(a=>typeof a.text !== 'string' || !a.text.trim())||new Set(answers.map(a=>normalize(a.text))).size!==answers.length){skip(id,'missing or duplicate question/answer text');continue;}
 const correct=answers.filter(a=>a.correct===true).length;
 const required=d.numAnswersRequired===undefined?correct:Number(d.numAnswersRequired);
 if(!correct||correct===answers.length||!Number.isInteger(required)||required<1||required>correct){skip(id,'invalid or all-correct answer set');continue;}
 if(/splash mountain/i.test(JSON.stringify(d))){skip(id,'retired attraction context needs separate editorial review');continue;}
 if(/(?:pictured here|shown here|this (?:image|picture|photo|audio clip)|which (?:image|picture) shows|listen to (?:this|the) (?:clip|sound))/i.test(d.question)){skip(id,'requires missing media');continue;}
 const key=normalize(d.question);if(seen.has(key)){skip(id,'duplicate question wording or existing question');continue;}seen.add(key);
 // Deterministic permutation keeps answer indices paired with their choices.
 let seed=[...id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,23);
 const permuted=answers.map(a=>({...a,text:cleanText(a.text)}));
 for(let i=permuted.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[permuted[i],permuted[j]]=[permuted[j],permuted[i]];}
 const indices=permuted.flatMap((a,i)=>a.correct===true?[i]:[]);
 // Park facts describe the preserved app's era, rather than claiming current operations.
 let description=(record.tags?.parks||record.tags?.attractions?'Disney parks history: ':'')+(voices[d.voice]?`${voices[d.voice]} asks: `:'')+cleanText(d.question);
 const task={id:`tri-play-bulk-${id}`,size:'small',category:'trivia',displayCategory:'Trivia',description,points:correct>1?10:5,difficulty:correct>1?'medium':'easy',tag:'disney',triviaChoices:permuted.map(a=>a.text)};
 if(indices.length===1)task.triviaAnswer=indices[0];else{task.triviaAnswers=indices;if(required!==correct)task.triviaRequiredAnswers=required;}
 if(d.funFact?.trim())task.triviaExplanation=(record.tags?.parks||record.tags?.attractions?'Archive-era note: ':'')+cleanText(d.funFact);
 added.push(task);
}
fs.writeFileSync('src/data/archiveTrivia.ts',`import { Task } from '../types';\n// Preserved user-supplied Play Disney Parks text. See docs/archive-import-report.json.\nexport const ARCHIVE_BULK_TRIVIA: Task[] = ${JSON.stringify(added,null,2)};\n`);
fs.writeFileSync('docs/archive-import-report.json',JSON.stringify({source:'User-supplied PlayDisneyParks-trivia.zip / questions.json / en-US',imported:added.length,totalRecords:Object.keys(questions).length,review:'Structural text checks; exact normalized wording deduplication. Semantic duplicates and factual updates still need editorial review. Park questions are labeled historical. Missing image assets are omitted only when text stands alone.',excluded},null,2));
console.log(JSON.stringify({added:added.length,excluded:excluded.length,byReason:excluded.reduce((n,x)=>(n[x.reason]=(n[x.reason]??0)+1,n),{})},null,2));
