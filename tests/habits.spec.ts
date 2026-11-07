import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** Leaves first run by editing the starter script, so Home shows the returning layout. */
async function returning(page: Page, title = 'My video plan') {
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Title', { exact: true }).fill(title);
  await expect(page.getByText('Saved')).toBeVisible();
}
/** The streak chip on Home expands to show the weekly goal and streak details. */
async function openStreak(page: Page) {
  await page.locator('.studio-streak summary').click();
}
/** Writes kv entries and kept takes straight into the Studio database. */
async function seed(
  page: Page,
  data: { kv?: Record<string, unknown>; takes?: Array<{ scriptId: string; at: number }> },
) {
  await page.evaluate(async ({ kv, takes }) => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['kv', 'takes'], 'readwrite');
    for (const [key, value] of Object.entries(kv ?? {})) tx.objectStore('kv').put(value, key);
    (takes ?? []).forEach((take, i) =>
      tx.objectStore('takes').put({
        id: `seed-${i}`,
        scriptId: take.scriptId,
        kept: true,
        durationMs: 30000,
        wordsRead: 70,
        createdAt: take.at,
        exportedAt: null,
      }),
    );
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, data);
}
const day = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

test('Today prompt shuffles hooks and writes a local script; the challenge opens its day', async ({
  page,
}) => {
  await returning(page);
  await page.goto('/studio#/');
  const today = page.getByRole('region', { name: "Today's prompt" });
  await expect(today.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
  const hook = today.locator('.studio-today__hook');
  const first = await hook.textContent();
  await today.getByRole('button', { name: 'Another hook' }).click();
  await expect(hook).not.toHaveText(first ?? '');
  const shuffled = (await hook.textContent()) ?? '';
  await today.getByRole('button', { name: 'Write' }).click();
  await expect(page).toHaveURL(/#\/scripts\//);
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(
    new RegExp(shuffled.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  await page.goto('/studio#/challenge');
  await page.getByRole('button', { name: 'Join challenge' }).click();
  await expect(page.getByText('0 of 30 days complete')).toBeVisible();
  await page.getByRole('button', { name: 'Write' }).click();
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(/Say who you help/);
});

test('share cards download as full-size PNGs over 10 KB', async ({ page }) => {
  await returning(page, 'Weekly card');
  // A week card needs a video this week to share.
  await seed(page, { takes: [{ scriptId: 'quick', at: Date.now() }] });
  await page.goto('/studio#/');
  const download = page.waitForEvent('download');
  await page
    .getByRole('region', { name: 'Your progress' })
    .getByRole('button', { name: 'Share week' })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('teleprompter-wtf-weekly.png');
  const bytes = await readFile(await file.path());
  expect(bytes.length).toBeGreaterThan(10_000);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1920);
});

// The rating itself is asked in the take review right after Keep (media.spec.ts covers it).
test('Home never shows the recording rating, even after the third kept take', async ({ page }) => {
  await returning(page, 'Three takes');
  await seed(page, {
    takes: [0, 1, 2].map(() => ({ scriptId: 'quick', at: Date.now() })),
  });
  await page.goto('/studio#/');
  await expect(page.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
  await expect(page.getByText('How did recording feel today?')).toHaveCount(0);
});

test('Monday recap uses only the previous week for best streak', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 16, 12));
  await returning(page, 'Weekly recap');
  const older = Array.from({ length: 30 }, (_, i) => day(2026, 9, i + 1));
  await seed(page, {
    kv: { streak: { activeDates: [...older, day(2026, 11, 11)] } },
    takes: [{ scriptId: 'quick', at: new Date(2026, 10, 11, 12).getTime() }],
  });
  await page.goto('/studio#/');
  const recap = page.getByRole('region', { name: 'Weekly recap' });
  await expect(recap.getByText('1 day')).toBeVisible();
  await expect(recap.getByText('30 days')).toHaveCount(0);
});

test('Home shows one ask per session and the milestone share card once', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 12, 12));
  await returning(page, 'Ladder');
  await seed(page, {
    kv: {
      streak: { activeDates: [day(2026, 11, 10), day(2026, 11, 11), day(2026, 11, 12)] },
    },
    takes: [0, 1, 2].map(() => ({ scriptId: 'quick', at: Date.now() })),
  });
  await page.goto('/studio#/');
  // Reminder, share card and rating are all eligible; the ladder shows only the reminder.
  await expect(page.getByRole('heading', { name: 'Daily reminder' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Share your progress' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('heading', { name: 'Daily reminder' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Daily reminder' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Share your progress' })).toHaveCount(0);

  // A new tab is a new session: the reminder is snoozed, so the 3-day milestone gets its turn.
  const second = await page.context().newPage();
  await second.clock.setFixedTime(new Date(2026, 10, 12, 12));
  await second.goto('/studio#/');
  const share = second.getByRole('region', { name: 'Share your progress' });
  await expect(share.getByRole('heading', { name: 'Streak milestone' })).toBeVisible();
  await expect(second.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
  const download = second.waitForEvent('download');
  await share.getByRole('button', { name: 'Share card' }).click();
  expect((await download).suggestedFilename()).toBe('teleprompter-wtf-streak.png');
  await second.close();

  // Offered once: the next session has no ask left, since the rating moved to the take review.
  const third = await page.context().newPage();
  await third.clock.setFixedTime(new Date(2026, 10, 12, 12));
  await third.goto('/studio#/');
  await expect(third.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
  await third.waitForTimeout(300);
  await expect(third.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
  await expect(third.getByRole('region', { name: 'Share your progress' })).toHaveCount(0);
  await third.close();
});

test('the weekly goal resets at Monday 00:00 local time', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 15, 23, 58));
  await returning(page, 'Sunday video');
  await seed(page, {
    takes: [{ scriptId: 'quick', at: new Date(2026, 10, 15, 23, 30).getTime() }],
  });
  await page.goto('/studio#/');
  await openStreak(page);
  await expect(page.getByText('1 of 5 videos this week')).toBeVisible();
  await page.clock.setFixedTime(new Date(2026, 10, 16, 0, 0, 1));
  await page.reload();
  await openStreak(page);
  await expect(page.getByText('0 of 5 videos this week')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Weekly recap' })).toBeVisible();
  await page.goto('/studio#/settings/habit');
  await page.getByRole('combobox', { name: /Weekly goal/ }).selectOption('3');
  await page.goto('/studio#/');
  await openStreak(page);
  await expect(page.getByText('0 of 3 videos this week')).toBeVisible();
});

test('every habit feature can be turned off in Settings', async ({ page }) => {
  await returning(page, 'Switches');
  await seed(page, {
    kv: { streak: { activeDates: [day(2026, 1, 1)] }, badges: ['first_take'] },
    takes: [{ scriptId: 'quick', at: Date.now() }],
  });
  await page.goto('/studio#/');
  await expect(page.getByRole('region', { name: "Today's prompt" })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Weekly goal progress' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your progress' })).toBeVisible();
  await page.goto('/studio#/settings/habit');
  for (const label of [
    'Show streaks and freezes',
    'Show weekly goal',
    "Show today's prompt",
    'Show recording stats',
    'Show badges and celebrations',
    'Show 30-day challenge',
    'Show Monday recap',
    'Offer share cards',
    'Ask how recording feels',
  ])
    await page.getByLabel(label).uncheck();
  await page.goto('/studio#/');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('region', { name: "Today's prompt" })).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Weekly goal progress' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Recording streak' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Your progress' })).toHaveCount(0);
  await expect(page.getByRole('status', { name: 'Badge unlocked' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Share/ })).toHaveCount(0);
  await page.goto('/studio#/challenge');
  await expect(page.getByText('The challenge is turned off.')).toBeVisible();
});

