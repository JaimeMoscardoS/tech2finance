import assert from "node:assert/strict";
import { test } from "node:test";
import { demoFacts } from "../../shared/mock/demo-facts.ts";
import { goalProgress, lastMonthChangePct, planStatus, selectFacts, sliceByPeriod } from "./home-logic.ts";

test("goalProgress acota y valida", () => {
  assert.deepEqual(goalProgress(10000, 40000), { pct: 25, remaining: 30000, reached: false });
  assert.equal(goalProgress(50000, 40000)?.pct, 100);
  assert.equal(goalProgress(50000, 40000)?.reached, true);
  assert.equal(goalProgress(1, 0), null);
  assert.equal(goalProgress(NaN, 10), null);
});

test("planStatus compara con avance lineal", () => {
  assert.equal(planStatus(40, 18, 60)?.status, "ahead");
  assert.equal(planStatus(30, 18, 60)?.status, "on_track");
  assert.equal(planStatus(10, 18, 60)?.status, "behind");
  assert.equal(planStatus(10, 18, 0), null);
});

test("sliceByPeriod: 1S sin datos y recortes mensuales", () => {
  const s = Array.from({ length: 37 }, (_, i) => i);
  assert.equal(sliceByPeriod(s, "1w"), null);
  assert.equal(sliceByPeriod(s, "1m")?.length, 2);
  assert.equal(sliceByPeriod(s, "1y")?.length, 13);
  assert.equal(sliceByPeriod(s, "max")?.length, 37);
  assert.equal(sliceByPeriod([1, 2], "6m")?.length, 2);
});

test("lastMonthChangePct", () => {
  assert.ok(Math.abs((lastMonthChangePct([100, 110]) ?? 0) - 10) < 1e-9);
  assert.equal(lastMonthChangePct([100]), null);
  assert.equal(lastMonthChangePct([0, 5]), null);
});

test("selectFacts filtra por fecha y cartera, ordena y limita", () => {
  const r = selectFacts(demoFacts, ["demo-bonos"], "2026-11-11", 5);
  assert.deepEqual(r.map((f) => f.id), ["f1", "f4", "f5"]);
  assert.equal(selectFacts(demoFacts, ["demo-global", "demo-bonos"], "2026-11-11", 2).length, 2);
  assert.deepEqual(selectFacts(demoFacts, [], "2026-11-11").map((f) => f.id), ["f5"]);
  assert.deepEqual(selectFacts(demoFacts, ["demo-global"], "2026-11-11", 0), []);
  // Hecho de prueba con fecha posterior a la consulta (vive solo en la prueba, no en los datos DEMO).
  const future: (typeof demoFacts)[number] = { id: "f-future", date: "2026-11-20", fundIds: ["demo-global"], text: { es: "futuro", en: "future" }, source: { es: "Prueba", en: "Test" } };
  assert.ok(!selectFacts([...demoFacts, future], ["demo-global"], "2026-11-11").some((f) => f.id === "f-future"));
  assert.ok(selectFacts([...demoFacts, future], ["demo-global"], "2026-11-20", 10).some((f) => f.id === "f-future"));
});
