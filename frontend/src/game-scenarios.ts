import { illustrativeReturns, simulate } from "./demo.ts";
import { MAX_SIMULATION_AMOUNT, type SimulationResult } from "./simulation-types.ts";

/**
 * Funciones puras de la simulación ilustrativa. TODO es hipotético: las tasas son supuestos de la demo,
 * no datos de mercado ni previsiones. Los resultados no predicen ni garantizan rendimientos.
 * Convención de aportación igual que `simulate`: se aporta al inicio de cada mes y luego se aplica el rendimiento.
 */

export const MAX_YEARS = 10;

export type SimParams = { initial: number; monthly: number; years: number };

export type ScenarioDef = {
  id: string;
  /** "constant": misma tasa bruta anual cada mes; "cycle": ciclo mensual con caídas de `demo.ts`. */
  kind: "constant" | "cycle";
  /** Tasa bruta anual supuesta en % (solo "constant"). */
  grossAnnualPct?: number;
  /** Coste anual supuesto en % (TER y similares), descontado de forma proporcional cada mes. */
  costAnnualPct: number;
};

/** Escenarios ilustrativos de la demo (supuestos, no previsiones). Los costes recuerdan a los TER de la cartera DEMO. */
export const SCENARIOS: readonly ScenarioDef[] = [
  { id: "prudent", kind: "constant", grossAnnualPct: 2, costAnnualPct: 0.45 },
  { id: "balanced", kind: "constant", grossAnnualPct: 4, costAnnualPct: 1.1 },
  { id: "dynamic", kind: "constant", grossAnnualPct: 6, costAnnualPct: 0.9 },
  { id: "cycle", kind: "cycle", costAnnualPct: 0.9 },
];

export function validateParams(p: SimParams): string | null {
  const okAmt = (n: number) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= MAX_SIMULATION_AMOUNT;
  if (!okAmt(p.initial) || !okAmt(p.monthly)) return "amount";
  if (!Number.isInteger(p.years) || p.years < 1 || p.years > MAX_YEARS) return "years";
  if (p.initial === 0 && p.monthly === 0) return "zero";
  return null;
}

export type ScenarioResult = {
  def: ScenarioDef;
  sim: SimulationResult;
  /** Valor al final de cada año (índice 0 = inicio). */
  yearly: { year: number; value: number; contributed: number }[];
  /** Importe aproximado que habrían restado los costes: valor sin coste menos valor con coste. */
  costEur: number;
};

function monthlyReturns(def: ScenarioDef, withCost: boolean): number[] {
  const cost = withCost ? Math.pow(1 - def.costAnnualPct / 100, 1 / 12) : 1;
  const gross = def.kind === "constant" ? [Math.pow(1 + (def.grossAnnualPct ?? 0) / 100, 1 / 12) - 1] : [...illustrativeReturns];
  return gross.map((r) => (1 + r) * cost - 1);
}

export function runScenario(params: SimParams, def: ScenarioDef): ScenarioResult {
  const err = validateParams(params);
  if (err) throw new Error(`Invalid parameters: ${err}`);
  if (def.costAnnualPct < 0 || def.costAnnualPct >= 100) throw new Error("Invalid cost");
  const months = params.years * 12;
  const sim = simulate(params.initial, params.monthly, months, monthlyReturns(def, true));
  const noCost = simulate(params.initial, params.monthly, months, monthlyReturns(def, false));
  const yearly = Array.from({ length: params.years + 1 }, (_, y) => {
    const pt = sim.timeline[y * 12];
    return { year: y, value: pt.value, contributed: pt.contributed };
  });
  return { def, sim, yearly, costEur: Math.max(0, noCost.value - sim.value) };
}

export function runAll(params: SimParams, defs: readonly ScenarioDef[] = SCENARIOS): ScenarioResult[] {
  return defs.map((d) => runScenario(params, d));
}

export type HorizonRow = { years: number; value: number; contributed: number; profit: number; simpleReturnPercent: number | null };

/** Mismo escenario evaluado a varios plazos (<= MAX_YEARS). */
export function compareHorizons(params: SimParams, def: ScenarioDef, horizons: readonly number[]): HorizonRow[] {
  const full = runScenario({ ...params, years: MAX_YEARS }, def);
  return horizons.map((years) => {
    if (!Number.isInteger(years) || years < 1 || years > MAX_YEARS) throw new Error("Invalid horizon");
    const pt = full.sim.timeline[years * 12];
    const profit = pt.value - pt.contributed;
    return { years, value: pt.value, contributed: pt.contributed, profit, simpleReturnPercent: pt.contributed === 0 ? null : (profit / pt.contributed) * 100 };
  });
}
