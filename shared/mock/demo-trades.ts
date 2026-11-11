/**
 * OPERACIONES RECIENTES DEMO (ficticias). Son movimientos SIMULADOS de la cartera de ejemplo:
 * no son operaciones reales, no hay broker ni custodia. Solo se guardan entradas (fondo, sentido,
 * unidades y mes relativo de la serie DEMO); el precio y el importe se CALCULAN en código probado
 * (`frontend/src/funds-metrics.ts`) a partir de las series de `demo-portfolio.ts`.
 * Son movimientos ilustrativos que NO alteran la cartera mostrada (posiciones y serie de valor de `demo-portfolio.ts` fijas); los fondos en USD no tienen efecto divisa.
 * Invariante probada: las unidades vendidas de cada fondo no superan las unidades en cartera.
 * No se modelan comisiones ni impuestos. `month` es el índice relativo de la serie (M0..M36), sin fechas.
 */
export type DemoTrade = {
  id: string;
  fundId: string;
  side: "buy" | "sell";
  units: number;
  /** Índice de mes relativo (0 = inicio de la serie DEMO). */
  month: number;
};

export const demoTrades: readonly DemoTrade[] = [
  { id: "sim-01", fundId: "demo-global", side: "buy", units: 40, month: 36 },
  { id: "sim-02", fundId: "demo-bonos", side: "sell", units: 20, month: 34 },
  { id: "sim-03", fundId: "demo-mixto", side: "buy", units: 60, month: 33 },
  { id: "sim-04", fundId: "demo-emergentes", side: "sell", units: 50, month: 31 },
  { id: "sim-05", fundId: "demo-liquidez", side: "buy", units: 10, month: 29 },
  { id: "sim-06", fundId: "demo-global", side: "buy", units: 30, month: 27 },
];
