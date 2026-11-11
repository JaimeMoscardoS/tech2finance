import assert from "node:assert/strict";
import test from "node:test";
import { annualizedVolatility, changePct, cumulativeFromReturns, equityShockImpactPct, groupWeights, lastN, MIN_MONTHLY_OBSERVATIONS, maxDrawdown, profitAndLoss, returnsFromSeries, sharpeRatio, stressImpactPct, weightedAverage, weights } from "./dashboard-metrics.ts";
import { buildDemoPortfolio } from "./dashboard-portfolio.ts";
import { analyzeDecline } from "../../tutor-ia/src/index.ts";
import { demoBenchmark, demoFunds, demoPositions, type DemoFund } from "../../shared/mock/demo-portfolio.ts";
import { LEVEL_STORAGE_KEY, readStoredLevel, writeStoredLevel } from "./preferences.ts";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test("cumulative series, window and change", () => {
  const s = cumulativeFromReturns(100, [10, -10]);
  close(s[1], 110); close(s[2], 99); assert.equal(s.length, 3);
  assert.deepEqual(lastN([1, 2, 3], 2), [2, 3]); assert.deepEqual(lastN([1], 5), [1]);
  close(changePct([100, 110, 121], 2)!, 21); close(changePct([100, 110, 121], 1)!, 10);
  assert.equal(changePct([100, 110], 2), null); assert.equal(changePct([0, 5], 1), null);
  assert.throws(() => cumulativeFromReturns(100, [-100])); assert.throws(() => cumulativeFromReturns(NaN, []));
  assert.throws(() => lastN([1], 0));
});

test("profit and loss treats a zero cost as unknown percent", () => {
  const p = profitAndLoss(1100, 1000); close(p.amount, 100); close(p.percent!, 10);
  assert.equal(profitAndLoss(10, 0).percent, null); close(profitAndLoss(900, 1000).percent!, -10);
});

test("weights sum to one and groups are sorted", () => {
  const w = weights([1, 1, 2]); close(w[2], 0.5); close(w.reduce((a, b) => a + b, 0), 1);
  assert.deepEqual(weights([0, 0]), [0, 0]); assert.throws(() => weights([-1]));
  const g = groupWeights([{ k: "a", v: 1 }, { k: "b", v: 3 }, { k: "a", v: 2 }], (x) => x.k, (x) => x.v);
  assert.deepEqual(g.map((x) => x.key), ["a", "b"]); close(g[0].weight, 0.5); close(g[1].value, 3);
  close(weightedAverage([2, 4], [1, 3])!, 3.5); assert.equal(weightedAverage([1], [0]), null);
});

test("volatility, drawdown and Sharpe on hand-checkable series", () => {
  assert.equal(MIN_MONTHLY_OBSERVATIONS, 12);
  // returns 1,-1: mean 0, sample variance 2, sd sqrt(2), annualized sqrt(24) = 4.898979...
  close(annualizedVolatility([1, -1], 2)!, 4.898979485566356, 1e-12); assert.equal(annualizedVolatility([1], 2), null);
  close(maxDrawdown([100, 120, 90, 110])!, -25); assert.equal(maxDrawdown([1, 2, 3]), 0); assert.equal(maxDrawdown([1]), null);
  close(maxDrawdown([100, 80, 150, 90])!, -40);
  close(returnsFromSeries([100, 110, 99])[1], -10);
  assert.throws(() => returnsFromSeries([0, 5]), RangeError);
  assert.throws(() => returnsFromSeries([100, NaN]), RangeError);
  // returns [2, 0]: mean 1 %/month -> 12 % a year; sd sqrt(2), vol sqrt(24); (12 - 2) / sqrt(24) = 2.0412414523193148
  close(sharpeRatio([2, 0], 2, 2)!, 2.0412414523193148, 1e-12);
  assert.equal(sharpeRatio([1, 1, 1], 2, 2), null);
  close(stressImpactPct([{ key: "eq", weight: 0.4 }, { key: "bd", weight: 0.6 }], { eq: -10 }), -4);
});

