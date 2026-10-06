import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/model.mjs';
const d={personas:[{id:'NERD',name_zh:'学者'}],routes:[{persona_id:'NERD',id:'nerd',stops:[{poi_id:'flore',story_id:'warm'},{poi_id:'lipp',story_id:'meal'}]}],pois:[{id:'flore'},{id:'lipp'}],stories:[{id:'warm',poi_id:'flore',person_names:['萨特']},{id:'other',poi_id:'flore',person_names:['波伏娃']},{id:'meal',poi_id:'lipp',person_names:['萨特']} ]};
test('POI reading exposes every alternate story, while route chooses only its own',()=>{
 assert.equal(typeof model.getPoiStories,'function');
 assert.deepEqual(model.getPoiStories(d,'flore').map(x=>x.id),['warm','other']);
 assert.equal(model.getRoute(d,'NERD').stops[0].story.id,'warm');
});
test('entity browsing crosses POIs without mixing people with adjacent stories',()=>{
 assert.equal(typeof model.findEntityStories,'function');
 assert.deepEqual(model.findEntityStories(d,'萨特').map(x=>x.id),['warm','meal']);
});
test('deep links round trip story and originating route, invalid links fall back',()=>{
 assert.equal(typeof model.encodeView,'function');
 const v={type:'poi',poi:'flore',story:'other',route:'NERD',chapter:0};
 assert.deepEqual(model.decodeView(model.encodeView(v),d),v);
 assert.equal(model.decodeView('#/poi/missing',d).type,'route');
});
test('read status and skipped status stay distinct; corrupt local state is rejected',()=>{
 assert.equal(typeof model.updateReading,'function');
 const x=model.updateReading({},'NERD','warm','read');const y=model.updateReading(x,'NERD','meal','skipped');
 assert.deepEqual(y.NERD,{warm:'read',meal:'skipped'});assert.deepEqual(model.restore('{broken'),{});
});
test('book punctuation cannot split the same work into disconnected trails',()=>{
 const x={stories:[{id:'a',person_names:[],work_names:['《流动的盛宴》']},{id:'b',person_names:[],work_names:['流动的盛宴']}]};
 assert.deepEqual(model.findEntityStories(x,'《流动的盛宴》').map(s=>s.id),['a','b']);
});
test('free reading stays free through refresh and never becomes a route chapter',()=>{
 assert.equal(typeof model.isGuidedStory,'function');
 const v={type:'poi',poi:'flore',story:'warm',route:'NERD',chapter:0,context:'browse'};
 const restored=model.decodeView(model.encodeView(v),d);
 assert.deepEqual(restored,v);assert.equal(model.isGuidedStory(restored,model.getRoute(d,'NERD')),false);
 assert.equal(model.isGuidedStory({...v,context:undefined},model.getRoute(d,'NERD')),true);
});
test('search and saved entry context survive reload and nested branches',()=>{
 for(const returnContext of [{query:'花神'},{from:'saved'}]){
  const v={type:'poi',context:'browse',poi:'flore',story:'warm',route:'NERD',chapter:0,...returnContext};
  const restored=model.decodeView(model.encodeView(v),d);assert.deepEqual(restored,v);
  assert.deepEqual(model.decodeView(model.branchView(v,{poi:'flore',story:'other'}).origin,d),v);
 }
 assert.deepEqual(model.decodeView(model.encodeView({type:'library',query:'Café de Flore'}),d),{type:'library',query:'Café de Flore'});
});
