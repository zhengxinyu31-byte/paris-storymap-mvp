import { useI18n } from './i18n';
import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Photo from './Photo';
export default function StorylineLibrary({
  data,
  onChoose,
  onShowAll
}) {
  const {
    t
  } = useI18n();
  return <section className="library-storylines" aria-label={t("巴黎故事线")}>
  <div className="section-bar"><h2>{t("选一条故事线，巴黎就有了下一章")}</h2><button onClick={onShowAll}>{t("全部 ")}{t(data.routes.length)}{t(" 条故事线 ")}<ArrowRight size={14} /></button></div>
  <div className="storyline-grid">{data.routes.slice(0, 6).map(r => {
        const persona = data.personas.find(p => p.id === r.persona_id);
        const firstPoi = data.pois.find(p => p.id === r.stops[0].poi_id);
        return <button className="storyline-card" key={r.id} onClick={() => onChoose(r.persona_id)}>
    <Photo poi={firstPoi} compact />
    <div className="storyline-card-body"><small>{t("为「")}{t(persona.name_zh)}{t("」推荐 · ")}{t(r.stops.length)}{t(" 个章节")}</small><h3>{t(r.title)}</h3><p>{t(r.opening)}</p><span>{t("进入故事线 ")}<ArrowUpRight size={15} /></span></div>
   </button>;
      })}</div>
 </section>;
}
