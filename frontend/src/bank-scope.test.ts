import { test } from "node:test";
import { strict as assert } from "node:assert";
import data from "../../shared/demo-data.json" with { type: "json" };
import { scopeCatalog } from "./bank-scope.ts";
import type { Catalog } from "./server-api.ts";
test("scoping keeps one configured institution and never falls back to another", () => {
  const scoped = scopeCatalog(data as Catalog, "caixabank");
  assert.deepEqual(
    scoped.banks.map((b) => b.id),
    ["caixabank"],
  );
  assert.ok(scoped.instruments.length > 0);
  assert.ok(scoped.instruments.every((i) => i.bankId === "caixabank"));
  assert.equal(scopeCatalog(data as Catalog, "unknown").instruments.length, 0);
});
