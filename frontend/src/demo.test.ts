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
});