test("fewer than 12 monthly returns gives null volatility and Sharpe by default", () => {
  const eleven = [1, -1, 2, -2, 1, -1, 2, -2, 1, -1, 2];
  assert.equal(annualizedVolatility(eleven), null); assert.equal(sharpeRatio(eleven, 2), null);
  assert.notEqual(annualizedVolatility([...eleven, -2]), null); assert.notEqual(sharpeRatio([...eleven, -2], 2), null);
});

test("almost constant returns do not produce a meaningless Sharpe", () => {
  const flat = Array.from({ length: 15 }, () => 0.1);
  assert.equal(sharpeRatio(flat, 2), null);
  assert.equal(sharpeRatio(Array.from({ length: 12 }, () => 0), 2), null);
});

test("NaN and Infinity never leak out of the metrics", () => {
  const twelve = (x: number) => [x, ...Array.from({ length: 11 }, (_, i) => (i % 2 ? 1 : -1))];
  for (const bad of [NaN, Infinity, -Infinity]) {
    assert.equal(annualizedVolatility(twelve(bad)), null);
    assert.equal(sharpeRatio(twelve(bad), 2), null);
    assert.equal(maxDrawdown([100, bad, 90]), null);
    assert.equal(changePct([100, bad], 1), null); assert.equal(changePct([bad, 100], 1), null);
    assert.throws(() => profitAndLoss(bad, 100)); assert.throws(() => profitAndLoss(100, bad));
    assert.throws(() => equityShockImpactPct([{ value: 1, equityWeight: 1 }], bad));
  }
  assert.equal(sharpeRatio(twelve(1), NaN), null);
  assert.equal(changePct([1e-320, 1e308], 1), null); // overflow to Infinity
});

test("equity shock counts the equity part of mixed funds", () => {
  // values 1000 (equityWeight 0), 2000 (0.4), 1000 (1): equity value 0 + 800 + 1000 = 1800 of 4000 -> 45 %; -10 % shock -> -4.5 %
  const items = [{ value: 1000, equityWeight: 0 }, { value: 2000, equityWeight: 0.4 }, { value: 1000, equityWeight: 1 }];
  close(equityShockImpactPct(items, -10)!, -4.5); close(equityShockImpactPct(items, -20)!, -9);
  assert.equal(equityShockImpactPct([], -10), null); assert.equal(equityShockImpactPct([{ value: 0, equityWeight: 1 }], -10), null);
  assert.throws(() => equityShockImpactPct(items, -100)); assert.throws(() => equityShockImpactPct(items, -150));
  assert.throws(() => equityShockImpactPct([{ value: 1, equityWeight: 1.5 }], -10)); assert.throws(() => equityShockImpactPct([{ value: -1, equityWeight: 1 }], -10));
});

