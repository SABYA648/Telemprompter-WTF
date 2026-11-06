import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Outside the repo, so these review captures never end up in a commit.
const shots = process.env.STUDIO_UI_SHOTS ?? '/root/.hermes/cache/scratch/studio-ui';
const LONG_TITLE =
  'How I film a week of Reels in one Sunday afternoon without losing my voice or my mind';

async function seedScripts(page: Page) {
  for (const [title, body] of [
    [LONG_TITLE, '# Hook\nThis script has a very long title so the card has to wrap it.'],
    ['Quick tip', 'One short line.'],
  ]) {
    await page.goto('/studio#/scripts/new');
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Untitled script');
    await page.getByLabel('Title', { exact: true }).fill(title!);
    await page.getByLabel('Script', { exact: true }).fill(body!);
    await expect(page.getByText('Saved')).toBeVisible();
  }
}

const currentItems = (page: Page) =>
  page.getByRole('navigation', { name: 'Studio navigation' }).locator('[aria-current]');

test('bottom navigation marks exactly one current item that matches the route', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/studio#/scripts');
  await expect(page.getByRole('heading', { name: 'Scripts', exact: true })).toBeVisible();
  await expect(currentItems(page)).toHaveCount(1);
  await expect(currentItems(page)).toHaveText('Scripts');
  await expect(currentItems(page)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.studio-tabs .is-active')).toHaveCount(1);
  // Only the current item gets the active background; Record is no longer filled.
  const backgrounds = await page
    .locator('.studio-tabs a')
    .evaluateAll((links) => links.map((link) => getComputedStyle(link).backgroundColor));
  const plain = backgrounds.filter((value) => value === 'rgba(0, 0, 0, 0)');
  expect(plain).toHaveLength(4);

  for (const [hash, label] of [
    ['#/', 'Home'],
    ['#/scripts/quick', 'Scripts'],
    ['#/takes', 'Takes'],
    ['#/settings', 'Settings'],
    ['#/inbox', 'Home'],
  ] as const) {
    await page.goto(`/studio${hash}`);
    await expect(page.locator('.studio-screen').first()).toBeVisible();
    await expect(currentItems(page)).toHaveCount(1);
    await expect(currentItems(page)).toHaveText(label);
  }

  // Before camera access Record is a permission screen with the tab bar.
  for (const hash of ['#/record', '#/record/quick']) {
    await page.goto(`/studio${hash}`);
    await expect(page.getByRole('button', { name: 'Allow camera' })).toBeVisible();
    await expect(currentItems(page)).toHaveCount(1);
    await expect(currentItems(page)).toHaveText('Record');
    await expect(page.locator('.studio-tabs .is-active')).toHaveCount(1);
  }
  // Practice is full-bleed: no tab bar, the X is the way out.
  await page.goto('/studio#/practice/quick');
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeVisible();
  await expect(page.locator('.studio-tabs')).toHaveCount(0);
});

for (const viewport of [
  { width: 320, height: 640 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`practice actions stay on screen with no tab bar at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/studio#/practice/quick');
    await page.getByRole('button', { name: 'Start practice' }).click();
    for (const name of ['Finish practice', 'Restart']) {
      const button = page.getByRole('button', { name });
      await page.locator('.studio-practice').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      const target = (await button.boundingBox())!;
      await expect(page.locator('.studio-tabs')).toHaveCount(0);
      expect(target.y + target.height).toBeLessThanOrEqual(viewport.height);
      expect(
        await button.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return hit === element || element.contains(hit);
        }),
      ).toBe(true);
      await button.click();
      if (name === 'Finish practice')
        await expect(page.getByRole('region', { name: 'Practice summary' })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Practice summary' })).toHaveCount(0);
  });

  test(`script cards keep the title wide and actions clear at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await seedScripts(page);
    await page.goto('/studio#/scripts');
    const cards = page.locator('article.studio-script-card');
    await expect(cards).toHaveCount(3);
    await page.getByLabel('More actions for Quick tip').click();
    await page.getByRole('button', { name: 'Add to Up next: Quick tip' }).click();
    await expect(page.getByRole('heading', { name: 'Up next' })).toBeVisible();

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);

    for (const card of await cards.all()) {
      const box = (await card.boundingBox())!;
      const title = (await card.locator('.studio-script-card__title').boundingBox())!;
      const meta = (await card.locator('.studio-script-card__meta').boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(title.width).toBeGreaterThanOrEqual(box.width * 0.5);
      expect(meta.width).toBeGreaterThanOrEqual(box.width * 0.5);
      // A long title can take more lines, but none of it is clipped.
      expect(
        await card
          .locator('.studio-script-card__title')
          .evaluate((el) => el.scrollHeight - el.clientHeight),
      ).toBe(0);
      const record = (await card.getByRole('link', { name: /^Record / }).boundingBox())!;
      expect(record.width).toBeGreaterThanOrEqual(44);
      expect(record.x + record.width).toBeLessThanOrEqual(box.x + box.width);
      expect(record.y).toBeGreaterThanOrEqual(box.y);
    }
    const longCard = cards.filter({ hasText: 'How I film a week' });
    await expect(longCard.locator('.studio-script-card__title')).toHaveText(LONG_TITLE);
    await expect(longCard.locator('.studio-script-card__main')).toHaveAttribute(
      'href',
      /#\/scripts\//,
    );

    if (viewport.width !== 320) {
      mkdirSync(shots, { recursive: true });
      await longCard.evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: `${shots}/scripts-${viewport.width}.png` });
    }

    // Delete asks before it acts, and Escape backs out.
    await longCard.getByLabel(`More actions for ${LONG_TITLE}`).click();
    await longCard.getByRole('button', { name: `Delete ${LONG_TITLE}` }).click();
    await expect(longCard.getByRole('group', { name: `Delete ${LONG_TITLE}?` })).toBeVisible();
    await expect(longCard.getByRole('button', { name: 'Cancel' })).toBeFocused();
    if (viewport.width !== 320)
      await page.screenshot({ path: `${shots}/scripts-${viewport.width}-confirm.png` });
    await page.keyboard.press('Escape');
    await expect(longCard.getByLabel(`More actions for ${LONG_TITLE}`)).toBeFocused();
    await expect(cards).toHaveCount(3);
    await longCard.getByLabel(`More actions for ${LONG_TITLE}`).click();
    await longCard.getByRole('button', { name: `Delete ${LONG_TITLE}` }).click();
    await page.getByRole('button', { name: `Confirm delete ${LONG_TITLE}` }).click();
    await expect(cards).toHaveCount(2);
    await expect(page.getByRole('status')).toHaveText(/moved to Recently deleted/);
  });
}

test('script cards and navigation hold up on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedScripts(page);
  await page.goto('/studio#/scripts');
  const cards = page.locator('article.studio-script-card');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    const box = (await card.boundingBox())!;
    const title = (await card.locator('.studio-script-card__title').boundingBox())!;
    expect(title.width).toBeGreaterThanOrEqual(box.width * 0.5);
  }
  await expect(currentItems(page)).toHaveCount(1);
  mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/scripts-1440.png` });
});
