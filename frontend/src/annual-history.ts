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

/** Reconstructs a fictional holding at year end, with no additional contributions. */
export function replayAnnual(initial: number) {
  if (!Number.isFinite(initial) || initial < 0 || initial > 1e15) throw new Error("Invalid initial amount");
  let value = initial;
  const points = [value];
  for (const { rate } of annualHistory.returns) {
    value *= 1 + rate;
    if (!Number.isFinite(value)) throw new Error("Result exceeds supported range");
    points.push(value);
  }
  return { points, value, contributed: initial };
}
