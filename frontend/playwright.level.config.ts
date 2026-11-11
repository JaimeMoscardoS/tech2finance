import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "level-selector.spec.ts",
  use: { baseURL: "http://127.0.0.1:5197", channel: "chrome", headless: true },
  webServer: { command: "npx vite --host 127.0.0.1 --port 5197 --strictPort", url: "http://127.0.0.1:5197", reuseExistingServer: false, timeout: 30000 },
});
