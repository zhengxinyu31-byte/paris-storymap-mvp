import test from 'node:test';
import assert from 'node:assert/strict';
import {createTranslator, readLanguage, LANGUAGE_KEY} from '../src/i18n-core.mjs';

test('language choice defaults to Chinese and survives unavailable or invalid storage', () => {
  assert.equal(readLanguage({getItem:key => key === LANGUAGE_KEY ? 'en' : null}), 'en');
  for (const value of [null, '', 'fr', 'EN', '{broken']) assert.equal(readLanguage({getItem:() => value}), 'zh');
  assert.equal(readLanguage({getItem:() => {throw Error('storage denied');}}), 'zh');
});
test('localized templates can reorder parameters without translating IDs or coercing React children', () => {
  const t = createTranslator('en', {'第{0}章：{1}':'{1} — Chapter {0}'});
  assert.equal(t('第{0}章：{1}',3,'Café de Flore'),'Café de Flore — Chapter 3');
  assert.equal(t('cafe-de-flore'),'cafe-de-flore');
  assert.equal(t(0),0);
  const child={type:'span'};assert.equal(t(child),child);
  assert.equal(t(undefined),undefined);
});
