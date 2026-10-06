import React, {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Check, Compass, MapPin, RotateCcw, Sparkles} from 'lucide-react';
import {useI18n} from './i18n';
import Photo from './Photo';
import quiz from '../content/personality-quiz.json';
import {QUIZ_KEY, emptyQuiz, restoreQuiz, answerQuestion, matchPersona} from './quiz-model.mjs';

const dimensions = {culture:'你想看见什么', planning:'你的旅行节奏', social:'你喜欢的陪伴', spending:'你愿意如何体验'};
const traits = {
  culture:['氛围与拍照','有趣的小故事','人物与作品'],
  planning:['随心漫游','大致有方向','有序探索'],
  social:['安静独处','两三好友','结伴热聊'],
  spending:['免费也精彩','值得才花','为体验买单']
};
const preferenceNotes = {
  culture:['你先被一个地方的氛围和画面吸引。','你愿意为有趣的小故事停下，不必每站都读得很深。','你喜欢沿人物与作品的线索，读懂一个地方。'],
  planning:['你喜欢随心走，给偶遇留出空间。','有大致方向就够了，途中仍可以改变主意。','明确的站序与节奏，让你更安心地探索。'],
  social:['你享受安静独行，按自己的节奏观察。','你更喜欢和一两个熟人分享沿途见闻。','和大家边走边聊，会让旅途更有趣。'],
  spending:['你优先选择不花钱也能享受的体验。','你愿意为值得的体验付费，再按兴趣做选择。','你愿意花钱换取喜欢的体验。']
};

