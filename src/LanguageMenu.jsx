import React, {useEffect, useRef, useState} from 'react';
import {Languages, Check, ChevronDown} from 'lucide-react';
import {useI18n} from './i18n';
export default function LanguageMenu() {
  const {language, setLanguage} = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef(null), trigger = useRef(null);
  const choices = [{id:'zh', label:'中文'}, {id:'en', label:'English'}];
  function close() { setOpen(false); trigger.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector('[aria-checked="true"]')?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <div className="language-control" ref={root} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (open && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      const items = [...root.current.querySelectorAll('[role="menuitemradio"]')];
      const index = items.indexOf(document.activeElement);
      items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length]?.focus();
    }
  }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className="language-trigger" ref={trigger} aria-label={language === 'en' ? 'Switch language' : '切换语言'} aria-haspopup="menu" aria-expanded={open} aria-controls="language-menu" onClick={() => setOpen(value => !value)} onKeyDown={event => {if (event.key === 'ArrowDown') {event.preventDefault();setOpen(true);}}}>
      <Languages size={17}/><span>{language === 'en' ? 'EN' : '中文'}</span><ChevronDown size={12}/>
    </button>
    {open && <div className="language-menu" id="language-menu" role="menu" aria-label={language === 'en' ? 'Choose a language' : '选择语言'}>
      {choices.map(choice => <button key={choice.id} role="menuitemradio" aria-checked={language === choice.id} onClick={() => {setLanguage(choice.id);close();}}><span lang={choice.id === 'zh' ? 'zh-CN' : 'en'}>{choice.label}</span>{language === choice.id && <Check size={16}/>}</button>)}
    </div>}
  </div>;
}
