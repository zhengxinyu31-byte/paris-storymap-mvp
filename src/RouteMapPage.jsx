import React,{useRef} from 'react';
import {ArrowLeft,ArrowRight,Bookmark,Share2,MapPin,Info,X,Check} from 'lucide-react';
import {useI18n} from './i18n';
import MapView from './LazyMap';
import Photo from './Photo';
import {navigationUrl} from './route-paths.mjs';
import {nextUnreadChapter} from './journey.mjs';

export default function RouteMapPage({route,places,resumeIndex=0,selected,onSelect,onClose,onRead,onChoose,onSave,onShare,saved,reading}) {
 const {t}=useI18n();
 const stage=useRef(null);
 const stop=selected===null?null:route.stops[selected];
 const suggested=nextUnreadChapter(route,reading,selected??resumeIndex);
 const hasProgress=Object.values(reading).some(s=>s==='read'||s==='skipped');
 const read=route.stops.filter(s=>reading[s.story_id]==='read').length;
 // A shared cemetery entrance is a reference point, never a fabricated grave location.
 const mapRoute={...route,stops:route.stops.map(s=>{
  if(Number.isFinite(s.poi.coordinates?.lat)&&Number.isFinite(s.poi.coordinates?.lon))return s;
  const parent=places.find(p=>p.id===s.poi.parent_poi_id);
  return parent?.coordinates?{...s,poi:{...s.poi,coordinates:parent.coordinates,map_group_id:parent.id,map_label:parent.name_zh}}:s;
 })};
 const next=stop&&route.stops[selected+1];
 const nav=next&&navigationUrl(stop,next);
 const reference=stop&&mapRoute.stops[selected].poi.map_group_id;
 const unlocated=stop&&!Number.isFinite(mapRoute.stops[selected].poi.coordinates?.lat);
 function close(){const marker=stage.current?.querySelector('[aria-pressed="true"][data-stop-index]');onClose();marker?.focus({preventScroll:true});}
 return <main className="route-map-page">
  <header className="route-map-heading">
   <div><div className="route-map-kicker"><span>{route.persona_id} · {t(route.persona.name_zh)}</span><span>{t('{0} 个故事章节',route.stops.length)} · {t('{0} 章已读',read)}</span></div><h1>{t(route.title)}</h1></div>
   <div className="route-map-actions"><button className="route-switch" onClick={onChoose}>{t('换一条故事线')}<ArrowRight size={14}/></button><button className={'icon outlined '+(saved?'saved':'')} aria-label={t(saved?'取消收藏路线':'收藏路线')} aria-pressed={saved} onClick={onSave}><Bookmark size={17}/></button><button className="icon outlined" aria-label={t('分享路线')} onClick={onShare}><Share2 size={16}/></button></div>
  </header>
  <section className={'route-map-stage '+(stop?'has-card':'')} ref={stage} aria-label={t('故事线地图')} onKeyDown={e=>{if(e.key==='Escape'&&stop){e.stopPropagation();close();}}}>
   <MapView route={mapRoute} selected={selected} onSelect={onSelect} onClear={onClose} expanded/>
   <details className="route-map-info"><summary><Info size={16}/>{t('路线简介')}</summary><div><p>{t(route.opening)}</p>{route.duration_hint&&<small>{t(route.duration_hint)}</small>}<p>{t(route.walking_note)}</p></div></details>
   {!stop&&<div className="route-map-hint journey-map-hint"><span>{t('按数字顺序游览，点地点读故事。')}</span><button className="start-route primary" onClick={()=>onSelect(suggested??0)}>{suggested===null?t('回看第 1 站'):t(hasProgress?'继续第 {0} 站':'从第 {0} 站开始',(suggested??0)+1)}<ArrowRight size={14}/></button></div>}
   {stop&&<article className="route-poi-card" aria-label={t('地点故事卡片')} key={stop.story_id}>
    <div className="route-card-photo"><Photo poi={stop.poi} compact eager/><button className="route-card-close icon" onClick={close} aria-label={t('关闭地点卡片')}><X size={18}/></button><span className="route-card-number">{String(selected+1).padStart(2,'0')} / {String(route.stops.length).padStart(2,'0')}</span></div>
    <div className="route-card-content"><div className="route-card-phase"><span>{t(stop.phase)||t('第 {0} 章',selected+1)}</span>{reading[stop.story_id]==='read'?<span><Check size={12}/>{t('已读')}</span>:reading[stop.story_id]==='skipped'?<span>{t('已跳过')}</span>:null}</div><h2>{t(stop.poi.name_zh)}</h2><h3>{t(stop.story.title)}</h3><p className="route-card-hook">{t(stop.story.hook)}</p>{reference&&<small className="route-card-location-note">{t('标记为公墓入口，墓位请看官方导览。')}</small>}{unlocated&&<small className="route-card-location-note">{t('地图位置待核实，请看官方导览。')}</small>}{next&&<div className="route-next-leg"><span>{t('下一站：{0}',t(next.poi.name_zh))}</span>{nav&&<a href={nav} target="_blank" rel="noreferrer">{t('查看前往下一站的导航')} ↗</a>}</div>}<div className="route-card-actions"><button className="primary read-story" onClick={()=>onRead(selected)}>{t('读这则故事')}<ArrowRight size={16}/></button><button className="icon outlined" disabled={selected===0} onClick={()=>onSelect(selected-1)} aria-label={t('上一个地点')}><ArrowLeft size={16}/></button><button className="icon outlined" disabled={selected===route.stops.length-1} onClick={()=>onSelect(selected+1)} aria-label={t('下一个地点')}><ArrowRight size={16}/></button></div></div>
   </article>}
  </section>
 </main>;
}
