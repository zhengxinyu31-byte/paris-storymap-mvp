import { useI18n, englishText } from './i18n';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, MapPin, BookOpen, Compass, X, Share2, ChevronDown, Quote, Users, Clock, Library, Search, Coffee } from 'lucide-react';
import data from './catalog';
import { getRoute, getPoiStories, findEntityStories, relatedRoutes, encodeView, decodeView, updateReading, restore, isGuidedStory, branchView, getEntityTrail } from './model.mjs';
import Photo from './Photo';
import LanguageMenu from './LanguageMenu';
import PersonalityQuiz from './PersonalityQuiz';
import RouteMapPage from './RouteMapPage';
import EntityTrail from './EntityTrail';
import {JOURNEY_KEY,restoreJourney,initialView,journeyFromView,nextUnreadChapter} from './journey.mjs';
import StoryQuestions from './StoryQuestions';
const icons = {
  NERD: '✧',
  CTRL: '⌘',
  BLUE: '◒',
  MYTH: '☷',
  DODO: '❋',
  BUDD: '◌',
  GOAT: '✳',
  TIME: '◷',
  BEE: '❖',
  LORD: '♛',
  BOSS: '♜',
  FREE: '☁',
  WIND: '〰',
  SHAN: '☀',
  REST: '☕',
  CUTE: '✿'
};
const bios = {
  '让-保罗·萨特': '法国哲学家、小说家。写作、公共立场与日常生活，在这条路线里不断相遇。',
  '西蒙娜·德·波伏娃': '法国作家和思想家，《第二性》的作者。她的写作与公共行动有着独立的轨迹。',
  '欧内斯特·海明威': '美国作家。《流动的盛宴》把他年轻时的巴黎留在了书页里。',
  '鲍里斯·维昂': '法国作家，也是爵士乐演奏者。书桌与地窖舞台，是他的两种生活。',
  '雷蒙·格诺': '法国作家，1933 年首届双叟文学奖得主。',
  '马塞尔·普鲁斯特': '《追忆似水年华》的作者，日常细节和人际观察是理解他作品的一条线索。'
};
function readSaved() {
  try {
    return restore(localStorage.getItem('paris-storymap-v2'));
  } catch {
    return {};
  }
}
const stored = readSaved();
function Badge({
  story
}) {
  const {
    t,
    language
  } = useI18n();
  return <span className={'badge ' + (story.confidence || 'attributed')}>{story.myth ? t('传说辨读') : story.confidence === 'documented' ? t('附资料来源') : story.confidence === 'disputed' ? t('记载有出入') : t('带着出处读')}</span>;
}
function Modal({
  title,
  close,
  children,
  wide = false
}) {
  const {
    t,
    language
  } = useI18n();
  const ref = useRef();
  useEffect(() => {
    const old = document.activeElement;
    ref.current?.querySelector('button')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      old?.focus();
    };
  }, []);
  return <div className="overlay" onClick={e => e.target === e.currentTarget && close()}><section className={'modal ' + (wide ? 'wide' : '')} role="dialog" aria-modal="true" aria-label={t(title)} ref={ref} onKeyDown={e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const a = [...ref.current.querySelectorAll('button,a[href],input')].filter(x => !x.disabled);
        if (e.shiftKey && document.activeElement === a[0]) {
          e.preventDefault();
          a.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === a.at(-1)) {
          e.preventDefault();
          a[0]?.focus();
        }
      }
    }}><header><h2>{t(title)}</h2><button className="icon" onClick={close} aria-label={t("关闭")}><X /></button></header>{children}</section></div>;
}
function StorySources({
  story
}) {
  const {
    t,
    language
  } = useI18n();
  return <details className="sources"><summary>{t("出处与阅读说明 · ")}{t(story.source_ids?.length) || 0}{t(" 份资料")}</summary>{story.caveat && <p>{t(story.caveat)}</p>}{t(story.source_ids?.map(id => {
      const s = data.sources.find(x => x.id === id);
      return s ? <a key={id} href={s.url} target="_blank" rel="noreferrer">{t(s.publisher)} · {t(s.title)}<ArrowUpRight size={13} /></a> : null;
    }))}<small>{story.provenance === 'paris-storymap/associations' ? t('收录自原项目研究语料，保留其来源与争议说明。') : t('故事依据所列资料整理。')}{t("历史叙述与现场开放情况分开核实。")}</small></details>;
}
export default function App() {
  const {
    t,
    language
  } = useI18n();
  const [journey,setJourney]=useState(()=>{try{return restoreJourney(localStorage.getItem(JOURNEY_KEY),data);}catch{return null;}});
  const [view, setView] = useState(() => initialView(location.hash, journey, data));
  const activeJourney=journeyFromView(view,journey,data);
  const journeyRef=useRef(activeJourney);journeyRef.current=activeJourney;
  useEffect(()=>{
    setJourney(activeJourney);
    if(activeJourney)try{localStorage.setItem(JOURNEY_KEY,JSON.stringify(activeJourney));}catch{/* Navigation still works in memory. */}
  },[activeJourney]);
  const [modal, setModal] = useState(null);
  const [mapOpenRoute,setMapOpenRoute]=useState(null);
  const [query, setQuery] = useState(view.query||'');
  useEffect(()=>{if(view.type==='library')setQuery(view.query||'');},[view.type,view.query]);
  function searchLibrary(value){setQuery(value);const next={type:'library',query:value};history.replaceState(null,'',encodeView(next));setView(next);}
  const [reading, setReading] = useState(restore(JSON.stringify(stored.reading)));
  const [saved, setSaved] = useState(Array.isArray(stored.saved) ? stored.saved.filter(x => typeof x === 'string') : []);
  const [toast, setToast] = useState('');
  const route = getRoute(data, view.route || activeJourney?.route || 'NERD'),
    chapter = view.chapter || 0,
    active = route.stops[chapter] || route.stops[0];
  const poi = view.type === 'poi' ? data.pois.find(p => p.id === view.poi) : null;
  const poiStories = poi ? getPoiStories(data, poi.id) : [];
  const story = poiStories.find(s => s.id === view.story) || poiStories[0];
  const personStories = story ? [story, ...poiStories.filter(s => s.id !== story.id)] : poiStories;
  const guided = isGuidedStory(view, route);
  const isBranch = view.context === 'branch';
  const originView = view.origin ? decodeView(view.origin, data) : {
    type: 'route',
    route: route.persona_id,
    chapter
  };
  const originIsMain = originView.type === 'route' || isGuidedStory(originView, getRoute(data, originView.route || 'NERD'));
  function returnOrigin() {
    nav(view.origin ? decodeView(view.origin, data) : {
      type: 'route',
      route: route.persona_id,
      chapter
    });
  }
  function returnFromStory() {
    if(view.from==='saved'&&!view.trail&&!view.origin){setModal('saved');return;}
    if (view.trail) nav({
      type: 'entity',
      entity: view.trail,
      event: story.id,
      route: route.persona_id,
      chapter,
      origin: view.origin
    });else if (view.origin) returnOrigin();else nav(view.context === 'browse' ? {
      type: 'library',query:view.query||query
    } : {
      type: 'route',
      route: route.persona_id,
      chapter
    });
  }
  const state = reading[route.persona_id] || {};
  const read = route.stops.filter(s => state[s.story_id] === 'read').length;
  const skipped = route.stops.filter(s => state[s.story_id] === 'skipped').length;
  useEffect(() => {
    const fn = () => {
      setView(initialView(location.hash, journeyRef.current, data));
      setModal(null);
      if (!preserveScroll.current) window.scrollTo(0, 0);
      preserveScroll.current = false;
    };
    addEventListener('hashchange', fn);
    return () => removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('paris-storymap-v2', JSON.stringify({
        reading,
        saved
      }));
    } catch {
      setToast('当前浏览器无法保存，仍可继续阅读。');
    }
  }, [reading, saved]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const preserveScroll = useRef(false);
  function nav(v, scroll = true) {
    if(v.type==='route'&&view.type!=='route')setMapOpenRoute(v.route);
    preserveScroll.current = !scroll;
    const hash = encodeView(v);
    if (location.hash === hash) {
      setView(v);
      if(scroll) window.scrollTo(0, 0);
    } else location.hash = hash;
    setModal(null);
  }
  function openStop(i) {
    const s = route.stops[i];
    nav({
      type: 'poi',
      poi: s.poi_id,
      story: s.story_id,
      route: route.persona_id,
      chapter: i
    });
  }
  function openPoi(p, s, origin = route.persona_id, from) {
    nav({
      type: 'poi',
      context: 'browse',
      ...(from?{from}:{}),
      ...(query?{query}:{}),
      poi: p,
      story: s || getPoiStories(data, p)[0]?.id,
      route: origin,
      chapter: data.routes.find(r => r.persona_id === origin)?.stops.findIndex(x => x.poi_id === p) >= 0 ? data.routes.find(r => r.persona_id === origin).stops.findIndex(x => x.poi_id === p) : 0
    });
  }
  function toggleSave(id) {
    setSaved(x => x.includes(id) ? x.filter(s => s !== id) : [...x, id]);
  }
  function browseEntity(name) {
    const trail = getEntityTrail(data, name);
    const currentStory = story?.id || (view.type === 'route' ? active.story.id : view.event);
    const event = trail.stories.some(s => s.id === currentStory) ? currentStory : trail.stories[0]?.id;
    nav({
      type: 'entity',
      entity: name,
      event,
      route: route.persona_id,
      chapter,
      origin: view.origin || encodeView(view)
    });
  }
  function openBranch(s) {
    nav(branchView(view, {
      poi: s.poi_id,
      story: s.id
    }));
  }
  const shareUrl = new URL(encodeView(view), location.href).href;
  async function share() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast('已复制这一页的链接。');
    } catch {
      setModal('share');
    }
  }
  function finish(status) {
    setReading(x => updateReading(x, guided ? route.persona_id : 'free', story.id, status));
    const isChapter = guided;
    if (isChapter && chapter < route.stops.length - 1) {setMapOpenRoute(route.persona_id);nav({type:'route',route:route.persona_id,chapter:chapter+1});}else if (isChapter) {
      setModal('finish');
    } else setToast(status === 'read' ? '已读完这则故事。' : '已跳过这则故事。');
  }
  const choose = (id,poiId) => {
    const target=data.routes.find(r=>r.persona_id===id);
    const index=poiId?target.stops.findIndex(s=>s.poi_id===poiId):-1;
    nav({type:'route',route:id,chapter:Math.max(0,index)});
    setMapOpenRoute(index>=0?id:null);
  };
  function myRoute(){
    if(activeJourney){nav({type:'route',...activeJourney});setMapOpenRoute(null);}
    else startQuiz();
  }
  function startQuiz() { nav({type:'quiz',stage:'questions',route:activeJourney?.route||route.persona_id,chapter:activeJourney?.chapter||0}); }
  function quizEntry() { return <button className="quiz-entry" onClick={startQuiz}><Compass size={23}/><div><strong>{t('四道题，找到适合你的故事线')}</strong><small>{t('从旅行偏好出发，看看你的巴黎旅行人格。')}</small></div><ArrowRight size={18}/></button>; }
  function storyCard(s) {
    const p = data.pois.find(p => p.id === s.poi_id);
    return <button className="result-card" key={s.id} onClick={() => openPoi(p.id, s.id, activeJourney?.route||route.persona_id, 'saved')}><span>{t(p.name_zh)} · {t(s.when) || t('巴黎往事')}</span><strong>{t(s.title)}</strong><p>{t(s.hook)}</p><ArrowUpRight size={18} /></button>;
  }
  return <div className="app"><header className="topbar"><button className="brand" onClick={myRoute} aria-label={t("巴黎故事地图首页")}><Compass size={26}/><span>{t("Paris")}<span className="brand-script">{t(" StoryMap")}</span><small>{t("巴黎故事地图")}</small></span></button><nav aria-label={t('主导航')}>
   <button className={'journey-nav '+(!activeJourney?'quiz-nav ':'')+(['route','quiz'].includes(view.type)||guided?'selected':'')} onClick={myRoute} aria-label={t(activeJourney?'我的路线':'旅行人格测试')}><Compass size={16}/><span>{t(activeJourney?'我的路线':'旅行人格测试')}</span></button>
   <button aria-label={t('探索地点')} className={view.type==='library'?'selected':''} onClick={()=>nav({type:'library'})}><Library size={16}/><span>{t('探索地点')}</span></button>
   <button aria-label={t('我的收藏')} onClick={()=>setModal('saved')}><Bookmark size={16}/><span>{t('我的收藏')}</span>{saved.length>0&&<b>{saved.length}</b>}</button><LanguageMenu/>
  </nav></header>
 {view.type === 'quiz' && <PersonalityQuiz data={data} view={view} nav={nav} onChoose={choose} onShowAll={()=>setModal('personas')} hasJourney={!!activeJourney} onReturn={myRoute}/>}
 {view.type === 'route' && <RouteMapPage key={route.persona_id} route={route} places={data.pois} resumeIndex={chapter} selected={mapOpenRoute===route.persona_id?chapter:null} onSelect={index=>{setMapOpenRoute(route.persona_id);nav({type:'route',route:route.persona_id,chapter:index},false);}} onClose={()=>setMapOpenRoute(null)} onRead={openStop} onChoose={()=>setModal('personas')} onSave={()=>toggleSave('route:'+route.persona_id)} onShare={share} saved={saved.includes('route:'+route.persona_id)} reading={state}/>}
 {poi && story && <main className="poi-page">{(!isBranch||view.trail)&&<button className="back-link" onClick={returnFromStory}><ArrowLeft size={15} />{view.trail ? t("回到「{0}」的故事足迹", t(view.trail)) : view.origin ? t('回到出发的故事') : view.context === 'browse' ? t(view.from==='saved'?'返回我的收藏':'回到探索地点') : t("回到「{0}」", t(route.title))}</button>}{isBranch && <div className="branch-banner"><div><span>{t("支线阅读 · 你的主线进度保持在原处")}</span><strong>{originIsMain ? t("从「{0}」第 {1} 章出发", t(route.title), t(chapter + 1)) : t('从自由探索中发现的新线索')}</strong></div><button onClick={returnOrigin}><ArrowLeft size={14} />{originIsMain ? t('返回原来章节') : t('回到出发页')}</button></div>}<div className="poi-heading"><div><span className="eyebrow">{t("A PLACE, MANY STORIES")}</span><h1>{t(poi.name_zh)}</h1><span className="french-name">{t(poi.name_fr)}</span><p><MapPin size={14} />{t(poi.address)}</p></div><div className="poi-actions"><button className={'icon outlined ' + (saved.includes(story.id) ? 'saved' : '')} aria-label={saved.includes(story.id) ? t('取消收藏故事') : t('收藏故事')} onClick={() => toggleSave(story.id)}><Bookmark size={19} /></button><button className="icon outlined" aria-label={t("分享故事")} onClick={share}><Share2 size={18} /></button></div></div>
 {guided && <section className="storyline-context" aria-label={t("当前故事线")}><div><span>{t("正在读 · ")}{t(route.title)} · {t(chapter + 1)}/{t(route.stops.length)}</span><strong>{t(active.phase) || t("第 {0} 章 · {1}", t(chapter + 1), t(poi.name_zh))}</strong></div></section>}<div className="poi-layout"><section className="reading-column"><Photo poi={poi} /><article className="main-story"><div className="story-label"><span>{t(story.when) || t('巴黎往事')}</span><Badge story={story} /></div><h2>{t(story.title)}</h2><p className="story-hook"><Quote size={23} />{t(story.hook)}</p><div className="story-body">{t(story.body).split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{t(p)}</p>)}</div>{story.relationship && <div className="relationship"><Users size={18} /><p>{t(story.relationship)}</p></div>}{story.myth && <div className="myth-card"><span>{t("传说与证据")}</span><div><small>{t("流传的说法")}</small><p>{t(story.myth.claim)}</p></div><div><small>{t("把来源打开之后")}</small><p>{t(story.myth.reality)}</p></div></div>}<div className="entity-tags">{[...(story.person_names || []), ...(story.work_names || [])].map(n => <button key={n} onClick={() => browseEntity(n)}>{t(n)} <ArrowUpRight size={12} /></button>)}</div><details className="story-extra" key={"extra:"+story.id}><summary>{t('深入了解这则故事')}</summary><StoryQuestions key={story.id} story={story} sources={data.sources} onEntity={browseEntity}/></details><StorySources key={"sources:"+story.id} story={story} /></article>
 <section className="look-section"><span>{t("把眼前的风景，看得更具体")}</span><p>{t(story.observable_cue) || t('看看这个地点的门牌与周围街道，再读一遍故事发生的年代。')}</p></section> {guided && active.transition && <div className="transition"><span>{t("下一章的线索")}</span><p>{t(active.transition)}</p></div>}
 <div className="read-actions"><button className="secondary" onClick={() => finish('skipped')}>{t("跳过这则")}</button><button className="primary" onClick={() => finish('read')}>{guided ? chapter === route.stops.length - 1 ? t('读完这一章，看看回顾') : t('读完这一章，前往下一站') : t('标记这则故事已读')}<ArrowRight size={17} /></button></div>
 <details className="people-section supporting-people"><summary>{t("故事中的人物 · 补充阅读")}</summary>{[...new Set(personStories.flatMap(s => s.person_names || []))].map(n => {
              const ss = personStories.filter(s => s.person_names?.includes(n));
              return <div className="person-card" key={n}><span className="person-initial">{t(t(n).slice(0, 1))}</span><div><button onClick={() => browseEntity(n)}>{t(n)}<ArrowUpRight size={15} /></button>{bios[n] && <p>{t(bios[n])}</p>}<span>{t(ss.map(s => t(s.when)).filter(Boolean).join(' · '))}</span><p>{t(ss[0].why_here) || t(ss[0].hook)}</p><button className="text-link" onClick={() => browseEntity(n)}>{t("查看这个人物的相关轶事")}</button></div></div>;
            })}{!poiStories.some(s => s.person_names?.length) && <p className="muted">{t("这里的故事也属于作品、建筑与未留下姓名的普通人。")}</p>}</details>
