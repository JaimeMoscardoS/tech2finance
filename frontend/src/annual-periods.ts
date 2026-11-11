/** Compound the last N annual rates only when the entire source series is valid and contiguous. */
export function annualPeriods(
  rows: readonly { year: number; rate: number }[],
  years: number,
) {
  if (
    !Number.isInteger(years) ||
    years < 1 ||
    rows.length < years ||
    rows.some(
      (row, i) =>
        !Number.isInteger(row.year) ||
        !Number.isFinite(row.rate) ||
        row.rate < -1 ||
        (i > 0 && row.year !== rows[i - 1].year + 1),
    )
  )
    return null;
  const tail = rows.slice(-years);
  const factor = tail.reduce((value, row) => value * (1 + row.rate), 1);
  const cumulative = factor - 1,
    annualised = factor ** (1 / years) - 1;
  if (
    !Number.isFinite(factor) ||
    !Number.isFinite(cumulative) ||
    !Number.isFinite(annualised)
  )
    return null;
  return {
    cumulative,
    annualised,
    start: tail[0].year,
    end: tail[tail.length - 1].year,
  };
}
