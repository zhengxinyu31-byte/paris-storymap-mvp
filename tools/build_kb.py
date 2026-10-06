import json,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
ORIG=ROOT/'content/input/storymap'
OLD=ROOT/'content/input/v1'
OUT=ROOT/'src/data'
def read(p):return json.loads(p.read_text())
def write(name,value):(OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
alias={'deyrolle':'maison-deyrolle','ritz-paris-bar-hemingway':'ritz-paris','palais-royal-colonnes-buren':'palais-royal','shakespeare-and-company':'shakespeare-bucherie','le-passe-muraille':'passe-muraille'}
def pid(x):return alias.get(x,x)
pois={p['id']:p for p in read(OLD/'pois.json') if p['category']!='rest_support'}
sources={s['id']:s for s in read(OLD/'sources.json')}
stories={s['id']:s for s in read(OLD/'stories.json')}
for s in stories.values():
 s['confidence']='documented';s['provenance']='previous_curated';s['when']='';s['why_here']=s['hook'];s['detail']=s['body'];s['relationship']=''
 s['body']=''.join(x for x in re.split(r'(?<=。)',s['body']) if not any(t in x for t in ['不必','无需','不要','不该','不需']))
for p in pois.values():
 p['access_note']='请以地点官方信息确认开放与入场要求。';p['status']='access_unverified'
 p['category']=p.get('category','culture');p['area']=p.get('area','巴黎')
def source(url,title='',publisher=''):
 sid='src-'+hashlib.sha256(url.encode()).hexdigest()[:12]
 sources[sid]={'id':sid,'url':url,'title':title or url.split('/')[2],'publisher':publisher or url.split('/')[2]}
 return sid
orig_story_ids={}
for p in read(ORIG/'pois.json'):
 k=pid(p['id']);old=pois.get(k,{})
 pois[k]={**old,'id':k,'name_zh':p['name_zh'],'name_fr':p['name_fr'],'address':p['address'],
 'coordinates':old.get('coordinates'),'area':str(p.get('arrondissement',''))+'e · Paris',
 'category':old.get('category','culture'),'access_note':p.get('access_note',''),
 'status':p['still_exists'],'official_url':old.get('official_url',''),'outside_paris':p.get('outside_paris',False),
 'original_id':p['id'],'era':p.get('era'),'access_checked_at':'2026-09-22','best_time':p.get('best_time','')}
 orig_story_ids[k]=[]
 for i,a in enumerate(p['associations']):
  sid=k+'--archive-'+str(i+1);orig_story_ids[k].append(sid)
  title=a['name'].split(' / ')[0]
  confidence='documented' if a['confidence'] in ['L1','L2'] else 'attributed'
  if a['confidence']=='L5':confidence='disputed'
  body=a['why_here'].rstrip('。')+'。'+a['detail']
  if a['confidence']=='L4':body='这是一则需要带着出处阅读的掌故。'+body
  names=[title.split('（')[0]] if a['type']=='person' else []
  works=[title] if a['type'] in ['work','film','screen'] else []
  stories[sid]={'id':sid,'poi_id':k,'title':title,'hook':a['why_here'],'body':body,
  'person_names':names,'work_names':works,'when':a['when'],'why_here':a['why_here'],'detail':a['detail'],
  'observable_cue':'在这里，找一处与故事有关的建筑细节，再回看它的年代。',
  'source_ids':[source(u) for u in a['sources']], 'confidence':confidence,'caveat':a.get('caveat',''),
  'original_confidence':a['confidence'],'provenance':'paris-storymap/associations','relationship':''}
  if a['confidence']=='L3':stories[sid]['caveat']=('原语料的置信度口径尚需统一，以下保留来源及原有说明。'+stories[sid]['caveat'])
  if a['confidence']=='L5':stories[sid]['myth']={'claim':title,'reality':a['detail']}
for d in read(ORIG/'debunks.json')['debunks']:
 if d['status']=='linked':
  candidates=[stories[s] for s in orig_story_ids.get(pid(d['poi_id']),[]) if stories[s]['original_confidence']=='L5']
  for s in candidates:s['myth']={'claim':d['official_claim'],'reality':d['reality']}
# Supplemented packs override baseline records, with explicit source URLs retained.
pack_routes={}
for path in sorted((ROOT/'content').glob('*.json')):
 pack=read(path)
 if not isinstance(pack,dict) or 'stories' not in pack:continue
 for p in pack.get('pois',[]):
  k=pid(p['id']);pois[k]={**pois.get(k,{}),**p,'id':k}
 for s in pack['stories']:
  s={**s,'poi_id':pid(s['poi_id']),'provenance':'v2_source_checked'}
  if 'source_urls' in s:
   s['source_ids']=[source(x['url'],x.get('title',''),x.get('publisher','')) if isinstance(x,dict) else source(x) for x in s['source_urls']]
  stories[s['id']]=s
 for r in pack.get('routes',[])+([pack['route']] if 'route' in pack else []):pack_routes[r['persona_id']]=r
personas=read(OLD/'personas.json')
old_routes={r['persona_id']:r for r in read(OLD/'routes.json')}
route_intros={
'LORD':('有些人的日常，后来成了我们专程前往的地方。读侦探住过的拱廊、普鲁斯特的餐桌，再看看收藏与一场大火怎样留下另一种巴黎。','最后留下的，不只是财富。是人如何挑选物件、讲述自己，又把私人品味交给后来者。'),
'BOSS':('一只鸭子的编号、一张桌子的铭牌、一道通往二楼的楼梯：巴黎的老餐厅，把身份和故事摆在了桌上。','读懂一张餐桌，也就读懂一部分城市的社交史。不必每家都用餐，挑一个让你好奇的故事坐下来。'),
'FREE':('从电影里的泳池到书店、运河与屋顶，把一个人的一天交给不同高度的巴黎。你可以只选其中两三章，留出发呆的空白。','巴黎不需要被一天走完。今天读到的一个场景，也可以成为下一次独自出门的理由。'),
'WIND':('列车停了，城市却没有停止生长。沿着旧铁路、山坡与水岸，看看废弃空间如何长出花园，又保留普通人的记忆。','铁路留下的是连接，今天连接它们的也可以是你的目光。只走开放路段，未走到的部分留在故事里。'),
'SHAN':('为便宜的酒走到城外，为一顿午餐坐上阳台，为音乐在河边聚起来。一起吃、一起跳的巴黎，有一条很长的来路。','让一张餐桌变得特别的，往往是坐在旁边的人。挑一处当作相聚的起点，比走完所有站更有意义。'),
'REST':('椅子也有历史，书店也有待客的方法。今天不赶路，挑一处能停下来的地方，读它为什么让人愿意多待一会儿。','不走完也可以。一本书、一把椅子、一段树荫，已经足够组成今天的巴黎。'),
'CUTE':('有人从墙里探出身子，有人把外星人贴上高楼，还有一位“炼金术士”留下了真正的房子。把街角当作一本可以随手翻开的奇闻集。','不需要答对什么，也不用收集齐全。记住一个今天才发现的小怪东西，就已经不虚此行。')}
routes=[]
for original in read(ORIG/'storylines.json')['storylines']:
 code=original['persona_code'];route={'id':'paris-'+code.lower(),'persona_id':code,'title':original['theme_zh'],
 'opening':'从一个人物、一件小事开始，读懂这条主题线。','closing':'把今天读到的故事，留给下一次走进巴黎的自己。',
 'duration_hint':original.get('duration_hint') or '按兴趣逐章阅读，步行时间待核实',
 'walking_note':'章节顺序用于阅读，不代表已核验的连续步行路线。开放与入口以官方信息为准。',
 'stops':[]}
 if code in route_intros:
  route['opening'],route['closing']=route_intros[code]
  stations=original['stations']
  if code=='CUTE':stations=[s for s in stations if s['poi_id'] not in ['mur-des-je-taime','place-stravinsky-wall','sentier-des-merisiers','rue-denoyez']]
  for i,st in enumerate(stations):
   k=pid(st['poi_id']);ss=orig_story_ids[k]
   main=next((x for x in ss if stories[x]['confidence']=='documented'),ss[0])
   if code=='FREE' and k=='shakespeare-bucherie':main=ss[2]
   if code=='FREE' and k=='piscine-pontoise':main=ss[1]
   if code=='BOSS' and k=='brasserie-lipp':main=ss[0]
   route['stops'].append({'poi_id':k,'story_id':main,'phase':st.get('cluster') or ('城外支线' if st.get('outside_paris') else '第'+str(i+1)+'章'),
   'transition':('下一章，'+pois[pid(stations[i+1]['poi_id'])]['name_zh']+'继续这个主题。') if i<len(stations)-1 else '',
   'visit_note':st.get('segment_note') or st.get('transit') or ''})
  if code in ['SHAN','LORD','BOSS','FREE']:route['walking_note']='这些章节分布在不同片区，建议选择部分停留并搭乘公共交通。城外地点需单独安排。'
  if code=='REST':route['walking_note']='松散地点集合，今天挑 1–2 处即可；不要求按章节顺序步行。'
  if code=='CUTE':route['walking_note']='按片区挑选的 8 个故事，可就近探索；其余地点仍可在知识库浏览。'
  if code=='WIND':route['walking_note']='长距离主题，原研究估算全线约 14–15 公里。可分段阅读和游览，废铁道仅进入合法开放段。'
 else:
  route['stops']=[{'poi_id':s['poi_id'],'story_id':s['story_id'],'phase':s['role'],'transition':s.get('transition_to_next','')} for s in old_routes[code]['stops']]
  route['draft']=True
 if code in pack_routes:
  route.update(pack_routes[code]);route.pop('draft',None)
  for s in route['stops']:s['poi_id']=pid(s['poi_id'])
 routes.append(route)
# Curated resolution of conflicts discovered in the source repository.
overrides=read(ROOT/'content/editorial-overrides.json')
for p in personas:p.update(overrides.get('persona_updates',{}).get(p['id'],{}))
for r in routes:r.update(overrides.get('route_updates',{}).get(r['persona_id'],{}))
for sid,patch in overrides['story_updates'].items():
 if sid in stories:
  stories[sid].update(patch)
  stories[sid]['provenance']='v2_editorial_review'
  for item in patch.get('source_urls',[]):
   ref=source(item['url'],item.get('title',''),item.get('publisher',''))
   if ref not in stories[sid]['source_ids']:stories[sid]['source_ids'].append(ref)
for r in routes:
 for st in r['stops']:st['story_id']=overrides['route_story_replacements'].get(st['story_id'],st['story_id'])
for sid in overrides['remove_story_ids']:stories.pop(sid,None)
# Enriched original eight chapters come first in each POI's available readings.
order={'v2_source_checked':0,'paris-storymap/associations':1,'previous_curated':2}
stories=sorted(stories.values(),key=lambda s:order.get(s.get('provenance'),3))
coordinates=read(ROOT/'content/coordinates.json') if (ROOT/'content/coordinates.json').exists() else {}
photo_manifest=ROOT/'content/photo-manifest.json'
media=read(photo_manifest) if photo_manifest.exists() else read(ROOT/'src/data/media.json')
write('media.json',media)
for p in pois.values():
 if p['id'] in coordinates:p['coordinates']=coordinates[p['id']]
 p['story_ids']=[s['id'] for s in stories if s['poi_id']==p['id']]
 p.setdefault('area','巴黎');p.setdefault('official_url','');p.setdefault('access_note','请以官方信息确认入场条件。')
 p.setdefault('status','access_unverified');p.setdefault('category','culture')
 p['media']=[p['id']] if p['id'] in media else []
 p['media_status']='photo_verified' if p['media'] else 'photo_pending'
for r in routes:
 for i,s in enumerate(r['stops']):s['order']=i+1
write('pois.json',list(pois.values()));write('stories.json',stories);write('sources.json',list(sources.values()));write('routes.json',routes);write('personas.json',personas)
write('manifest.json',{'version':2,'basis':'paris-storymap c1d190e','pois':len(pois),'stories':len(stories),'routes':len(routes),'pending_routes':[r['persona_id'] for r in routes if r.get('draft')], 'newly_reviewed_stories':sum(s['provenance']=='v2_source_checked' for s in stories)})
print('KB',len(pois),'POIs',len(stories),'stories;',len(pack_routes),'routes enriched')
