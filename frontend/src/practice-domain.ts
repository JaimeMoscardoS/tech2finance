import type { Instrument } from './catalog';
import type { ServerSimulation, SimulationSpec } from './server-api';

export type Lesson = 'contributions' | 'horizon' | 'assets';
export type PracticeSettings = { instrumentId: string; alternativeInstrumentId: string; initial: number; contribution: number; periods: number; alternativePeriods: number };
export type ExperimentPair = { lesson: Lesson; baseline: SimulationSpec; alternative: SimulationSpec; dataStatus: 'fictional' | 'annual_history' | 'historical_nav' };
export type ComparisonFeedback = { valueDelta: number; contributedDelta: number; profitDelta: number; text: string[]; limitation: string };

const amount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e9;
const periodsValid = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 72;
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 + 1e-12 * Math.max(Math.abs(a), Math.abs(b));

export function buildExperiment(lesson: Lesson, settings: PracticeSettings, instruments: Instrument[]): ExperimentPair {
  if (!['contributions', 'horizon', 'assets'].includes(lesson) || !settings || !Array.isArray(instruments) || !amount(settings.initial) || !amount(settings.contribution) || !periodsValid(settings.periods) || !periodsValid(settings.alternativePeriods)) throw new Error('Invalid practice settings');
  const instrument = instruments.find(item => item.instrumentId === settings.instrumentId);
  if (!instrument || instrument.dataStatus === 'missing_history') throw new Error('Instrument history unavailable');
  if (instrument.dataStatus !== 'fictional' && instrument.dataStatus !== 'annual_history' && instrument.dataStatus !== 'historical_nav') throw new Error('Invalid instrument');
  if (instrument.dataStatus === 'annual_history' && (lesson !== 'contributions' || settings.periods !== 5)) throw new Error('Annual history covers five years');
  if (lesson === 'contributions' && settings.contribution <= 0) throw new Error('Contribution must be positive');
  if (lesson === 'horizon' && (!['fictional','historical_nav'].includes(instrument.dataStatus) || settings.periods === settings.alternativePeriods)) throw new Error('Choose different fictional horizons');
  if (lesson === 'assets') {
    const alternative = instruments.find(item => item.instrumentId === settings.alternativeInstrumentId);
    if (!['fictional','historical_nav'].includes(instrument.dataStatus) || !alternative || alternative.dataStatus !== instrument.dataStatus || alternative.currency !== instrument.currency || alternative.instrumentId === instrument.instrumentId) throw new Error('Choose two different fictional instruments');
  }
  const common = { instrumentId: instrument.instrumentId, initial: settings.initial, recurringContribution: lesson === 'horizon' ? 0 : settings.contribution, periods: settings.periods };
  const baseline = { ...common, recurringContribution: lesson === 'contributions' ? 0 : common.recurringContribution };
  const alternative = { ...common, ...(lesson === 'horizon' ? { periods: settings.alternativePeriods } : {}), ...(lesson === 'assets' ? { instrumentId: settings.alternativeInstrumentId } : {}) };
  return { lesson, baseline, alternative, dataStatus: instrument.dataStatus };
}

function validateResult(spec: SimulationSpec, status: ExperimentPair['dataStatus'], result: ServerSimulation): void {
  const kind = status === 'fictional' ? 'fictional_monthly' : status === 'historical_nav' ? 'real_monthly_nav' : 'annual_history';
  const timing = status === 'fictional' ? 'month_start' : status === 'historical_nav' ? 'month_end_after_return' : 'year_end_after_return';
  if (!result || result.instrumentId !== spec.instrumentId || result.kind !== kind || result.contributionTiming !== timing || result.currency !== 'EUR' || !Array.isArray(result.timeline) || result.timeline.length !== spec.periods + 1 || !Array.isArray(result.points) || result.points.length !== spec.periods + 1 || !Array.isArray(result.sources) || !Array.isArray(result.assumptions)) throw new Error('Simulation does not match experiment');
  const numbers = [result.value, result.contributed, result.profit];
  if (!numbers.every(n => typeof n === 'number' && Number.isFinite(n)) || result.value < 0 || !close(result.contributed, spec.initial + spec.recurringContribution * spec.periods) || !close(result.profit, result.value - result.contributed)) throw new Error('Inconsistent simulation totals');
  const expectedPercent = result.contributed === 0 ? null : result.profit / result.contributed * 100;
  if (expectedPercent === null ? result.simpleReturnPercent !== null : typeof result.simpleReturnPercent !== 'number' || !Number.isFinite(result.simpleReturnPercent) || !close(result.simpleReturnPercent, expectedPercent)) throw new Error('Inconsistent simulation return');
  let factor = 1;
  for (let i = 0; i <= spec.periods; i++) {
    const point = result.timeline[i];
    if (!point || point.period !== i || ![point.value, point.contributed, point.profit, point.contribution, point.valueBeforeContribution, point.instrumentReturnPercent, result.points[i]].every(n => typeof n === 'number' && Number.isFinite(n)) || point.value < 0 || point.valueBeforeContribution < 0 || !close(point.contribution, i === 0 ? spec.initial : spec.recurringContribution) || !close(point.contributed, spec.initial + spec.recurringContribution * i) || !close(point.profit, point.value - point.contributed) || !close(point.value, result.points[i]) || (status === 'fictional' ? point.date !== null : status === 'annual_history' ? point.date !== `${2020 + i}-12-31` : !point.date || !/^\d{4}-\d{2}-\d{2}$/.test(point.date))) throw new Error('Inconsistent simulation timeline');
    if (i === 0) {
      if (point.periodReturn !== null || !close(point.valueBeforeContribution, 0) || !close(point.instrumentReturnPercent, 0)) throw new Error('Inconsistent initial point');
    } else {
      const rate = point.periodReturn;
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < -1) throw new Error('Invalid period return');
      const previous = result.timeline[i - 1].value;
      const before = status === 'fictional' ? previous : previous * (1 + rate);
      const value = status === 'fictional' ? (before + point.contribution) * (1 + rate) : before + point.contribution;
      factor *= 1 + rate;
      if (![before, value, factor].every(Number.isFinite) || !close(point.valueBeforeContribution, before) || !close(point.value, value) || !close(point.instrumentReturnPercent, (factor - 1) * 100)) throw new Error('Inconsistent simulation trajectory');
    }
  }
  const last = result.timeline[spec.periods];
  if (!close(result.timeline[0].value, spec.initial) || !close(last.value, result.value) || !close(last.contributed, result.contributed) || !close(last.profit, result.profit)) throw new Error('Inconsistent simulation endpoints');
}

