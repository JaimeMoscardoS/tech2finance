import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../../shared/demo-data.json' with { type: 'json' };
import { isBankProfile } from './bank-validation.ts';

test('accepts the shared bank profile and rejects malformed or mismatched data', () => {
 assert.equal(isBankProfile(data.bankProfile, data.instruments), true);
 for (const mutate of [
  (p: any) => { p.products[0].fees.annualOngoingBps = -1; },
  (p: any) => { p.products[0].fees.entryBps = Infinity; },
  (p: any) => { p.products[0].instrumentId = 'bbva-mi-inversion-bolsa'; },
  (p: any) => { p.products[0].instrumentId = p.products[1].instrumentId; },
  (p: any) => { p.faq.pop(); },
  (p: any) => { p.source.asOf = 'unknown'; },
  (p: any) => { p.conditions.realOrdersAvailable = true; },
 ]) {
  const profile = structuredClone(data.bankProfile);
  mutate(profile);
  assert.equal(isBankProfile(profile, data.instruments), false);
 }
});
