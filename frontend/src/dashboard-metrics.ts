/**
 * Métricas financieras puras para el dashboard. Sin dependencias; las usan los componentes DEMO.
 * Convención: rentabilidades y variaciones en %, series como arrays de valores (índice 0 = inicio).
 * Devuelven `null` cuando el cálculo no está definido (nunca 0 inventado) o no sería finito
 * (NaN/Infinity). Las funciones que ya lanzan error explícito ante entradas inválidas (`weights`,
 * `cumulativeFromReturns`, `profitAndLoss`, `equityShockImpactPct`) mantienen esa convención.
 */

/**
 * Mínimo de rentabilidades mensuales (12 = un año) para publicar volatilidad anualizada y Sharpe.
 * Con menos datos la desviación típica muestral es demasiado inestable para anualizarla. Es un umbral
 * mínimo, no una garantía de significación estadística. Parametrizable por llamada (`minObservations`).
 */
export const MIN_MONTHLY_OBSERVATIONS = 12;

/** Volatilidad anualizada por debajo de la cual el ratio de Sharpe no se considera definido (en %). */
export const MIN_VOLATILITY_FOR_SHARPE = 1e-9;

const finite = (n: number) => Number.isFinite(n);

/** Serie acumulada: [start, start*(1+r1/100), ...]. Longitud = returns.length + 1. */
export function cumulativeFromReturns(start: number, returnsPct: readonly number[]): number[] {
  if (!finite(start) || start < 0) throw new RangeError("start must be a non-negative finite number");
  const out = [start];
  for (const r of returnsPct) {
    if (!finite(r) || r <= -100) throw new RangeError("return must be finite and greater than -100");
    out.push(out[out.length - 1] * (1 + r / 100));
  }
  return out;
}

/** Últimos `count` valores (o todos si hay menos). */
export function lastN<T>(values: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer");
  return values.slice(Math.max(0, values.length - count));
}

/** Variación % entre el valor `periods` puntos antes del final y el final. null si no hay histórico, el origen es 0 o el resultado no es finito. */
export function changePct(series: readonly number[], periods: number): number | null {
  if (!Number.isInteger(periods) || periods < 1 || series.length <= periods) return null;
  const from = series[series.length - 1 - periods];
  const to = series[series.length - 1];
  if (!finite(from) || !finite(to) || from === 0) return null;
  const change = (to / from - 1) * 100;
  return finite(change) ? change : null;
}

/** Resultado de una posición o cartera: importe y porcentaje sobre el coste (null si el coste es 0). Lanza RangeError con entradas no finitas. */
export function profitAndLoss(value: number, cost: number): { amount: number; percent: number | null } {
  if (!finite(value) || !finite(cost)) throw new RangeError("value and cost must be finite");
  return { amount: value - cost, percent: cost > 0 ? ((value - cost) / cost) * 100 : null };
}

/** Pesos (0..1) que suman 1. Si el total es 0 devuelve ceros. Valores negativos no admitidos. */
export function weights(values: readonly number[]): number[] {
  if (values.some((v) => !finite(v) || v < 0)) throw new RangeError("values must be non-negative and finite");
  const total = values.reduce((a, b) => a + b, 0);
  return values.map((v) => (total > 0 ? v / total : 0));
}

/** Agrupa por clave y devuelve pesos por grupo, de mayor a menor (desempate por clave). */
export function groupWeights<T, K extends string>(items: readonly T[], keyOf: (item: T) => K, valueOf: (item: T) => number): { key: K; value: number; weight: number }[] {
  const totals = new Map<K, number>();
  for (const item of items) totals.set(keyOf(item), (totals.get(keyOf(item)) ?? 0) + valueOf(item));
  const keys = [...totals.keys()];
  const w = weights(keys.map((k) => totals.get(k)!));
  return keys
    .map((key, i) => ({ key, value: totals.get(key)!, weight: w[i] }))
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key));
}

/** Media ponderada; null si la suma de pesos es 0. */
export function weightedAverage(values: readonly number[], w: readonly number[]): number | null {
  if (values.length !== w.length) throw new RangeError("length mismatch");
  const total = w.reduce((a, b) => a + b, 0);
  return total > 0 ? values.reduce((s, v, i) => s + v * w[i], 0) / total : null;
}

