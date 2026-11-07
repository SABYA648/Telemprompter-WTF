import { expect, test, type Page } from '@playwright/test';

// M12: one current tab on every route with a tab bar, and at most one accent (primary) action
// per screen. Practice and the live camera are full-bleed with no tab bar (M12 P3).
const ROUTES = [
  ['#/', 'Home'],
  ['#/inbox', 'Home'],
  ['#/challenge', 'Home'],
  ['#/scripts', 'Scripts'],
  ['#/scripts/quick', 'Scripts'],
  ['#/batch', 'Scripts'],
  ['#/receive/S1.not-a-real-code', 'Scripts'],
  // Before camera access, Record is a permission screen, which keeps the tab bar.
  ['#/record/quick', 'Record'],
  ['#/takes', 'Takes'],
  ['#/takes/missing', 'Takes'],
  ['#/settings', 'Settings'],
  ['#/settings/camera', 'Settings'],
  ['#/settings/habit', 'Settings'],
] as const;

/** Visible controls filled with the accent, outside the tab bar's record button. */
const accentActions = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('a, button, summary, [role="button"]')]
      .filter((el) => !el.closest('.studio-tabs'))
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
  await page.goto('/studio#/practice/quick');
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeVisible();
  await expect(page.locator('.studio-tabs')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Close practice' })).toHaveAttribute(
    'href',
    '#/scripts/quick',
  );
  // Practice speaks the camera's language: play is the one accent, every control is an icon,
  // and the camera preview is an icon switch, not a native checkbox.
  expect(await accentActions(page)).toEqual(['Start practice']);
  for (const name of ['Start practice', 'Restart', 'Finish practice']) {
    const button = page.getByRole('button', { name });
    await expect(button.locator('svg')).toHaveCount(1);
    expect(((await button.textContent()) ?? '').trim()).toBe('');
  }
  await expect(page.getByRole('switch', { name: 'Camera preview' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await expect(page.locator('.studio-practice input[type="checkbox"]')).toHaveCount(0);
  const title = (await page.getByRole('heading', { name: /^Practice:/ }).boundingBox())!;
  const prompter = (await page.getByTestId('practice-prompter').boundingBox())!;
  expect(title.y + title.height).toBeLessThanOrEqual(prompter.y);
});

test('active tab labels meet 4.5:1 contrast on the tab bar', async ({ page }) => {
  const luminance = (rgb: number[]) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  for (const hash of ['#/', '#/scripts', '#/record/quick', '#/takes', '#/settings']) {
    await page.goto(`/studio${hash}`);
    const active = page.locator('.studio-tabs .is-active');
    await expect(active).toHaveCount(1);
    const [fg, bg] = await active.evaluate((el) => {
      const color = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number);
      let node: Element | null = el;
      let background = 'rgba(0, 0, 0, 0)';
      while (node && background === 'rgba(0, 0, 0, 0)') {
        background = getComputedStyle(node).backgroundColor;
        node = node.parentElement;
      }
      return [color(getComputedStyle(el).color), color(background)];
    });
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    expect((hi! + 0.05) / (lo! + 0.05), hash).toBeGreaterThanOrEqual(4.5);
  }
});

test('a returning Home is streak, Today and Up next: no badge card, no survey, one Share', async ({
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
    tx.objectStore('kv').put({ activeDates: [new Date().toLocaleDateString('sv')] }, 'streak');
    for (const n of [1, 2, 3])
      tx.objectStore('takes').put({
        id: `seed-m12-${n}`,
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
  const today = page.getByRole('region', { name: "Today's prompt" });
  await expect(today).toBeVisible();
  await page.waitForTimeout(300);
  // The badge is a toast after Keep, and the survey follows a kept take: neither lives on Home.
  await expect(page.getByRole('status', { name: 'Badge unlocked' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
  expect(await accentActions(page)).toEqual(['Record this']);
  // Above the fold, in order: streak chip, Today's prompt, Up next.
  const top = async (selector: string) => (await page.locator(selector).boundingBox())!.y;
  const streak = await top('.studio-streak');
  const prompt = await top('.studio-today');
  const next = await top('.studio-up-next');
  expect(streak).toBeLessThan(prompt);
  expect(prompt).toBeLessThan(next);
  expect(next).toBeLessThan(780);
  // Up next rows record with a ghost camera, not a second accent.
  await expect(page.locator('.studio-up-next .studio-round-action').first()).toHaveCSS(
    'background-color',
    'rgb(32, 32, 36)',
  );
  // Progress is one line and at most one Share, not a grid of zeros or three share buttons.
  const progress = page.getByRole('region', { name: 'Your progress' });
  const line = progress.locator('.studio-progress__line');
  await expect(line).toContainText('3 takes');
  await expect(line).toContainText('1 badge');
  await expect(line).not.toContainText('0 min');
  expect((await line.boundingBox())!.height).toBeLessThan(32);
  await expect(progress.getByRole('button', { name: /Share/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Share/ })).toHaveCount(1);
});

test("Today's prompt reads naturally, never a fill-in token", async ({ page }) => {
  for (const day of [1, 2, 3, 4, 5, 6, 7]) {
    await page.clock.setFixedTime(new Date(2026, 10, day, 12));
    await page.goto('/studio#/scripts/quick');
    await page.getByLabel('Title', { exact: true }).fill(`Day ${day}`);
    await expect(page.getByText('Saved')).toBeVisible();
    await page.goto('/studio#/');
    const today = page.getByRole('region', { name: "Today's prompt" });
    await expect(today.locator('.studio-today__hook')).toBeVisible();
    await expect(today).not.toContainText('{');
    await today.getByRole('button', { name: 'Another hook' }).click();
    await expect(today).not.toContainText('{');
  }
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
  // The permission screen keeps the tab bar; only the live camera drops it.
  await expect(page.locator('.studio-tabs')).toHaveCount(1);
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
    // Markup sits behind one Aa button, and only the duration chips set the target.
    const markup = page.getByRole('group', { name: 'Markup tools' });
    const row = (await markup.boundingBox())!;
    expect(row.x + row.width).toBeLessThanOrEqual(viewport.width);
    await expect(markup.getByRole('button', { name: 'Pause' })).toBeHidden();
    await markup.getByLabel('Format').click();
    for (const name of ['Add section', 'Pause', 'Emphasis', 'Highlight', 'Cue: breathe']) {
      const option = (await markup.getByRole('button', { name }).boundingBox())!;
      expect(option.x).toBeGreaterThanOrEqual(0);
      expect(option.x + option.width).toBeLessThanOrEqual(viewport.width);
    }
    await markup.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByLabel('Script', { exact: true })).toHaveValue(/\[pause\]/);
    await page.getByText('More', { exact: true }).click();
    await expect(page.getByLabel('Target seconds')).toHaveCount(0);
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
