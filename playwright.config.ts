import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Runs against the static web export (`npm run build:web`) at a standard and a small phone size.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    // Optional installed-browser fallback; no browser download is needed.
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'small-phone', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 667 } } },
  ],
  webServer: {
    command: `node e2e/serve.mjs dist ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
  },
});
