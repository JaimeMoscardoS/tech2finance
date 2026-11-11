import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://127.0.0.1:5175', channel: 'chrome', headless: true }, webServer: [
  { command: 'node tests/start-backend.mjs', url: 'http://127.0.0.1:8000/api/health', reuseExistingServer: true, timeout: 30000 },
  { command: 'node tests/start-vite.mjs caixabank 5177', url: 'http://127.0.0.1:5177', reuseExistingServer: false, timeout: 30000 },
  { command: 'node tests/start-vite.mjs bbva 5179', url: 'http://127.0.0.1:5179', reuseExistingServer: false, timeout: 30000 },
  { command: 'node tests/start-vite.mjs unknown 5178', url: 'http://127.0.0.1:5178', reuseExistingServer: false, timeout: 30000 },
  { command: 'node tests/start-vite.mjs demo 5175', url: 'http://127.0.0.1:5175', reuseExistingServer: false, timeout: 30000 },
] });
