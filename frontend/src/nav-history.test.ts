import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { simulateNav } from './nav-history.ts';
test('uses observed NAVs and adds contributions after each return', () => {
 const result = simulateNav([{date:'2020-01-31',nav:'10'}, {date:'2020-02-29',nav:'8'}, {date:'2020-03-31',nav:'12'}], 1000, 100, 2);
 assert.deepEqual(result.timeline.map(p => p.value), [1000,900,1450]);
 assert.equal(result.contributed,1200);
 assert.equal(result.timeline[2].date,'2020-03-31');
 assert.throws(() => simulateNav([{date:'2020-01-31',nav:'10'}], 1000,0,2));
});
test('annual contributions occur only after every twelfth observed month', () => {
 const rows = Array.from({length: 26}, (_, i) => ({date: `${2020 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2,'0')}-01`, nav:'10'}));
 const result = simulateNav(rows,1000,100,25,undefined,'annual');
 assert.equal(result.contributed,1200);
 assert.deepEqual(result.timeline.filter(p=>p.period && p.contribution).map(p=>p.period),[12,24]);
 assert.equal(simulateNav(rows,1000,100,11,undefined,'annual').contributed,1000);
});
