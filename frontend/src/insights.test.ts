import { test } from "node:test";
import assert from "node:assert/strict";
import { insightFacts, isInsight } from "./insights.ts";
import { buildDemoPortfolio } from "./dashboard-portfolio.ts";

test("insightFacts usa las cifras calculadas de la cartera y respeta el esquema", () => {
  const p = buildDemoPortfolio();
  const f = insightFacts(p, { goalProgressPct: 66.666, planExpectedPct: null });
  assert.equal(f.dataKind, "fictional");
  assert.equal(f.months, p.valueSeries.length - 1);
  assert.equal(f.valueEur, Math.round(p.totalValue * 100) / 100);
  assert.equal(f.goalProgressPct, 66.7);
  assert.equal("planExpectedPct" in f, false);
  assert.ok(f.weights.length <= 8 && f.weights[0].weightPct >= f.weights.at(-1)!.weightPct);
});

test("isInsight valida la respuesta del servidor", () => {
  assert.equal(isInsight({ mode: "ai", summary: "Hola", points: ["a"] }), true);
  assert.equal(isInsight({ mode: "demo", summary: "Hola", points: [] }), false);
  assert.equal(isInsight({ mode: "ai", summary: "Hola", points: [1] }), false);
});