for (const width of [320, 360, 390]) {
  test(`habit cards fit ${width}px with 48px targets, clear of the nav, and still under reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await returning(page, 'Phone habits');
    await seed(page, {
      kv: { badges: ['first_take'], 'badges.unseen': ['first_take'] },
      takes: [{ scriptId: 'quick', at: Date.now() }],
    });
    await page.goto('/studio#/');
    await expect(page.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
    // An unseen badge is a toast after Keep, never a card on Home.
    await page.waitForTimeout(300);
    await expect(page.locator('.studio-celebration')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const buttons = page.locator(
      '.studio-streak summary, .studio-today button, [aria-label="Your progress"] .studio-button',
    );
    for (const box of await buttons.evaluateAll((els) =>
      els
        .filter((el) => el.matches('button, a, summary'))
        .map((el) => el.getBoundingClientRect().height),
    ))
      expect(box).toBeGreaterThanOrEqual(48);
    await expect(page.getByRole('progressbar', { name: 'Weekly goal progress' })).toHaveAttribute(
      'aria-valuemax',
      '5',
    );
    // The last Home control scrolls fully above the bottom navigation.
    const last = page
      .getByRole('region', { name: 'Your progress' })
      .getByRole('link', { name: 'See the challenge' });
    await last.scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const nav = await page.getByRole('navigation', { name: 'Studio navigation' }).boundingBox();
    const box = await last.boundingBox();
    expect(box && nav && box.y + box.height <= nav.y).toBe(true);
  });
}
