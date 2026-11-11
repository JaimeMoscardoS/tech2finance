import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalTutorProvider, suggestedQuestions } from '../src/index.ts';
import type { KnowledgeLevel, Language, Page, TutorContext } from '../src/types.ts';

const levels: KnowledgeLevel[] = ['beginner', 'intermediate', 'advanced'];
const pages: Page[] = ['home', 'explore', 'simulator', 'portfolio', 'learn', 'game'];
const ctx = (page: Page, level: KnowledgeLevel, language: Language = 'es'): TutorContext => ({ page, level, language });
const ask = (message: string, context: TutorContext) => createLocalTutorProvider().reply({ message, context });

test('concept answers differ by level and get longer from basic to advanced', async () => {
  for (const q of ['What is risk?', 'What is a fund?', 'What are costs?']) {
    const [b, i, a] = await Promise.all(levels.map(l => ask(q, ctx('home', l, 'en'))));
    assert.equal(new Set([b.text, i.text, a.text]).size, 3, q);
    assert.ok(b.text.length < a.text.length, q);
  }
  const [, , a] = await Promise.all(levels.map(l => ask('que es el riesgo', ctx('home', l))));
  assert.match(a.text, /Sharpe/);
});

test('advanced decline answer states assumptions; no level promises recovery or pressures to hold', async () => {
  const decline = { status: 'ok', basisName: 'x', dataKind: 'fictional', observationCount: 4, latestLabel: '3', latestValue: 90, peakValue: 100, currentDrawdownPercent: 10, maxDrawdownPercent: 20, episodes: [], sources: [], causesStatus: 'unknown', comparablesStatus: 'not_available', limitations: [] } as const;
  for (const level of levels) for (const language of ['es', 'en'] as const) {
    const r = await ask(language === 'es' ? 'qué significa esta caída' : 'what does this drawdown mean', { ...ctx('game', level, language), decline });
    assert.equal(r.intent, 'decline');
    assert.doesNotMatch(r.text, /seguro que se recupera|will recover|deberías mantener|you should hold/i);
    if (level === 'advanced') assert.match(r.text, /Supuestos|Assumptions/);
  }
  const d = await ask('qué hago, vender o mantener', ctx('game', 'advanced'));
  assert.equal(d.intent, 'decision'); assert.match(d.text, /decisión es tuya/); assert.match(d.text, /causalidad/);
  const b = await ask('sell or hold?', ctx('game', 'beginner', 'en'));
  assert.match(b.text, /the decision is yours/); assert.match(b.text, /decide now or later/);
});

test('every page including learn and game gets level-specific orientation and suggestions', async () => {
  for (const page of pages) for (const language of ['es', 'en'] as const) {
    const texts = new Set<string>();
    for (const level of levels) {
      const r = await ask('hola', ctx(page, level, language));
      assert.equal(r.intent, 'unknown'); texts.add(r.text);
      const qs = suggestedQuestions(page, level, language);
      assert.equal(qs.length, 3); assert.equal(new Set(qs).size, 3);
    }
    assert.equal(texts.size, 3, `${page}/${language}`);
    assert.notDeepEqual(suggestedQuestions(page, 'beginner', language), suggestedQuestions(page, 'advanced', language));
  }
  assert.equal(suggestedQuestions('home', 'beginner', 'en', true)[0], 'What does this decline mean?');
});

test('suggested questions are answered by the local tutor (not unknown)', async () => {
  for (const page of pages) for (const level of levels) for (const language of ['es', 'en'] as const)
    for (const q of suggestedQuestions(page, level, language)) {
      const r = await ask(q, ctx(page, level, language));
      assert.doesNotMatch(r.text, /observaciones válidas|valid observations|No hay observaciones|no observations/i, `${page}/${level}/${language}: ${q} returns a no-data text`);
      if (/drawdown|caída máxima|caída desde/i.test(q)) assert.equal(r.intent, 'decline');
      if (/fondo y ETF|fund and an ETF/.test(q)) assert.equal(r.intent, 'fund_etf');
      if (/seeing|viendo/.test(q)) assert.ok(['bank_page', 'unknown'].includes(r.intent)); // sin banco en el contexto responde la orientación de pantalla
      else if (!/Explica el resultado|Explain the result|simulaci|simulation|rentabilidad|What is return/.test(q)) assert.notEqual(r.intent, 'unknown', `${page}/${level}/${language}: ${q}`);
    }
});

test('level changes explanation only: same facts and no investment orders', async () => {
  for (const level of levels) {
    const r = await ask('what is diversification', ctx('portfolio', level, 'en'));
    assert.equal(r.intent, 'diversification');
    assert.doesNotMatch(r.text, /\b(buy|sell now)\b|guarantee(?!s? (?:no|cannot))/i);
  }
});
