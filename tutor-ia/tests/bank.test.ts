import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalTutorProvider } from '../src/local-tutor.ts';
import type { TutorContext } from '../src/types.ts';

const bank = JSON.parse(readFileSync(new URL('../../shared/snapshots/demo-2026-11-10.1/demo-data.json', import.meta.url), 'utf8')).bankProfile;
const context: TutorContext = { page: 'simulator', level: 'beginner', language: 'es', bank, instrument: { id: 'demo-mixed', name: 'T2F Equilibrio', currency: 'EUR', dataKind: 'fictional', sources: [], product: bank.products.find((p: {instrumentId: string}) => p.instrumentId === 'demo-mixed') } };
const ask = (message: string, c = context, history: {role: 'assistant'; text: string; intent: string}[] = []) => createLocalTutorProvider().reply({ message, context: c, history });
test('bank questions use fictional contextual data and do not deduct fees', async () => {
  assert.match((await ask('¿Qué es BancoT2F?')).text, /fictici/i);
  assert.match((await ask('¿Qué condiciones tiene la cuenta de demo?')).text, /0 EUR/);
  const fee = await ask('¿Cuánto cuesta este fondo?'); assert.match(fee.text, /0,75\s*%/); assert.match(fee.text, /no se descuentan/i);
  assert.match((await ask('¿Y eso está descontado?', context, [{role:'assistant', text: fee.text, intent: fee.intent}])).text, /no se descuentan/i);
  assert.doesNotMatch((await ask('¿Qué es una comisión?')).text, /0,75/);
  assert.match((await ask('¿Qué ganaré el próximo año?')).text, /no|disponible|pred/i);
  assert.match((await ask('¿Necesito mantener?')).text, /decisión es tuya/i);
});
test('plural fee definition remains conceptual', async () => {
  const reply = await ask('¿Qué son las comisiones?');
  assert.equal(reply.intent, 'costs'); assert.doesNotMatch(reply.text, /0,75/);
});
test('foreign products, missing history and malformed data never inherit fees', async () => {
  const external = { ...context, instrument: { ...context.instrument!, product: undefined, id: 'bbva', name: 'BBVA', dataKind: 'missing_history' as const } };
  assert.match((await ask('¿Por qué no puedo simularlo?', external)).text, /histórico/i);
  assert.doesNotMatch((await ask('¿Cuánto cuesta este fondo?', external)).text, /0,75|75/);
  assert.doesNotMatch((await ask('¿Cuánto cuesta el fondo Tesla?')).text, /0,75|75/);
  const malformed = { ...context, bank: { ...bank, services: null }, instrument: { ...context.instrument!, product: { ...context.instrument!.product!, fees: null } } } as unknown as TutorContext;
  assert.doesNotMatch((await ask('¿Cuánto cuesta este fondo?', malformed)).text, /0,75|75/);
});
test('external selected instrument explains missing history without a bank profile', async () => {
  for (const [language, question, expected] of [
    ['es', '¿Por qué no puedo simularlo?', /no tiene histórico disponible/i],
    ['en', "Why can't I simulate it?", /no available history/i],
  ] as const) {
    const external: TutorContext = { ...context, language, bank: undefined, instrument: { id: 'bbva-mi-inversion-bolsa', name: 'BBVA', currency: 'EUR', dataKind: 'missing_history', sources: [] } };
    const reply = await ask(question, external);
    assert.equal(reply.intent, 'bank_missing_history');
    assert.match(reply.text, expected);
    assert.doesNotMatch(reply.text, /0[,.]75|BancoT2F/i);
  }
});
test('missing context remains a safe fallback for simulation questions', async () => {
  for (const absent of [undefined, null]) for (const message of ["Why can't I simulate it?", '¿Por qué no puedo simularlo?']) {
    const reply = await createLocalTutorProvider().reply({ message, context: absent as unknown as TutorContext });
    assert.notEqual(reply.intent, 'bank_missing_history');
    assert.doesNotMatch(reply.text, /0[,.]75|BancoT2F|selected instrument has no available history|no tiene histórico disponible/i);
  }
});
test('English script and latest abstention retain scope', async () => {
  const c = { ...context, language: 'en' as const };
  assert.match((await ask('What is BancoT2F?', c)).text, /fictional/i);
  assert.match((await ask('What are the demo account terms?', c)).text, /maintenance.*0/i);
  const fee = await ask('How much does this fund cost?', c); assert.match(fee.text, /0\.75%/);
  assert.match((await ask('Is that deducted?', c, [{role:'assistant', text: fee.text, intent:fee.intent}])).text, /not deducted/i);
  assert.match((await ask('What am I seeing?', c)).text, /simulator/i);
  assert.match((await ask('Why can\'t I simulate it?', { ...c, instrument: { ...c.instrument!, dataKind:'missing_history' } })).text, /history/i);
  assert.match((await ask('What will I earn next year?', c)).text, /not available|predict/i);
  const refusal = await ask('How much does the Tesla fund cost?', c);
  assert.doesNotMatch(refusal.text, /0\.75/);
  const after = await ask('Is that deducted?', c, [{role:'assistant', text:fee.text, intent:fee.intent}, {role:'assistant', text:refusal.text, intent:refusal.intent}]);
  assert.doesNotMatch(after.text, /0\.75|75 basis/);
  assert.doesNotMatch((await ask('What is a fee?', c)).text, /0\.75/);
});
test('fees for stock remain unknown and external bank does not receive demo conditions', async () => {
  const stock = { ...context, instrument: { ...context.instrument!, product: bank.products.find((p: {instrumentId:string}) => p.instrumentId === 'demo-stock'), id:'demo-stock', name:'Acción Empresa ficticia' } };
  const reply = await ask('¿Cuánto cuesta esta acción?', stock);
  assert.match(reply.text, /anual corriente no está disponible/);
  assert.doesNotMatch(reply.text, /anual corriente: 0/);
  assert.doesNotMatch((await ask('¿Qué condiciones tiene la cuenta de BBVA?')).text, /0 EUR/);
  const external = { ...context, instrument: { ...context.instrument!, product: undefined, id: 'bbva', name: 'BBVA', dataKind:'missing_history' as const } };
  assert.doesNotMatch((await ask('¿Qué condiciones tiene la cuenta de BBVA?', external)).text, /0 EUR/);
  assert.doesNotMatch((await ask('¿Cuánto cuesta T2F Horizonte?')).text, /0,75/);
});
test('maintenance, external products, named banks and selected screen context', async () => {
  for (const page of ['home', 'explore'] as const) {
    const c = { ...context, page, language: 'en' as const };
    const maintenance = await ask('What is the maintenance fee of BancoT2F?', c);
    assert.match(maintenance.text, /maintenance.*0.*EUR|maintenance.*EUR.*0/i);
    assert.doesNotMatch(maintenance.text, /0\.75/);
    assert.match((await ask('¿Cuál es la comisión de mantenimiento de BancoT2F?', {...c, language:'es'})).text, /mantenimiento.*0 EUR/i);
  }
  const en = { ...context, page:'explore' as const, language:'en' as const };
  assert.match((await ask('Are all products from BancoT2F?', en)).text, /no\..*other institutions/i);
  assert.match((await ask('¿Todos los productos son de BancoT2F?', {...en,language:'es'})).text, /no\..*otras entidades/i);
  for (const name of ['BancoFantasma', 'Banco Fantasma', 'ExampleBankOther', 'OtherBank', 'BankOther']) {
    const reply = await ask(`What terms does ${name} have?`, en);
    assert.equal(reply.intent, 'unknown'); assert.doesNotMatch(reply.text, /maintenance|0 EUR|no real account/i);
  }
  assert.match((await ask('What am I seeing?', en)).text, /catalogue.*T2F Equilibrio/i);
  assert.doesNotMatch((await ask('What am I seeing?', {...en, page:'home'})).text, /Equilibrio/);
  assert.match((await ask('What am I seeing?', {...en, instrument:undefined})).text, /no .*selected/i);
  const conditions = await ask('What are the demo account terms?', en);
  assert.match(conditions.text, /EUR/i); assert.match(conditions.text, /minimum/i);
  assert.match((await ask('What are the terms of the bank?', en)).text, /maintenance/i);
  assert.equal((await ask('What terms does BBVA have?', {...en, instrument: {...en.instrument!, id:'bbva', name:'BBVA', dataKind:'missing_history', product:undefined}})).intent, 'unknown');
});
test('how much contributed and lost refer to the calculated result, not fees', async () => {
  const c: TutorContext = { ...context, language:'en', simulation: { kind:'fictional_monthly', initial:800, recurringContribution:100, contributionTiming:'month_start', periods:2, finalValue:900, totalContributed:1000, profit:-100, simpleReturnPercent:-10, instrumentReturnPercent:-10 } };
  for (const message of ['How much did I contribute?', 'How much did I lose?', 'How much is the simulation result?']) {
    const reply = await ask(message, c); assert.match(reply.text, /1,000/); assert.match(reply.text, /-100/);
  }
  for (const message of ['¿Cuánto he aportado?', '¿Cuál es el resultado de mi simulación?']) {
    const reply = await ask(message, {...c, language:'es'}); assert.match(reply.text, /1\.?000/);
  }
});
test('named fee requests never substitute the active product and generic plurals stay conceptual', async () => {
  const en = { ...context, language:'en' as const, instrument:{...context.instrument!, name:'T2F Balance'} };
  const activeEn = await ask('What are the fees for T2F Balance?', en);
  assert.equal(activeEn.intent, 'bank_fees'); assert.match(activeEn.text, /0\.75%/);
  const activeEs = await ask('¿Qué comisiones tiene T2F Equilibrio?');
  assert.equal(activeEs.intent, 'bank_fees'); assert.match(activeEs.text, /0,75%/);
  for (const [question, c] of [
    ['What are the fees for T2F Horizon?', en],
    ['What are the fees for UnknownProduct?', en],
    ['¿Qué comisiones tiene T2F Horizonte?', context],
    ['¿Qué comisiones tiene ProductoDesconocido?', context],
  ] as const) {
    const reply = await ask(question, c);
    assert.equal(reply.intent, 'unknown'); assert.doesNotMatch(reply.text, /0[,.]75|75 basis|75 puntos/i);
    const follow = await ask(c.language === 'en' ? 'Is that deducted?' : '¿Y eso está descontado?', c, [{role:'assistant', text: activeEn.text, intent:'bank_fees'}, {role:'assistant', text:reply.text, intent:reply.intent}]);
    assert.doesNotMatch(follow.text, /0[,.]75|75 basis|75 puntos/i);
  }
  for (const [question, c] of [['¿Qué son las comisiones?', context], ['¿Qué son comisiones?', context], ['What are fees?', en], ['What are the fees?', en]] as const) {
    const reply = await ask(question, c); assert.equal(reply.intent, 'costs'); assert.doesNotMatch(reply.text, /0[,.]75|75 basis|75 puntos/i);
  }
});
