import { test } from "node:test";
import { strict as assert } from "node:assert";
import { annualPeriods } from "./annual-periods.ts";
test("compounds published annual returns over complete contiguous periods", () => {
  const rows = [
    { year: 2021, rate: -0.0053 },
    { year: 2022, rate: -0.0067 },
    { year: 2023, rate: 0.0243 },
    { year: 2024, rate: 0.0297 },
    { year: 2025, rate: 0.0153 },
  ];
  for (const [n, cumulative, annualised] of [
    [1, 0.0153, 0.0153],
    [3, 0.070858952163, 0.0230827383197842526],
    [5, 0.05804667093843530813, 0.011348803532501202],
  ]) {
    const actual = annualPeriods(rows, n)!;
    assert.ok(Math.abs(actual.cumulative - cumulative) < 1e-12);
    assert.ok(Math.abs(actual.annualised - annualised) < 1e-12);
  }
  assert.equal(annualPeriods([{ year: 2025, rate: -1 }], 1)?.cumulative, -1);
  for (const [data, years] of [
    [[], 1],
    [rows, 10],
    [rows, 0],
    [rows, 1.5],
    [
      [
        { year: 2023, rate: 0.1 },
        { year: 2025, rate: 0.2 },
      ],
      1,
    ],
    [
      [
        { year: 2024, rate: 0.1 },
        { year: 2024, rate: 0.2 },
      ],
      1,
    ],
    [
      [
        { year: 2025, rate: 0.1 },
        { year: 2024, rate: 0.2 },
      ],
      1,
    ],
    [
      [
        { year: 2024, rate: NaN },
        { year: 2025, rate: 0.2 },
      ],
      1,
    ],
    [[{ year: 2025, rate: -1.01 }], 1],
    [
      [
        { year: 2024, rate: 1e308 },
        { year: 2025, rate: 1e308 },
      ],
      2,
    ],
  ] as const)
    assert.equal(annualPeriods(data, years), null);
});
