export type GoalAnswers = {
  objective: string;
  horizon: string;
  liquidity: string;
  reserve: string;
  debt: string;
  loss: string;
};
/** Gate an illustrative classroom scenario; this is not an assessment of suitability. */
export function scenarioReady(a: GoalAnswers): boolean {
  return Boolean(
    ["retirement", "project", "general"].includes(a.objective) &&
      a.horizon === "long" &&
      a.liquidity === "no" &&
      a.reserve === "yes" &&
      a.debt === "no" &&
      ["low", "medium", "high"].includes(a.loss),
  );
}
export function validAllocation(values: readonly number[]): boolean {
  return (
    values.length === 3 &&
    values.every((n) => Number.isFinite(n) && n >= 0 && n <= 100) &&
    Math.abs(values.reduce((a, b) => a + b, 0) - 100) < 1e-9
  );
}

/** Allocate whole cents by largest remainder, preserving the total exactly. */
export function allocateCents(
  amount: string,
  weights: readonly number[],
): number[] | null {
  if (
    !/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount) ||
    Number(amount) > 1_000_000_000 ||
    !validAllocation(weights)
  )
    return null;
  const cents = Math.round(Number(amount) * 100);
  const quotas = weights.map((weight) => (cents * weight) / 100);
  const parts = quotas.map(Math.floor);
  const remaining = cents - parts.reduce((a, b) => a + b, 0);
  if (remaining < 0 || remaining > parts.length) return null;
  const order = quotas
    .map((value, index) => ({ index, fraction: value - parts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remaining; i++) parts[order[i].index]++;
  return parts;
}

/** Transparent teaching templates, not suitable allocations or financial advice. */
export function scenarioTemplate(a: GoalAnswers): number[] | null {
  if (!scenarioReady(a)) return null;
  const base: Record<string, number[]> = {
    low: [50, 40, 10],
    medium: [30, 40, 30],
    high: [20, 30, 50],
  };
  const result = [...base[a.loss]];
  const shift =
    a.objective === "project" ? 10 : a.objective === "general" ? 5 : 0;
  result[0] += shift;
  result[2] -= shift;
  return result;
}
