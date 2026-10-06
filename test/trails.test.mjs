import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/model.mjs';
const data={personas:[{id:'NERD'}],routes:[{persona_id:'NERD',stops:[{poi_id:'flore',story_id:'warm'}]}],pois:[{id:'flore'},{id:'grave'}],stories:[{id:'warm',poi_id:'flore',person_names:['让-保罗·萨特'],when:'1939—1945年'},{id:'late',poi_id:'grave',person_names:['萨特'],when:'1980年4月19日、1986年4月19日'},{id:'undated',poi_id:'flore',person_names:['萨特'],when:''},{id:'other',poi_id:'flore',person_names:['波伏娃'],when:'1949年'}]};
test('person trails merge aliases, sort dated stories, and retain unknown dates',()=>{
 const trail=model.getEntityTrail(data,'萨特');
 assert.deepEqual(trail.stories.map(s=>s.id),['warm','late','undated']);
 assert.equal(trail.placeCount,2);
 assert.deepEqual(trail.stories[1].time,{label:'1980年4月19日、1986年4月19日',sortYear:1980,basis:'first_explicit_year'});
 assert.equal(trail.stories[2].time.sortYear,null);
});
test('date sorting does not manufacture precision from episodes, centuries or missing values',()=>{
 for(const value of ['第一季第六集','18世纪',null,'无年份']) assert.equal(model.storyTime(value).sortYear,null);
 assert.equal(model.storyTime('约 1840 年；1974 年列入名录').sortYear,1840);
});
test('branch and person links retain the original chapter across reload without recursively growing URLs',()=>{
 const start={type:'poi',poi:'flore',story:'warm',route:'NERD',chapter:0};
 const entity={type:'entity',entity:'萨特',event:'late',route:'NERD',chapter:0,origin:model.encodeView(start)};
 assert.deepEqual(model.decodeView(model.encodeView(entity),data),entity);
 const branch=model.branchView(entity,{poi:'grave',story:'late'});
 assert.equal(branch.origin,model.encodeView(start));
 assert.equal(model.decodeView(model.encodeView(branch),data).origin,model.encodeView(start));
 assert.equal(model.isGuidedStory(model.branchView(branch,{poi:'flore',story:'warm'}),model.getRoute(data,'NERD')),false);
});
test('a crafted external or recursive return target cannot become navigation',()=>{
 assert.equal(model.decodeView('#/poi/flore/warm?context=branch&origin=https%3A%2F%2Fevil.example',data).origin,undefined);
 const malicious='#/poi/flore/warm?origin='+encodeURIComponent('#/poi/flore/warm?origin=x');
 assert.equal(model.decodeView(malicious,data).origin,undefined);
});
