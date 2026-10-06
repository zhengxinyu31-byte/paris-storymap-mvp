import test from 'node:test';
import assert from 'node:assert/strict';
import {initialView,restoreJourney,journeyFromView,nextUnreadChapter} from '../src/journey.mjs';
const data={personas:[],routes:[{persona_id:'NERD',stops:[{poi_id:'a',story_id:'a1'},{poi_id:'b',story_id:'b1'}]},{persona_id:'BLUE',stops:[{poi_id:'c',story_id:'c1'},{poi_id:'d',story_id:'d1'}]}],pois:[],stories:[]};
test('first visit enters the four questions; a returning visitor resumes their chosen route',()=>{
 assert.equal(initialView('',null,data).type,'quiz');
 assert.deepEqual(initialView('',{route:'BLUE',chapter:1},data),{type:'route',route:'BLUE',chapter:1});
 assert.deepEqual(initialView('#/route/NERD/0',{route:'BLUE',chapter:1},data),{type:'route',route:'NERD',chapter:0});
});
test('side trips and quiz results never overwrite the active itinerary',()=>{
 const saved={route:'BLUE',chapter:1};
 for(const view of [{type:'library'},{type:'quiz',route:'NERD'},{type:'entity',route:'NERD'},{type:'poi',context:'branch',route:'NERD',poi:'a',story:'a1',chapter:0},{type:'poi',context:'browse',route:'NERD',poi:'a',story:'a1',chapter:0}])assert.deepEqual(journeyFromView(view,saved,data),saved);
 assert.deepEqual(journeyFromView({type:'poi',route:'NERD',poi:'b',story:'b1',chapter:1},saved,data),{route:'NERD',chapter:1});
});
test('restored route positions are validated and pending chapters exclude read or skipped stories',()=>{
 assert.equal(restoreJourney('{bad',data),null);assert.equal(restoreJourney('{"route":"unknown"}',data),null);
 assert.deepEqual(restoreJourney('{"route":"BLUE","chapter":99}',data),{route:'BLUE',chapter:1});
 const route=data.routes[1];assert.equal(nextUnreadChapter(route,{},1),1);assert.equal(nextUnreadChapter(route,{d1:'read'},1),0);assert.equal(nextUnreadChapter(route,{c1:'skipped',d1:'read'},0),null);
});
