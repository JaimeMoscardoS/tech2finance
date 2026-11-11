import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../../shared/demo-data.json' with {type:'json'};
import { createLocalTutorProvider } from '../src/local-tutor.ts';
import type { TutorContext } from '../src/types.ts';
const provider=createLocalTutorProvider();
for(const language of ['es','en'] as const) for(const level of ['beginner','intermediate','advanced'] as const) test(`NAV context and unknown costs ${language} ${level}`,async()=>{
 const context: TutorContext={page:'simulator',language,level,bank:data.bankProfile as TutorContext['bank'],instrument:{id:'bbva-mi-inversion-bolsa-acumulacion',name:'BBVA MI INVERSION BOLSA ACUMULACION, FI',currency:'EUR',dataKind:'historical_nav',sources:[{label:'CNMV',url:'https://www.cnmv.es/'}]},simulation:{kind:'real_monthly_nav',initial:1000,recurringContribution:0,contributionTiming:'month_end_after_return',periods:3,finalValue:744.62,totalContributed:1000,profit:-255.38,simpleReturnPercent:-25.538,instrumentReturnPercent:-25.538,periodStart:'2019-12-31',periodEnd:'2020-03-31'}};
 const result=await provider.reply({message:language==='es'?'Explica el resultado':'Explain the result',context});
 assert.match(result.text,/2020-03-31/);assert.match(result.text,/744/);assert.match(result.text,language==='es'?/cierre mensual/:/month end/i);
 const cost=await provider.reply({message:language==='es'?'Cuánto cuesta este fondo':'How much does this fund cost?',context});
 assert.doesNotMatch(cost.text,/0[,.]75|75 basis|75 puntos/i);
 const annual=await provider.reply({message:language==='es'?'¿Cuál fue la rentabilidad de 2022?':'What was the return of 2022?',context});
 assert.match(annual.text,language==='es'?/rentabilidad anual.*no está disponible/i:/annual return.*not available/i);
 assert.doesNotMatch(annual.text,/744|255/);
});
test('annual NAV contributions are counted only on completed years', async()=>{
 const context:TutorContext={page:'simulator',language:'es',level:'beginner',instrument:{id:'x',name:'Fondo',currency:'EUR',dataKind:'historical_nav',sources:[]},simulation:{kind:'real_monthly_nav',initial:1000,recurringContribution:100,contributionTiming:'month_end_after_return',contributionFrequency:'annual',periods:25,finalValue:1200,totalContributed:1200,profit:0,simpleReturnPercent:0,instrumentReturnPercent:0,periodStart:'2020-01-01',periodEnd:'2022-02-01'}};
 const result=await provider.reply({message:'Explica el resultado',context});
 assert.match(result.text,/1\.?200/);assert.match(result.text,/cada 12 cierres/);
});