export function explainComparison(pair: ExperimentPair, baselineResult: ServerSimulation, alternativeResult: ServerSimulation, language: 'es' | 'en'): ComparisonFeedback {
  if (!pair || !['contributions', 'horizon', 'assets'].includes(pair.lesson) || !['fictional', 'annual_history', 'historical_nav'].includes(pair.dataStatus) || !['es', 'en'].includes(language)) throw new Error('Invalid comparison');
  const a = pair.baseline, b = pair.alternative;
  if (!a || !b || !amount(a.initial) || !amount(b.initial) || !amount(a.recurringContribution) || !amount(b.recurringContribution) || !periodsValid(a.periods) || !periodsValid(b.periods) || !a.instrumentId || !b.instrumentId || a.initial !== b.initial || (pair.dataStatus === 'annual_history' && (pair.lesson !== 'contributions' || a.periods !== 5)) || (pair.lesson === 'contributions' && (a.instrumentId !== b.instrumentId || a.periods !== b.periods || a.recurringContribution !== 0 || b.recurringContribution <= 0)) || (pair.lesson === 'horizon' && (!['fictional','historical_nav'].includes(pair.dataStatus) || a.instrumentId !== b.instrumentId || a.periods === b.periods || a.recurringContribution !== 0 || b.recurringContribution !== 0)) || (pair.lesson === 'assets' && (!['fictional','historical_nav'].includes(pair.dataStatus) || a.instrumentId === b.instrumentId || a.periods !== b.periods || a.recurringContribution !== b.recurringContribution))) throw new Error('Scenarios are not comparable');
  validateResult(a, pair.dataStatus, baselineResult); validateResult(b, pair.dataStatus, alternativeResult);
  if (pair.dataStatus === 'historical_nav' && (baselineResult.timeline[0].date !== alternativeResult.timeline[0].date || (pair.lesson !== 'horizon' && baselineResult.timeline.at(-1)?.date !== alternativeResult.timeline.at(-1)?.date))) throw new Error('Historical windows do not match');
  const valueDelta = alternativeResult.value - baselineResult.value;
  const contributedDelta = alternativeResult.contributed - baselineResult.contributed;
  const profitDelta = alternativeResult.profit - baselineResult.profit;
  const format = (n: number) => new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR', signDisplay: 'exceptZero' }).format(n);
  const text = language === 'es' ? [`Cambio en valor final: ${format(valueDelta)}.`, `Cambio en total aportado: ${format(contributedDelta)}.`, `Cambio en ganancia o pérdida: ${format(profitDelta)}.`] : [`Change in final value: ${format(valueDelta)}.`, `Change in total contributed: ${format(contributedDelta)}.`, `Change in gain or loss: ${format(profitDelta)}.`];
  const limitation = pair.dataStatus === 'historical_nav' ? (language === 'es' ? 'Cierres mensuales históricos de la CNMV; el pasado no predice resultados futuros.' : 'Historical monthly CNMV closes; past results do not predict future results.') : pair.dataStatus === 'annual_history' ? (language === 'es' ? 'Reconstrucción de rentabilidades publicadas de 2021 a 2025; el pasado no predice resultados futuros.' : 'Reconstruction from published 2021–2025 returns; past results do not predict future results.') : (language === 'es' ? 'Series ficticias que se repiten cada doce meses; los resultados no son una predicción ni una garantía.' : 'Fictional series repeat every twelve months; results are neither predictions nor guarantees.');
  return { valueDelta, contributedDelta, profitDelta, text, limitation };
}
