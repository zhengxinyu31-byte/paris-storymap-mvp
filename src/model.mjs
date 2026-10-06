export function getPoiStories(data,id){return data.stories.filter(s=>s.poi_id===id)}
export function getRoute(data,id){const r=data.routes.find(r=>r.persona_id===id)||data.routes.find(r=>r.persona_id==='NERD');return {...r,persona:data.personas.find(p=>p.id===r.persona_id),stops:r.stops.map((s,i)=>({...s,order:i+1,poi:data.pois.find(p=>p.id===s.poi_id),story:data.stories.find(p=>p.id===s.story_id)}))}}
export function entityKey(name){const k=name.replace(/[《》〈〉「」『』“”‘’"'·•\s—–-]/g,'').toLowerCase();const aliases={'让保罗萨特':'萨特','西蒙娜德波伏娃':'波伏娃','西蒙娜波伏娃':'波伏娃','欧内斯特海明威':'海明威','马塞尔普鲁斯特':'普鲁斯特','巴勃罗毕加索':'毕加索'};return aliases[k]||k}
export function findEntityStories(data,name){return data.stories.filter(s=>[...(s.person_names||[]),...(s.work_names||[])].some(n=>entityKey(n)===entityKey(name)))}
export function isGuidedStory(view,route){const s=route.stops[view.chapter||0];return view.type==='poi'&&!['browse','branch'].includes(view.context)&&s?.poi_id===view.poi&&s?.story_id===view.story}

export function relatedRoutes(data,id){return data.routes.filter(r=>r.stops.some(s=>s.poi_id===id))}
export function storyTime(value){
 const label=String(value||'年代未细分');
 const match=label.match(/(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)/);
 return {label,sortYear:match?Number(match[1]):null,basis:match?'first_explicit_year':'undated'};
}
export function getEntityTrail(data,name){
 const stories=findEntityStories(data,name).map(s=>({...s,time:storyTime(s.when)})).sort((a,b)=>(a.time.sortYear??Infinity)-(b.time.sortYear??Infinity));
 return {name,stories,placeCount:new Set(stories.map(s=>s.poi_id)).size};
}
function cleanOrigin(value){
 if(typeof value!=='string'||value.length>1200||!/^#\/(route|poi|library)(\/|\?|$)/.test(value))return undefined;
 const q=new URLSearchParams(value.split('?')[1]);
 if(q.has('origin')||q.has('trail')||q.get('context')==='branch')return undefined;
 return value;
}
export function branchView(from,{poi,story}){
 const origin=cleanOrigin(from.origin)||cleanOrigin(encodeView(from));
 return {type:'poi',context:'branch',poi,story,route:from.route||'NERD',chapter:from.chapter||0,...(origin?{origin}:{}),...(from.type==='entity'?{trail:from.entity}:from.trail?{trail:from.trail}:{})};
}
export function encodeView(v){
 const q=new URLSearchParams();
 if(['browse','branch'].includes(v.context))q.set('context',v.context);
 if(v.route)q.set('route',v.route);
 if(Number.isInteger(v.chapter))q.set('chapter',v.chapter);
 if(cleanOrigin(v.origin))q.set('origin',v.origin);
 if(v.trail)q.set('trail',v.trail);
 if(v.event)q.set('event',v.event);
 if(v.from==='saved')q.set('from','saved');
 if(v.query)q.set('q',String(v.query).slice(0,80));
 const suffix=q.size?'?'+q:'';
 if(v.type==='quiz')return '#/quiz'+(v.stage==='result'?'/result':'')+suffix;
 if(v.type==='poi')return '#/poi/'+encodeURIComponent(v.poi)+'/'+encodeURIComponent(v.story||'')+suffix;
 if(v.type==='entity')return '#/entity/'+encodeURIComponent(v.entity)+suffix;
 return v.type==='library'?'#/library'+suffix:'#/route/'+(v.route||'NERD')+'/'+(v.chapter||0);
}
export function decodeView(hash,data){try{
 const [path,query]=hash.replace(/^#\/?/,'').split('?');const [type,a,b]=path.split('/').map(decodeURIComponent);const q=new URLSearchParams(query);
 const route=data.routes.some(r=>r.persona_id===q.get('route'))?q.get('route'):'NERD';const routeData=data.routes.find(r=>r.persona_id===route);
 const chapter=Math.max(0,Math.min(Math.floor(Number(q.get('chapter')))||0,routeData.stops.length-1));
 const origin=cleanOrigin(q.get('origin'));const context={route,chapter,...(origin?{origin}:{})};
 if(type==='quiz')return {type:'quiz',stage:a==='result'?'result':'questions',route,chapter};
 if(type==='entity'&&findEntityStories(data,a||'').length){const events=getEntityTrail(data,a).stories;return {type:'entity',entity:a,event:events.some(s=>s.id===q.get('event'))?q.get('event'):events[0].id,...context};}
 if(type==='poi'&&data.pois.some(p=>p.id===a)){
 const browseReturn={...(q.get('from')==='saved'?{from:'saved'}:{}),...(q.get('q')?{query:q.get('q').slice(0,80)}:{})};
 const stories=getPoiStories(data,a);return {type:'poi',poi:a,story:stories.some(s=>s.id===b)?b:stories[0]?.id,...context,...browseReturn,...(['browse','branch'].includes(q.get('context'))?{context:q.get('context')}:{}),...(q.get('trail')&&findEntityStories(data,q.get('trail')).length?{trail:q.get('trail')}:{})};}
 if(type==='library')return {type:'library',...(q.get('q')?{query:q.get('q').slice(0,80)}:{})};
 const r=data.routes.find(r=>r.persona_id===a)||data.routes.find(r=>r.persona_id==='NERD');return {type:'route',route:r.persona_id,chapter:Math.max(0,Math.min(Math.floor(Number(b))||0,r.stops.length-1))};
 }catch{return {type:'route',route:'NERD',chapter:0}}}
export function updateReading(state,route,id,status){return {...state,[route]:{...(state[route]&&typeof state[route]==='object'?state[route]:{}),[id]:status}}}
export function restore(raw){try{const x=JSON.parse(raw);return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}}
