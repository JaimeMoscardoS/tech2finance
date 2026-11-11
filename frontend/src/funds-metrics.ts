/**
 * Cálculos puros de la sección Fondos/Inversiones (datos DEMO). Sin dependencias de interfaz.
 * Complementa `dashboard-metrics.ts` sin modificarlo. Devuelve null cuando no está definido.
 */
import type { DemoFund } from "../../shared/mock/demo-portfolio.ts";
import type { DemoTrade } from "../../shared/mock/demo-trades.ts";
import { changePct, cumulativeFromReturns } from "./dashboard-metrics.ts";

export type MatrixRow = {
  /** Fila 0-based (año relativo 1, 2, 3...). */
  row: number;
  /** 12 celdas (mes relativo 1..12); null si aún no hay dato. */
  months: (number | null)[];
  /** Rentabilidad compuesta de los meses con dato, en %. null si no hay ninguno. */
  total: number | null;
  /** Meses con dato. */
  count: number;
};

/** Matriz año relativo × mes a partir de rentabilidades mensuales en % (la serie DEMO no tiene fechas). */
export function monthlyReturnMatrix(returnsPct: readonly number[], perRow = 12): MatrixRow[] {
  if (!Number.isInteger(perRow) || perRow < 1) throw new RangeError("perRow must be a positive integer");
  if (returnsPct.some((r) => !Number.isFinite(r) || r <= -100)) throw new RangeError("return must be finite and greater than -100");
  const rows: MatrixRow[] = [];
  for (let start = 0; start < returnsPct.length; start += perRow) {
    const chunk = returnsPct.slice(start, start + perRow);
    const months: (number | null)[] = Array.from({ length: perRow }, (_, i) => (i < chunk.length ? chunk[i] : null));
    const growth = chunk.reduce((a, r) => a * (1 + r / 100), 1);
    rows.push({ row: start / perRow, months, total: chunk.length ? (growth - 1) * 100 : null, count: chunk.length });
  }
  return rows;
}

/** Mayor valor absoluto de la matriz (escala de color). 0 si no hay datos. */
export function matrixMaxAbs(rows: readonly MatrixRow[]): number {
  return rows.reduce((m, r) => r.months.reduce<number>((mm, v) => (v == null ? mm : Math.max(mm, Math.abs(v))), m), 0);
}

/** Últimos `months` meses de una serie de valores (months + 1 puntos); todos si hay menos. */
export function periodWindow<T>(series: readonly T[], months: number): T[] {
  if (!Number.isInteger(months) || months < 1) throw new RangeError("months must be a positive integer");
  return series.slice(Math.max(0, series.length - months - 1));
}

/** Reescala una serie a base `base` en su primer punto. */
export function rebase(series: readonly number[], base = 100): number[] {
  if (!series.length) return [];
  if (!(series[0] > 0) || !Number.isFinite(series[0])) throw new RangeError("first value must be positive and finite");
  return series.map((v) => (v / series[0]) * base);
}

/** Diferencia en puntos porcentuales entre la variación de dos series en los últimos `months`. null si falta histórico. */
export function excessReturnPct(series: readonly number[], reference: readonly number[], months: number): number | null {
  const a = changePct(series, months);
  const b = changePct(reference, months);
  return a == null || b == null ? null : a - b;
}

/** Porcentaje de meses con rentabilidad estrictamente positiva. null sin datos. */
export function positiveMonthsPct(returnsPct: readonly number[]): number | null {
  return returnsPct.length ? (returnsPct.filter((r) => r > 0).length / returnsPct.length) * 100 : null;
}

/** Mejor y peor mes (índice 0-based dentro de las rentabilidades). null sin datos. */
export function bestWorstMonth(returnsPct: readonly number[]): { best: { index: number; value: number }; worst: { index: number; value: number } } | null {
  if (!returnsPct.length) return null;
  let best = 0, worst = 0;
  returnsPct.forEach((r, i) => { if (r > returnsPct[best]) best = i; if (r < returnsPct[worst]) worst = i; });
  return { best: { index: best, value: returnsPct[best] }, worst: { index: worst, value: returnsPct[worst] } };
}

/** Filtra posiciones por clase de activo y texto (nombre o gestora, sin distinguir mayúsculas). */
export function filterPositions<T extends { fund: { name: string; manager: string; assetClass: string } }>(rows: readonly T[], filter: { assetClass?: string; query?: string }): T[] {
  const q = (filter.query ?? "").trim().toLowerCase();
  return rows.filter((r) =>
    (!filter.assetClass || filter.assetClass === "all" || r.fund.assetClass === filter.assetClass) &&
    (!q || r.fund.name.toLowerCase().includes(q) || r.fund.manager.toLowerCase().includes(q)));
}

export type TradeRow = DemoTrade & { price: number; amount: number };

/** Precio de la participación en el mes de la operación (serie DEMO) e importe = unidades × precio. Lanza RangeError si el fondo o el mes no existen. */
export function tradeValue(trade: DemoTrade, funds: readonly Pick<DemoFund, "id" | "startPrice" | "monthlyReturnsPct">[]): TradeRow {
  const fund = funds.find((f) => f.id === trade.fundId);
  if (!fund) throw new RangeError(`Unknown demo fund ${trade.fundId}`);
  if (!Number.isFinite(trade.units) || trade.units <= 0) throw new RangeError("units must be positive");
  const prices = cumulativeFromReturns(fund.startPrice, fund.monthlyReturnsPct);
  if (!Number.isInteger(trade.month) || trade.month < 0 || trade.month >= prices.length) throw new RangeError("month out of range");
  const price = prices[trade.month];
  return { ...trade, price, amount: trade.units * price };
}

/** Operaciones con precio e importe, más recientes primero, y totales comprado / vendido / neto. */
export function summarizeTrades(trades: readonly DemoTrade[], funds: readonly Pick<DemoFund, "id" | "startPrice" | "monthlyReturnsPct">[]): { rows: TradeRow[]; bought: number; sold: number; net: number } {
  const rows = trades.map((t) => tradeValue(t, funds)).sort((a, b) => b.month - a.month || a.id.localeCompare(b.id));
  const bought = rows.filter((r) => r.side === "buy").reduce((s, r) => s + r.amount, 0);
  const sold = rows.filter((r) => r.side === "sell").reduce((s, r) => s + r.amount, 0);
  return { rows, bought, sold, net: bought - sold };
}
