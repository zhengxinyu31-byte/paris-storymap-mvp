export const LANGUAGE_KEY = 'paris-storymap-language';
export function readLanguage(storage) {
  try { return storage?.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'; }
  catch { return 'zh'; }
}
export function createTranslator(language, english = {}, chinese = {}) {
  const dictionary = language === 'en' ? english : chinese;
  return function translate(value, ...args) {
    if (typeof value !== 'string') return value;
    const text = Object.hasOwn(dictionary, value) ? dictionary[value] : value;
    return args.length ? text.replace(/\{(\d+)\}/g, (match, i) => args[i] === undefined ? match : String(args[i])) : text;
  };
}
