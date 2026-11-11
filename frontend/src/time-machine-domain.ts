/** Pure helpers for the "Vive el recorrido" replay. Everything is derived from the real simulation timeline: nothing is invented. */
import { classifyDifference, type Outcome } from './journey-domain.ts';

export type ReplayRow = {
  period: number;
  date: string | null;
  nav?: string;
  value: number;
  contributed: number;
  profit: number;
  instrumentReturnPercent: number;
};
export type PauseKind = 'drop' | 'high' | 'recover' | 'end';
export type PausePoint = {
  month: number;
  /** One or more reasons share a month (for example the largest drop can also be the last month). */
  kinds: PauseKind[];
  /** Monthly change of the instrument in percent, only for the "drop" reason. */
  dropPercent?: number;
};
const EPSILON = 0.005;
const ORDER: Record<PauseKind, number> = { drop: 0, high: 1, recover: 2, end: 3 };

/** Instrument level of each month: the NAV when every row has one, otherwise 1 + cumulative return. Null when unusable. */
export function instrumentLevels(rows: readonly ReplayRow[]): number[] | null {
  const fromNav = rows.map(r => (r.nav === undefined ? NaN : Number(r.nav)));
  const levels = fromNav.every(n => Number.isFinite(n) && n > 0) ? fromNav : rows.map(r => 1 + r.instrumentReturnPercent / 100);
  return levels.every(n => Number.isFinite(n) && n > 0) ? levels : null;
}

/** Month-by-month change of the instrument (not of the user's balance), as a fraction. Index 0 is 0. */
export function monthlyChanges(rows: readonly ReplayRow[]): number[] {
  const levels = instrumentLevels(rows);
  if (!levels) return rows.map(() => 0);
  return levels.map((level, i) => (i === 0 ? 0 : level / levels[i - 1] - 1));
}

/**
 * Pause points from the real timeline, ordered by month:
 * - drop: the month with the largest monthly fall of the instrument (only if it actually fell);
 * - high: the first month after that fall in which the instrument exceeds every earlier level;
 * - recover: the first month in which the value is back at or above what was contributed after having been below it;
 * - end: the last month.
 */
export function detectPausePoints(rows: readonly ReplayRow[]): PausePoint[] {
  if (rows.length < 2) return [];
  const last = rows.length - 1;
  const found = new Map<number, PausePoint>();
  const add = (month: number, kind: PauseKind, extra: Partial<PausePoint> = {}) => {
    const existing = found.get(month);
    if (existing) { existing.kinds.push(kind); Object.assign(existing, extra); } else found.set(month, { month, kinds: [kind], ...extra });
  };
  const levels = instrumentLevels(rows);
  if (levels) {
    const changes = monthlyChanges(rows);
    let drop = 0;
    let worst = 0;
    for (let i = 1; i <= last; i++) if (changes[i] < worst) { worst = changes[i]; drop = i; }
    if (drop > 0) {
      add(drop, 'drop', { dropPercent: Math.round(changes[drop] * 1e6) / 1e4 });
      let peak = Math.max(...levels.slice(0, drop + 1));
      for (let i = drop + 1; i <= last; i++) {
        if (levels[i] > peak) { add(i, 'high'); break; }
        peak = Math.max(peak, levels[i]);
      }
    }
  }
  let below = false;
  for (let i = 1; i <= last; i++) {
    if (rows[i].value < rows[i].contributed - EPSILON) below = true;
    else if (below) { add(i, 'recover'); break; }
  }
  add(last, 'end');
  return [...found.values()].map(p => ({ ...p, kinds: [...new Set(p.kinds)].sort((a, b) => ORDER[a] - ORDER[b]) })).sort((a, b) => a.month - b.month);
}

/** Only the months up to and including the visible one: the single place where the future is cut off. */
export function visibleWindow<T>(items: readonly T[], month: number): T[] {
  if (!Number.isFinite(month)) return [];
  return items.slice(0, Math.max(0, Math.min(items.length, Math.floor(month) + 1)));
}

/** Interpretation question: is the user above, below or level with what was contributed? Same 1 % tolerance as step 2. */
export function standing(row: Pick<ReplayRow, 'profit' | 'contributed'>): Outcome {
  return classifyDifference(row.profit, row.contributed);
}

/** The pause the replay must show when it reaches `month`, or undefined. */
export function pauseAt(pauses: readonly PausePoint[], month: number): PausePoint | undefined {
  return pauses.find(p => p.month === month);
}

/** Whether a sale decision is offered at a pause: any pause except the last month (nothing is left to hold). */
export function offersDecision(pause: PausePoint, lastMonth: number): boolean {
  return pause.month < lastMonth && !pause.kinds.includes('end');
}
