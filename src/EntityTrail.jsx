import { useI18n } from './i18n';
import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, BookOpen } from 'lucide-react';
import { getEntityTrail, entityKey } from './model.mjs';
import MapView from './LazyMap';
export default function EntityTrail({
  data,
  view,
  nav,
  onStory,
  onEntity,
  onReturn
}) {
  const {
    t
  } = useI18n();
  const trail = getEntityTrail(data, view.entity);
  const selected = trail.stories.find(s => s.id === view.event) || trail.stories[0];
  const selectedPoi = data.pois.find(p => p.id === selected.poi_id);
  const places = [...new Set(trail.stories.map(s => s.poi_id))];
  const mapRoute = {
    persona_id: 'entity',
    stops: places.map(id => ({
      poi: data.pois.find(p => p.id === id)
    }))
  };
  const related = [...new Set((selected.person_names || []).filter(n => entityKey(n) !== entityKey(view.entity)))];
  const pick = s => nav({
    ...view,
    event: s.id
  }, false);
  return <main className="entity-page">
  <button className="back-link" onClick={onReturn}><ArrowLeft size={15} />{t("回到出发的故事")}</button>
  <header className="entity-heading"><span className="eyebrow">{t("STORY NOTES · PARIS")}</span><div className="entity-title"><span className="entity-monogram">{t(t(view.entity).replace(/[《》]/g, '').slice(0, 1))}</span><div><h1>{t(view.entity)}</h1><p>{t("故事支线 · 了解人物与作品背后的轶事。")}</p></div></div><div className="entity-facts"><span><BookOpen size={15} />{t(trail.stories.length)}{t(" 则相关故事")}</span><span><MapPin size={15} />{t(trail.placeCount)}{t(" 个地点")}</span><span>{t("主线章节保留，随时回到出发的故事。")}</span></div></header>
  <div className="entity-layout"><section className="entity-events"><div className="section-bar"><h2>{t("与这则故事有关的补充阅读")}</h2><span>{t("RELATED STORIES")}</span></div><p className="time-note">{t("按故事年代中首先出现的明确年份排列；保留原文中的约数、多段时间与影视标记。这是相关故事集，不是完整生平。")}</p><ol>{trail.stories.map((s, i) => {
            const p = data.pois.find(p => p.id === s.poi_id);
            return <li key={s.id} className={s.id === selected.id ? 'active' : ''}><span className="event-dot">{t(String(i + 1).padStart(2, '0'))}</span><button className="event-select" onClick={() => pick(s)} aria-pressed={s.id === selected.id}><span className="event-date">{t(s.time.label)}</span><strong>{t(s.title)}</strong><p>{t(s.hook)}</p><span className="event-place"><MapPin size={12} />{t(p.name_zh)}{!Number.isFinite(p.coordinates?.lat) && t(' · 地图位置待核实')}</span></button><button className="event-read" onClick={() => onStory(s)}>{t("读完整轶事 ")}<ArrowUpRight size={13} /></button></li>;
          })}</ol></section>
  <aside className="entity-side"><div className="section-bar"><h2>{t("一段故事，一处坐标")}</h2><span>{t("PLACES & MEMORIES")}</span></div><MapView route={mapRoute} selected={places.indexOf(selected.poi_id)} onSelect={i => pick(trail.stories.find(s => s.poi_id === places[i]))} /><article className="entity-preview"><span className="eyebrow">{t("此刻停在 · ")}{t(selectedPoi.name_zh)}</span><h2>{t(selected.title)}</h2><p>{t(selected.why_here) || t(selected.hook)}</p><button className="primary" onClick={() => onStory(selected)}>{t("走进这则故事 ")}<ArrowRight size={16} /></button>{related.length > 0 && <div className="connected-names"><span>{t("在这则故事里，还会遇见")}</span><div>{related.map(n => <button key={n} onClick={() => onEntity(n)}>{t(n)}<ArrowUpRight size={12} /></button>)}</div><small>{t("依据同一则故事中的人物记录，不额外推断关系。")}</small></div>}</article><div className="trail-return"><span>{t("暂时岔开，也随时回得去。")}</span><button onClick={onReturn}><ArrowLeft size={14} />{t("继续原来的故事")}</button></div></aside></div>
 </main>;
}
