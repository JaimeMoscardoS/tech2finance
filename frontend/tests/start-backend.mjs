import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const python = process.env.T2F_PYTHON || (process.platform === 'win32' ? `${root}/.venv/Scripts/python.exe` : `${root}/.venv/bin/python`);
if (!existsSync(python) && !process.env.T2F_PYTHON) throw new Error('Create the repository .venv and install backend requirements, or set T2F_PYTHON');
const child = spawn(python, ['-m','uvicorn','backend.app:app','--host','127.0.0.1','--port',process.env.T2F_BACKEND_PORT || '8111'], {cwd:root,stdio:'inherit'});
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
