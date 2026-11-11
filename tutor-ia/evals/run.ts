import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { evaluateCase, type Case } from './evaluate.ts';

const dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name: string, fallback: string) => { const i = args.indexOf(name); if (i < 0) return fallback; if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing ${name}`); return args[i + 1]; };
if (args.includes('--check') === args.includes('--write')) throw new Error('Choose exactly one of --check or --write');
const corpusPath = option('--corpus', join(dir, 'corpus.v1.json'));
const reportPath = option('--report', join(dir, 'report.v1.json'));
const policyPath = join(dir, 'policy.v1.json');
const canonicalText = (data: string | Buffer) => data.toString().replace(/\r\n/g, '\n');
const hash = (data: string | Buffer) => createHash('sha256').update(canonicalText(data), 'utf8').digest('hex');
const corpusData = readFileSync(corpusPath); const policyData = readFileSync(policyPath);
const corpus = JSON.parse(corpusData.toString('utf8')) as { schemaVersion: number; cases: Case[] };
if (corpus.schemaVersion !== 1 || !Array.isArray(corpus.cases) || !corpus.cases.length || new Set(corpus.cases.map(x => x.id)).size !== corpus.cases.length) throw new Error('Invalid corpus');
const results = []; for (const item of corpus.cases) results.push(await evaluateCase(item));
const failed = results.filter(r => r.checks.some(c => !c.pass));
const coverage = Object.fromEntries(['es', 'en'].map(language => [language, Object.fromEntries(['beginner', 'intermediate', 'advanced'].map(level => [level, results.filter(r => r.language === language && r.level === level).length]))]));
const implementation = ['../src/local-tutor.ts', '../src/bank-profile.ts', '../src/decline.ts', './evaluate.ts', './run.ts'].map(file => ({ file, sha256: hash(readFileSync(join(dir, file))) }));
const report = JSON.stringify({ schemaVersion: 1, policyVersion: JSON.parse(policyData.toString('utf8')).policyVersion, corpusSha256: hash(corpusData), policySha256: hash(policyData), implementation, coverage, total: results.length, failed: failed.length, results }, null, 2) + '\n';
if (args.includes('--write')) writeFileSync(reportPath, report, 'utf8');
else if (canonicalText(readFileSync(reportPath, 'utf8')) !== report) { console.error('Report drift detected'); process.exitCode = 1; }
console.log(`${results.length} cases; ${failed.length} failed`);
if (failed.length) { console.error(JSON.stringify(failed)); process.exitCode = 1; }
