import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1';

/**
 * Playwright E2E configuration
 *
 * Run: pnpm test:e2e
 * Run with UI: pnpm test:e2e --ui
 * Install browsers: npx playwright install chromium
 *
 * In CI, `next start` is used (requires `pnpm build` first in the CI job).
 * Locally, `next dev` is used for faster iteration with HMR.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? 'github' : 'list',
  timeout: 60_000,

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: skipWebServer
    ? undefined
    : {
        // CI uses production build for realistic behavior; local uses dev for HMR.
        // CI job must run `pnpm build` before `pnpm test:e2e`.
        command: isCI ? 'next start --port 3001' : 'next dev --port 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
