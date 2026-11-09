import assert from 'node:assert/strict';
import test from 'node:test';
import { replayAnnual } from './annual-history.ts';
import { simulate } from './demo.ts';
import { MAX_SIMULATION_AMOUNT } from './simulation-types.ts';

const close = (actual: number, expected: number, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
test('annual published series applies contributions at each closing', () => {
  const r = replayAnnual(500, 100);
  [500, 597.35, 693.347755, 810.1961054465, 934.25892977826105, 1048.5530914038684].forEach((n, i) => close(r.points[i], n));
  assert.equal(r.kind, 'annual_history'); assert.equal(r.contributed, 1000);
  close(r.profit, 48.55309140386844); close(r.simpleReturnPercent!, 4.855309140386844);
  assert.deepEqual(r.timeline.map(p => p.date), ['2020-12-31','2021-12-31','2022-12-31','2023-12-31','2024-12-31','2025-12-31']);
  assert.equal(r.timeline[0].periodReturn, null); assert.equal(r.timeline[5].contribution, 100);
  close(r.timeline[5].valueBeforeContribution, r.value - 100);
  for (const [initial, amount, value, contributed] of [[500,0,529.0233354692177,500],[500,50,788.788213436543,750],[0,100,519.5297559346508,500],[500,500,3126.6721151424716,3000]]) {
    const x = replayAnnual(initial, amount); close(x.value, value); assert.equal(x.contributed, contributed); close(x.timeline[5].instrumentReturnPercent, 5.804667093843531);
  }
  const zero = replayAnnual(0,0); assert.equal(zero.simpleReturnPercent, null); assert.equal(zero.profit, 0);
});
test('monthly is fictional, repeats the sequence and contributes before return', () => {
  const r = simulate(1000, 100, 2, [0.1]);
  close(r.points[1], 1210); close(r.value, 1441); assert.equal(r.contributed, 1200);
  assert.equal(r.kind, 'fictional_monthly'); assert.deepEqual(r.timeline.map(p => p.date), [null,null,null]);
  assert.equal(r.timeline[1].valueBeforeContribution, 1000); close(r.timeline[2].instrumentReturnPercent, 21);
  assert.equal(simulate(0,0,1,[0]).simpleReturnPercent, null);
});
test('validation and independent result objects', () => {
  for (const bad of [-1, MAX_SIMULATION_AMOUNT + 1, Infinity, NaN, true, '1']) {
    assert.throws(() => replayAnnual(bad as number)); assert.throws(() => replayAnnual(1, bad as number));
    assert.throws(() => simulate(bad as number, 1, 1)); assert.throws(() => simulate(1, bad as number, 1));
  }
  for (const bad of [0,121,1.5,NaN,true]) assert.throws(() => simulate(1,1,bad as number));
  for (const bad of [[], [-1.01], [Infinity], [NaN], [true]]) assert.throws(() => simulate(1,1,1,bad as number[]));
  assert.throws(() => simulate(1,1,120,[1e308]));
  assert.throws(() => simulate(1,1,1,Array(2)));
  assert.throws(() => simulate(1e-300,0,1,[1e308]));
  const a = replayAnnual(500,100), b = replayAnnual(500,100);
  a.points[0] = 9; a.timeline[0].value = 8;
  assert.equal(b.points[0],500); assert.equal(b.timeline[0].value,500); assert.equal(a.points[1],a.timeline[1].value);
});