test("minimal two-fund portfolio matches hand calculations", () => {
  const fund = (id: string, startPrice: number, monthlyReturnsPct: number[]): DemoFund => ({ id, name: id, manager: "m", assetClass: "equity", region: "global", currency: "EUR", riskLevel: 4, ter: 0, equityWeight: 1, startPrice, monthlyReturnsPct });
  // A: price 10 -> 11 -> 9.9, 10 units: 100, 110, 99. B: price 20 flat, 5 units: 100, 100, 100.
  const p = buildDemoPortfolio([fund("a", 10, [10, -10]), fund("b", 20, [0, 0])], [{ fundId: "a", units: 10, costBasisEur: 100 }, { fundId: "b", units: 5, costBasisEur: 100 }], 2);
  assert.equal(p.valueSeries.length, 3);
  close(p.valueSeries[0], 200); close(p.valueSeries[1], 210); close(p.valueSeries[2], 199);
  close(p.totalValue, 199); close(p.totalCost, 200); close(p.pnlAmount, -1); close(p.pnlPercent!, -0.5);
  close(p.positions[0].weight, 99 / 199); close(p.positions[1].weight, 100 / 199);
  close(p.positions[0].weight, 0.497487437, 1e-8); close(p.positions[1].weight, 0.502512563, 1e-8);
  // monthly returns 5 % and 199/210 - 1 = -5.238095 %; sample sd 7.2396 -> vol 25.0786 %; Sharpe (-1.428571 - 2) / 25.0786 = -0.136715
  close(p.volatilityPct!, 25.0786, 1e-3); close(p.sharpe!, -0.136715, 1e-5);
  close(p.maxDrawdownPct!, (199 / 210 - 1) * 100, 1e-9); close(p.maxDrawdownPct!, -5.238095, 1e-6);
  // with the default minimum of 12 observations the same two returns give null
  const strict = buildDemoPortfolio([fund("a", 10, [10, -10]), fund("b", 20, [0, 0])], [{ fundId: "a", units: 10, costBasisEur: 100 }, { fundId: "b", units: 5, costBasisEur: 100 }]);
  assert.equal(strict.volatilityPct, null); assert.equal(strict.sharpe, null);
});

test("empty portfolio is valid and has null metrics", () => {
  const p = buildDemoPortfolio(demoFunds, []);
  assert.deepEqual(p.positions, []); assert.deepEqual(p.valueSeries, []); assert.deepEqual(p.benchmarkSeries, []); assert.deepEqual(p.labels, []);
  assert.equal(p.totalValue, 0); assert.equal(p.totalCost, 0); assert.equal(p.pnlAmount, 0); assert.equal(p.pnlPercent, null);
  assert.equal(p.averageRisk, null); assert.equal(p.equityExposure, null); assert.equal(p.volatilityPct, null); assert.equal(p.maxDrawdownPct, null); assert.equal(p.sharpe, null);
  const f = deriveAgentFacts(p);
  assert.equal(f.topName, ""); assert.equal(f.volatilityPct, null); assert.deepEqual(f.scenarios.map((s) => s.portfolioImpactPct), [null, null]);
});

test("DEMO portfolio is internally consistent and fully computed", () => {
  const p = buildDemoPortfolio();
  close(p.positions.reduce((s, r) => s + r.weight, 0), 1);
  close(p.positions.reduce((s, r) => s + r.value, 0), p.totalValue);
  close(p.valueSeries[p.valueSeries.length - 1], p.totalValue);
  close(p.pnlAmount, p.totalValue - p.totalCost);
  for (const group of [p.byAssetClass, p.byRegion, p.byCurrency]) close(group.reduce((s, g) => s + g.weight, 0), 1);
  assert.equal(p.valueSeries.length, 37); assert.equal(p.benchmarkSeries.length, 37);
  close(p.benchmarkSeries[0], p.valueSeries[0]);
  assert.ok(p.averageRisk! >= 1 && p.averageRisk! <= 7);
  assert.ok(p.maxDrawdownPct! <= 0); assert.ok(p.volatilityPct! > 0); assert.notEqual(p.sharpe, null);
  const first = p.positions[0]; close(first.value, first.units * first.price);
});

test("DEMO cost basis equals units x month-0 price for every fund (same base as the series)", () => {
  for (const pos of demoPositions) {
    const fund = demoFunds.find((f) => f.id === pos.fundId)!;
    close(pos.costBasisEur, pos.units * fund.startPrice);
  }
  // hand-checked literals: 40*100, 140*50, 520*12.5, 280*20, 350*8
  assert.deepEqual(demoPositions.map((x) => x.costBasisEur), [4000, 7000, 6500, 5600, 2800]);
  const p = buildDemoPortfolio(); close(p.totalCost, 25900); close(p.valueSeries[0], 25900);
  assert.ok(demoFunds.every((f) => f.equityWeight >= 0 && f.equityWeight <= 1));
  assert.deepEqual(demoFunds.map((f) => f.equityWeight), [0, 0, 0.4, 1, 1]);
});

