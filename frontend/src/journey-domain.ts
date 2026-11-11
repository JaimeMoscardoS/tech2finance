/** Pure helpers for the guided simulator journey. Display and evaluation only: no financial engine here. */
import type { NavHistory } from './server-api.ts';

export type Guess = 'more' | 'less' | 'same';
export type Outcome = Guess;
/** A result counts as "about the same" when the difference is at most this share of the reference amount. */
export const SAME_TOLERANCE = 0.01;

type Series = { date: string; nav: string }[];

/** Monthly NAV rows of the eligible series for an ISIN, or an empty list. */
export function navSeries(navHistory: Pick<NavHistory, 'instruments'>, isin: string | null | undefined): Series {
  return navHistory.instruments.find(h => h.isin === isin && h.eligible)?.monthly ?? [];
}

/** Largest peak-to-trough fall of the series, as a non-positive percentage. Null with fewer than two valid points. */
export function maxDrawdownPercent(values: readonly number[]): number | null {
  if (values.length < 2 || values.some(v => !Number.isFinite(v) || v <= 0)) return null;
  let peak = values[0];
  let worst = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const drawdown = (v - peak) / peak;
    if (drawdown < worst) worst = drawdown;
  }
  return worst === 0 ? 0 : Math.round(worst * 1e6) / 1e4;
}

/** Points for an SVG polyline scaled to the box; null with fewer than two valid points. Flat series draw a centred line. */
export function sparklinePoints(values: readonly number[], width: number, height: number, pad = 2): string | null {
  if (values.length < 2 || values.some(v => !Number.isFinite(v))) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1);
  const y = (v: number) => (span === 0 ? height / 2 : height - pad - ((v - min) * (height - 2 * pad)) / span);
  return values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
}

/** What happened, compared with the reference: "same" when |difference| <= 1 % of |reference|. */
export function classifyDifference(difference: number, reference: number): Outcome {
  if (!Number.isFinite(difference) || !Number.isFinite(reference)) throw new Error('Invalid amounts');
  if (Math.abs(difference) <= SAME_TOLERANCE * Math.abs(reference)) return 'same';
  return difference > 0 ? 'more' : 'less';
}

/** Step 2 rule: final money against what was contributed, using profit and contributed from the calculation. */
export function evaluatePrediction(guess: Guess, profit: number, contributed: number): { actual: Outcome; matched: boolean } {
  const actual = classifyDifference(profit, contributed);
  return { actual, matched: actual === guess };
}

/** Step 3 rule: money after selling at month N against holding to the end. */
export function evaluateSellPrediction(guess: Guess, sellValue: number, holdValue: number): { actual: Outcome; matched: boolean } {
  const actual = classifyDifference(sellValue - holdValue, holdValue);
  return { actual, matched: actual === guess };
}

/** "mar 2021" / "Mar 2021" from an ISO date. */
export function monthLabel(iso: string | undefined, language: 'es' | 'en'): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const date = new Date(`${iso}T00:00:00Z`);
  if (!Number.isFinite(date.valueOf())) return '';
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date).replace('.', '');
}

/** Long form for the challenge hint: "marzo de 2020" / "March 2020". */
export function longMonthLabel(iso: string, language: 'es' | 'en'): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/** Index of the first close inside the given "YYYY-MM", or -1. */
export function findMonthIndex(dates: readonly string[], yearMonth: string): number {
  return dates.findIndex(d => d.startsWith(yearMonth));
}

/** Largest number of months the slider offers: observed monthly closes minus one, capped at 72. */
export function sliderMonths(closes: number, cap = 72): number {
  return Math.max(0, Math.min(cap, closes - 1));
}

export type Preset = { id: 'lump' | 'gradual'; initial: number; monthly: number };
export const PRESETS: readonly Preset[] = [
  { id: 'lump', initial: 1000, monthly: 0 },
  { id: 'gradual', initial: 100, monthly: 50 },
];
export const matchesPreset = (preset: Preset, initial: string, monthly: string) => Number(initial) === preset.initial && Number(monthly || '0') === preset.monthly && initial.trim() !== '';

/** Fund card facts computed from the real monthly NAV series. */
export function fundMetrics(navHistory: Pick<NavHistory, 'instruments'>, isin: string | null | undefined) {
  const rows = navSeries(navHistory, isin);
  const values = rows.map(r => Number(r.nav));
  return {
    values,
    first: rows[0]?.date,
    last: rows.at(-1)?.date,
    maxDrawdown: maxDrawdownPercent(values),
  };
}

/** Change of the NAV in the first close of "YYYY-MM" against the previous close, in percent; null if unavailable. */
export function monthChange(rows: Series, yearMonth: string): { index: number; percent: number } | null {
  const index = rows.findIndex(r => r.date.startsWith(yearMonth));
  if (index < 1) return null;
  const now = Number(rows[index].nav);
  const before = Number(rows[index - 1].nav);
  if (!Number.isFinite(now) || !Number.isFinite(before) || before <= 0 || now <= 0) return null;
  return { index, percent: Math.round((now / before - 1) * 1e6) / 1e4 };
}
