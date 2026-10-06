import {readFileSync,writeFileSync} from 'node:fs';
import {entityKey,storyTime} from '../src/model.mjs';
const stories=JSON.parse(readFileSync(new URL('../src/data/stories.json',import.meta.url)));
const entities=new Map();
for(const s of stories)for(const [kind,field] of [['person','person_names'],['work','work_names']])for(const name of s[field]||[]){
 const id=kind+':'+entityKey(name);
 if(!entities.has(id))entities.set(id,{id,kind,name,aliases:[],poi_ids:[],story_refs:[]});
 const e=entities.get(id);
 if(!e.aliases.includes(name))e.aliases.push(name);
 if(!e.poi_ids.includes(s.poi_id))e.poi_ids.push(s.poi_id);
 if(!e.story_refs.some(r=>r.story_id===s.id))e.story_refs.push({story_id:s.id,poi_id:s.poi_id,time:storyTime(s.when),source_ids:s.source_ids||[]});
}
writeFileSync(new URL('../src/data/entities.json',import.meta.url),JSON.stringify([...entities.values()],null,2)+'\n');
console.log(`${entities.size} people/work entities built from ${stories.length} stories; no new historical claims.`);
