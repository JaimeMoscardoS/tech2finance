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
test("fictional instruments have distinct sequences and real funds have no series", () => {
 const samples=instruments.filter(item=>item.dataStatus==="fictional");
 assert.equal(new Set(samples.map(item=>simulate(500,50,12,item.returns).value)).size,samples.length);
 assert.ok(instruments.filter(item=>item.dataStatus==="missing_history").every(item=>!item.returns));
});
