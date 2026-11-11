/** Lógica pura del Inicio: progreso al objetivo, periodos sobre serie mensual y selección de hechos DEMO. */
import type { DemoFact } from "../../shared/mock/demo-facts.ts";

export type PlanStatus = "ahead" | "on_track" | "behind";

/** Progreso al objetivo en % (acotado a 0..100) y falta por alcanzar. null si el objetivo no es válido. */
export function goalProgress(value: number, target: number): { pct: number; remaining: number; reached: boolean } | null {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return null;
  const raw = (Math.max(0, value) / target) * 100;
  return { pct: Math.min(100, raw), remaining: Math.max(0, target - value), reached: value >= target };
}

/** Compara el avance real con el avance lineal esperado del plan (± `tolerancePts` puntos). */
export function planStatus(progressPct: number, monthsElapsed: number, monthsTotal: number, tolerancePts = 5): { status: PlanStatus; expectedPct: number } | null {
  if (!Number.isFinite(progressPct) || !(monthsTotal > 0) || monthsElapsed < 0) return null;
  const expectedPct = Math.min(100, (monthsElapsed / monthsTotal) * 100);
  const diff = progressPct - expectedPct;
  return { status: diff > tolerancePts ? "ahead" : diff < -tolerancePts ? "behind" : "on_track", expectedPct };
}

export type HomePeriod = "1w" | "1m" | "3m" | "6m" | "1y" | "max";
/** La serie DEMO es mensual: 1S no tiene datos (nunca se inventan datos diarios). `months` = meses que abarca. */
export const HOME_PERIODS: readonly { id: HomePeriod; months: number | null; available: boolean }[] = [
  { id: "1w", months: null, available: false },
  { id: "1m", months: 1, available: true },
  { id: "3m", months: 3, available: true },
  { id: "6m", months: 6, available: true },
  { id: "1y", months: 12, available: true },
  { id: "max", months: null, available: true },
];

/** Recorte de una serie mensual: `months` meses = months+1 puntos. null si el periodo no tiene datos. */
export function sliceByPeriod<T>(values: readonly T[], period: HomePeriod): T[] | null {
  const p = HOME_PERIODS.find((x) => x.id === period);
  if (!p || !p.available) return null;
  if (p.months == null) return [...values];
  return values.slice(Math.max(0, values.length - (p.months + 1)));
}

/** Variación % del último mes de la serie; null si no hay dos puntos o el origen es 0. */
export function lastMonthChangePct(series: readonly number[]): number | null {
  if (series.length < 2) return null;
  const from = series[series.length - 2];
  const to = series[series.length - 1];
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return (to / from - 1) * 100;
}

/**
 * Hechos relevantes: fecha no posterior a `asOf` (ISO), que afecten a algún fondo en cartera o sean generales.
 * Orden: más reciente primero (desempate por id). Máximo `max`.
 */
export function selectFacts(facts: readonly DemoFact[], heldFundIds: readonly string[], asOf: string, max = 5): DemoFact[] {
  const held = new Set(heldFundIds);
  return facts
    .filter((f) => f.date <= asOf && (f.fundIds.length === 0 || f.fundIds.some((id) => held.has(id))))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1))
    .slice(0, Math.max(0, max));
}
