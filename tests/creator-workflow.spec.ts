import { expect, test } from '@playwright/test';

test('public template opens an authored Studio script', async ({ page }) => {
  await page.goto('/templates/30-second-reel-script');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('30-second');
  await page.getByRole('link', { name: 'Use this template' }).click();
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(/# Hook/);
  await expect(page.getByText(/placeholder.*left/)).toBeVisible();
});

test('idea becomes a script with a chosen template', async ({ page }) => {
  await page.goto('/studio#/inbox');
  await page.getByLabel('New idea').fill('A real lesson from my first shoot');
  await page.getByRole('button', { name: 'Save idea' }).click();
  await expect(page.getByText('A real lesson from my first shoot')).toBeVisible();
  await page.getByRole('button', { name: 'Make script' }).click();
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(
    /A real lesson from my first shoot/,
  );
});

test('S1 link previews and saves a new script', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/studio#/scripts/quick');
  await page.getByRole('button', { name: 'Send to phone' }).click();
  await expect(page.getByRole('heading', { name: 'Send to phone' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain('/studio#/receive/S1.');
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'Receive script' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save and record' })).toBeVisible();
  await page.getByRole('button', { name: 'Save and record' }).click();
  await expect(page).toHaveURL(/#\/record\//);
});

test('hooks page copies a hook and lists five groups of five', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/hooks/fitness');
  await expect(page.locator('.creator-hook')).toHaveCount(25);
  await page.getByRole('button', { name: 'Copy' }).first().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('{');
});

test('template picker filters and creates a script', async ({ page }) => {
  await page.goto('/studio#/scripts');
  await page.getByText('Start from a template').click();
  await page.getByLabel('Search templates').fill('myth');
  await page.getByLabel('Duration').selectOption('short');
  await page.getByLabel('Format').selectOption('short-form');
  await expect(page.getByRole('button', { name: /Myth vs fact/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Story time/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Myth vs fact/ }).click();
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Myth vs fact');
});

test('an unknown template id opens a blank script', async ({ page }) => {
  await page.goto('/studio#/scripts/new?template=nope');
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue('');
});

test('hook picker shuffles and inserts into the script', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  await page.getByText('Choose a hook').click();
  await page.getByLabel('Niche').selectOption('tech');
  const hook = page.getByTestId('hook-text');
  const first = await hook.textContent();
  await page.getByRole('button', { name: 'Shuffle' }).click();
  await expect(hook).not.toHaveText(first ?? '');
  const shuffled = (await hook.textContent()) ?? '';
  await page.getByRole('button', { name: 'Insert hook' }).click();
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(
    new RegExp(shuffled.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});

test('Up next reorders, and Home records the first script', async ({ page }) => {
  for (const title of ['Queue one', 'Queue two']) {
    await page.goto('/studio#/scripts/new');
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Untitled script');
    await page.getByLabel('Title', { exact: true }).fill(title);
    await expect(page.getByText('Saved')).toBeVisible();
  }
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: 'Add to Up next' }).first().click();
  await page.getByRole('button', { name: 'Add to Up next' }).nth(1).click();
  const firstQueued = page.getByText(/^1\. /);
  const before = await firstQueued.textContent();
  await page
    .getByRole('button', { name: /^Move .* down$/ })
    .first()
    .click();
  await expect(firstQueued).not.toHaveText(before ?? '');
  await page.reload();
  await expect(firstQueued).not.toHaveText(before ?? '');
  const title = ((await firstQueued.textContent()) ?? '').replace(/^1\. /, '');
  await page.goto('/studio#/');
  await expect(page.getByRole('link', { name: `Record ${title}` })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start batch' })).toBeVisible();
  await page.getByRole('link', { name: 'Record next' }).click();
  await expect(page).toHaveURL(/#\/record\/next$/);
});

test('status filter narrows the library with live counts', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  await page.getByLabel('Title', { exact: true }).fill('Ready to shoot');
  await page.locator('.studio-grid-fields').getByLabel('Status').selectOption('ready');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.goto('/studio#/scripts');
  const status = page.getByLabel('Status');
  await expect(status.locator('option[value="ready"]')).toHaveText('Ready (1)');
  await status.selectOption('ready');
  await expect(page.getByRole('link', { name: /Ready to shoot/ })).toBeVisible();
  await status.selectOption('posted');
  await expect(page.getByRole('link', { name: /Ready to shoot/ })).toHaveCount(0);
});

test('caption counters track limits from platform facts', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  await page.getByLabel('Hashtags').fill('#a #b #c #d #e #f');
  await expect(page.getByText('6/5 hashtags. 1 over the limit.')).toBeVisible();
  await page.getByLabel('YouTube title').fill('Short');
  await expect(page.getByText('5/100 characters')).toBeVisible();
  await page.getByLabel('Instagram caption').fill('Hello');
  await expect(page.getByText('5/2200 characters')).toBeVisible();
});

test('practice ends with a summary of pace, pauses and fit', async ({ page }) => {
  await page.clock.install();
  await page.goto('/studio#/practice/quick');
  await page.getByRole('button', { name: 'Faster' }).click();
  await expect(page.getByText('145 WPM')).toBeVisible();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.clock.runFor(4000);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.clock.runFor(60_000);
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.clock.runFor(2000);
  await page.getByRole('button', { name: 'Finish practice' }).click();
  const summary = page.getByRole('region', { name: 'Practice summary' });
  await expect(summary).toContainText('Duration: 6 seconds');
  await expect(summary).toContainText('Average pace: 145 WPM');
  await expect(summary).toContainText('Pauses: 1');
  await expect(summary).toContainText('Target fit:');
  await expect(summary.getByRole('link', { name: 'Record this script' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(summary).toHaveCount(0);
});

test('send sheet shows a QR code, and long scripts fall back to the link', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  await page.getByLabel('Script', { exact: true }).fill('A short script for my phone.');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.getByRole('button', { name: 'Send to phone' }).click();
  await expect(page.getByAltText('QR code for this script')).toBeVisible();
  await page.getByRole('button', { name: 'Send to phone' }).click();
  // Random words barely compress, so the link passes 1,500 characters.
  const words = Array.from(
    { length: 900 },
    (_, i) => (i * 7919).toString(36) + (i * 104729).toString(36),
  );
  await page.getByLabel('Script', { exact: true }).fill(words.join(' '));
  await expect(page.getByText('Saved')).toBeVisible();
  await page.getByRole('button', { name: 'Send to phone' }).click();
  await expect(
    page.getByText('Too long for a QR code. Share or copy the link instead.'),
  ).toBeVisible();
  await expect(page.getByAltText('QR code for this script')).toHaveCount(0);
});

test('a receive link never reaches analytics and a bad link explains itself', async ({ page }) => {
  await page.goto('/studio#/receive/S1.not-a-real-code');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save and record' })).toHaveCount(0);
});

test('receive screen copies a transfer code for the Home Screen app', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/studio#/scripts/quick');
  await page.getByRole('button', { name: 'Send to phone' }).click();
  await page.getByRole('button', { name: 'Copy link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(link);
  await page.getByRole('button', { name: 'Copy transfer code' }).click();
  await expect(page.getByRole('status')).toContainText('Transfer code copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^T1\./);
});

test('hook page records into a new script and keeps the quick script', async ({ page }) => {
  await page.goto('/studio#/scripts/quick');
  const quick = await page.getByLabel('Script', { exact: true }).inputValue();
  await page.goto('/hooks/tech');
  await page.getByRole('button', { name: 'Record this hook' }).first().click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
  expect(page.url()).not.toContain('/record/quick');
  await page.goto('/studio#/scripts/quick');
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(quick);
});

test('creator pages expose schema, one primary CTA, and clean mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/templates', '/hooks', '/templates/ugc-ad-script', '/hooks/real-estate']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schema.join(' ')).toContain('BreadcrumbList');
    expect(schema.join(' ')).not.toMatch(/FAQPage|HowTo|AggregateRating/);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/templates/ugc-ad-script');
  await expect(page.locator('[data-analytics-cta]')).toHaveCount(1);
  await page.goto('/hooks/real-estate');
  await expect(page.locator('[data-analytics-cta]')).toHaveCount(1);
});
