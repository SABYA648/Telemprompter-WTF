import { expect, test } from '@playwright/test';

test('GA stays absent before consent and after declining', async ({ page }) => {
  const gaRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com')) gaRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Optional analytics' })).toBeVisible();
  await page.getByLabel('Teleprompter script').fill('No analytics before consent.');
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.waitForTimeout(400);
  expect(gaRequests).toEqual([]);
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.waitForTimeout(250);
  expect(gaRequests).toEqual([]);
});

test('GA is requested only after explicit allow', async ({ page }) => {
  const gaRequests: string[] = [];
  await page.route('https://www.googletagmanager.com/**', async (route) => {
    gaRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto('/');
  expect(gaRequests).toEqual([]);
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => gaRequests.length).toBe(1);
  expect(gaRequests[0]).toContain('G-TEST123');
});

test('declining keeps optional analytics absent', async ({ page }) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    if (/googletagmanager/.test(request.url())) thirdPartyRequests.push(request.url());
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

test('GA interface and network request are absent when no measurement ID exists', async ({
  page,
}) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'The Docker E2E image includes test IDs.');
  const gaRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('google')) gaRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:48172/');
  await expect(page.getByRole('heading', { name: 'Free online teleprompter' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Allow analytics' })).toHaveCount(0);
  await expect(page.locator('script[data-teleprompter-analytics]')).toHaveCount(0);
  expect(gaRequests).toEqual([]);
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
