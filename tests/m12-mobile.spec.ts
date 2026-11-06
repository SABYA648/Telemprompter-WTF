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

for (const viewport of [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
]) {
  test(`the editor's only accent action is the nav Record, clear of its row, at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/studio#/scripts/new');
    await page.getByLabel('Title', { exact: true }).fill('One record action');
    await page.getByLabel('Script', { exact: true }).fill('Only the nav records this.');
    await expect(page.getByText('Saved')).toBeVisible();
    const scriptId = page.url().split('#/scripts/')[1];
    const everyAccent = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, summary, [role="button"]')]
        .filter((el) => el.checkVisibility({ visibilityProperty: true }))
        .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(240, 71, 42)')
        .map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim()),
    );
    expect(everyAccent).toEqual(['Record this script']);
    const record = page
      .getByRole('navigation', { name: 'Studio navigation' })
      .getByRole('link', { name: 'Record this script' });
    await expect(record).toHaveAttribute('href', `#/record/${scriptId}`);
    const actions = page.locator('.studio-editor__actions');
    await expect(actions.getByRole('link', { name: 'Record' })).toHaveCount(0);
    const practice = (await actions.getByRole('link', { name: 'Practice' }).boundingBox())!;
    const more = (await actions.locator('summary').boundingBox())!;
    const fab = (await record.boundingBox())!;
    for (const box of [practice, more]) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(fab.y);
    }
    // Practice fills the row beside the overflow button.
    expect(practice.width).toBeGreaterThan(viewport.width - 32 - 44 - 8 - 2);
    await record.click();
    await expect(page).toHaveURL(new RegExp(`#\\/record\\/${scriptId}$`));
  });
}

test('Takes leads with a storage chip and a one-line tip that stays dismissed', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/studio#/takes');
  await expect(page.locator('h1')).toHaveText('Takes');
  await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction('takes', 'readwrite');
    tx.objectStore('takes').put({
      id: 'seed-tip',
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
  await page.reload();
  const chip = page.getByRole('img', { name: /used · about \d+ min left at 1080p/ });
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText(/^\S+ \S?B · ~\d+ min$/);
  await expect(page.locator('meter')).toHaveCount(0);
  const tip = page.getByRole('note', { name: 'Save to Photos — browser storage can clear' });
  await expect(tip).toBeVisible();
  const text = tip.locator('.studio-tip__text');
  // One line, never wrapped: shorter than two lines of its own font size.
  const fontSize = await text.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect((await text.boundingBox())!.height).toBeLessThan(fontSize * 2.2);
  const close = tip.getByRole('button', { name: 'Dismiss tip' });
  const box = (await close.boundingBox())!;
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(tip).toHaveCount(0);
  await page.reload();
  await expect(chip).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
});
