/**
 * Cartera DEMO calculada: combina las entradas ficticias de shared/mock con las métricas probadas.
 * Nada de lo que devuelve esta función está escrito a mano; todo sale de `dashboard-metrics.ts`.
 */
import { demoBenchmark, demoFunds, demoPositions, DEMO_RISK_FREE_ANNUAL_PCT, type AssetClass, type Currency, type DemoFund, type Region } from "../../shared/mock/demo-portfolio.ts";
import { annualizedVolatility, changePct, cumulativeFromReturns, groupWeights, maxDrawdown, profitAndLoss, returnsFromSeries, sharpeRatio, equityShockImpactPct, MIN_MONTHLY_OBSERVATIONS, weightedAverage, weights } from "./dashboard-metrics.ts";

export type PositionRow = {
  fund: DemoFund;
  units: number;
  price: number;
  value: number;
  cost: number;
  weight: number;
  pnlAmount: number;
  pnlPercent: number | null;
  /** Variación a 12 meses del precio, null si no hay histórico. */
  change12m: number | null;
};

export type DemoPortfolio = {
  positions: PositionRow[];
  totalValue: number;
  totalCost: number;
  pnlAmount: number;
  pnlPercent: number | null;
  /** Valor total de la cartera por mes (índice 0 = mes 0). */
  valueSeries: number[];
  /** Índice de referencia ficticio, reescalado al valor inicial de la cartera. */
  benchmarkSeries: number[];
  labels: string[];
  byAssetClass: { key: AssetClass; value: number; weight: number }[];
  byRegion: { key: Region; value: number; weight: number }[];
  byCurrency: { key: Currency; value: number; weight: number }[];
  /** Exposición a renta variable look-through (0..1): Σ peso × equityWeight del fondo. null si no hay posiciones. */
  equityExposure: number | null;
  /** Riesgo medio ponderado por valor de los niveles de riesgo de producto (1 a 7). */
  averageRisk: number | null;
  volatilityPct: number | null;
  maxDrawdownPct: number | null;
  sharpe: number | null;
  riskFreeAnnualPct: number;
};

function emptyPortfolio(): DemoPortfolio {
  return {
    positions: [], totalValue: 0, totalCost: 0, pnlAmount: 0, pnlPercent: null, valueSeries: [], benchmarkSeries: [], labels: [],
    byAssetClass: [], byRegion: [], byCurrency: [], equityExposure: null, averageRisk: null, volatilityPct: null, maxDrawdownPct: null, sharpe: null,
    riskFreeAnnualPct: DEMO_RISK_FREE_ANNUAL_PCT,
  };
}

/**
 * `minObservations`: rentabilidades mensuales mínimas para volatilidad y Sharpe (12 por defecto;
 * solo se baja en pruebas con series cortas hechas a mano).
 */
export function buildDemoPortfolio(funds: readonly DemoFund[] = demoFunds, held = demoPositions, minObservations = MIN_MONTHLY_OBSERVATIONS): DemoPortfolio {
  if (held.length === 0) return emptyPortfolio();
  const prices = new Map(funds.map((f) => [f.id, cumulativeFromReturns(f.startPrice, f.monthlyReturnsPct)]));
  const base = held.map((p) => {
    const fund = funds.find((f) => f.id === p.fundId);
    const series = prices.get(p.fundId);
    if (!fund || !series) throw new RangeError(`Unknown demo fund ${p.fundId}`);
    return { fund, p, series };
  });
  const length = Math.min(...base.map((b) => b.series.length));
  const valueSeries = Array.from({ length }, (_, i) => base.reduce((s, b) => s + b.p.units * b.series[i], 0));
  const values = base.map((b) => b.p.units * b.series[b.series.length - 1]);
  const w = weights(values);
  const positions: PositionRow[] = base.map((b, i) => {
    const pnl = profitAndLoss(values[i], b.p.costBasisEur);
    return { fund: b.fund, units: b.p.units, price: b.series[b.series.length - 1], value: values[i], cost: b.p.costBasisEur, weight: w[i], pnlAmount: pnl.amount, pnlPercent: pnl.percent, change12m: changePct(b.series, 12) };
  });
  const totalValue = values.reduce((a, b) => a + b, 0);
  const totalCost = held.reduce((a, b) => a + b.costBasisEur, 0);
  const pnl = profitAndLoss(totalValue, totalCost);
  const monthly = returnsFromSeries(valueSeries);
  const benchmark = cumulativeFromReturns(valueSeries[0], demoBenchmark.monthlyReturnsPct).slice(0, length);
  return {
    positions,
    totalValue,
    totalCost,
    pnlAmount: pnl.amount,
    pnlPercent: pnl.percent,
    valueSeries,
    benchmarkSeries: benchmark,
    labels: valueSeries.map((_, i) => `M${i}`),
    byAssetClass: groupWeights(positions, (r) => r.fund.assetClass, (r) => r.value),
    byRegion: groupWeights(positions, (r) => r.fund.region, (r) => r.value),
    byCurrency: groupWeights(positions, (r) => r.fund.currency, (r) => r.value),
    equityExposure: weightedAverage(positions.map((r) => r.fund.equityWeight), w),
    averageRisk: weightedAverage(positions.map((r) => r.fund.riskLevel), w),
    volatilityPct: annualizedVolatility(monthly, minObservations),
    maxDrawdownPct: maxDrawdown(valueSeries),
    sharpe: sharpeRatio(monthly, DEMO_RISK_FREE_ANNUAL_PCT, minObservations),
    riskFreeAnnualPct: DEMO_RISK_FREE_ANNUAL_PCT,
  };
}

export type AgentFacts = {
  totalValue: number;
  pnlPercent: number | null;
  topName: string;
  topWeightPct: number;
  /** Peso de los fondos de clase «renta variable» (sin contar la parte de renta variable de los mixtos), en %. */
  equityWeightPct: number;
  /** Exposición a renta variable look-through (incluye la parte de los fondos mixtos), en %; la usa el escenario. */
  equityExposurePct: number;
  volatilityPct: number | null;
  maxDrawdownPct: number | null;
  averageRisk: number | null;
  sharpe: number | null;
  riskFreeAnnualPct: number;
  /** Impacto ilustrativo en % de la cartera de una caída hipotética de la renta variable (ejercicio de sensibilidad, no predicción). Incluye la renta variable de los fondos mixtos (`equityWeight`). */
  scenarios: { equityShockPct: number; portfolioImpactPct: number | null }[];
};

/** Hechos calculados que el panel de agente (educativo) se limita a explicar. */
export function deriveAgentFacts(p: DemoPortfolio, equityShocksPct: readonly number[] = [-10, -20]): AgentFacts {
  const top = [...p.positions].sort((a, b) => b.weight - a.weight)[0];
  const equity = p.byAssetClass.find((g) => g.key === "equity")?.weight ?? 0;
  return {
    totalValue: p.totalValue,
    pnlPercent: p.pnlPercent,
    topName: top?.fund.name ?? "",
    topWeightPct: (top?.weight ?? 0) * 100,
    equityWeightPct: equity * 100,
    equityExposurePct: (p.equityExposure ?? 0) * 100,
    volatilityPct: p.volatilityPct,
    maxDrawdownPct: p.maxDrawdownPct,
    averageRisk: p.averageRisk,
    sharpe: p.sharpe,
    riskFreeAnnualPct: p.riskFreeAnnualPct,
    scenarios: equityShocksPct.map((s) => ({ equityShockPct: s, portfolioImpactPct: equityShockImpactPct(p.positions.map((r) => ({ value: r.value, equityWeight: r.fund.equityWeight })), s) })),
  };
}
