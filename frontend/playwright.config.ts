import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://127.0.0.1:5175', channel: 'chrome', headless: true }, webServer: [
  { command: 'node tests/start-backend.mjs', url: 'http://127.0.0.1:8000/api/health', reuseExistingServer: true, timeout: 30000 },
  { command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: false, timeout: 30000 },
] });
