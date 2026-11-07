import { expect, test, type Locator, type Page } from '@playwright/test';

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

/** Text a sighted user sees: everything except visually hidden spans. */
const visibleText = (locator: Locator) =>
  locator.evaluate((el) => {
    const copy = el.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('.studio-visually-hidden').forEach((node) => node.remove());
    return (copy.textContent ?? '').trim();
  });

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
  const heading = page.getByRole('heading', { name: /^Practice:/ });
  // The header shows the script title alone; "Practice:" is for screen readers.
  expect(await visibleText(heading)).not.toMatch(/Practice/);
  await expect(heading.locator('.studio-visually-hidden')).toHaveText('Practice:');
  const title = (await heading.boundingBox())!;
  const prompter = (await page.getByTestId('practice-prompter').boundingBox())!;
  expect(title.y + title.height).toBeLessThanOrEqual(prompter.y);
  // Speed is the camera tray's control: a gauge glyph and a number, WPM for screen readers.
  const speed = page.getByRole('group', { name: 'Speed' });
  await expect(speed.locator('.studio-stepper__value svg')).toHaveCount(1);
  await expect(speed.locator('.studio-stepper__value')).toHaveText(/^\d+ WPM$/);
  expect(await visibleText(speed.locator('.studio-stepper__value'))).toMatch(/^\d+$/);
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
    const practiceLink = actions.getByRole('link', { name: 'Practice' });
    // Practice is a round ghost play glyph beside ..., not a wide button.
    expect(((await practiceLink.textContent()) ?? '').trim()).toBe('');
    await expect(practiceLink.locator('svg')).toHaveCount(1);
    const practice = (await practiceLink.boundingBox())!;
    const more = (await actions.getByLabel('More script actions').boundingBox())!;
    const fab = (await record.boundingBox())!;
    for (const box of [practice, more]) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeLessThanOrEqual(48);
      expect(box.y + box.height).toBeLessThanOrEqual(fab.y);
      // Right-aligned, clear of the raised record button's column.
      expect(box.x).toBeGreaterThan(fab.x + fab.width);
    }
    expect(more.x + more.width).toBeLessThanOrEqual(viewport.width - 8);
    // The nav Record word uses the 11px label token.
    expect(
      await record
        .locator('.studio-record-link__tag')
        .evaluate((el) => getComputedStyle(el).fontSize),
    ).toBe('11px');
    await record.click();
    await expect(page).toHaveURL(new RegExp(`#\\/record\\/${scriptId}$`));
  });
}

