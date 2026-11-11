import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../../shared/demo-data.json' with {type:'json'};
import { isBankProfile } from './bank-validation.ts';
test('accepts the host without product terms and rejects malformed host or invented products', () => {
 assert.equal(isBankProfile(data.bankProfile,data.instruments),true);
 for (const mutate of [
  (p:any)=>{p.products.push({instrumentId:'invented'});},
  (p:any)=>{p.faq.pop();},
  (p:any)=>{p.source.asOf='unknown';},
  (p:any)=>{p.conditions.realOrdersAvailable=true;},
 ]) { const profile=structuredClone(data.bankProfile); mutate(profile); assert.equal(isBankProfile(profile,data.instruments),false); }
});