/** Rentabilidades porcentuales periódicas a partir de una serie de valores. Lanza RangeError si algún valor no es finito o el valor previo no es positivo (no se inventan ceros). */
export function returnsFromSeries(series: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    if (!finite(series[i - 1]) || !finite(series[i]) || !(series[i - 1] > 0)) throw new RangeError("series values must be finite and previous values positive");
    out.push((series[i] / series[i - 1] - 1) * 100);
  }
  return out;
}

/**
 * Volatilidad anualizada en %: desviación típica muestral de rentabilidades mensuales × √12.
 * null con menos de `minObservations` datos (mínimo efectivo 2), datos no finitos o resultado no finito.
 */
export function annualizedVolatility(monthlyReturnsPct: readonly number[], minObservations = MIN_MONTHLY_OBSERVATIONS): number | null {
  const n = monthlyReturnsPct.length;
  if (n < Math.max(2, minObservations) || !monthlyReturnsPct.every(finite)) return null;
  const mean = monthlyReturnsPct.reduce((a, b) => a + b, 0) / n;
  const variance = monthlyReturnsPct.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1);
  const vol = Math.sqrt(variance) * Math.sqrt(12);
  return finite(vol) ? vol : null;
}

/** Máxima caída desde un máximo previo, en % (≤ 0). 0 si la serie nunca cae; null si hay menos de 2 puntos o datos no finitos. */
export function maxDrawdown(series: readonly number[]): number | null {
  if (series.length < 2 || !series.every(finite)) return null;
  let peak = series[0];
  let worst = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    if (peak > 0) worst = Math.min(worst, (v / peak - 1) * 100);
  }
  return finite(worst) ? worst : null;
}

/**
 * Ratio de Sharpe anualizado: (media mensual × 12 − rf anual) / volatilidad anualizada, con tipo libre
 * de riesgo supuesto (en %). null si hay pocos datos (`minObservations`), la volatilidad es nula, no
 * finita o inferior a `MIN_VOLATILITY_FOR_SHARPE`, o el resultado no es finito.
 */
export function sharpeRatio(monthlyReturnsPct: readonly number[], riskFreeAnnualPct: number, minObservations = MIN_MONTHLY_OBSERVATIONS): number | null {
  if (!finite(riskFreeAnnualPct)) return null;
  const vol = annualizedVolatility(monthlyReturnsPct, minObservations);
  if (vol === null || !finite(vol) || vol < MIN_VOLATILITY_FOR_SHARPE) return null;
  const meanMonthly = monthlyReturnsPct.reduce((a, b) => a + b, 0) / monthlyReturnsPct.length;
  const sharpe = (meanMonthly * 12 - riskFreeAnnualPct) / vol;
  return finite(sharpe) ? sharpe : null;
}

/**
 * Impacto ilustrativo en % de la cartera de una variación hipotética por grupo (suma de peso × variación).
 * Es un ejercicio de sensibilidad, no una predicción.
 */
export function stressImpactPct(groupWeightList: readonly { key: string; weight: number }[], shocksPct: Readonly<Record<string, number>>): number {
  return groupWeightList.reduce((s, g) => s + g.weight * (shocksPct[g.key] ?? 0), 0);
}

/**
 * Impacto ilustrativo en % de la cartera de una caída/subida hipotética de la renta variable, contando
 * la exposición a renta variable de cada fondo (look-through): shock × Σ(valor × equityWeight) / Σ valor.
 * Supuesto: todo el valor de renta variable de cada fondo se mueve exactamente `shockPct`; el resto
 * no cambia. Lanza RangeError si el shock no es finito o ≤ −100, o si un valor/peso es inválido.
 * Devuelve null con total 0. Es un ejercicio de sensibilidad, no una predicción.
 */
export function equityShockImpactPct(items: readonly { value: number; equityWeight: number }[], shockPct: number): number | null {
  if (!finite(shockPct) || shockPct <= -100) throw new RangeError("shock must be finite and greater than -100");
  if (items.some((i) => !finite(i.value) || i.value < 0 || !finite(i.equityWeight) || i.equityWeight < 0 || i.equityWeight > 1)) throw new RangeError("value must be non-negative and equityWeight within 0..1");
  const total = items.reduce((a, i) => a + i.value, 0);
  if (total <= 0) return null;
  const impact = (items.reduce((a, i) => a + i.value * i.equityWeight, 0) * shockPct) / total;
  return finite(impact) && impact > -100 ? impact : null;
}
