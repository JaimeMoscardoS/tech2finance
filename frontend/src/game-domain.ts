import manifest from '../../shared/data-manifest.json' with { type: 'json' };
import type { Instrument } from './catalog';
import type { GameComparison, GameSide, GameSpec, NavHistory } from './server-api';

/** Banks excluded from the hold/sell game only; the rest of the app is unaffected. */
export const GAME_EXCLUDED_BANK_IDS: readonly string[] = ['caixabank'];
export const GAME_MAX_MONTHS = 72;
export const GAME_MAX_AMOUNT = 1_000_000_000;
export const GAME_MAX_FEE_PERCENT = 5;

export type GameForm = { initial: number; monthly: number; months: number; sellMonth: number; buyFeePercent: number; sellFeePercent: number };
export type GameField = 'instrument' | 'initial' | 'monthly' | 'amounts' | 'months' | 'sellMonth' | 'buyFee' | 'sellFee';
export class GameInputError extends Error {
  readonly field: GameField;
  constructor(field: GameField) { super(`Invalid game input: ${field}`); this.name = 'GameInputError'; this.field = field; }
}

export function gameInstruments(instruments: readonly Instrument[]): Instrument[] {
  return instruments.filter(i => i.dataStatus === 'historical_nav' && !GAME_EXCLUDED_BANK_IDS.includes(i.bankId));
}

/** Months available for a fund: monthly observations minus one, capped at the backend limit. */
export function gameMaxMonths(instrument: Pick<Instrument, 'identifier'> | undefined, navHistory: Pick<NavHistory, 'instruments'>): number {
  const series = navHistory.instruments.find(h => h.isin === instrument?.identifier && h.eligible);
  return series ? Math.min(GAME_MAX_MONTHS, Math.max(0, series.monthly.length - 1)) : 0;
}

export function gameDates(instrument: Pick<Instrument, 'identifier'> | undefined, navHistory: Pick<NavHistory, 'instruments'>): string[] {
  return navHistory.instruments.find(h => h.isin === instrument?.identifier && h.eligible)?.monthly.map(row => row.date) ?? [];
}

const inRange = (n: number, max: number) => Number.isFinite(n) && n >= 0 && n <= max;

export function buildGameSpec(form: GameForm, instrument: Instrument | undefined, maxMonths: number): GameSpec {
  if (!instrument || !gameInstruments([instrument]).length) throw new GameInputError('instrument');
  if (!inRange(form.initial, GAME_MAX_AMOUNT)) throw new GameInputError('initial');
  if (!inRange(form.monthly, GAME_MAX_AMOUNT)) throw new GameInputError('monthly');
  if (form.initial + form.monthly <= 0) throw new GameInputError('amounts');
  if (!Number.isInteger(form.months) || form.months < 1 || form.months > Math.min(maxMonths, GAME_MAX_MONTHS)) throw new GameInputError('months');
  if (!Number.isInteger(form.sellMonth) || form.sellMonth < 0 || form.sellMonth > form.months) throw new GameInputError('sellMonth');
  if (!inRange(form.buyFeePercent, GAME_MAX_FEE_PERCENT)) throw new GameInputError('buyFee');
  if (!inRange(form.sellFeePercent, GAME_MAX_FEE_PERCENT)) throw new GameInputError('sellFee');
  const rate = (percent: number) => Math.round(percent / 100 * 1e6) / 1e6;
  return { instrumentId: instrument.instrumentId, initial: form.initial, monthly: form.monthly, months: form.months, sellMonth: form.sellMonth, buyFeeRate: rate(form.buyFeePercent), sellFeeRate: rate(form.sellFeePercent) };
}

export function gameDefaults(eligible: readonly Instrument[], selectedId: string | undefined, initial: string, monthly: string, months: string, maxFor: (item: Instrument) => number) {
  const item = eligible.find(i => i.instrumentId === selectedId) ?? eligible[0];
  const max = item ? maxFor(item) : 0;
  const wanted = Number(months);
  const clamped = Math.max(1, Math.min(Number.isInteger(wanted) ? wanted : 12, Math.max(1, max)));
  return { instrumentId: item?.instrumentId ?? '', initial, monthly, months: String(clamped), sellMonth: String(Math.floor(clamped / 2)) };
}

const fail = (reason: string): never => { throw new Error(`Invalid game response: ${reason}`); };
const close = (a: number, b: number) => Math.abs(a - b) <= 0.01 + 1e-9 * Math.max(Math.abs(a), Math.abs(b));
const num = (value: string) => { const n = Number(value); return Number.isFinite(n) ? n : fail('number'); };
const isoOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

