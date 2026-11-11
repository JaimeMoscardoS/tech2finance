import { test } from "node:test";
import { strict as assert } from "node:assert";
import { SCENARIOS, compareHorizons, runAll, runScenario, validateParams } from "./game-scenarios.ts";

const p = { initial: 1000, monthly: 100, years: 5 };

test("contributions add up and the zero-rate zero-cost case is exact", () => {
  const r = runScenario(p, { id: "x", kind: "constant", grossAnnualPct: 0, costAnnualPct: 0 });
  assert.equal(r.sim.contributed, 1000 + 100 * 60);
  assert.ok(Math.abs(r.sim.value - r.sim.contributed) < 1e-6);
  assert.equal(r.costEur < 1e-6, true);
  assert.equal(r.yearly.length, 6);
  assert.equal(r.yearly[5].value, r.sim.value);
});

test("a constant annual rate compounds as expected for a lump sum", () => {
  const r = runScenario({ initial: 1000, monthly: 0, years: 3 }, { id: "x", kind: "constant", grossAnnualPct: 5, costAnnualPct: 0 });
  assert.ok(Math.abs(r.sim.value - 1000 * 1.05 ** 3) < 1e-6);
});

test("costs reduce the final value and are reported", () => {
  const free = runScenario(p, { id: "a", kind: "constant", grossAnnualPct: 4, costAnnualPct: 0 });
  const paid = runScenario(p, { id: "b", kind: "constant", grossAnnualPct: 4, costAnnualPct: 1 });
  assert.ok(paid.sim.value < free.sim.value);
  assert.ok(Math.abs(paid.costEur - (free.sim.value - paid.sim.value)) < 1e-6);
});

test("all default scenarios run and the cycle one can dip below contributions early", () => {
  const all = runAll(p);
  assert.equal(all.length, SCENARIOS.length);
  assert.ok(all.every((r) => Number.isFinite(r.sim.value)));
});

test("horizons are consistent with a full run", () => {
  const rows = compareHorizons(p, SCENARIOS[1], [1, 3, 5]);
  assert.equal(rows.length, 3);
  assert.equal(rows[2].value, runScenario(p, SCENARIOS[1]).sim.value);
  assert.ok(rows[0].contributed < rows[1].contributed);
  assert.throws(() => compareHorizons(p, SCENARIOS[1], [11]));
});

test("parameter validation", () => {
  assert.equal(validateParams(p), null);
  assert.equal(validateParams({ ...p, years: 0 }), "years");
  assert.equal(validateParams({ ...p, years: 2.5 }), "years");
  assert.equal(validateParams({ ...p, initial: -1 }), "amount");
  assert.equal(validateParams({ ...p, initial: NaN }), "amount");
  assert.equal(validateParams({ initial: 0, monthly: 0, years: 1 }), "zero");
  assert.throws(() => runScenario({ ...p, years: 11 }, SCENARIOS[0]));
});
