import test from 'node:test';
import assert from 'node:assert/strict';
import shared from '../../shared/demo-data.json' with {type:'json'};
import sample from '../tests/fixtures/game-compare-santander-rf-ahorro.json' with {type:'json'};
import type { Instrument } from './catalog.ts';
import type { GameComparison, GameSpec } from './server-api.ts';
import { GAME_ASSUMPTIONS, GameInputError, buildGameSpec, gameDefaults, gameInstruments, gameMaxMonths, localizeAssumption, summarizeGame, validateGame, type GameForm } from './game-domain.ts';

const instruments = shared.instruments as Instrument[];
const santander = { instrumentId: 'santander-rf-ahorro', bankId: 'santander', dataStatus: 'historical_nav', identifier: 'ES0000000001' } as Instrument;
const form: GameForm = { initial: 1000, monthly: 100, months: 3, sellMonth: 2, buyFeePercent: 1, sellFeePercent: 1 };
const spec: GameSpec = { instrumentId: 'santander-rf-ahorro', initial: 1000, monthly: 100, months: 3, sellMonth: 2, buyFeeRate: 0.01, sellFeeRate: 0.01 };
const fresh = () => structuredClone(sample) as unknown as GameComparison;
const rejectsField = (f: GameForm, field: string, inst: Instrument | null = santander, max = 12) => assert.throws(() => buildGameSpec(f, inst ?? undefined, max), (e: unknown) => e instanceof GameInputError && e.field === field);

test('the game excludes CaixaBank and instruments without historical NAV', () => {
  const list = [
    santander,
    { ...santander, instrumentId: 'caixabank-monetario-estandar', bankId: 'caixabank' },
    { ...santander, instrumentId: 'bbva-mi-inversion-bolsa', bankId: 'bbva', dataStatus: 'unsupported_distributions' },
    { ...santander, instrumentId: 'annual', dataStatus: 'annual_history' },
  ] as Instrument[];
  assert.deepEqual(gameInstruments(list).map(i => i.instrumentId), ['santander-rf-ahorro']);
  assert.ok(!gameInstruments(instruments).some(i => i.bankId === 'caixabank' || i.instrumentId === 'caixabank-monetario-estandar'));
  assert.ok(instruments.some(i => i.instrumentId === 'caixabank-monetario-estandar'), 'CaixaBank stays in the shared catalogue');
});

test('buildGameSpec converts fees to rates and validates every bound', () => {
  assert.deepEqual(buildGameSpec(form, santander, 12), spec);
  assert.equal(buildGameSpec({ ...form, buyFeePercent: 0.07, sellFeePercent: 5 }, santander, 12).buyFeeRate, 0.0007);
  assert.equal(buildGameSpec({ ...form, buyFeePercent: 0.29 }, santander, 12).buyFeeRate, 0.0029);
  assert.equal(buildGameSpec({ ...form, initial: 0 }, santander, 12).initial, 0);
  assert.equal(buildGameSpec({ ...form, sellMonth: 0 }, santander, 12).sellMonth, 0);
  assert.equal(buildGameSpec({ ...form, sellMonth: 3 }, santander, 12).sellMonth, 3);
  rejectsField({ ...form, sellMonth: 4 }, 'sellMonth');
  rejectsField({ ...form, sellMonth: -1 }, 'sellMonth');
  rejectsField({ ...form, sellMonth: 1.5 }, 'sellMonth');
  rejectsField({ ...form, initial: 0, monthly: 0 }, 'amounts');
  rejectsField({ ...form, initial: -1 }, 'initial');
  rejectsField({ ...form, monthly: NaN }, 'monthly');
  rejectsField({ ...form, initial: 1e9 + 1 }, 'initial');
  rejectsField({ ...form, months: 0 }, 'months');
  rejectsField({ ...form, months: 13, sellMonth: 2 }, 'months');
  rejectsField({ ...form, months: 2.5 }, 'months');
  rejectsField({ ...form, buyFeePercent: 5.01 }, 'buyFee');
  rejectsField({ ...form, sellFeePercent: -0.1 }, 'sellFee');
  rejectsField(form, 'instrument', { ...santander, bankId: 'caixabank' });
  rejectsField(form, 'instrument', null);
  assert.throws(() => buildGameSpec({ ...form, months: 73 }, santander, 100), GameInputError);
});

