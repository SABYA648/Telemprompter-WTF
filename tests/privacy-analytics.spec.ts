import { expect, test } from '@playwright/test';

test('analytics stay absent before consent and after declining', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (/googletagmanager\.com|analytics\.sabya\.pm/.test(request.url())) {
      analyticsRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Optional analytics' })).toBeVisible();
  await page.getByLabel('Teleprompter script').fill('No analytics before consent.');
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.waitForTimeout(400);
  expect(analyticsRequests).toEqual([]);
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.waitForTimeout(250);
  expect(analyticsRequests).toEqual([]);
});

test('GA is requested only after explicit allow', async ({ page }) => {
  const gaRequests: string[] = [];
  await page.route('https://www.googletagmanager.com/**', async (route) => {
    gaRequests.push(route.request().url());
    await route.abort();
  });
  await page.route('https://analytics.sabya.pm/**', async (route) => {
    await route.abort();
  });
  await page.goto('/');
  expect(gaRequests).toEqual([]);
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => gaRequests.length).toBe(1);
  expect(gaRequests[0]).toContain('G-TEST123');
});

test('Umami is requested only after explicit allow', async ({ page }) => {
  const umamiRequests: string[] = [];
  await page.route('https://analytics.sabya.pm/**', async (route) => {
    umamiRequests.push(route.request().url());
    await route.abort();
  });
  await page.route('https://www.googletagmanager.com/**', async (route) => {
    await route.abort();
  });
  await page.goto('/');
  expect(umamiRequests).toEqual([]);
  await expect(page.locator('script[data-teleprompter-analytics="umami"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => umamiRequests.length).toBeGreaterThan(0);
  expect(umamiRequests[0]).toContain('https://analytics.sabya.pm/script.js');
  await expect(page.locator('script[data-teleprompter-analytics="umami"]')).toHaveAttribute(
    'data-website-id',
    'c5952a2b-b192-46fe-8a3d-04ad673ffd6d',
  );
});

test('declining keeps optional analytics absent', async ({ page }) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    if (/googletagmanager|analytics\.sabya\.pm/.test(request.url())) {
      thirdPartyRequests.push(request.url());
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.waitForTimeout(250);
  expect(thirdPartyRequests).toEqual([]);
});

test('no Microsoft Clarity integration remains', async ({ page }) => {
  const clarityRequests: string[] = [];
  page.on('request', (request) => {
    if (/clarity\.ms|c\.bing\.com/.test(request.url())) clarityRequests.push(request.url());
  });
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
  await page.route('https://analytics.sabya.pm/**', (route) => route.abort());
  await page.goto('/');
  await page.getByLabel('Teleprompter script').fill('Clarity is gone from this build.');
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await page.waitForTimeout(400);
  expect(clarityRequests).toEqual([]);
  await expect(page.locator('[data-clarity-mask]')).toHaveCount(0);
});

test('analytics stays dormant until consent even with a configured measurement ID', async ({
  page,
}) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'The Docker E2E image includes test IDs.');
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (/google|analytics\.sabya\.pm/.test(request.url())) analyticsRequests.push(request.url());
  });
  // Umami is configured by default (website ID and script URL are baked into the build),
  // so the consent control is always offered. The fail-closed guarantee is that no
  // analytics script loads and no request leaves the browser before an explicit opt-in.
  await page.route('https://analytics.sabya.pm/**', (route) => route.abort());
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
  await page.goto('http://127.0.0.1:48172/');
  await expect(
    page.getByRole('heading', { name: 'Free online teleprompter that follows your pace' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Allow analytics' })).toBeVisible();
  await expect(page.locator('script[data-teleprompter-analytics]')).toHaveCount(0);
  expect(analyticsRequests).toEqual([]);
});

test('private script canary never enters an outgoing request', async ({ page }) => {
  const canary = 'SCRIPT_SECRET_CANARY_74fd9a52c861';
  const outgoing: string[] = [];
  page.on('request', (request) => {
    outgoing.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`);
  });
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
  await page.getByLabel('Teleprompter script').fill(`${canary}\n\nOnly local words.`);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  expect(outgoing.join('\n')).not.toContain(canary);
});

test('voice canary never enters an outgoing request', async ({ page }) => {
  const canary = 'VOICE_SECRET_CANARY_28ac6e194bf0';
  const outgoing: string[] = [];
  page.on('request', (request) => {
    outgoing.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`);
  });
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
  await page.getByLabel('Teleprompter script').fill(`${canary} stays local.`);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  expect(outgoing.join('\n')).not.toContain(canary);
});
