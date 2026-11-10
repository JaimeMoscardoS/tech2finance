import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { main } from '../dev.mjs';
const freePort = () => new Promise(resolve => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const tick = () => new Promise(r => setTimeout(r, 50));
async function harness(probe) {
  process.env.T2F_PYTHON = process.execPath;
  process.env.T2F_BACKEND_PORT = String(await freePort());
  process.env.T2F_FRONTEND_PORT = String(await freePort());
  const children = [], stopped = [], logs = [];
  const original = console.log; console.log = value => logs.push(value);
  const result = main({probe, spawnProcess() { const child = new EventEmitter(); Object.assign(child, {pid:children.length+1, exitCode:null, signalCode:null, stderr:new EventEmitter()}); children.push(child); return child; }, stopChild(child) { stopped.push(child.pid); }}).finally(() => { console.log = original; });
  while (children.length < 2) await tick();
  return {children, stopped, logs, result};
}
const never = () => new Promise(() => {});
test('child failure before readiness stops both without announcing ready', async () => {
  const h = await harness(never); h.children[0].exitCode = 1; h.children[0].emit('exit', 1, null);
  await assert.rejects(h.result, /terminó inesperadamente/); assert.deepEqual(h.stopped, [2]); assert.equal(h.logs.length, 0);
});
test('child failure after readiness stops both and reports error', async () => {
  const h = await harness(async () => {}); await tick(); assert.equal(h.logs.length, 1); h.children[1].exitCode = 1; h.children[1].emit('exit', 1, null);
  await assert.rejects(h.result, /terminó inesperadamente/); assert.deepEqual(h.stopped, [1]);
});
for (const [name, probe] of [['before', never], ['after', async () => {}]]) test(`SIGINT ${name} readiness stops both`, async () => {
  const h = await harness(probe); await tick(); process.emit('SIGINT'); await h.result;
  assert.deepEqual(h.stopped, [1,2]); assert.equal(h.logs.length, name === 'after' ? 1 : 0);
});

test('spawn error does not expose executable path or secret', async () => {
  const h = await harness(never);
  const error = Object.assign(new Error('spawn C:\\Users\\private-user\\token=secret ENOENT'), {code:'ENOENT'});
  h.children[0].pid = undefined;
  h.children[0].emit('error', error);
  await assert.rejects(h.result, e => /ENOENT/.test(e.message) && !/private-user|secret/.test(e.message));
  assert.deepEqual(h.stopped, [2]);
});
