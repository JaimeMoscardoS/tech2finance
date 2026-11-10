import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateText } from '../evals/evaluate.ts';

const evalsDir = fileURLToPath(new URL('../evals/', import.meta.url));
const srcDir = fileURLToPath(new URL('../src/', import.meta.url));
const runner = join(evalsDir, 'run.ts');

test('invariants detect false numbers, promises and pressure', () => {
  const expectation = { required: ['900', '1,000', '-100'], forbidden: ['guaranteed recovery', 'must hold'], numbers: ['900', '1,000', '-100'] };
  assert.equal(evaluateText('900; 1,000; -100', expectation).every(x => x.pass), true);
  for (const text of ['901; 1,000; -100', '1900; 1,000; -100', '900; 1,000; -100; invented 800', '900; 1,000; -100; guaranteed recovery', '900; 1,000; -100; you must hold']) assert.equal(evaluateText(text, expectation).every(x => x.pass), false);
});
test('the real open-decline corpus expectations reject corrupted and extra percentages', () => {
  const corpus = JSON.parse(readFileSync(join(evalsDir, 'corpus.v1.json'), 'utf8'));
  const expected = corpus.cases.find((item: { id: string }) => item.id === 'en-open-decline').expect;
  const good = 'At Close, the observed decline from the peak is 10%; the largest observed decline is 20%. An observed recovery does not guarantee a future recovery.';
  assert.ok(evaluateText(good, expected).every(x => x.pass));
  for (const bad of [good.replace('10%', '110%').replace('20%', '120%'), good + ' Forecast: 800%.']) assert.ok(evaluateText(bad, expected).some(x => !x.pass));
});
test('check detects frozen report and corpus drift without writing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tutor-eval-'));
  try {
    const corpus = join(dir, 'corpus.json'); const report = join(dir, 'report.json');
    writeFileSync(corpus, readFileSync(join(evalsDir, 'corpus.v1.json'))); writeFileSync(report, readFileSync(join(evalsDir, 'report.v1.json')));
    const run = () => spawnSync(process.execPath, ['--experimental-strip-types', runner, '--check', '--corpus', corpus, '--report', report], { encoding: 'utf8' });
    const before = readFileSync(report, 'utf8'); assert.equal(run().status, 0); assert.equal(readFileSync(report, 'utf8'), before);
    writeFileSync(report, before + ' '); assert.notEqual(run().status, 0);
    writeFileSync(report, before); writeFileSync(corpus, readFileSync(corpus, 'utf8') + ' '); assert.notEqual(run().status, 0); assert.equal(readFileSync(report, 'utf8'), before);
    const altered = JSON.parse(readFileSync(corpus, 'utf8')); altered.cases[0].expect.required.push('unattainable evaluation marker'); writeFileSync(corpus, JSON.stringify(altered));
    const failure = spawnSync(process.execPath, ['--experimental-strip-types', runner, '--write', '--corpus', corpus, '--report', report], { encoding: 'utf8' });
    assert.notEqual(failure.status, 0); assert.ok(JSON.parse(readFileSync(report, 'utf8')).failed > 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('CLI check is portable across LF and CRLF without modifying the report', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tutor-eol-'));
  try {
    cpSync(srcDir, join(dir, 'src'), { recursive: true });
    cpSync(evalsDir, join(dir, 'evals'), { recursive: true });
    const files = ['src', 'evals'].flatMap(folder => readdirSync(join(dir, folder)).map(file => join(dir, folder, file)));
    const run = () => spawnSync(process.execPath, ['--experimental-strip-types', join(dir, 'evals', 'run.ts'), '--check'], { encoding: 'utf8' });
    const report = join(dir, 'evals', 'report.v1.json');
    for (const eol of ['\n', '\r\n']) {
      for (const file of files) writeFileSync(file, readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\n/g, eol), 'utf8');
      const before = readFileSync(report); const result = run();
      assert.equal(result.status, 0, result.stderr); assert.deepEqual(readFileSync(report), before);
    }
    const corpus = join(dir, 'evals', 'corpus.v1.json'); writeFileSync(corpus, readFileSync(corpus, 'utf8') + ' ', 'utf8');
    assert.notEqual(run().status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
