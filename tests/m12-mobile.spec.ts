import { expect, test, type Page } from '@playwright/test';

// M12: one current tab on every route, and at most one accent (primary) action per screen.
const ROUTES = [
  ['#/', 'Home'],
  ['#/inbox', 'Home'],
  ['#/challenge', 'Home'],
  ['#/scripts', 'Scripts'],
  ['#/scripts/quick', 'Scripts'],
  ['#/batch', 'Scripts'],
  ['#/receive/S1.not-a-real-code', 'Scripts'],
  ['#/record/quick', 'Record'],
  ['#/practice/quick', 'Record'],
  ['#/takes', 'Takes'],
  ['#/takes/missing', 'Takes'],
  ['#/settings', 'Settings'],
  ['#/settings/camera', 'Settings'],
  ['#/settings/habit', 'Settings'],
] as const;

/** Visible controls filled with the accent, outside the tab bar's record button and row record buttons. */
const accentActions = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('a, button, summary, [role="button"]')]
      .filter((el) => !el.closest('.studio-tabs') && !el.matches('.studio-round-action'))
      .filter((el) => el.checkVisibility({ visibilityProperty: true }))
      .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(240, 71, 42)')
      .map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim()),
  );

const currentItems = (page: Page) =>
  page.getByRole('navigation', { name: 'Studio navigation' }).locator('[aria-current]');

test('every route marks exactly one tab and shows at most one accent action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [hash, tab] of ROUTES) {
    await page.goto(`/studio${hash}`);
    await expect(page.locator('h1').first()).toBeVisible();
    // Today's prompt and other Home content load after the first paint.
    await page.waitForTimeout(300);
    await expect(currentItems(page), hash).toHaveCount(1);
    await expect(currentItems(page), hash).toHaveText(tab);
    await expect(page.locator('.studio-tabs .is-active'), hash).toHaveCount(1);
    const accents = await accentActions(page);
    expect(accents.length, `${hash}: ${accents.join(', ')}`).toBeLessThanOrEqual(1);
  }
});

test('a returning Home keeps one accent action with a badge and an ask on screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Title', { exact: true }).fill('Back again');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['kv', 'takes'], 'readwrite');
    tx.objectStore('kv').put(['first_take'], 'badges');
    tx.objectStore('kv').put(['first_take'], 'badges.unseen');
    tx.objectStore('takes').put({
      id: 'seed-m12',
      scriptId: 'quick',
      kept: true,
      durationMs: 30000,
      wordsRead: 70,
      createdAt: Date.now(),
      exportedAt: null,
    });
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.goto('/studio#/');
  await expect(page.getByRole('status', { name: 'Badge unlocked' })).toBeVisible();
  await expect(page.getByRole('region', { name: "Today's prompt" })).toBeVisible();
  expect(await accentActions(page)).toEqual(['Record this']);
  // Progress is a sentence, not a grid of zeros.
  const progress = page.getByRole('region', { name: 'Your progress' });
  await expect(progress).toContainText('1 take');
  await expect(progress).not.toContainText('0 min');
});

test('first-run progress is one encouraging line, never a grid of zeros', async ({ page }) => {
  await page.goto('/studio');
  const progress = page.getByRole('region', { name: 'Your progress' });
  await expect(progress).toContainText('Your first take starts your progress.');
  await expect(progress.locator('dl, dd')).toHaveCount(0);
});

test('the permission screen leads with the camera frame and one Allow action', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/studio#/record/quick');
  const allow = page.getByRole('button', { name: 'Allow camera' });
  await expect(allow).toBeVisible();
  await expect(page.getByText('Saved on your device. Nothing uploaded.')).toBeVisible();
  // The action sits in the bottom third, above the tab bar, and Not now is a quiet link.
  const box = (await allow.boundingBox())!;
  expect(box.y).toBeGreaterThan(780 * 0.6);
  await expect(page.getByRole('link', { name: 'Not now' })).not.toHaveClass(/studio-button/);
  expect(await accentActions(page)).toEqual(['Allow camera']);
});
