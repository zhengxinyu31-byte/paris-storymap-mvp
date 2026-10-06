import {parse} from '@babel/parser';
import {readFileSync, readdirSync, writeFileSync, mkdirSync} from 'node:fs';
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const dictionary = Object.assign({}, ...readdirSync('content/i18n').filter(name => /^en-.*\.json$/.test(name)).sort().map(name => read('content/i18n/'+name)));
const han = /[\u3400-\u9fff]/u;
const required = new Set();
function collect(value) {
  if (typeof value === 'string' && han.test(value)) required.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
const fields = {
  pois: ['name_zh','aliases','area','address','access_note'],
  stories: ['title','hook','body','when','why_here','relationship','observable_cue','caveat','myth','person_names','work_names'],
  routes: ['title','opening','closing','duration_hint','walking_note'],
  personas: ['name_zh','match_reason','model_note'],
  sources: ['title','publisher'],
  media: ['alt','caption','short_label','author'],
  entities: ['name','aliases']
};
for(const [file, keys] of Object.entries(fields)) {
  const records = read('src/data/'+file+'.json');
  for(const record of Array.isArray(records) ? records : Object.values(records)) {
    for(const key of keys) collect(record[key]);
    if(file === 'routes') for(const stop of record.stops) for(const key of ['phase','transition','visit_note']) collect(stop[key]);
  }
}
const quiz = read('content/personality-quiz.json');
for(const q of quiz.questions) { collect(q.promptZh); for(const o of q.options) collect(o.labelZh); }
for(const p of quiz.profiles) { collect(p.taglineZh); collect(p.descZh); }
// Check literal UI copy too, including both branches of t(condition ? A : B).
function visit(node,callback){if(!node||typeof node!=='object')return;callback(node);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(x=>visit(x,callback));else if(value&&typeof value==='object')visit(value,callback);}}
for(const name of readdirSync('src').filter(n=>n.endsWith('.jsx'))){
 const ast=parse(readFileSync('src/'+name,'utf8'),{sourceType:'module',plugins:['jsx']});
 visit(ast,node=>{if(node.type==='CallExpression'&&node.callee?.name==='t')visit(node.arguments[0],n=>{if(n.type==='StringLiteral')collect(n.value);});});
}
const missing = [...required].filter(key => typeof dictionary[key] !== 'string' || !dictionary[key].trim());
const mixed = Object.entries(dictionary).filter(([key,value]) => !['中文','简体中文'].includes(key) && han.test(value));
const report = {required:required.size, translations:Object.keys(dictionary).length, missing:missing.length, mixed: mixed.length};
console.log(JSON.stringify(report));
if(missing.length || mixed.length) {console.error(JSON.stringify({missing, mixed},null,2));process.exitCode=1;}
else { mkdirSync('artifacts',{recursive:true}); writeFileSync('artifacts/language-coverage.json', JSON.stringify({...report, complete:true},null,2)+'\n'); }
