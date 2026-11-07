import { expect, test, type Page } from '@playwright/test';

/** Send to phone sits in the editor's ... menu, next to Present and Delete. */
async function sendToPhone(page: Page) {
  await page.getByLabel('More script actions').click();
  await page.getByRole('button', { name: 'Send to phone' }).click();
}

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
  await sendToPhone(page);
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
  // One "+" holds every way to start: Blank, Template and Import. No template bar, no ... menu.
  await expect(page.getByText('Start from a template')).toHaveCount(0);
  await expect(page.getByLabel('More library actions')).toHaveCount(0);
  await page.getByRole('button', { name: 'New script' }).click();
  const sheet = page.getByRole('dialog', { name: 'New script' });
  await expect(sheet.locator('.studio-create-options button')).toHaveText([
    'Blank',
    'Template',
    'Import',
  ]);
  await sheet.getByRole('button', { name: 'Template' }).click();
  await expect(page.getByRole('dialog', { name: 'Templates' })).toBeVisible();
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
  // The hook picker is a round lightbulb in the action row that opens a sheet.
  const bulb = page
    .locator('.studio-editor__actions')
    .getByRole('button', { name: 'Choose a hook' });
  await expect(bulb.locator('.studio-captioned__label')).toHaveText('Hook');
  const box = (await bulb.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await bulb.click();
  const sheet = page.getByRole('dialog', { name: 'Choose a hook' });
  await sheet.getByLabel('Niche').selectOption('tech');
  const hook = page.getByTestId('hook-text');
  const first = await hook.textContent();
  await page.getByRole('button', { name: 'Shuffle' }).click();
  await expect(hook).not.toHaveText(first ?? '');
  const shuffled = (await hook.textContent()) ?? '';
  await page.getByRole('button', { name: 'Insert hook' }).click();
  await expect(sheet).toHaveCount(0);
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
  // A queued script's button changes name, so the first match is always the next unqueued one.
  // Each lives in its row's ... menu, so it is matched by label while the menu is closed.
  const addButtons = page.locator('button[aria-label^="Add to Up next"]');
  const addNext = async () => {
    await page
      .locator('article.studio-script-card', { has: addButtons })
      .first()
      .locator('.studio-overflow summary')
      .click();
    await page.getByRole('button', { name: 'Add to Up next' }).first().click();
  };
  const beforeAdd = await addButtons.count();
  await addNext();
  await expect(addButtons).toHaveCount(beforeAdd - 1);
  await addNext();
  const firstQueued = page.locator('.studio-row__title').first();
  const before = await firstQueued.textContent();
  await page
    .getByRole('button', { name: /^Move .* down$/ })
    .first()
    .click();
  await expect(firstQueued).not.toHaveText(before ?? '');
  await page.reload();
  await expect(firstQueued).not.toHaveText(before ?? '');
  const title = (await firstQueued.textContent()) ?? '';
  await page.goto('/studio#/');
  await expect(page.getByRole('link', { name: `Record ${title}` })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start batch' })).toBeVisible();
  await page.getByRole('link', { name: 'Record next' }).click();
  await expect(page).toHaveURL(/#\/record\/next$/);
});

test('one status list, Draft, Recorded and Posted, across editor, rows and filters', async ({
  page,
}) => {
  await page.goto('/studio#/scripts/new');
  await page.getByLabel('Title', { exact: true }).fill('Posted reel');
  await page.getByText('More', { exact: true }).click();
  // Status is three labelled glyph segments with radio semantics; arrows move the choice.
  const statusGroup = page.getByRole('radiogroup', { name: 'Status' });
  await expect(statusGroup.getByRole('radio')).toHaveText(['Draft', 'Recorded', 'Posted']);
  await expect(statusGroup.getByRole('radio', { name: 'Draft' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const label = statusGroup.locator('.studio-segmented__label').first();
  expect(await label.evaluate((el) => getComputedStyle(el).fontSize)).toBe('11px');
  await statusGroup.getByRole('radio', { name: 'Recorded' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(statusGroup.getByRole('radio', { name: 'Posted' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(statusGroup.getByRole('radio', { name: 'Posted' })).toBeFocused();
  await expect(page.locator('.studio-more select')).toHaveCount(0);
  await expect(page.getByText('Saved')).toBeVisible();
  await page.goto('/studio#/scripts');
  // Chips only for stages that hold a script, plus All; one pressed.
  const filters = page.getByRole('group', { name: 'Filter scripts' });
  await expect(filters.getByRole('button')).toHaveText([/^All \d+$/, /^Draft \d+$/, 'Posted 1']);
  await expect(filters.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.getByRole('combobox')).toHaveCount(0);
  const posted = filters.getByRole('button', { name: /^Posted/ });
  await posted.click();
  await expect(posted).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /^Posted reel/ })).toBeVisible();
  await expect(page.locator('.studio-script-card__meta')).toHaveText([/ · Posted · /]);
  await filters.getByRole('button', { name: /^Draft/ }).click();
  await expect(page.getByRole('link', { name: /^Posted reel/ })).toHaveCount(0);
});

test('legacy idea and ready scripts read as Draft or Recorded without rewriting them', async ({
  page,
}) => {
  await page.goto('/studio#/scripts');
  await expect(page.getByRole('heading', { name: 'Scripts' })).toBeVisible();
  await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction('scripts', 'readwrite');
    const base = {
      body: 'Old words.',
      templateId: null,
      targetSeconds: 30,
      aspect: '9:16',
      caption: '',
      hashtags: '',
      youtubeTitle: '',
      youtubeDescription: '',
      order: 0,
      plannedFor: null,
      createdAt: 1,
      updatedAt: Date.now(),
      deletedAt: null,
    };
    tx.objectStore('scripts').put({
      ...base,
      id: 'legacy-idea',
      title: 'Legacy idea',
      status: 'idea',
      lastRecordedAt: null,
      takeCount: 0,
    });
    tx.objectStore('scripts').put({
      ...base,
      id: 'legacy-ready',
      title: 'Legacy ready',
      status: 'ready',
      lastRecordedAt: Date.now(),
      takeCount: 2,
    });
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  const row = (title: string) =>
    page
      .locator('article.studio-script-card', { hasText: title })
      .locator('.studio-script-card__meta');
  await expect(row('Legacy idea')).toHaveText(/ · Draft · /);
  await expect(row('Legacy ready')).toHaveText(/ · Recorded · /);
  const filters = page.getByRole('group', { name: 'Filter scripts' });
  await expect(filters.getByRole('button', { name: /^Ready/ })).toHaveCount(0);
  await expect(filters.getByRole('button', { name: /^Recorded/ })).toHaveText('Recorded 1');
  await page.goto('/studio#/scripts/legacy-ready');
  await page.getByText('More', { exact: true }).click();
  await expect(
    page.getByRole('radiogroup', { name: 'Status' }).getByRole('radio', { name: 'Recorded' }),
  ).toHaveAttribute('aria-checked', 'true');
  // Opening the editor does not rewrite the stored status.
  const stored = await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction('scripts');
    const req = tx.objectStore('scripts').get('legacy-ready');
    const value = await new Promise<{ status: string }>((resolve) => {
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return value.status;
  });
  expect(stored).toBe('ready');
});

test('caption counters track limits from platform facts', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  // Captions live in a sheet from the ... menu, not in the More section.
  await page.getByText('More', { exact: true }).click();
  await expect(page.getByLabel('Hashtags')).toHaveCount(0);
  await expect(page.getByText(/Platform facts checked/)).toHaveCount(0);
  await page.getByLabel('More script actions').click();
  await page.getByRole('button', { name: 'Captions' }).click();
  const sheet = page.getByRole('dialog', { name: 'Captions' });
  await expect(sheet).toBeVisible();
  // Instagram first; YouTube's fields wait behind one chip.
  await expect(page.getByLabel('YouTube title')).toHaveCount(0);
  // What a sighted user reads: the counter without its screen-reader words.
  const shown = (locator: import('@playwright/test').Locator) =>
    locator.evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('.studio-visually-hidden').forEach((node) => node.remove());
      return (copy.textContent ?? '').trim();
    });
  const counter = async (label: string) =>
    page.locator(`#${(await page.getByLabel(label).getAttribute('aria-describedby'))!}`);
  await page.getByLabel('Instagram caption').fill('Hello');
  const caption = await counter('Instagram caption');
  await expect(caption).toHaveText('5/2200 characters');
  expect(await shown(caption)).toBe('5/2200');
  const muted = await caption.evaluate((el) => getComputedStyle(el).color);
  await page.getByLabel('Hashtags').fill('#a #b #c #d #e #f');
  const tags = await counter('Hashtags');
  expect(await shown(tags)).toBe('6/5');
  await expect(tags).toHaveText('6/5 hashtags, 1 over the limit');
  expect(await tags.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(255, 77, 77)');
  expect(muted).not.toBe('rgb(255, 77, 77)');
  await sheet.getByRole('button', { name: 'YouTube' }).click();
  await expect(sheet.getByRole('button', { name: 'YouTube' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('YouTube title').fill('Short');
  expect(await shown(await counter('YouTube title'))).toBe('5/100');
  // Done sits low in the sheet, in the thumb zone, and closes it.
  const done = sheet.getByRole('button', { name: 'Done' });
  const box = (await done.boundingBox())!;
  expect(box.y).toBeGreaterThan((page.viewportSize()?.height ?? 720) * 0.6);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await done.click();
  await expect(sheet).toHaveCount(0);
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
  await sendToPhone(page);
  await expect(page.getByAltText('QR code for this script')).toBeVisible();
  await sendToPhone(page);
  // Random words barely compress, so the link passes 1,500 characters.
  const words = Array.from(
    { length: 900 },
    (_, i) => (i * 7919).toString(36) + (i * 104729).toString(36),
  );
  await page.getByLabel('Script', { exact: true }).fill(words.join(' '));
  await expect(page.getByText('Saved')).toBeVisible();
  await sendToPhone(page);
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
  await sendToPhone(page);
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

test("Home's create row is Idea and Practice; Up next rows read like library rows", async ({
  page,
}) => {
  await page.goto('/studio#/');
  // Write and the library's "+" sheet already start a script or a template, so no tile repeats them.
  const tools = page.getByRole('navigation', { name: 'Create tools' });
  await expect(tools.getByRole('link')).toHaveText(['Idea', 'Practice']);
  const row = page.locator('.studio-next-row').first();
  await expect(row.locator('small')).toHaveText('30 words · 0:13');
  await page.goto('/studio#/scripts');
  await expect(page.locator('.studio-script-card__meta').first()).toContainText('30 words · 0:13');
  // The template list is still one link away for template pages that send a visitor here.
  await page.goto('/studio#/');
  await page.evaluate(() => (location.hash = '#/scripts?templates=1'));
  const sheet = page.getByRole('dialog', { name: 'Templates' });
  await expect(sheet.getByLabel('Search templates')).toBeVisible();
});
