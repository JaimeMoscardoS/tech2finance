import { MAX_SIMULATION_AMOUNT, type SimulationResult, type TimelinePoint } from './simulation-types.ts';

/** Published annual returns; rounded source figures, not transaction prices. */
export const annualHistory = {
  instrumentId: "caixabank-monetario-estandar",
  kind: "annual_published_returns",
  sourceUrl: "https://www.caixabankassetmanagement.com/es/fondos/caixabank-monetario-rendimiento-fi-clase-estandar",
  sourceDate: "2026-11-09",
  baseline: "2020-12-31",
  currency: "EUR",
  returns: [
    { year: 2021, rate: -0.0053 },
    { year: 2022, rate: -0.0067 },
    { year: 2023, rate: 0.0243 },
    { year: 2024, rate: 0.0297 },
    { year: 2025, rate: 0.0153 },
  ],
} as const;

/** Applies each published return, then adds the annual contribution at year end. */
export function replayAnnual(initial: number, annualContribution: number = 0): SimulationResult {
  if (![initial, annualContribution].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_SIMULATION_AMOUNT)) throw new Error('Invalid amount');
  let value = initial, contributed = initial, factor = 1;
  const timeline: TimelinePoint[] = [{ period: 0, date: annualHistory.baseline, valueBeforeContribution: 0, contribution: initial, contributed, value, profit: 0, instrumentReturnPercent: 0, periodReturn: null }];
  for (const [index, { year, rate }] of annualHistory.returns.entries()) {
    const before = value * (1 + rate);
    value = before + annualContribution; contributed += annualContribution; factor *= 1 + rate;
    const profit = value - contributed, instrumentReturnPercent = (factor - 1) * 100;
    if (![before, value, contributed, profit, instrumentReturnPercent].every(Number.isFinite)) throw new Error('Result exceeds supported range');
    timeline.push({ period: index + 1, date: `${year}-12-31`, valueBeforeContribution: before, contribution: annualContribution, contributed, value, profit, instrumentReturnPercent, periodReturn: rate });
  }
  const last = timeline[timeline.length - 1];
  const simpleReturnPercent = last.contributed === 0 ? null : last.profit / last.contributed * 100;
  if (simpleReturnPercent !== null && !Number.isFinite(simpleReturnPercent)) throw new Error('Result exceeds supported range');
  return { kind: 'annual_history', points: timeline.map(p => p.value), timeline, value: last.value, contributed: last.contributed, profit: last.profit, simpleReturnPercent };
}
