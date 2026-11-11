import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DEMO_AMOUNT_PER_FUND_EUR, buildRealPortfolio, displayName, type NavSource } from "./portfolio-real.ts";

const real = JSON.parse(readFileSync(new URL("../../shared/nav-history.json", import.meta.url), "utf8")) as NavSource;
const synth = (n: number, ccy: string | null = "EUR", eligible = true): NavSource => ({
  source: { name: "CNMV", indexUrl: "https://www.cnmv.es/" },
  instruments: [{
    isin: "ES0000000001", name: "FONDO MONETARIO X, FI", currency: ccy, eligible,
    monthly: Array.from({ length: n }, (_, i) => ({ date: `${2020 + Math.floor((11 + i) / 12)}-${String(((11 + i) % 12) + 1).padStart(2, "0")}-28`, nav: (10 * 1.01 ** i).toFixed(6) })),
  }],
});

test("real dataset builds a portfolio with real NAV, dates and source", () => {
  const p = buildRealPortfolio(real);
  assert.ok(p && p.real);
  assert.equal(p.positions.length, real.instruments.filter((i) => i.eligible).length);
  assert.equal(p.real.sourceName, "CNMV");
  assert.equal(p.real.from, "2019-12-31");
  assert.equal(p.real.to, "2025-12-31");
  assert.equal(p.real.months, 72);
  assert.equal(p.valueSeries.length, 73);
  assert.equal(p.labels[0], "2019-12");
  assert.equal(p.labels[72], "2025-12");
  assert.equal(p.real.heatmapFirstYear, 2020);
  assert.equal(p.benchmarkSeries.length, 73);
  assert.ok(Math.abs(p.benchmarkSeries[0] - p.valueSeries[0]) < 1e-9);
});

test("fund end price equals the last real NAV; cost basis is units x first NAV; weights sum to 1", () => {
  const p = buildRealPortfolio(real)!;
  for (const r of p.positions) {
    const inst = real.instruments.find((i) => i.isin === r.fund.id)!;
    assert.ok(Math.abs(r.price - Number(inst.monthly.at(-1)!.nav)) < 1e-6 * r.price);
    assert.ok(Math.abs(r.cost - r.units * Number(inst.monthly[0].nav)) < 1e-6);
  }
  assert.ok(Math.abs(p.positions.reduce((s, r) => s + r.weight, 0) - 1) < 1e-9);
});

test("metrics are computed from real NAV with the declared risk-free assumption", () => {
  const p = buildRealPortfolio(real)!;
  assert.ok(p.volatilityPct != null && p.volatilityPct > 0);
  assert.ok(p.maxDrawdownPct != null && p.maxDrawdownPct < 0);
  assert.ok(p.sharpe != null);
  assert.equal(p.riskFreeAnnualPct, 2);
});

test("empty, short, ineligible or non-EUR data return null so the UI falls back to DEMO", () => {
  assert.equal(buildRealPortfolio(null), null);
  assert.equal(buildRealPortfolio({ ...synth(30), instruments: [] }), null);
  assert.equal(buildRealPortfolio(synth(10)), null);
  assert.equal(buildRealPortfolio(synth(30, "USD")), null);
  assert.equal(buildRealPortfolio(synth(30, "EUR", false)), null);
  assert.ok(buildRealPortfolio(synth(30)));
});

test("a gap in the monthly series is rejected", () => {
  const s = synth(30);
  s.instruments[0].monthly.splice(10, 1);
  assert.equal(buildRealPortfolio(s), null);
});

test("display name from the published name", () => {
  assert.equal(displayName("SANTANDER RF AHORRO, FI"), "Santander RF Ahorro, FI");
  assert.equal(displayName("BBVA ESTRATEGIA 0-50, FI"), "BBVA Estrategia 0-50, FI");
});

test("unpublished attributes stay unknown (never deduced); only holdings are DEMO; manager and generic name come from the catalog", () => {
  const p = buildRealPortfolio(real, { ES0112793007: { manager: "Santander Asset Management", name: "Fondo ahorro" } })!;
  for (const r of p.positions) {
    assert.equal(r.fund.assetClass, "unknown"); assert.equal(r.fund.region, "unknown");
    assert.equal(r.fund.riskLevel, null); assert.equal(r.fund.ter, null); assert.equal(r.fund.equityWeight, null);
    assert.ok(Math.abs(r.cost - DEMO_AMOUNT_PER_FUND_EUR) < 1e-9);
  }
  assert.equal(p.positions.find((r) => r.fund.id === "ES0112793007")!.fund.manager, "Santander Asset Management");
  assert.equal(p.positions.find((r) => r.fund.id === "ES0112793007")!.fund.name, "Fondo ahorro");
  assert.equal(p.positions.find((r) => r.fund.id === "ES0138045002")!.fund.manager, "ISIN ES0138045002");
  assert.equal(p.averageRisk, null); assert.equal(p.equityExposure, null);
});

test("portfolio values match an independent recomputation (also asserted by the backend portfolio_cnmv test)", () => {
  // Recalculado aparte (Python, suma de 5.000 € / NAV inicial × NAV de cada fondo elegible en EUR):
  // coste 25.000 €, valor final 28.175,7467 €, caída máxima 8,7857 % entre 2019-12 y 2020-03.
  const p = buildRealPortfolio(real)!;
  assert.ok(Math.abs(p.totalCost - 25000) < 1e-6);
  assert.ok(Math.abs(p.totalValue - 28175.7467) < 1e-3);
  assert.ok(Math.abs(p.maxDrawdownPct! + 8.7857) < 1e-3);
});
