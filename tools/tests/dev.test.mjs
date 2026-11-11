import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePort, validateHealth, validateCatalog } from '../dev.mjs';

test('ports reject invalid and non-integer values', () => {
  for (const value of ['0', '65536', '1.5', 'localhost', '-1', '']) assert.throws(() => validatePort(value));
  assert.equal(validatePort('8092'), 8092);
});
test('health contract is exact for demo mode', () => {
  assert.equal(validateHealth({status:'ok', mode:'demo', tutorProvider:'server_rules', speechProvider:'browser_local', speechKeyConfigured:false, externalProviders:false}), true);
  assert.equal(validateHealth({status:'ok', mode:'demo'}), false);
});
test('catalog requires version and all collections', () => {
  assert.equal(validateCatalog({schemaVersion:'1.0', banks:[], instruments:[], annualHistory:{}}), true);
  assert.equal(validateCatalog({schemaVersion:'1.0', banks:[], instruments:[]}), false);
});

test('health accepts a configured external analysis provider', () => {
  assert.equal(validateHealth({status:'ok',mode:'demo',tutorProvider:'anthropic',speechProvider:'elevenlabs',speechKeyConfigured:true,externalProviders:true}), true);
  assert.equal(validateHealth({status:'ok',mode:'demo',tutorProvider:'unknown',speechProvider:'elevenlabs',speechKeyConfigured:true,externalProviders:true}), false);
  assert.equal(validateHealth({status:'ok',mode:'demo',tutorProvider:'anthropic',speechProvider:'unknown',speechKeyConfigured:true,externalProviders:true}), false);
  assert.equal(validateHealth({status:'ok',mode:'demo',tutorProvider:'anthropic',speechProvider:'elevenlabs',speechKeyConfigured:'true',externalProviders:true}), false);
});
