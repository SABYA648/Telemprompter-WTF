import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Studio creates a script and persists it after reload', async ({ page }) => {
  await page.goto('/studio#/scripts');
  await expect(page.getByRole('heading', { name: 'Scripts' })).toBeVisible();
  await page.getByRole('button', { name: '+ Script' }).click();
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  await page.getByLabel('Title').fill('A persistent Studio script');
  await page.getByLabel('Script').fill('A few words for a stored script.');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByLabel('Title')).toHaveValue('A persistent Studio script');
  await expect(page.getByLabel('Script')).toHaveValue('A few words for a stored script.');
});

test('homepage Record video hands the classic script to Studio', async ({ page }) => {
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
  await page.getByLabel('Teleprompter script').fill('A handoff script from the homepage.');
  await page.getByRole('button', { name: 'Open Studio' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\/quick/);
  await page.getByRole('link', { name: 'Not now' }).click();
  await expect(page).toHaveURL(/\/studio#\/scripts\/quick/);
  await expect(page.getByLabel('Script')).toHaveValue('A handoff script from the homepage.');
});

test('console canary stays clean on site, Studio, a guide and a tool', async ({ page }) => {
  await page.route('https://analytics.sabya.pm/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.umami = { track() {}, identify() {} };',
    }),
  );
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of [
    '/',
    '/studio',
    '/guides/how-to-use-a-teleprompter',
    '/tools/words-to-minutes',
  ])
    await page.goto(path);
  expect(errors).toEqual([]);
});

test('Studio works at phone width and library search, delete, restore work', async ({ page }) => {
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  for (const [width, height] of [
    [390, 844],
    [360, 740],
    [768, 1024],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('navigation', { name: 'Studio navigation' })
    .getByRole('link', { name: 'Scripts' })
    .click();
  await expect(page.getByRole('heading', { name: 'Scripts' })).toBeVisible();
  await page.getByRole('button', { name: '+ Script' }).click();
  await page.getByLabel('Title').fill('Searchable story');
  await page.getByLabel('Script').fill('A body with unique content.');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.getByRole('link', { name: 'Scripts', exact: true }).first().click();
  await page.getByLabel('Search scripts').fill('unique content');
  await expect(page.getByText('Searchable story')).toBeVisible();
  await page.getByRole('button', { name: 'Delete Searchable story' }).click();
  await expect(page.getByRole('heading', { name: 'Recently deleted' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByText('Searchable story')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Searchable story')).toBeVisible();
});

test('Studio markup controls and stats update safely', async ({ page }) => {
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: '+ Script' }).click();
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  const body = page.getByRole('textbox', { name: 'Script', exact: true });
  await body.fill('# Intro\nHello **friend** [pause] {name}');
  await expect(page.getByText('3 spoken words')).toBeVisible();
  await expect(page.getByText('1 placeholder left')).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(body).toHaveValue(/\[pause\]/);
});

test('Studio home, library and editor pass accessibility scans', async ({ page }) => {
  for (const hash of ['#/', '#/scripts', '#/scripts/quick']) {
    await page.goto(`/studio${hash}`);
    await expect(page.locator('.studio-screen')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('deleting a just-edited script does not restore it on reload', async ({ page }) => {
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: '+ Script' }).click();
  await page.getByLabel('Title').fill('Delete immediately');
  await page.getByLabel('Script').fill('Unsaved words');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Scripts' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Recently deleted' })).toBeVisible();
  await expect(page.getByText('Delete immediately')).toBeVisible();
});
