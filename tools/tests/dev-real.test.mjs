import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { main, checkPort } from '../dev.mjs';

const freePort = () => new Promise(resolve => { const server = createServer().listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
const fixture = `const http = require('node:http'); http.createServer((req,res) => { res.setHeader('content-type','application/json'); res.end(JSON.stringify(req.url.endsWith('health') ? {status:'ok',mode:'demo',tutorProvider:'server_rules',externalProviders:false} : {schemaVersion:'1.0',banks:[],instruments:[],annualHistory:{}})); }).listen(Number(process.argv[1]),'127.0.0.1');`;

test('real child failure stops other service and frees both ports', {timeout: 15000}, async () => {
  const ports = [await freePort(), await freePort()];
  process.env.T2F_PYTHON = process.execPath;
  [process.env.T2F_BACKEND_PORT, process.env.T2F_FRONTEND_PORT] = ports.map(String);
  const children = [];
  let markReady; const ready = new Promise(resolve => { markReady = resolve; });
  const log = console.log; console.log = () => markReady();
  try {
    const finished = main({spawnProcess(_command, _args, opts) { const child = spawn(process.execPath, ['-e', fixture, String(ports[children.length])], opts); children.push(child); return child; }}).then(() => null, error => error);
    await Promise.race([ready, finished.then(error => { throw error || new Error('Stopped before ready'); })]);
    children[0].kill();
    const error = await finished;
    assert.match(error.message, /terminó inesperadamente/);
    await Promise.all(ports.map(checkPort));
    assert.notEqual(children[1].exitCode === null && children[1].signalCode === null, true);
  } finally { console.log = log; }
});
