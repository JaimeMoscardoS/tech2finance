import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
export function validatePort(value) {
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw new Error(`Puerto inválido: ${value}`);
  return Number(value);
}
export const validateHealth = x => x?.status === 'ok' && x?.mode === 'demo' && x?.tutorProvider === 'server_rules' && x?.externalProviders === false;
export const validateCatalog = x => typeof x?.schemaVersion === 'string' && Array.isArray(x?.banks) && Array.isArray(x?.instruments) && x?.annualHistory !== null && typeof x?.annualHistory === 'object' && !Array.isArray(x.annualHistory);
export function checkPort(port) {
  return new Promise((yes, no) => {
    const server = createServer();
    server.once('error', () => no(new Error(`Puerto ${port} ocupado o no disponible en 127.0.0.1; elige otro con T2F_*_PORT.`)));
    server.listen(port, '127.0.0.1', () => server.close(yes));
  });
}
export async function waitForContracts(port, timeout = 30000, signal) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (signal?.aborted) return;
    try {
      const responses = await Promise.all(['/api/health', '/api/catalog'].map(path => fetch(`http://127.0.0.1:${port}${path}`, {signal: AbortSignal.timeout(1000)})));
      if (responses.every(r => r.ok && (r.headers.get('content-type') || '').includes('application/json'))) {
        const [health, catalog] = await Promise.all(responses.map(r => r.json()));
        if (validateHealth(health) && validateCatalog(catalog)) return;
      }
    } catch { /* Service is still starting or proxy is unavailable. */ }
    await delay(200);
  }
  throw new Error(`Tiempo agotado: health/catalog no cumplen el contrato a través de 127.0.0.1:${port}. Revisa dependencias y servidor.`);
}
export async function main(options = {}) {
  if (process.argv.includes('--help')) { console.log('npm run dev:full -- [--help]\nRequiere Node >= 22.12, frontend/npm ci y .venv con backend/requirements.txt. T2F_PYTHON permite elegir Python; T2F_BACKEND_PORT y T2F_FRONTEND_PORT eligen puertos loopback. Ctrl+C detiene ambos.'); return; }
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error('Se requiere Node.js >= 22.12.');
  const backendPort = validatePort(process.env.T2F_BACKEND_PORT ?? '8000');
  const frontendPort = validatePort(process.env.T2F_FRONTEND_PORT ?? '5173');
  if (backendPort === frontendPort) throw new Error('Los puertos de backend y frontend deben ser distintos.');
  const python = process.env.T2F_PYTHON || resolve(root, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
  const vite = resolve(root, 'frontend/node_modules/vite/bin/vite.js');
  if (!existsSync(python)) throw new Error('No se encuentra Python del entorno virtual. Crea .venv e instala backend/requirements.txt o define T2F_PYTHON.');
  if (!existsSync(vite)) throw new Error('Faltan dependencias frontend: ejecuta npm ci en frontend.');
  await checkPort(backendPort); await checkPort(frontendPort);
  const children = [];
  let stopping = false;
  let rejectFailure;
  const failure = new Promise((_, reject) => { rejectFailure = reject; });
  const launch = (name, command, args, env = process.env, cwd = root) => {
    const child = (options.spawnProcess ?? spawn)(command, args, {cwd, env, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true, detached: process.platform !== 'win32'});
    let stderr = '';
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-2048); });
    const diagnostic = () => stderr.replace(/https?:\/\/\S+/g, '[URL]').replace(/(?:[A-Za-z]:)?[\\/][^\s:]+/g, '[ruta]').replace(/(token|secret|password|key)\s*[=:]\s*\S+/gi, '$1=[oculto]').slice(-1000);
    children.push(child);
    child.once('error', err => { if (!stopping) { const code = ['ENOENT', 'EACCES', 'EPERM'].includes(err.code) ? err.code : 'SPAWN_ERROR'; rejectFailure(new Error(`${name} no arrancó (${code}). Comprueba el ejecutable y sus permisos.`)); } });
    child.once('exit', (code, signal) => { if (!stopping) rejectFailure(new Error(`${name} terminó inesperadamente (código ${code}, señal ${signal}). Comprueba backend con Python -m uvicorn backend.app:app y frontend con npm run dev; revisa dependencias y puertos. ${diagnostic()}`)); });
  };
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await Promise.all(children.map(child => new Promise(done => {
      if (child.exitCode !== null || child.signalCode !== null || !child.pid) return done();
      if (options.stopChild) { options.stopChild(child); return done(); }
      const kill = signal => { try { if (process.platform === 'win32') execFile('taskkill', ['/PID', String(child.pid), '/T', '/F'], {windowsHide:true}, () => {}); else process.kill(-child.pid, signal); } catch {} };
      const timer = setTimeout(() => kill('SIGKILL'), 3000);
      const deadline = setTimeout(() => { console.error(`No se pudo detener el proceso ${child.pid}; revisa ese PID y sus descendientes.`); process.exitCode = 1; done(); }, 6000);
      child.once('exit', () => { clearTimeout(timer); clearTimeout(deadline); done(); });
      kill('SIGTERM');
    })));
  };
  let signalResolve;
  const interrupted = new Promise(resolveSignal => { signalResolve = resolveSignal; });
  const onSignal = () => signalResolve('signal');
  process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal);
  const cancellation = new AbortController();
  try {
    launch('Backend', python, ['-m', 'uvicorn', 'backend.app:app', '--host', '127.0.0.1', '--port', String(backendPort)]);
    launch('Frontend', process.execPath, [vite, '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], {...process.env, T2F_BACKEND_PORT: String(backendPort)}, resolve(root, 'frontend'));
    const initial = await Promise.race([Promise.all([(options.probe ?? waitForContracts)(backendPort, 30000, cancellation.signal), (options.probe ?? waitForContracts)(frontendPort, 30000, cancellation.signal)]), failure, interrupted]);
    if (initial !== 'signal') {
      console.log(`Listo: http://127.0.0.1:${frontendPort} (API proxy verificada). Ctrl+C para detener.`);
      await Promise.race([failure, interrupted]);
    }
  } finally {
    cancellation.abort();
    await stop();
    process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(err => { console.error(err.message); process.exitCode = 1; });