export function validateGame(spec: GameSpec, response: GameComparison): void {
  if (response.schemaVersion !== '2.0') fail('schemaVersion');
  if (response.instrumentId !== spec.instrumentId) fail('instrumentId');
  if (response.months !== spec.months) fail('months');
  if (response.sellMonth !== spec.sellMonth) fail('sellMonth');
  if (response.currency !== 'EUR') fail('currency');
  if (response.dataKind !== 'historical_nav') fail('dataKind');
  const p = response.provenance;
  if (p?.datasetVersion !== manifest.datasetVersion || p.datasetSha256 !== manifest.datasetSha256 || p.navHistorySha256 !== manifest.navHistorySha256) fail('provenance');
  if (typeof p.calculationVersion !== 'string' || !p.calculationVersion) fail('calculationVersion');
  if (!Array.isArray(response.assumptions) || !response.assumptions.every(a => typeof a === 'string')) fail('assumptions');
  const contributedAt = (month: number) => spec.initial + spec.monthly * month;
  const checkSide = (side: GameSide, isSell: boolean) => {
    if (!Array.isArray(side.timeline) || side.timeline.length !== spec.months + 1) fail('timeline length');
    side.timeline.forEach((point, i) => {
      if (point.month !== i || point.periodIndex !== i) fail('timeline index');
      if (!isoOk(point.date)) fail('date');
      if (i > 0 && point.date <= side.timeline[i - 1].date) fail('date order');
      for (const key of ['price', 'contributed', 'cash', 'units', 'fees', 'total'] as const) num(point[key]);
      if (!close(num(point.contributed), contributedAt(i))) fail('timeline contributed');
      if (isSell && i >= spec.sellMonth && num(point.units) !== 0) fail('units after sale');
    });
    for (const key of ['contributed', 'cash', 'units', 'fees', 'value', 'profit'] as const) num(side[key]);
    const last = side.timeline[spec.months];
    if (!close(num(side.contributed), contributedAt(spec.months))) fail('contributed');
    if (!close(num(side.profit), num(side.value) - num(side.contributed))) fail('profit');
    if (!close(num(last.total), num(side.value))) fail('total');
    if (isSell && num(side.units) !== 0) fail('final units');
  };
  checkSide(response.hold, false);
  checkSide(response.sell, true);
  response.hold.timeline.forEach((point, i) => {
    if (point.date !== response.sell.timeline[i].date) fail('dates differ');
    if (i < spec.sellMonth && !close(num(point.total), num(response.sell.timeline[i].total))) fail('paths diverge before sale');
  });
}

export type SideSummary = { value: number; contributed: number; fees: number; profit: number; cash: number; units: number; simpleReturn: number | null };
export type GameSummary = {
  hold: SideSummary; sell: SideSummary;
  series: { month: number; date: string; hold: number; sell: number; contributed: number }[];
  sellDate: string; periodStart: string; periodEnd: string;
};
const side = (s: GameSide): SideSummary => ({ value: num(s.value), contributed: num(s.contributed), fees: num(s.fees), profit: num(s.profit), cash: num(s.cash), units: num(s.units), simpleReturn: s.simpleReturn === null ? null : num(s.simpleReturn) });

/** Converts decimal strings to numbers for display only; all calculations stay on the server. */
export function summarizeGame(response: GameComparison): GameSummary {
  const series = response.hold.timeline.map((point, i) => ({ month: point.month, date: point.date, hold: num(point.total), sell: num(response.sell.timeline[i].total), contributed: num(point.contributed) }));
  return { hold: side(response.hold), sell: side(response.sell), series, sellDate: series[response.sellMonth].date, periodStart: series[0].date, periodEnd: series[series.length - 1].date };
}

export const GAME_ASSUMPTIONS: Record<string, { es: string; en: string }> = {
  'Observed CNMV NAV; monthly contributions execute on observed closes after NAV change.': { es: 'Se usan valores liquidativos observados de la CNMV; las aportaciones mensuales se ejecutan en cada cierre observado, después del cambio del valor liquidativo.', en: 'Observed CNMV net asset values are used; monthly contributions execute on observed closes, after the NAV change.' },
  'Sale-date contribution is invested before sale; later contributions remain cash.': { es: 'La aportación del mes de venta se invierte antes de vender; las aportaciones posteriores quedan en efectivo.', en: 'The contribution in the sale month is invested before selling; later contributions stay as cash.' },
  'Reported distributions are zero at published precision; no future policy is guaranteed.': { es: 'Los reembolsos o distribuciones publicados son cero con la precisión disponible; no se garantiza ninguna política futura.', en: 'Reported distributions are zero at the published precision; no future policy is guaranteed.' },
  'Costs embedded in NAV are not deducted again; explicit game fees are separate.': { es: 'Los costes ya incluidos en el valor liquidativo no se descuentan de nuevo; las comisiones del juego son explícitas y aparte.', en: 'Costs already embedded in the NAV are not deducted again; the game fees are explicit and separate.' },
  'No taxes, real orders, prediction or recommendation.': { es: 'No incluye impuestos ni órdenes reales, ni es una predicción o una recomendación.', en: 'No taxes or real orders are included, and this is neither a prediction nor a recommendation.' },
};
export const localizeAssumption = (text: string, language: 'es' | 'en') => GAME_ASSUMPTIONS[text]?.[language] ?? text;
