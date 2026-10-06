import React from 'react';
import {useI18n} from './i18n';
import {overviewPositions} from './map-points.mjs';
export default function MapOverview({points,segments=[],selected,onSelect,failed}) {
 const {t}=useI18n();
 const positions=overviewPositions(points);
 const positionFor=index=>positions[points.findIndex(p=>p.indexes.includes(index))];
 return <div className="map-fallback geographic-fallback">
  <div className="map-grid"/><span className="overview-city" aria-hidden="true">PARIS</span><span className="overview-north" aria-hidden="true">↑ N</span>
  <span className="fallback-heading">{t(failed?'底图暂不可用 · 可继续点选地点':'正在加载底图 · 可先点选地点')}</span>
  <svg className="overview-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="sequence-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#bd4935"/></marker></defs>{segments.map(s=>{const a=positionFor(s.index),b=positionFor(s.index+1);return a&&b&&a!==b?<line key={s.index} data-leg-index={s.index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} markerEnd="url(#sequence-arrow)" className={selected===s.index?'selected':''}/>:null;})}</svg>
  <svg className="overview-leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{positions.map((p,i)=><line key={i} x1={p.x} y1={p.y} x2={p.labelX} y2={p.labelY}/>)}</svg>
  {points.map((point,i)=><button key={point.id} className={'offline-map-pin '+(point.indexes.includes(selected)?'selected':'')} data-stop-index={point.index} style={{left:positions[i].labelX+'%',top:positions[i].labelY+'%'}} aria-label={t('地图第{0}站 {1}',point.indexes.map(n=>n+1).join(' / '),t(point.name))} aria-pressed={point.indexes.includes(selected)} onClick={()=>onSelect(point.indexes.includes(selected)?selected:point.index)}><b>{point.indexes.length>1?`${point.index+1}–${point.indexes.at(-1)+1}`:point.index+1}</b><span>{t(point.name)}</span></button>)}
  <small>{t('游览顺序示意 · 连线不代表实际道路')}</small>
 </div>;
}
