import test from 'node:test';
import assert from 'node:assert/strict';
import legacy from '../../shared/snapshots/demo-2026-11-10.1/demo-data.json' with {type:'json'};
import type {Instrument} from './catalog.ts';
const instruments = legacy.instruments as Instrument[];
import { simulate } from './demo.ts';
import { replayAnnual } from './annual-history.ts';
import { buildExperiment, explainComparison, type PracticeSettings } from './practice-domain.ts';
import type { SimulationSpec, ServerSimulation } from './server-api.ts';

const defaults: PracticeSettings = { instrumentId: 'demo-etf', alternativeInstrumentId: 'demo-stock', initial: 500, contribution: 20, periods: 12, alternativePeriods: 60 };
function result(spec: SimulationSpec): ServerSimulation {
  const instrument = instruments.find(i => i.instrumentId === spec.instrumentId)!;
  const annual = instrument.dataStatus === 'annual_history';
  const value = annual ? replayAnnual(spec.initial, spec.recurringContribution) : simulate(spec.initial, spec.recurringContribution, spec.periods, instrument.returns);
  return { ...value, instrumentId: spec.instrumentId, currency: 'EUR', contributionTiming: annual ? 'year_end_after_return' : 'month_start', sources: [], assumptions: [] };
}
test('contributions compare the same instrument and periods and separate cash from gains', () => {
  const pair = buildExperiment('contributions', defaults, instruments);
  assert.deepEqual(pair.baseline, { instrumentId: 'demo-etf', initial: 500, recurringContribution: 0, periods: 12 });
  assert.equal(pair.alternative.recurringContribution, 20);
  const a = result(pair.baseline), b = result(pair.alternative);
  const feedback = explainComparison(pair, a, b, 'es');
  assert.equal(feedback.contributedDelta, 240);
  assert.ok(Math.abs(feedback.valueDelta - feedback.contributedDelta - feedback.profitDelta) < 1e-8);
  assert.match(feedback.text[2], /ganancia o pérdida/);
  assert.match(feedback.limitation, /ficticias/);
});
test('annual history has five closing contributions and fixed dates', () => {
  const pair = buildExperiment('contributions', { ...defaults, instrumentId: 'caixabank-monetario-estandar', contribution: 100, periods: 5 }, instruments);
  const feedback = explainComparison(pair, result(pair.baseline), result(pair.alternative), 'en');
  assert.equal(feedback.contributedDelta, 500);
  assert.match(feedback.limitation, /2021–2025/);
  assert.throws(() => buildExperiment('contributions', { ...defaults, instrumentId: 'caixabank-monetario-estandar', periods: 6 }, instruments));
});
test('horizon and asset comparisons hold other controls constant', () => {
  const horizon = buildExperiment('horizon', defaults, instruments);
  assert.equal(horizon.baseline.recurringContribution, 0);
  assert.equal(horizon.alternative.recurringContribution, 0);
  assert.equal(horizon.alternative.periods, 60);
  assert.equal(explainComparison(horizon, result(horizon.baseline), result(horizon.alternative), 'es').contributedDelta, 0);
  const assets = buildExperiment('assets', defaults, instruments);
  assert.equal(assets.alternative.instrumentId, 'demo-stock');
  assert.equal(explainComparison(assets, result(assets.baseline), result(assets.alternative), 'en').contributedDelta, 0);
});
test('zero investment has undefined percentage and loss remains a loss', () => {
  const zero = buildExperiment('horizon', { ...defaults, initial: 0 }, instruments);
  const z = result(zero.baseline); assert.equal(z.simpleReturnPercent, null);
  assert.equal(explainComparison(zero, z, result(zero.alternative), 'es').valueDelta, 0);
  const pair = buildExperiment('assets', { ...defaults, periods: 2, initial: 500, contribution: 0 }, instruments);
  assert.ok(result(pair.baseline).profit < 0); assert.ok(result(pair.alternative).profit < 0);
  explainComparison(pair, result(pair.baseline), result(pair.alternative), 'es');
});
test('invalid settings and non-comparable instruments are rejected', () => {
  for (const bad of [-1, 1e9 + 1, NaN, Infinity, true, '1']) assert.throws(() => buildExperiment('contributions', { ...defaults, initial: bad as number }, instruments));
  for (const bad of [0, 121, 1.5, NaN, true]) assert.throws(() => buildExperiment('assets', { ...defaults, periods: bad as number }, instruments));
  assert.throws(() => buildExperiment('contributions', { ...defaults, contribution: 0 }, instruments));
  assert.throws(() => buildExperiment('assets', { ...defaults, alternativeInstrumentId: 'demo-etf' }, instruments));
  assert.throws(() => buildExperiment('assets', { ...defaults, alternativeInstrumentId: 'caixabank-monetario-estandar' }, instruments));
  assert.throws(() => buildExperiment('contributions', { ...defaults, instrumentId: 'bbva-mi-inversion-bolsa' }, instruments));
  assert.throws(() => buildExperiment('horizon', { ...defaults, alternativePeriods: 12 }, instruments));
});
test('rejects mixed results, malformed totals, non-finite data and changed controls', () => {
  const pair = buildExperiment('assets', defaults, instruments), a = result(pair.baseline), b = result(pair.alternative);
  assert.throws(() => explainComparison(pair, b, a, 'es'));
  assert.throws(() => explainComparison(pair, { ...a, contributionTiming: 'year_end_after_return' }, b, 'es'));
  assert.throws(() => explainComparison(pair, { ...a, contributed: a.contributed + 1 }, b, 'es'));
  assert.throws(() => explainComparison(pair, { ...a, profit: NaN }, b, 'es'));
  assert.throws(() => explainComparison(pair, { ...a, simpleReturnPercent: null }, b, 'es'));
  assert.throws(() => explainComparison({ ...pair, alternative: { ...pair.alternative, periods: 5 } }, a, b, 'es'));
});
test('rejects altered trajectory, rate and instrument return for both contribution timings', () => {
  for (const settings of [defaults, { ...defaults, instrumentId: 'caixabank-monetario-estandar', periods: 5 }]) {
    const pair = buildExperiment('contributions', settings, instruments);
    const a = result(pair.baseline), b = result(pair.alternative);
    const changed = (index: number, patch: Partial<typeof a.timeline[number]>) => ({ ...a, timeline: a.timeline.map((p, i) => i === index ? { ...p, ...patch } : p) });
    for (const corrupted of [
      changed(0, { periodReturn: 0 }), changed(0, { valueBeforeContribution: 1 }), changed(0, { instrumentReturnPercent: 1 }),
      changed(1, { valueBeforeContribution: -123 }), changed(1, { valueBeforeContribution: a.timeline[1].valueBeforeContribution + 1 }),
      changed(1, { periodReturn: 7 }), changed(1, { periodReturn: -1.1 }), changed(1, { periodReturn: null }),
      changed(1, { instrumentReturnPercent: 700 }),
    ]) assert.throws(() => explainComparison(pair, corrupted, b, 'es'));
  }
});
