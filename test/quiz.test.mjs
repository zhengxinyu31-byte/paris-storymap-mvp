import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchPersona, restoreQuiz, answerQuestion, emptyQuiz} from '../src/quiz-model.mjs';
import {encodeView, decodeView} from '../src/model.mjs';
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const quiz=read('content/personality-quiz.json');
const personas=read('src/data/personas.json'), routes=read('src/data/routes.json');
const data={personas,routes,pois:[],stories:[]};

test('four original questions cover all dimensions and retain their three choices',()=>{
 assert.deepEqual(quiz.questions.map(q=>q.id),[1,4,7,12]);
 assert.deepEqual(quiz.questions.map(q=>q.dimension),['culture','planning','social','spending']);
 for(const q of quiz.questions)assert.deepEqual(q.options.map(o=>o.score),[0,1,2]);
});
test('all 81 complete answers map to a real route; all 16 personalities are reachable',()=>{
 const reached=new Set();
 for(let i=0;i<81;i++){
  const answers=Object.fromEntries(quiz.questions.map((q,j)=>[q.id,Math.floor(i/3**j)%3]));
  const p=matchPersona(answers,quiz.questions,personas);
  assert(p);reached.add(p.id);
  assert(routes.some(r=>r.id===p.default_route_id && r.persona_id===p.id && r.stops.length>=6));
  for(const q of quiz.questions)assert.equal(p.dimensions[q.dimension],answers[q.id]===2?1:0);
 }
 assert.equal(reached.size,16);
 assert.equal(matchPersona({1:2,4:2,7:0,12:0},quiz.questions,personas).id,'NERD');
 assert.equal(matchPersona({1:0,4:0,7:0,12:0},quiz.questions,personas).id,'CUTE');
});
test('incomplete, invalid and corrupted answers never fabricate a result',()=>{
 for(const a of [null,[],{}, {1:2,4:2,7:0},{1:2,4:2,7:0,12:3},{1:2,4:2,7:0,12:'2'}])assert.equal(matchPersona(a,quiz.questions,personas),null);
 for(const raw of ['{bad','null','[]',JSON.stringify({version:99,answers:{1:2},step:1})])assert.deepEqual(restoreQuiz(raw,quiz.questions),emptyQuiz());
 const safe=restoreQuiz(JSON.stringify({version:1,answers:{1:0,4:9,7:2,12:2},step:3}),quiz.questions);
 assert.deepEqual(safe.answers,{1:0});assert.equal(safe.step,1);
});
test('editing replaces an answer without accumulating scores and resumes after refresh',()=>{
 let state=emptyQuiz();for(const q of quiz.questions)state=answerQuestion(state,q.id,2,quiz.questions);
 assert.equal(matchPersona(state.answers,quiz.questions,personas).id,'GOAT');
 state=answerQuestion({...state,step:2},7,0,quiz.questions);
 assert.equal(matchPersona(state.answers,quiz.questions,personas).id,'BLUE');
 assert.deepEqual(restoreQuiz(JSON.stringify(state),quiz.questions),state);
 assert.deepEqual(answerQuestion(state,7,7,quiz.questions),state);
});
test('quiz and result deep links preserve the return route',()=>{
 for(const stage of ['questions','result']){
  const view={type:'quiz',stage,route:'BLUE',chapter:2};
  assert.deepEqual(decodeView(encodeView(view),data),view);
 }
 assert.equal(decodeView('#/quiz/result',data).stage,'result');
});
