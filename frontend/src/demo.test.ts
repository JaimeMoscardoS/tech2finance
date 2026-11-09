import { test } from "node:test";
import { strict as assert } from "node:assert";
import { simulate } from "./demo.ts";

test("the illustrative simulator accounts for all contributions", () => {
  const result = simulate(100, 20, 3);
  assert.equal(result.contributed, 160);
  assert.equal(result.points.length, 4);
  assert.ok(Number.isFinite(result.value));
});
test("invalid values are rejected", () => {
  assert.throws(() => simulate(-1, 0, 3));
  assert.throws(() => simulate(1, 0, 0));
  assert.throws(() => simulate(1e308, 1e308, 12));
  assert.throws(() => simulate(1e308, 0, 12, [1]));
});
import { instruments } from "./catalog.ts";
import { annualHistory, replayAnnual } from "./annual-history.ts";
test("fictional instruments have distinct sequences and real funds have no series", () => {
 const samples=instruments.filter(item=>item.dataStatus==="fictional");
 assert.equal(new Set(samples.map(item=>simulate(500,50,12,item.returns).value)).size,samples.length);
 assert.ok(instruments.filter(item=>item.dataStatus==="missing_history").every(item=>!item.returns));
});

test("annual published returns reconstruct the fixed historical period", () => {
 assert.equal(annualHistory.instrumentId, "caixabank-monetario-estandar");
 assert.equal(annualHistory.baseline, "2020-12-31");
 assert.deepEqual(annualHistory.returns, [
  {year:2021, rate:-0.0053}, {year:2022, rate:-0.0067},
  {year:2023, rate:0.0243}, {year:2024, rate:0.0297}, {year:2025, rate:0.0153},
 ]);
 const result=replayAnnual(1000);
 assert.equal(result.points.length, 6);
 assert.ok(result.points[1] < result.points[0] && result.points[2] < result.points[1]);
 assert.ok(Math.abs(result.value-1058.0466709384355)<1e-9);
 assert.equal(result.contributed,1000);
 assert.equal(replayAnnual(0).value,0);
 assert.ok(Number.isFinite(replayAnnual(1e15).value));
 for (const invalid of [-1, NaN, Infinity, 1e15+1, 1.69e308, Number.MAX_VALUE]) assert.throws(()=>replayAnnual(invalid));
});
