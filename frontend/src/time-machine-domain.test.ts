import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPausePoints, monthlyChanges, offersDecision, pauseAt, standing, visibleWindow, type ReplayRow } from './time-machine-domain.ts';

/** Rows from NAVs with a fixed contribution of 100 per month and 1000 at the start (units bought at each close). */
function rowsFrom(navs: number[], initial = 1000, monthly = 100): ReplayRow[] {
  let units = initial / navs[0];
  return navs.map((nav, i) => {
    if (i > 0) units += monthly / nav;
    const contributed = initial + monthly * i;
    const value = units * nav;
    return { period: i, date: `2020-${String(i + 1).padStart(2, '0')}-28`, nav: String(nav), value, contributed, profit: value - contributed, instrumentReturnPercent: (nav / navs[0] - 1) * 100 };
  });
}

test('the largest monthly drop is the pause "drop", with its real percentage', () => {
  const rows = rowsFrom([10, 10.5, 9.45, 9.9, 9.0, 10.2, 11]);
  const changes = monthlyChanges(rows);
  assert.equal(changes[0], 0);
  const pauses = detectPausePoints(rows);
  const drop = pauses.find(p => p.kinds.includes('drop'))!;
  assert.equal(drop.month, 2); // -10 %, larger than -9.09 % in month 4
  assert.equal(drop.dropPercent, -10);
  assert.equal(pauseAt(pauses, 2), drop);
});

test('the first new all-time high after the drop is detected, ignoring recoveries that stay below the peak', () => {
  const rows = rowsFrom([10, 10.5, 9.45, 10.4, 10.6, 11]);
  const high = detectPausePoints(rows).find(p => p.kinds.includes('high'))!;
  assert.equal(high.month, 4); // 10.4 is below the 10.5 peak; 10.6 is the first new high
});

test('no pause for a drop or a high when the instrument never falls', () => {
  const rows = rowsFrom([10, 10.1, 10.2, 10.3]);
  const kinds = detectPausePoints(rows).flatMap(p => p.kinds);
  assert.deepEqual(kinds, ['end']);
});

test('recovery is the first month back within 1 % of the contributed amount after being clearly below it', () => {
  const rows = rowsFrom([10, 9, 8.5, 9.5, 11, 12]);
  const recover = detectPausePoints(rows).find(p => p.kinds.includes('recover'))!;
  assert.notEqual(standing(rows[recover.month]), 'less');
  assert.ok(rows.slice(1, recover.month).every(r => standing(r) === 'less'));
  assert.ok(rows.slice(1, recover.month).some(r => r.value < r.contributed));
});

test('a value 0.5 % under the contributed amount is "same", so it is not a recovery by itself and does not start a dip', () => {
  const rows: ReplayRow[] = [10, 10, 10, 10].map((nav, i) => ({ period: i, date: null, nav: String(nav), value: 995, contributed: 1000, profit: -5, instrumentReturnPercent: 0 }));
  assert.equal(detectPausePoints(rows).some(p => p.kinds.includes('recover')), false);
  const dip = rows.map((r, i) => (i === 1 ? { ...r, value: 900, profit: -100 } : i === 2 ? { ...r, value: 995, profit: -5 } : r));
  assert.equal(detectPausePoints(dip).find(p => p.kinds.includes('recover'))?.month, 2);
});

test('no recovery pause when the value was never below what was contributed', () => {
  const rows = rowsFrom([10, 10.2, 10.4, 10.5]);
  assert.equal(detectPausePoints(rows).some(p => p.kinds.includes('recover')), false);
});

test('the final month is always a pause and reasons sharing a month are merged', () => {
  const rows = rowsFrom([10, 11, 12, 9]);
  const pauses = detectPausePoints(rows);
  const final = pauses.at(-1)!;
  assert.equal(final.month, 3);
  assert.deepEqual(final.kinds, ['drop', 'end']);
  assert.equal(pauses.length, new Set(pauses.map(p => p.month)).size);
  assert.equal(offersDecision(final, 3), false);
});

test('pauses are ordered by month and never include month 0', () => {
  const rows = rowsFrom([10, 9.2, 9.8, 8.8, 10, 11, 12]);
  const months = detectPausePoints(rows).map(p => p.month);
  assert.deepEqual(months, [...months].sort((a, b) => a - b));
  assert.ok(months.every(m => m >= 1));
});

test('falls back to the cumulative return when NAVs are missing, and handles short series', () => {
  const rows = rowsFrom([10, 8, 9, 10]).map(({ nav: _nav, ...row }) => row as ReplayRow);
  assert.equal(detectPausePoints(rows).find(p => p.kinds.includes('drop'))!.month, 1);
  assert.deepEqual(detectPausePoints(rowsFrom([10])), []);
  assert.deepEqual(detectPausePoints(rowsFrom([10, 10]) ).map(p => p.kinds), [['end']]);
});

test('visibleWindow never returns months after the visible one', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(visibleWindow(items, 0), ['a']);
  assert.deepEqual(visibleWindow(items, 2), ['a', 'b', 'c']);
  assert.deepEqual(visibleWindow(items, 99), items);
  assert.deepEqual(visibleWindow(items, -3), []);
  assert.deepEqual(visibleWindow(items, NaN), []);
});

test('standing uses the 1 % tolerance of step 2', () => {
  assert.equal(standing({ profit: 50, contributed: 1000 }), 'more');
  assert.equal(standing({ profit: -50, contributed: 1000 }), 'less');
  assert.equal(standing({ profit: 5, contributed: 1000 }), 'same');
});
