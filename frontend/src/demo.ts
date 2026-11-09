import { MAX_SIMULATION_AMOUNT, type SimulationResult, type TimelinePoint } from './simulation-types.ts';

/** Hypothetical monthly returns, deliberately not historical market data. */
export const illustrativeReturns = [0.015, 0.012, -0.025, 0.02, -0.085, -0.045, 0.03, 0.025, 0.01, 0.02, -0.012, 0.018];
export function simulate(initial: number, monthly: number, months: number, returns: readonly number[] = illustrativeReturns): SimulationResult {
  if (![initial, monthly].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_SIMULATION_AMOUNT) || !Number.isInteger(months) || months < 1 || months > 120) throw new Error('Introduce cantidades válidas y un plazo entre 1 y 120 meses.');
  if (!Array.isArray(returns) || !returns.length || Array.from(returns).some(n => typeof n !== 'number' || !Number.isFinite(n) || n < -1)) throw new Error('Invalid returns');
  let value = initial, contributed = initial, factor = 1;
  const timeline: TimelinePoint[] = [{ period: 0, date: null, valueBeforeContribution: 0, contribution: initial, contributed, value, profit: 0, instrumentReturnPercent: 0, periodReturn: null }];
  for (let i = 0; i < months; i++) {
    const rate = returns[i % returns.length], before = value;
    value = (value + monthly) * (1 + rate); contributed += monthly; factor *= 1 + rate;
    const profit = value - contributed, instrumentReturnPercent = (factor - 1) * 100;
    if (![value, contributed, profit, instrumentReturnPercent].every(Number.isFinite)) throw new Error('Result exceeds supported range');
    timeline.push({ period: i + 1, date: null, valueBeforeContribution: before, contribution: monthly, contributed, value, profit, instrumentReturnPercent, periodReturn: rate });
  }
  const last = timeline[timeline.length - 1];
  const simpleReturnPercent = last.contributed === 0 ? null : last.profit / last.contributed * 100;
  if (simpleReturnPercent !== null && !Number.isFinite(simpleReturnPercent)) throw new Error('Result exceeds supported range');
  return { kind: 'fictional_monthly', points: timeline.map(p => p.value), timeline, value: last.value, contributed: last.contributed, profit: last.profit, simpleReturnPercent };
}
export const euro = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);