test('Takes leads with a one-line Save to Photos tip; the storage chip lives in Settings', async ({
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
  await expect(chip).toHaveCount(0);
  await expect(page.locator('meter')).toHaveCount(0);
  const tip = page.getByRole('note', { name: 'Save to Photos. Browser storage can clear.' });
  await expect(tip).toBeVisible();
  await expect(tip.locator('svg').first()).toBeVisible();
  const text = tip.locator('.studio-tip__text');
  // Short and whole: no dash, nothing cut off.
  await expect(text).toHaveText('Save to Photos');
  expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  // One line, never wrapped: shorter than two lines of its own font size.
  const fontSize = await text.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect((await text.boundingBox())!.height).toBeLessThan(fontSize * 2.2);
  const close = tip.getByRole('button', { name: 'Dismiss tip' });
  const box = (await close.boundingBox())!;
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(tip).toHaveCount(0);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Takes');
  await expect(page.getByRole('note')).toHaveCount(0);
  await page.goto('/studio#/settings');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText(/^\S+ \S?B · ~\d+ min$/);
});

for (const width of [360, 390]) {
  test(`the editor's durations are one row, its facts one quiet line, its badge a chip at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/studio#/scripts/new');
    await page.getByLabel('Title', { exact: true }).fill('Durations');
    await page
      .getByLabel('Script', { exact: true })
      .fill('# Hook\nI film seven videos in two hours.\n# Body\nHere is the system.');
    await expect(page.getByText('Saved')).toBeVisible();
    // Five durations and the custom timer share one line that never wraps.
    const row = page.getByRole('group', { name: 'Target length' });
    const tops = await row
      .locator(':scope > *')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(tops).toHaveLength(6);
    expect(new Set(tops).size).toBe(1);
    const box = (await row.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    // Facts read as one muted line with no pill backgrounds.
    const stats = page.locator('.studio-stats-line');
    await expect(stats).toHaveText('11 words · 0:05 · Hook 0:03 · Body 0:02');
    expect(await stats.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      'rgba(0, 0, 0, 0)',
    );
    await expect(stats.locator('span')).toHaveCount(0);
    // While editing, the nav record button shows a tiny visible word.
    const record = page
      .getByRole('navigation', { name: 'Studio navigation' })
      .getByRole('link', { name: 'Record this script' });
    await expect(record.locator('.studio-record-link__tag')).toHaveText('Record');
    await expect(record.locator('.studio-record-link__tag')).toBeVisible();
    // A badge earned here is a star chip by "Saved", never a toast over the form.
    await page.evaluate(() =>
      dispatchEvent(new CustomEvent('studio-badge-unlocked', { detail: 'first_take' })),
    );
    const chip = page.locator('.studio-screen-heading .studio-badge-chip');
    await expect(chip).toContainText('First take');
    await expect(chip.locator('svg')).toHaveCount(1);
    await expect(page.locator('.studio-toast')).toHaveCount(0);
    // Leaving the editor while it shows hands it back to the low toast.
    await page.goto('/studio#/takes');
    await expect(page.locator('.studio-toast')).toContainText('First take badge unlocked');
  });
}

test('library rows keep their details on one line with a short date', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/studio#/scripts/new');
  await page
    .getByLabel('Title', { exact: true })
    .fill('How I film a whole week of short videos in one Sunday afternoon');
  await page.getByLabel('Script', { exact: true }).fill('One two three four five.');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.goto('/studio#/scripts');
  const meta = page.locator('.studio-script-card__meta').first();
  await expect(meta).toHaveText(/ · Today$/);
  const fontSize = await meta.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect((await meta.boundingBox())!.height).toBeLessThan(fontSize * 2.2);
  expect(await meta.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('the editor opens on the words: chevron, title as heading, and timing on the first screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/studio#/scripts/new');
  const title = page.getByLabel('Title', { exact: true });
  await title.fill('How I film a whole week of short videos in one Sunday afternoon');
  await expect(page.getByText('Saved')).toBeVisible();
  // No visible "Editor" heading or field labels; the back link is a chevron named Scripts.
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveCount(1);
  await expect(heading.getByLabel('Title', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Editor', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Editor', { exact: true })).toHaveClass(/studio-visually-hidden/);
  await expect(page.locator('label', { hasText: /^Title$|^Script$/ })).toHaveCount(0);
  const back = page.getByRole('link', { name: 'Scripts', exact: true }).first();
  await expect(back).toHaveAttribute('href', '#/scripts');
  expect(((await back.textContent()) ?? '').trim()).toBe('');
  const backBox = (await back.boundingBox())!;
  expect(backBox.width).toBeGreaterThanOrEqual(44);
  // The title wraps instead of truncating, and shares its row with "Saved".
  const field = (await title.boundingBox())!;
  expect(await title.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  expect(field.height).toBeGreaterThan(40);
  const saved = (await page.getByText('Saved').boundingBox())!;
  expect(saved.y).toBeLessThan(field.y + field.height);
  expect(saved.x).toBeGreaterThan(field.x + field.width - 1);
  // Empty script: the stats line and duration row are on the first screen.
  const row = (await page.getByRole('group', { name: 'Target length' }).boundingBox())!;
  const stats = (await page.locator('.studio-stats-line').boundingBox())!;
  const actions = (await page.locator('.studio-editor__actions').boundingBox())!;
  expect(stats.y + stats.height).toBeLessThanOrEqual(actions.y);
  expect(row.y + row.height).toBeLessThanOrEqual(actions.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
