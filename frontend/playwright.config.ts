import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://127.0.0.1:5193', channel: 'chrome', headless: true }, webServer: [
  { command: 'node tests/start-backend.mjs', url: 'http://127.0.0.1:8111/api/health', reuseExistingServer: true, timeout: 30000 },
  { command: 'node tests/start-vite.mjs caixabank 5194', url: 'http://127.0.0.1:5194', reuseExistingServer: false, timeout: 30000 },
  { command: 'node tests/start-vite.mjs bbva 5196', url: 'http://127.0.0.1:5196', reuseExistingServer: false, timeout: 30000 },
  { command: 'node tests/start-vite.mjs unknown 5195', url: 'http://127.0.0.1:5195', reuseExistingServer: false, timeout: 30000 },
  { command: 'node tests/start-vite.mjs demo 5193', url: 'http://127.0.0.1:5193', reuseExistingServer: false, timeout: 30000 },
] });
