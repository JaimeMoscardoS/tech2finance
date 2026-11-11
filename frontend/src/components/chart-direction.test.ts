import { test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { directions } from './chart-direction.ts';
test('chart direction compares adjacent observations, including flat and below-zero values', () => {
 deepStrictEqual(directions([10, 12, 12, 8, -1, 0]), ['rise', 'flat', 'fall', 'fall', 'rise']);
 deepStrictEqual(directions([0]), []);
 deepStrictEqual(directions([]), []);
});
