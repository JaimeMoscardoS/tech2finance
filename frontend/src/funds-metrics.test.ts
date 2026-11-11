import assert from "node:assert/strict";
import { test } from "node:test";
import { demoFunds, demoPositions } from "../../shared/mock/demo-portfolio.ts";
import { demoTrades } from "../../shared/mock/demo-trades.ts";
import { bestWorstMonth, excessReturnPct, filterPositions, matrixMaxAbs, monthlyReturnMatrix, periodWindow, positiveMonthsPct, rebase, summarizeTrades, tradeValue } from "./funds-metrics.ts";

const close = (a: number | null, b: number, eps = 1e-9) => { assert.notEqual(a, null); assert.ok(Math.abs((a as number) - b) < eps, `${a} != ${b}`); };

test("monthlyReturnMatrix: compound total per row and padding", () => {
  const m = monthlyReturnMatrix([10, -10]);
  assert.equal(m.length, 1);
  assert.equal(m[0].months.length, 12);
  assert.deepEqual(m[0].months.slice(0, 3), [10, -10, null]);
  close(m[0].total, -1); // 1.1 * 0.9 - 1 = -0.01
  assert.equal(m[0].count, 2);
});
test("monthlyReturnMatrix: second row and invalid input", () => {
  const m = monthlyReturnMatrix([...Array(12).fill(0), 5]);
  assert.equal(m.length, 2);
  close(m[0].total, 0);
  assert.equal(m[1].months[0], 5);
  close(m[1].total, 5);
  assert.deepEqual(monthlyReturnMatrix([]), []);
  assert.throws(() => monthlyReturnMatrix([-100]), RangeError);
  assert.throws(() => monthlyReturnMatrix([1], 0), RangeError);
});
test("matrixMaxAbs", () => {
  assert.equal(matrixMaxAbs(monthlyReturnMatrix([2, -7, 3])), 7);
  assert.equal(matrixMaxAbs([]), 0);
});
test("periodWindow", () => {
  assert.deepEqual(periodWindow([1, 2, 3, 4], 2), [2, 3, 4]);
  assert.deepEqual(periodWindow([1, 2, 3, 4], 10), [1, 2, 3, 4]);
  assert.throws(() => periodWindow([1], 0), RangeError);
});
test("rebase", () => {
  rebase([50, 55, 45]).forEach((v, i) => close(v, [100, 110, 90][i]));
  assert.deepEqual(rebase([]), []);
  assert.throws(() => rebase([0, 1]), RangeError);
});
test("excessReturnPct", () => {
  close(excessReturnPct([100, 110], [100, 105], 1), 5);
  assert.equal(excessReturnPct([100], [100], 1), null);
  assert.equal(excessReturnPct([100, 110, 120], [100, 105], 1), null);
});
test("positiveMonthsPct and bestWorstMonth", () => {
  assert.equal(positiveMonthsPct([1, -1, 2, 0]), 50);
  assert.equal(positiveMonthsPct([]), null);
  assert.deepEqual(bestWorstMonth([1, -3, 4, 0]), { best: { index: 2, value: 4 }, worst: { index: 1, value: -3 } });
  assert.equal(bestWorstMonth([]), null);
  assert.equal(positiveMonthsPct([1, NaN]), null);
  assert.equal(bestWorstMonth([1, Infinity]), null);
});
test("filterPositions", () => {
  const rows = [
    { fund: { name: "Alfa", manager: "Gestora X", assetClass: "equity" } },
    { fund: { name: "Beta", manager: "Gestora Y", assetClass: "fixed_income" } },
  ];
  assert.equal(filterPositions(rows, {}).length, 2);
  assert.equal(filterPositions(rows, { assetClass: "equity" }).length, 1);
  assert.equal(filterPositions(rows, { query: " gestora y " })[0].fund.name, "Beta");
  assert.equal(filterPositions(rows, { assetClass: "all", query: "zzz" }).length, 0);
});
test("tradeValue and summarizeTrades", () => {
  const funds = [{ id: "f", startPrice: 100, monthlyReturnsPct: [10, 10] }];
  const t = tradeValue({ id: "a", fundId: "f", side: "buy", units: 3, month: 2 }, funds);
  close(t.price, 121); // 100 * 1.1 * 1.1
  close(t.amount, 363);
  assert.throws(() => tradeValue({ id: "a", fundId: "x", side: "buy", units: 1, month: 0 }, funds), RangeError);
  assert.throws(() => tradeValue({ id: "a", fundId: "f", side: "buy", units: 1, month: 3 }, funds), RangeError);
  const s = summarizeTrades([
    { id: "a", fundId: "f", side: "buy", units: 3, month: 2 },
    { id: "b", fundId: "f", side: "sell", units: 2, month: 1 },
  ], funds);
  assert.deepEqual(s.rows.map((r) => r.id), ["a", "b"]);
  close(s.bought, 363);
  close(s.sold, 220); // 2 * 110
  close(s.net, 143);
});
test("demo trades reference existing funds and valid months", () => {
  const s = summarizeTrades(demoTrades, demoFunds);
  assert.equal(s.rows.length, demoTrades.length);
  assert.ok(s.rows.every((r) => r.amount > 0));
});

test("operaciones DEMO: las unidades vendidas no superan las unidades en cartera en ningún mes", () => {
  const prices = new Map(demoFunds.map((f) => [f.id, f.monthlyReturnsPct.length]));
  for (const trade of demoTrades) {
    const held = demoPositions.find((p) => p.fundId === trade.fundId);
    assert.ok(held, `fondo sin posición: ${trade.fundId}`);
    assert.ok(trade.month >= 0 && trade.month <= prices.get(trade.fundId)!, "mes dentro de la serie");
  }
  for (const fund of demoFunds) {
    const units = demoPositions.find((p) => p.fundId === fund.id)?.units ?? 0;
    for (let month = 0; month <= fund.monthlyReturnsPct.length; month++) {
      const sold = demoTrades.filter((t) => t.fundId === fund.id && t.side === "sell" && t.month <= month).reduce((s, t) => s + t.units, 0);
      assert.ok(sold <= units, `${fund.id} mes ${month}: vendidas ${sold} > en cartera ${units}`);
    }
  }
});
