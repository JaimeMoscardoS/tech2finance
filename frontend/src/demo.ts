/** Hypothetical monthly returns, deliberately not historical market data. */
export const illustrativeReturns = [0.015, 0.012, -0.025, 0.02, -0.085, -0.045, 0.03, 0.025, 0.01, 0.02, -0.012, 0.018];
export function simulate(initial: number, monthly: number, months: number, returns: readonly number[] = illustrativeReturns) {
  if (!Number.isFinite(initial) || !Number.isFinite(monthly) || !Number.isInteger(months) || initial < 0 || monthly < 0 || months < 1 || months > 120) throw new Error("Introduce cantidades válidas y un plazo entre 1 y 120 meses.");
  if (!returns.length || returns.some(value => !Number.isFinite(value) || value < -1)) throw new Error("Invalid returns");
  const contributed = initial + monthly * months;
  if (!Number.isFinite(contributed)) throw new Error("Amounts exceed supported range");
  let value = initial;
  const points = [value];
  for (let i = 0; i < months; i++) {
    value = (value + monthly) * (1 + returns[i % returns.length]);
    if (!Number.isFinite(value)) throw new Error("Result exceeds supported range");
    points.push(value);
  }
  return { points, value, contributed };
}
export const euro = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);