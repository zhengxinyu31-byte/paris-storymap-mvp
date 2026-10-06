import { useI18n } from './i18n';
import React, { useState } from 'react';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';
export default function StoryQuestions({
  story,
  sources,
  onEntity
}) {
  const {
    t
  } = useI18n();
  const [active, setActive] = useState(null);
  const questions = [['place', '为什么故事发生在这里？', story.why_here], ['people', '人物之间是什么关系？', story.relationship], ['look', '今天可以留意什么？', story.observable_cue], ['evidence', '有哪些细节需要辨读？', story.caveat]].filter(q => q[2]);
  if (!questions.length) return null;
  const selected = questions.find(q => q[0] === active);
  return <section className="story-questions"><span className="eyebrow">{t("顺着线索，再多读一点")}</span><div className="question-buttons">{questions.map(([id, label]) => <button key={id} aria-expanded={active === id} aria-controls={'answer-' + story.id} onClick={() => setActive(active === id ? null : id)}>{t(label)}{active === id ? <Minus size={13} /> : <Plus size={13} />}</button>)}</div>{selected && <div className="question-answer" id={'answer-' + story.id}><h3>{t(selected[1])}</h3><p>{t(selected[2])}</p>{active === 'people' && <div className="entity-tags">{t(story.person_names?.map(n => <button key={n} onClick={() => onEntity(n)}>{t(n)}<ArrowUpRight size={12} /></button>))}</div>}<div className="answer-sources"><span>{t("本故事的资料")}</span>{(story.source_ids || []).map(id => sources.find(s => s.id === id)).filter(Boolean).map(s => <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{t(s.publisher)} · {t(s.title)}<ArrowUpRight size={11} /></a>)}</div></div>}</section>;
}
