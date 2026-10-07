import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Runs against the static web export (`npm run build:web`) at phone size.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'phone-chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `node e2e/serve.mjs dist ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
  },
});
