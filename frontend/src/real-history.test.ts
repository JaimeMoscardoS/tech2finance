import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import data from '../../shared/demo-data.json' with {type:'json'};
import nav from '../../shared/nav-history.json' with {type:'json'};
import {simulateNav} from './nav-history.ts';
import {buildExperiment,explainComparison} from './practice-domain.ts';
import type {Instrument} from './catalog.ts';
import type {SimulationSpec,ServerSimulation} from './server-api.ts';
const instruments=data.instruments as Instrument[];
function run(spec:SimulationSpec):ServerSimulation {
 const instrument=instruments.find(i=>i.instrumentId===spec.instrumentId)!;
 const series=nav.instruments.find(i=>i.isin===instrument.identifier && i.eligible)!;
 return {...simulateNav(series.monthly,spec.initial,spec.recurringContribution,spec.periods,spec.startDate),instrumentId:spec.instrumentId,currency:'EUR',contributionTiming:'month_end_after_return',sources:[],assumptions:[]};
}
const settings={instrumentId:'caixabank-monetario-estandar',alternativeInstrumentId:'bbva-mi-inversion-bolsa-acumulacion',initial:1000,contribution:100,periods:12,alternativePeriods:60};
test('historical experiments cover contributions, horizon and matched assets',()=>{
 for(const lesson of ['contributions','horizon','assets'] as const) {
  const pair=buildExperiment(lesson,settings,instruments);const a=run(pair.baseline),b=run(pair.alternative);
  assert.equal(a.kind,'real_monthly_nav');assert.equal(a.timeline[0].date,'2019-12-31');
  assert.doesNotThrow(()=>explainComparison(pair,a,b,'es'));
  assert.throws(()=>explainComparison(pair,{...a,timeline:a.timeline.map((p,i)=>i===1?{...p,value:p.value+1}:p)},b,'es'));
  if(lesson==='assets') assert.throws(()=>explainComparison(pair,a,{...b,timeline:b.timeline.map((p,i)=>i===0?{...p,date:'2020-01-31'}:p)},'es'));
 }
});
test('real decline case and out-of-range boundaries',()=>{
 const spec=data.portfolioExample;const result=run(spec);assert.equal(result.timeline.at(-1)?.date,'2020-03-31');assert.ok(Math.abs(result.value-744.62)<0.01);
 assert.throws(()=>run({...spec,startDate:'2025-12-31'}));
 assert.throws(()=>run({...spec,startDate:'2020-03-30'}));
});
