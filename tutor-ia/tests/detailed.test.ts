import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { analyzeDecline, buildDetailedDeclineAnalysis } from '../src/index.ts';

test('detailed decline explains observed episodes and decision in both languages', () => {
  const report = analyzeDecline({name:'Example',dataKind:'fictional',observations:[{label:'A',value:100},{label:'B',value:80},{label:'C',value:100},{label:'D',value:90}],sources:[]});
  for (const language of ['es','en'] as const) {
    const answer = buildDetailedDeclineAnalysis({report,language,level:'beginner',decision:{needsLiquidity:'yes'}});
    assert.deepEqual(answer.sections.map(s => s.id), ['observed','context','mechanism','portfolio','decision','uncertainty']);
    assert.equal(answer.mode,'demo');
    assert.match(answer.sections[0].paragraphs.join(' '), /20/);
    assert.match(answer.sections[4].paragraphs.join(' '), /liqui/i);
  }
});

test('insufficient and flat observations do not invent crises', () => {
  for (const observations of [[{label:'A',value:100}], [{label:'A',value:100},{label:'B',value:100}]]) {
    const report = analyzeDecline({name:'Example',dataKind:'fictional',observations,sources:[]});
    for (const level of ['beginner','intermediate','advanced'] as const) {
      const analysis = buildDetailedDeclineAnalysis({report,language:'en',level});
      assert.equal(analysis.sections.length, 6);
      assert.doesNotMatch(JSON.stringify(analysis), /crisis|NaN|undefined/);
    }
  }
});
