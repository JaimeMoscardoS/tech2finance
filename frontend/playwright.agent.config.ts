import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests', testMatch:'agent-conversation.spec.ts', outputDir:'./test-results/agent', use:{baseURL:'http://127.0.0.1:5208', channel:'chrome', headless:true}, webServer:[
 {command:'node tests/start-backend.mjs', url:'http://127.0.0.1:8111/api/health', reuseExistingServer:true, timeout:30000},
 {command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5208 --strictPort', url:'http://127.0.0.1:5208', reuseExistingServer:false, timeout:30000},
]});