export default function PersonalityQuiz({data, view, nav, onChoose, onShowAll, hasJourney, onReturn}) {
  const {t} = useI18n();
  const [session, setSession] = useState(() => {
    try { return restoreQuiz(localStorage.getItem(QUIZ_KEY), quiz.questions); }
    catch { return emptyQuiz(); }
  });
  const [pending, setPending] = useState(false);
  const timer = useRef(null), locked = useRef(false), heading = useRef(null);
  const persona = matchPersona(session.answers, quiz.questions, data.personas);
  const result = view.stage === 'result' && persona;
  const question = quiz.questions[session.step];
  const profile = persona && quiz.profiles.find(p => p.id === persona.id);
  const route = persona && data.routes.find(r => r.id === persona.default_route_id);
  const go = stage => nav({...view, type:'quiz', stage});

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(session)); } catch { /* Session stays usable in memory. */ }
  }, [session]);
  useEffect(() => {
    if (view.stage === 'result' && !persona) go('questions');
  }, [view.stage, persona]);
  useEffect(() => { heading.current?.focus({preventScroll:true}); }, [session.step, !!result]);

  function answer(choice) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    const next = answerQuestion(session, question.id, choice, quiz.questions);
    setSession({...next, step:session.step});
    timer.current = setTimeout(() => {
      setSession(next);
      setPending(false);
      locked.current = false;
      if (session.step === quiz.questions.length - 1) go('result');
    }, 280);
  }
  function restart() {
    clearTimeout(timer.current);
    locked.current = false;
    setPending(false);
    setSession(emptyQuiz());
    go('questions');
  }

  return <main className={'quiz-page ' + (result ? 'quiz-result-page' : '')}>
    <div className="quiz-topline"><button className="back-link" onClick={hasJourney?onReturn:onShowAll}>{hasJourney?<ArrowLeft size={15}/>:<MapPin size={15}/>}{t(hasJourney?'返回我的路线':'直接选故事线')}</button><span><Compass size={14}/>{t('四个选择，发现你的巴黎')}</span></div>
    {!result&&!hasJourney&&<p className="quiz-path-hint">{t('四个选择 → 一条推荐路线 → 跟着地图读故事')}</p>}
    {result ? <>
      <section className="quiz-persona" aria-labelledby="quiz-heading" data-persona={persona.id}>
        <div className="quiz-result-symbol" aria-hidden="true"><Sparkles size={32}/></div>
        <span className="eyebrow">{t('这次的旅行人格')}</span>
        <h1 id="quiz-heading" ref={heading} tabIndex={-1}>{t(persona.name_zh)} <small>{persona.id}</small></h1>
        <p className="quiz-tagline">{t(profile.taglineZh)}</p>
        <p className="quiz-description">{Object.values(session.answers).includes(1) ? quiz.questions.map(q=>t(preferenceNotes[q.dimension][session.answers[q.id]])).join(' ') : t(profile.descZh)}</p>
        <div className="quiz-traits" aria-label={t('你的四个旅行偏好')}>{quiz.questions.map(q => <div key={q.id}><small>{t(dimensions[q.dimension])}</small><strong>{t(traits[q.dimension][session.answers[q.id]])}</strong></div>)}</div>
      </section>
      <section className="quiz-recommendation" aria-labelledby="recommendation-title">
        <div className="quiz-route-photo"><Photo poi={data.pois.find(p=>p.id===route.stops[0].poi_id)} compact eager/></div>
        <div className="quiz-route-content"><span className="eyebrow">{t('从这条故事线出发')}</span><h2 id="recommendation-title">{t(route.title)}</h2><p>{t(route.opening)}</p>
          <div className="quiz-match-reason"><Sparkles size={15}/><div><strong>{t('为什么推荐给你')}</strong><p>{t(persona.match_reason)}</p></div></div>
          <span className="quiz-route-meta"><MapPin size={14}/>{t('巴黎 · {0} 个故事章节', route.stops.length)}</span>
          <p className="quiz-route-duration">{t(route.walking_note)}</p>
          <button className="primary quiz-open-route" onClick={()=>onChoose(route.persona_id)}>{t('在地图上开启这条故事线')}<ArrowRight size={17}/></button>
        </div>
      </section>
      <div className="quiz-result-actions"><button onClick={restart}><RotateCcw size={15}/>{t('重新测试')}</button><button onClick={()=>{setSession(s=>({...s,step:3}));go('questions');}}>{t('修改我的选择')}</button><button onClick={onShowAll}>{t('看看其他故事线')}<ArrowRight size={14}/></button></div>
    </> : <section className="quiz-question-panel" aria-labelledby="quiz-heading">
      <div className="quiz-progress-label"><span>{t('旅行人格测试')}</span><span>{t('第 {0} / {1} 题',session.step+1,quiz.questions.length)}</span></div>
      <div className="quiz-progress" role="progressbar" aria-label={t('答题进度')} aria-valuemin={0} aria-valuemax={4} aria-valuenow={Object.keys(session.answers).length}>{quiz.questions.map((q,i)=><span key={q.id} className={(i===session.step?'current ':'')+(Number.isInteger(session.answers[q.id])?'answered':'')}/>)}</div>
      <span className="quiz-question-number" aria-hidden="true">0{session.step+1}</span>
      <h1 id="quiz-heading" ref={heading} tabIndex={-1}>{t(question.promptZh)}</h1>
      <p className="quiz-instruction">{t('选最像你的那一个。最后一题后，故事线会为你展开。')}</p>
      <div className="quiz-options" role="group" aria-labelledby="quiz-heading" aria-busy={pending}>{question.options.map((option,i)=><button key={question.id+':'+i} className={'quiz-option '+(session.answers[question.id]===i?'chosen':'')} aria-pressed={session.answers[question.id]===i} disabled={pending} onClick={()=>answer(i)}><span className="quiz-option-letter" aria-hidden="true">{'ABC'[i]}</span><span>{t(option.labelZh)}</span>{session.answers[question.id]===i?<Check size={18}/>:<ArrowRight size={17}/>}</button>)}</div>
      <div className="quiz-question-bottom"><button disabled={session.step===0||pending} onClick={()=>setSession(s=>({...s,step:s.step-1}))}><ArrowLeft size={15}/>{t('上一题')}</button><span>{t('选择后自动继续')}</span></div>
    </section>}
  </main>;
}