test("DEMO data is fictional and well-formed", () => {
  const ids = new Set(demoFunds.map((f) => f.id));
  assert.equal(ids.size, demoFunds.length);
  for (const f of demoFunds) {
    assert.equal(f.monthlyReturnsPct.length, 36); assert.ok(f.startPrice > 0); assert.ok(f.riskLevel >= 1 && f.riskLevel <= 7);
    assert.doesNotMatch(f.id + f.name + f.manager, /\b[A-Z]{2}[0-9A-Z]{9}[0-9]\b/); // sin ISIN
    assert.match(f.name, /Ejemplo/);
  }
  for (const p of demoPositions) assert.ok(ids.has(p.fundId));
  assert.equal(demoBenchmark.monthlyReturnsPct.length, 36);
  assert.throws(() => buildDemoPortfolio(demoFunds, [{ fundId: "nope", units: 1, costBasisEur: 1 }]));
});

test("stored level is validated and falls back safely", () => {
  const store = new Map<string, string>();
  const ok = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  assert.equal(readStoredLevel("beginner", ok), "beginner");
  assert.equal(writeStoredLevel("advanced", ok), true);
  assert.equal(store.get(LEVEL_STORAGE_KEY), "advanced"); assert.equal(readStoredLevel("beginner", ok), "advanced");
  store.set(LEVEL_STORAGE_KEY, "expert"); assert.equal(readStoredLevel("intermediate", ok), "intermediate");
  store.set(LEVEL_STORAGE_KEY, "<script>"); assert.equal(readStoredLevel("beginner", ok), "beginner");
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } };
  assert.equal(readStoredLevel("intermediate", broken), "intermediate"); assert.equal(writeStoredLevel("advanced", broken), false);
  assert.equal(readStoredLevel("beginner", null), "beginner"); assert.equal(writeStoredLevel("advanced", null), false);
  assert.equal(writeStoredLevel("bogus" as never, ok), false);
});

import { deriveAgentFacts } from "./dashboard-portfolio.ts";
test("agent facts come from computed data", () => {
  const p = buildDemoPortfolio(); const f = deriveAgentFacts(p);
  const eq = p.byAssetClass.find((g) => g.key === "equity")!.weight * 100;
  const mixed = p.positions.find((r) => r.fund.id === "demo-mixto")!.weight * 100;
  close(f.equityWeightPct, eq);
  // look-through exposure = pure equity funds + 40 % of the mixed fund
  close(f.equityExposurePct, eq + 0.4 * mixed);
  close(f.scenarios[0].portfolioImpactPct!, (-10 * (eq + 0.4 * mixed)) / 100); close(f.scenarios[1].portfolioImpactPct!, (-20 * (eq + 0.4 * mixed)) / 100);
  assert.ok(f.scenarios.every((s) => Number.isFinite(s.portfolioImpactPct!) && s.portfolioImpactPct! > -100));
  assert.equal(f.topName, p.positions.reduce((a, b) => (b.weight > a.weight ? b : a)).fund.name);
});

test("la pausa antipánico de la cartera analiza la serie DEMO mostrada (misma caída máxima que el panel)", () => {
  const p = buildDemoPortfolio();
  const report = analyzeDecline({ name: "Mi cartera", dataKind: "fictional", sources: [], observations: p.valueSeries.map((value, i) => ({ label: p.labels[i], value })) });
  assert.equal(report.status, "ok");
  assert.equal(report.observationCount, p.valueSeries.length);
  assert.equal(report.observationCount, 37);
  assert.equal(report.latestLabel, "M36");
  close(report.maxDrawdownPercent!, Math.abs(p.maxDrawdownPct!), 1e-9);
});
