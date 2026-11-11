/**
 * Adaptador: cartera de «Mi cartera» (y de Inicio) a partir del histórico REAL de valores liquidativos (CNMV).
 *
 * REAL (viene del dataset y del catálogo): ISIN, divisa, NAV mensuales, fechas, fuente (CNMV) y gestora (del catálogo,
 * si consta). El fondo se muestra con su nombre genérico del catálogo (`shared/fund-aliases.json`), como el resto de la app.
 * Calculado en código probado desde esos NAV: valor de la cartera, rentabilidades, volatilidad, caída
 * máxima, Sharpe (con tipo libre de riesgo SUPUESTO y declarado), mapa mensual, mejor/peor mes.
 * DEMO (supuesto ficticio): solo las participaciones: una compra única de DEMO_AMOUNT_PER_FUND_EUR por fondo
 * al inicio de la serie (no existe una cartera real del usuario).
 * SIN DATO («No disponible», nunca deducido ni inventado): clase de activo, nivel de riesgo, exposición a renta
 * variable, TER y región, que el catálogo publica como null para estos fondos.
 * La referencia comparativa es la media simple mensual de los propios fondos: no es un índice de mercado.
 * El backend reproduce la misma serie para el análisis de caídas (`basis: "portfolio_cnmv"`,
 * backend/domain/__init__.py): si cambias la selección, las fechas o los importes, cámbialos en los dos sitios.
 * Rentabilidades pasadas no predicen las futuras. No es una recomendación.
 */
import { DEMO_RISK_FREE_ANNUAL_PCT, type DemoFund, type DemoPosition } from "../../shared/mock/demo-portfolio.ts";
import { cumulativeFromReturns } from "./dashboard-metrics.ts";
import { buildDemoPortfolio, type DemoPortfolio } from "./dashboard-portfolio.ts";

/** Subconjunto estructural de `NavHistory` (server-api.ts) que necesita el adaptador. */
export type NavSource = {
  source: { name: string; indexUrl: string };
  instruments: { isin: string; name: string; currency: string | null; eligible: boolean; monthly: { date: string; nav: string }[] }[];
};
export type RealFund = DemoFund & { isin: string };

/** Mínimo de meses reales comunes (13 NAV = 12 rentabilidades) para mostrar la cartera real. */
export const MIN_REAL_POINTS = 13;
export const MAX_REAL_FUNDS = 6;
/** Importe DEMO (ficticio) comprado de cada fondo al inicio de la serie. Igual en backend. */
export const DEMO_AMOUNT_PER_FUND_EUR = 5000;

/** «CAIXABANK MONETARIO RENDIMIENTO, FI» -> «Caixabank Monetario Rendimiento, FI» (solo presentación). */
export function displayName(name: string): string {
  const cased = name.toLowerCase().replace(/(^|[\s(\-/])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
  return cased.replace(/\bFi$/, "FI").replace(/\bRf\b/g, "RF").replace(/\bBbva\b/g, "BBVA");
}

/**
 * Construye la cartera a partir del histórico real. Devuelve null si no hay datos suficientes
 * (la interfaz cae entonces a la cartera DEMO). Usa solo instrumentos elegibles, en EUR y con
 * meses comunes consecutivos.
 */
/** Datos de presentación por ISIN tomados del catálogo: gestora y nombre genérico (alias de `shared/fund-aliases.json`). */
export type FundInfo = Readonly<Record<string, { manager?: string; name?: string }>>;

/** `info`: gestora y nombre genérico por ISIN; sin gestora se muestra el ISIN y sin alias, el nombre publicado. */
export function buildRealPortfolio(nav: NavSource | null | undefined, info: FundInfo = {}): DemoPortfolio | null {
  if (!nav?.instruments?.length) return null;
  const usable = nav.instruments.filter((i) => i.eligible && i.currency === "EUR" && i.monthly.length > 1).slice(0, MAX_REAL_FUNDS);
  if (!usable.length) return null;
  let common = usable[0].monthly.map((m) => m.date);
  for (const inst of usable.slice(1)) {
    const set = new Set(inst.monthly.map((m) => m.date));
    common = common.filter((d) => set.has(d));
  }
  if (common.length < MIN_REAL_POINTS) return null;
  const idx = (d: string) => Number(d.slice(0, 4)) * 12 + Number(d.slice(5, 7));
  for (let i = 1; i < common.length; i++) if (idx(common[i]) !== idx(common[i - 1]) + 1) return null;

  const funds: RealFund[] = [];
  const held: DemoPosition[] = [];
  const allReturns: number[][] = [];
  for (const inst of usable) {
    const byDate = new Map(inst.monthly.map((m) => [m.date, Number(m.nav)]));
    const navs = common.map((d) => byDate.get(d) as number);
    if (navs.some((v) => !Number.isFinite(v) || v <= 0)) return null;
    const returns = navs.slice(1).map((v, i) => (v / navs[i] - 1) * 100);
    const units = DEMO_AMOUNT_PER_FUND_EUR / navs[0];
    funds.push({
      id: inst.isin, isin: inst.isin, name: info[inst.isin]?.name ?? displayName(inst.name), manager: info[inst.isin]?.manager ?? `ISIN ${inst.isin}`,
      assetClass: "unknown", region: "unknown", currency: "EUR", riskLevel: null, ter: null, equityWeight: null,
      startPrice: navs[0], monthlyReturnsPct: returns,
    });
    held.push({ fundId: inst.isin, units, costBasisEur: units * navs[0] });
    allReturns.push(returns);
  }
  const base = buildDemoPortfolio(funds, held);
  const n = common.length;
  const meanReturns = Array.from({ length: n - 1 }, (_, m) => allReturns.reduce((s, r) => s + r[m], 0) / allReturns.length);
  const first = common[0];
  return {
    ...base,
    labels: common.map((d) => d.slice(0, 7)),
    benchmarkSeries: cumulativeFromReturns(base.valueSeries[0], meanReturns),
    riskFreeAnnualPct: DEMO_RISK_FREE_ANNUAL_PCT,
    real: {
      sourceName: nav.source.name, sourceUrl: nav.source.indexUrl, from: first, to: common[n - 1], months: n - 1,
      benchmarkName: { es: "Media simple de los fondos (calculada)", en: "Simple average of the funds (calculated)" },
      heatmapFirstYear: first.slice(5, 7) === "12" ? Number(first.slice(0, 4)) + 1 : null,
      isins: funds.map((f) => f.isin),
    },
  };
}
