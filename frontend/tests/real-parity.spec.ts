import { test, expect } from '@playwright/test';
import data from '../../shared/demo-data.json' with {type:'json'};
import nav from '../../shared/nav-history.json' with {type:'json'};
import manifest from '../../shared/data-manifest.json' with {type:'json'};
import {simulateNav} from '../src/nav-history';

test('CNMV replay agrees independently with the API for each instrument and dated scenario',async({request})=>{
 for(const id of data.demoStudyInstrumentIds){const instrument=data.instruments.find(i=>i.instrumentId===id)!;const history=nav.instruments.find(h=>h.isin===instrument.identifier)!;
  for(const [startDate,periods,initial,recurringContribution,contributionFrequency] of [['2019-12-31',3,1000,0,'monthly'],['2020-12-31',36,500,100,'monthly'],['2019-12-31',72,0,50,'monthly'],['2019-12-31',11,1000,100,'annual'],['2019-12-31',36,500,100,'annual']] as const){
   const response=await request.post('/api/simulations',{data:{instrumentId:id,startDate,periods,initial,recurringContribution,contributionFrequency}});expect(response.status()).toBe(200);const server=await response.json();const local=simulateNav(history.monthly,initial,recurringContribution,periods,startDate,contributionFrequency);
   expect(server.contributionFrequency).toBe(contributionFrequency);expect(server.provenance.datasetSha256).toBe(manifest.datasetSha256);expect(server.provenance.navHistorySha256).toBe(manifest.navHistorySha256);expect(server.timeline.map((p:any)=>[p.date,p.nav])).toEqual(local.timeline.map(p=>[p.date,p.nav]));
   for(let i=0;i<local.timeline.length;i++){expect(server.timeline[i].contribution).toBe(local.timeline[i].contribution);expect(Math.abs(server.timeline[i].value-local.timeline[i].value)).toBeLessThan(0.000001);expect(Math.abs(server.timeline[i].instrumentReturnPercent-local.timeline[i].instrumentReturnPercent)).toBeLessThan(0.000001)}
  }
 }
 const invalid=await request.post('/api/simulations',{data:{instrumentId:data.demoStudyInstrumentIds[0],startDate:'2025-12-31',periods:1,initial:1000,recurringContribution:0}});expect(invalid.status()).toBe(422);
});
