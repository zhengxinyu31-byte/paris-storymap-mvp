import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {createTranslator, readLanguage, LANGUAGE_KEY} from './i18n-core.mjs';
import zh from '../content/i18n/zh-ui.json';

// Build-time local files: reading and switching never depend on a translation service.
const dictionaries = import.meta.glob('../content/i18n/en-*.json', {eager: true, import: 'default'});
const english = Object.assign({}, ...Object.keys(dictionaries).sort().map(key => dictionaries[key]));
export const englishText = createTranslator('en', english);
const LanguageContext = createContext(null);
export function LanguageProvider({children}) {
  const [language, setLanguage] = useState(() => readLanguage({getItem: key => window.localStorage.getItem(key)}));
  const t = useMemo(() => createTranslator(language, english, zh), [language]);
  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? 'Paris StoryMap · Stories of Paris' : 'Paris StoryMap · 巴黎故事地图';
    document.querySelector('meta[name="description"]')?.setAttribute('content', language === 'en'
      ? 'Choose a travel personality and discover Paris through connected stories, places and real-life anecdotes.'
      : '选一个旅行人格，跟着故事线探索巴黎的地点、名人轶事与城市记忆。');
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Reading remains available without storage. */ }
  }, [language]);
  const value = useMemo(() => ({language, setLanguage, t}), [language, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useI18n() { return useContext(LanguageContext); }
