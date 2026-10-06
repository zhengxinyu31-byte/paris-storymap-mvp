import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const load=n=>JSON.parse(readFileSync(new URL(`../src/data/${n}.json`,import.meta.url)));const pois=load('pois'),stories=load('stories'),routes=load('routes'),sources=load('sources');
test('one Deyrolle aggregates the film story and fire story across routes',()=>{
 const entries=pois.filter(p=>['deyrolle','maison-deyrolle'].includes(p.id));assert.equal(entries.length,1);
 const p=entries[0];assert.ok(stories.filter(s=>s.poi_id===p.id).length>=3);
 assert.ok(routes.find(r=>r.persona_id==='BLUE').stops.some(s=>s.poi_id===p.id));
 assert.ok(routes.find(r=>r.persona_id==='LORD').stops.some(s=>s.poi_id===p.id));
});
test('every route resolves the correct POI story and every source is traceable',()=>{
 for(const list of [pois,stories,routes,sources])assert.equal(new Set(list.map(x=>x.id)).size,list.length);
 assert.equal(routes.length,16);assert.equal(routes.find(r=>r.persona_id==='NERD').stops.length,8);
 for(const r of routes)for(const st of r.stops){const s=stories.find(x=>x.id===st.story_id);assert.ok(s);assert.equal(s.poi_id,st.poi_id);assert.ok(pois.some(p=>p.id===st.poi_id));}
 for(const s of stories){assert.ok(s.body.trim());assert.ok(s.source_ids.length);for(const id of s.source_ids)assert.ok(sources.some(x=>x.id===id));}
});
