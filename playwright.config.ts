import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e/web',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:8096',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run export:web && python3 -m http.server 8096 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:8096',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