test('max months and defaults come from the fund history and stay clamped', () => {
  const nav = { instruments: [{ isin: 'ES0000000001', eligible: true, monthly: Array.from({ length: 73 }, (_, i) => ({ date: `d${i}`, nav: '1' })) }, { isin: 'ES0000000002', eligible: false, monthly: [{ date: 'a', nav: '1' }, { date: 'b', nav: '1' }] }] } as never;
  assert.equal(gameMaxMonths(santander, nav), 72);
  assert.equal(gameMaxMonths({ identifier: 'ES0000000002' }, nav), 0);
  assert.equal(gameMaxMonths(undefined, nav), 0);
  const other = { ...santander, instrumentId: 'other' } as Instrument;
  assert.deepEqual(gameDefaults([santander, other], 'caixabank-monetario-estandar', '500', '50', '120', () => 72), { instrumentId: 'santander-rf-ahorro', initial: '500', monthly: '50', months: '72', sellMonth: '36' });
  assert.equal(gameDefaults([santander, other], 'other', '1', '1', '12', () => 6).months, '6');
  assert.equal(gameDefaults([], undefined, '1', '1', '12', () => 0).instrumentId, '');
});

test('validateGame accepts the real server response', () => {
  assert.doesNotThrow(() => validateGame(spec, fresh()));
});

test('validateGame rejects mismatches with the request, the manifest and itself', () => {
  const mutate = (change: (r: GameComparison) => void, s: GameSpec = spec) => { const r = fresh(); change(r); assert.throws(() => validateGame(s, r), /Invalid game response/); };
  mutate(() => {}, { ...spec, instrumentId: 'other' });
  mutate(() => {}, { ...spec, months: 2, sellMonth: 2 });
  mutate(() => {}, { ...spec, sellMonth: 1 });
  mutate(() => {}, { ...spec, monthly: 50 });
  mutate(r => { (r as { schemaVersion: string }).schemaVersion = '1.0'; });
  mutate(r => { (r as { currency: string }).currency = 'USD'; });
  mutate(r => { (r as { dataKind: string }).dataKind = 'synthetic'; });
  mutate(r => { r.provenance.datasetSha256 = '0'; });
  mutate(r => { r.provenance.navHistorySha256 = '0'; });
  mutate(r => { r.provenance.datasetVersion = 'other'; });
  mutate(r => { r.sell.timeline[1].date = '2020-01-30'; });
  mutate(r => { r.hold.timeline[2].date = 'not-a-date'; });
  mutate(r => { r.hold.timeline.pop(); });
  mutate(r => { r.hold.timeline[1].periodIndex = 2; });
  mutate(r => { r.hold.value = '2000'; });
  mutate(r => { r.hold.contributed = '1301'; });
  mutate(r => { r.sell.timeline[3].total = '1'; });
  mutate(r => { r.sell.timeline[3].units = '1'; });
  mutate(r => { r.hold.timeline[0].price = 'abc'; });
  mutate(r => { r.assumptions = [1] as never; });
  mutate(r => { r.sell.timeline[1].total = '1'; });
});

test('summarizeGame converts decimals for display and exposes dates and series', () => {
  const s = summarizeGame(fresh());
  assert.ok(Math.abs(s.hold.value - 1254.627403898195) < 1e-9);
  assert.ok(Math.abs(s.sell.value - 1275.834803884758) < 1e-9);
  assert.equal(s.hold.contributed, 1300);
  assert.equal(s.sell.cash, s.sell.value);
  assert.equal(s.series.length, 4);
  assert.deepEqual(s.series[2], { month: 2, date: '2020-02-29', hold: 1187.7119231159177, sell: 1175.8348038847585, contributed: 1200 });
  assert.equal(s.sellDate, '2020-02-29');
  assert.equal(s.periodStart, '2019-12-31');
  assert.equal(s.periodEnd, '2020-03-31');
});

test('all server assumptions have fixed Spanish and English copy', () => {
  for (const text of fresh().assumptions) { assert.ok(GAME_ASSUMPTIONS[text], text); assert.notEqual(localizeAssumption(text, 'es'), text); assert.notEqual(localizeAssumption(text, 'en'), text); }
  assert.equal(localizeAssumption('unknown', 'en'), 'unknown');
});
