import test from 'node:test';
import assert from 'node:assert/strict';
import navData from '../../shared/nav-history.json' with { type: 'json' };
import { PRESETS, monthChange, classifyDifference, evaluatePrediction, evaluateSellPrediction, findMonthIndex, fundMetrics, matchesPreset, maxDrawdownPercent, monthLabel, navSeries, longMonthLabel, sliderMonths, sparklinePoints } from './journey-domain.ts';

test('max drawdown is the worst peak-to-trough fall', () => {
  assert.equal(maxDrawdownPercent([100, 120, 90, 110, 60, 130]), -50);
  assert.equal(maxDrawdownPercent([100, 90, 95]), -10);
  assert.equal(maxDrawdownPercent([10, 11, 12]), 0);
  assert.equal(maxDrawdownPercent([100, 50, 100]), -50);
});
test('max drawdown refuses series it cannot measure', () => {
  assert.equal(maxDrawdownPercent([]), null);
  assert.equal(maxDrawdownPercent([5]), null);
  assert.equal(maxDrawdownPercent([5, Number.NaN]), null);
  assert.equal(maxDrawdownPercent([5, 0, 3]), null);
});
test('sparkline scales into the box and handles flat series', () => {
  assert.equal(sparklinePoints([0, 10], 100, 20, 0), '0.0,20.0 100.0,0.0');
  assert.equal(sparklinePoints([3, 3, 3], 100, 20, 0), '0.0,10.0 50.0,10.0 100.0,10.0');
  assert.equal(sparklinePoints([1], 100, 20), null);
  assert.equal(sparklinePoints([1, Number.POSITIVE_INFINITY], 100, 20), null);
});
test('the "about the same" band is 1 % of the reference', () => {
  assert.equal(classifyDifference(5.51, 1100), 'same');
  assert.equal(classifyDifference(11, 1100), 'same');
  assert.equal(classifyDifference(11.01, 1100), 'more');
  assert.equal(classifyDifference(-11.01, 1100), 'less');
  assert.equal(classifyDifference(0, 0), 'same');
  assert.throws(() => classifyDifference(Number.NaN, 1));
});
test('step 2 prediction compares profit with the contributed amount', () => {
  assert.deepEqual(evaluatePrediction('same', 5.51, 1100), { actual: 'same', matched: true });
  assert.deepEqual(evaluatePrediction('more', 5.51, 1100), { actual: 'same', matched: false });
  assert.deepEqual(evaluatePrediction('less', -200, 1100), { actual: 'less', matched: true });
  assert.deepEqual(evaluatePrediction('more', 200, 1100), { actual: 'more', matched: true });
});
test('step 3 prediction compares selling with holding', () => {
  assert.deepEqual(evaluateSellPrediction('less', 1275.83, 1254.63), { actual: 'more', matched: false });
  assert.deepEqual(evaluateSellPrediction('same', 1260, 1254.63), { actual: 'same', matched: true });
  assert.deepEqual(evaluateSellPrediction('less', 900, 1254.63), { actual: 'less', matched: true });
});
test('month labels are short and locale aware, and empty for bad input', () => {
  assert.equal(monthLabel('2021-03-31', 'es'), 'mar 2021');
  assert.equal(monthLabel('2021-03-31', 'en'), 'Mar 2021');
  assert.equal(monthLabel('nope', 'es'), '');
  assert.equal(monthLabel(undefined, 'en'), '');
  assert.equal(longMonthLabel('2020-03-31', 'es'), 'marzo de 2020');
  assert.equal(longMonthLabel('2020-03-31', 'en'), 'March 2020');
});
test('month index finder and slider bounds', () => {
  const dates = ['2019-12-31', '2020-01-31', '2020-02-29', '2020-03-31'];
  assert.equal(findMonthIndex(dates, '2020-03'), 3);
  assert.equal(findMonthIndex(dates, '2021-03'), -1);
  assert.equal(sliderMonths(73), 72);
  assert.equal(sliderMonths(200), 72);
  assert.equal(sliderMonths(25), 24);
  assert.equal(sliderMonths(0), 0);
});
test('presets match only their exact amounts', () => {
  assert.equal(matchesPreset(PRESETS[0], '1000', '0'), true);
  assert.equal(matchesPreset(PRESETS[0], '1000', ''), true);
  assert.equal(matchesPreset(PRESETS[0], '', '0'), false);
  assert.equal(matchesPreset(PRESETS[1], '100', '50'), true);
  assert.equal(matchesPreset(PRESETS[1], '100', '51'), false);
});
test('fund metrics come from the real eligible NAV series', () => {
  const eligible = (navData as { instruments: { isin: string; eligible: boolean }[] }).instruments.find(i => i.eligible)!;
  const metrics = fundMetrics(navData as never, eligible.isin);
  assert.equal(metrics.values.length, navSeries(navData as never, eligible.isin).length);
  assert.ok(metrics.values.length > 1);
  assert.ok(metrics.maxDrawdown !== null && metrics.maxDrawdown <= 0 && metrics.maxDrawdown >= -100);
  const empty = fundMetrics(navData as never, 'XX0000000000');
  assert.deepEqual(empty.values, []);
  assert.equal(empty.maxDrawdown, null);
});

test('month change compares a close with the previous one', () => {
  const rows = [{ date: '2020-02-29', nav: '10' }, { date: '2020-03-31', nav: '8' }, { date: '2020-04-30', nav: '9' }];
  assert.equal(monthChange(rows, '2020-03')?.percent, -20);
  assert.equal(monthChange(rows, '2020-03')?.index, 1);
  assert.equal(monthChange(rows, '2020-02'), null);
  assert.equal(monthChange(rows, '2021-01'), null);
});