<section className="access-section"><h3>{t("如果你准备亲自前往")}</h3><p>{t(poi.access_note) || t('请查看官方信息确认开放与入场要求。')}</p><small>{t("历史故事不等于当前开放承诺。馆藏、私人建筑与墓区须遵守现场规则。")}</small><div>{poi.official_url && <a href={poi.official_url} target="_blank" rel="noreferrer">{t("官方参观信息 ")}<ArrowUpRight size={14} /></a>}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name_fr + ' ' + poi.address)}`} target="_blank" rel="noreferrer">{t("在地图中查找 ")}<ArrowUpRight size={14} /></a></div></section>
</section>
 <aside className="poi-side"><p className="side-reading-note">{t("想多读一点时，再打开这些线索。")}</p>{poiStories.length>1&&<details className="same-place-stories" key={story.id}><summary>{t("同一地点，还有这些故事")} · {poiStories.length-1}</summary><div className="other-stories">{poiStories.filter(s=>s.id!==story.id).map(s => <button key={s.id} className={s.id === story.id ? 'active' : ''} onClick={() => {
              if (s.id !== story.id) openBranch(s);
            }}><small>{t(s.when) || t('城市往事')}{s.id === story.id ? t(' · 正在阅读') : ''}</small><strong>{t(s.title)}</strong><p>{t(s.hook)}</p><span>{t(s.person_names?.slice(0, 2).map(n => t(n)).join(' · ')) || t(s.work_names?.[0]) || t('地点记忆')}</span><ArrowUpRight size={15} /></button>)}</div></details>}{relatedRoutes(data,poi.id).some(r=>r.persona_id!==route.persona_id)&&<details className="route-alternatives"><summary>{t("从这里换一条故事线")}</summary><div className="related-routes">{relatedRoutes(data, poi.id).filter(r=>r.persona_id!==route.persona_id).map(r => <button key={r.id} onClick={() => choose(r.persona_id,poi.id)}><small>{t(r.persona_id)} · {t(data.personas.find(p => p.id === r.persona_id).name_zh)}</small><strong>{t(r.title)}</strong><ArrowRight size={16} /></button>)}</div></details>}</aside></div></main>}
 {view.type === 'entity' && <EntityTrail data={data} view={view} nav={nav} onStory={openBranch} onEntity={browseEntity} onReturn={returnOrigin} />}
 {view.type === 'library' && <main className="library-page"><div className="eyebrow">{t("PARIS, ONE STORY AT A TIME")}</div><h1>{t("探索巴黎的地点与故事")}</h1><p>{t("按兴趣随手翻阅，随时回到你的路线。")}</p><button className="text-link library-return" onClick={myRoute}><ArrowLeft size={14}/>{t(activeJourney?"回到我的路线":"先找到适合我的路线")}</button><div className="section-bar library-places-heading"><h2>{t("也可以从眼前的地点开始")}</h2><span>{t(data.pois.filter(p => getPoiStories(data, p.id).length).length)}{t(" 个地点 · ")}{t(data.stories.length)}{t(" 则故事")}</span></div><div className="library-controls"><label><Search size={17} /><input aria-label={t("搜索地点、人物或作品")} placeholder={t("也可以搜索地点、人物或作品")} value={query} maxLength={80} onChange={e => searchLibrary(e.target.value)} /></label><div>{['咖啡', '花园', '书店', '电影', '建筑', '运河'].map(n => <button key={n} onClick={() => searchLibrary(language === 'en' ? ({咖啡:'cafe',花园:'garden',书店:'book',电影:'film',建筑:'architecture',运河:'canal'}[n]) : n)}>{t(n)}</button>)}{query && <button onClick={() => searchLibrary('')}>{t("全部地点 ×")}</button>}</div><div className="poi-grid">{data.pois.filter(p => {
            const ss = getPoiStories(data, p.id);
            return ss.length && (!query || [p.name_zh, p.name_fr, ...ss.flatMap(s => [s.title, s.body, ...(s.person_names || []), ...(s.work_names || [])])].flatMap(value => [value, englishText(value)]).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
          }).map(p => <button key={p.id} className="poi-library-card" onClick={() => openPoi(p.id)}><Photo poi={p} compact /><div><small>{t(p.area)} · {t(getPoiStories(data, p.id).length)}{t(" 则故事")}</small><h2>{t(p.name_zh)}</h2><p>{t(getPoiStories(data, p.id)[0]?.hook)}</p><span>{t("打开地点的故事 ")}<ArrowUpRight size={14} /></span></div></button>)}</div></div></main>}
 <footer><span>{t("PARIS STORYMAP · 把故事放回它发生的地方")}</span><span>{t("以 paris-storymap 为内容基础 · 人格是入口，故事线串联巴黎")}</span></footer>
 {modal === 'personas' && <Modal title={t("今天，想读巴黎的哪一面？")} wide close={() => setModal(null)}>{quizEntry()}<p className="modal-lead">{t("也可以直接选一个旅行人格，进入对应的故事线。")}</p><div className="persona-grid">{data.routes.map(r => {
          const p = data.personas.find(p => p.id === r.persona_id);
          return <button key={r.id} className={r.persona_id === activeJourney?.route ? 'selected' : ''} onClick={() => choose(r.persona_id)}><span>{t(icons[p.id])}</span><small>{t(p.id)} · {t(p.name_zh)}</small><strong>{t(r.title)}</strong><em>{t(r.stops.length)}{t(" 个故事章节 ")}<ArrowUpRight size={13} /></em></button>;
        })}</div></Modal>}
 {modal === 'saved' && <Modal title={t("收好的巴黎故事")} close={() => setModal(null)}><p className="modal-lead">{t("收藏与进度保存在当前浏览器。")}</p>{saved.length ? saved.map(id => id.startsWith('route:') ? (() => {
        const r = data.routes.find(r => r.persona_id === id.slice(6));
        return r ? <button className="result-card" key={id} onClick={() => choose(r.persona_id)}><span>{t("主题路线 · ")}{t(r.persona_id)}</span><strong>{t(r.title)}</strong><ArrowUpRight size={17} /></button> : null;
      })() : (() => {
        const s = data.stories.find(s => s.id === id);
        return s ? storyCard(s) : null;
      })()) : <div className="empty"><Bookmark size={32} /><p>{t("看到喜欢的故事线或地点故事，点一下书签，")}<br />{t("下次就能从这里找回来。")}</p></div>}</Modal>}
 {modal === 'finish' && <Modal title={t("这一段巴黎，读到了尾声。")} close={() => setModal(null)}><p className="modal-lead">{t(route.closing)}</p><div className="recap"><div><b>{t(read)}</b><span>{t("章已读")}</span></div><div><b>{t(skipped)}</b><span>{t("章跳过")}</span></div><div><b>{t(route.stops.length - read - skipped)}</b><span>{t("章待探索")}</span></div></div><button className="primary" onClick={()=>{const next=nextUnreadChapter(route,state);nav({type:"route",route:route.persona_id,chapter:next??0});setMapOpenRoute(next===null?null:route.persona_id);}}>{t(nextUnreadChapter(route,state)===null?"回看这条故事线 ":"继续未读的章节")}<ArrowRight size={16}/></button><button className="text-link" onClick={() => setModal('personas')}>{t("换一种人格，继续读巴黎")}</button></Modal>}
  {modal === 'share' && <Modal title={t("分享这个故事")} close={() => setModal(null)}><input className="share-input" readOnly value={shareUrl} onFocus={e => e.target.select()} /></Modal>}
 {toast && <div role="status" className="toast">{t(toast)}</div>}
 </div>;
}
