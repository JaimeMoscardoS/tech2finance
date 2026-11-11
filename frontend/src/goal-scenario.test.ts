import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  scenarioReady,
  validAllocation,
  allocateCents,
  scenarioTemplate,
} from "./goal-scenario.ts";
test("scenario requires complete answers and protects short-term liquidity and reserves", () => {
  const ready = {
    objective: "retirement",
    horizon: "long",
    liquidity: "no",
    reserve: "yes",
    debt: "no",
    loss: "medium",
  };
  assert.equal(scenarioReady(ready), true);
  for (const change of [
    { objective: "" },
    { horizon: "short" },
    { liquidity: "yes" },
    { reserve: "no" },
    { debt: "yes" },
    { liquidity: "" },
    { loss: "unknown" },
    { objective: "banana" },
  ])
    assert.equal(scenarioReady({ ...ready, ...change }), false);
});
test("editable proportions must be finite, nonnegative and total 100", () => {
  assert.equal(validAllocation([30, 40, 30]), true);
  for (const values of [
    [30, 40, 20],
    [-1, 51, 50],
    [NaN, 0, 100],
    [101, 0, -1],
    [100, 0],
  ])
    assert.equal(validAllocation(values), false);
});

test("cent allocation preserves the exact amount and rejects invalid amounts", () => {
  assert.deepEqual(allocateCents("0.05", [30, 40, 30]), [2, 2, 1]);
  assert.deepEqual(allocateCents("0.01", [30, 40, 30]), [0, 1, 0]);
  assert.deepEqual(allocateCents("100", [30, 40, 30]), [3000, 4000, 3000]);
  for (const amount of ["", "-1", "0.001", "1e3", "1000000001"])
    assert.equal(allocateCents(amount, [30, 40, 30]), null);
});

test("teaching templates reflect preference and objective but not knowledge level", () => {
  const a = {
    objective: "retirement",
    horizon: "long",
    liquidity: "no",
    reserve: "yes",
    debt: "no",
    loss: "medium",
  };
  assert.deepEqual(scenarioTemplate(a), [30, 40, 30]);
  assert.deepEqual(scenarioTemplate({ ...a, loss: "low" }), [50, 40, 10]);
  assert.deepEqual(scenarioTemplate({ ...a, loss: "high" }), [20, 30, 50]);
  assert.deepEqual(
    scenarioTemplate({ ...a, objective: "project" }),
    [40, 40, 20],
  );
  for (const loss of ["low", "medium", "high"])
    for (const objective of ["retirement", "project", "general"])
      assert.equal(
        validAllocation(scenarioTemplate({ ...a, loss, objective })!),
        true,
      );
  assert.equal(scenarioTemplate({ ...a, reserve: "no" }), null);
});
