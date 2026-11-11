import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import data from '../../shared/demo-data.json' with {type:'json'};
import navHistory from '../../shared/nav-history.json' with {type:'json'};
import { scopeCatalog } from './bank-scope.ts';
import type { Catalog } from './server-api.ts';
const catalog = {...data, navHistory} as unknown as Catalog;
test('host exposes only its explicitly allowed study cases, preserving real issuers', () => {
 const scoped = scopeCatalog(catalog,'demo');
 assert.deepEqual(scoped.instruments.map(i=>i.instrumentId), catalog.demoStudyInstrumentIds);
 assert.ok(scoped.instruments.every(i=>i.bankId !== 'demo'));
 assert.ok(new Set(scoped.instruments.map(i=>i.bankId)).size > 1);
});
test('issuer scope filters its own products and unknown banks fail', () => {
 const scoped=scopeCatalog(catalog,'caixabank');
 assert.ok(scoped.instruments.length > 0);
 assert.ok(scoped.instruments.every(i=>i.bankId==='caixabank'));
 assert.throws(()=>scopeCatalog(catalog,'unknown'));
});
test('a case without distribution eligibility is unavailable', () => {
 const modified = structuredClone(catalog);
 const first = modified.instruments.find(i => i.instrumentId === modified.demoStudyInstrumentIds[0])!;
 modified.navHistory.instruments.find(h => h.isin === first.identifier)!.eligible = false;
 assert.equal(scopeCatalog(modified, 'demo').instruments.find(i => i.instrumentId === first.instrumentId)?.dataStatus, 'unsupported_distributions');
});
