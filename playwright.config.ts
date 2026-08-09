import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:48171',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: [
          {
            command: 'npx serve dist-ga --listen tcp://127.0.0.1:48171 --no-clipboard',
            url: 'http://127.0.0.1:48171',
            reuseExistingServer: false,
            timeout: 120_000,
          },
          {
            command: 'npx serve dist --listen tcp://127.0.0.1:48172 --no-clipboard',
            url: 'http://127.0.0.1:48172',
            reuseExistingServer: false,
            timeout: 120_000,
          },
        ],
      }),
});
