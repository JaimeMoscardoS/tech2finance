import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { checkPort, waitForContracts } from '../dev.mjs';

const serve = handler => new Promise(resolve => { const server = http.createServer(handler).listen(0, '127.0.0.1', () => resolve(server)); });
const close = server => new Promise(resolve => server.close(resolve));
test('occupied port is rejected without affecting its owner', async () => {
  const server = await serve((_, res) => res.end('still alive'));
  try { await assert.rejects(checkPort(server.address().port), /ocupado/); assert.equal(await (await fetch(`http://127.0.0.1:${server.address().port}`)).text(), 'still alive'); }
  finally { await close(server); }
});
test('readiness validates both JSON responses via frontend port', async () => {
  let invalid = true;
  const server = await serve((req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(req.url.endsWith('health') ? {status:'ok', mode:'demo', tutorProvider:'server_rules', speechProvider:'browser_local', speechKeyConfigured:false, externalProviders:false} : {schemaVersion:'1.0', banks:[], instruments:[], ...(invalid ? {} : {annualHistory:{}})})); });
  try { await assert.rejects(waitForContracts(server.address().port, 250), /Tiempo agotado/); invalid = false; await waitForContracts(server.address().port, 1000); }
  finally { await close(server); }
});
test('readiness timeout is bounded when no server exists', async () => {
  const server = await serve((_, res) => res.end()); const port = server.address().port; await close(server);
  await assert.rejects(waitForContracts(port, 250), /Tiempo agotado/);
});
