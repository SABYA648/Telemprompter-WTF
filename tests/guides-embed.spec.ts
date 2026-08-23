import { expect, test } from '@playwright/test';

// Keep in sync with the slugs in src/content/guides.ts.
const guideSlugs = [
  'how-to-use-a-teleprompter',
  'teleprompter-for-youtube',
  'teleprompter-for-video-recording',
  'teleprompter-camera-distance-and-font-size',
  'teleprompter-for-presentations',
  'teleprompter-for-zoom',
  'teleprompter-speed',
  'what-is-a-teleprompter',
  'how-to-read-a-teleprompter-naturally',
  'how-to-maintain-eye-contact',
  'how-to-format-a-teleprompter-script',
  'voice-activated-teleprompters',
  'manual-vs-voice-activated-teleprompter',
  'teleprompter-for-phone-and-tablet',
  'teleprompter-for-online-courses',
  'teleprompter-for-podcasts',
  'teleprompter-for-short-form-video',
  'teleprompter-for-webinars',
  'teleprompter-for-interviews',
  'teleprompter-mirror-mode-glass',
  'teleprompter-keyboard-shortcuts',
];

// Guides with a hero illustration; the rest render none.
const guidesWithIllustration = new Set([
  'teleprompter-for-youtube',
  'teleprompter-for-video-recording',
  'teleprompter-camera-distance-and-font-size',
  'teleprompter-for-presentations',
  'teleprompter-for-zoom',
  'teleprompter-speed',
  'what-is-a-teleprompter',
  'how-to-read-a-teleprompter-naturally',
  'how-to-maintain-eye-contact',
  'how-to-format-a-teleprompter-script',
  'voice-activated-teleprompters',
  'teleprompter-for-phone-and-tablet',
  'teleprompter-for-online-courses',
  'teleprompter-for-podcasts',
  'teleprompter-for-short-form-video',
  'teleprompter-for-webinars',
  'teleprompter-for-interviews',
  'teleprompter-mirror-mode-glass',
]);

const PRIMARY_STORAGE_KEY = 'teleprompter-wtf.state';
const embedStorageKey = (slug: string) => `${PRIMARY_STORAGE_KEY}:embed:guide-${slug}`;

test('every guide page renders one practice embed with a sample script', async ({ page }) => {
  test.setTimeout(120_000);
  for (const slug of guideSlugs) {
    const response = await page.goto(`/guides/${slug}`);
    expect(response?.status(), slug).toBe(200);

    await expect(page.locator('[data-teleprompter-embed]'), slug).toHaveCount(1);
    const embed = page.locator(`[data-teleprompter-embed="guide-${slug}"]`);
    await expect(embed, slug).toHaveCount(1);

    const editor = embed.locator('textarea.script-editor');
    await expect(editor, slug).toHaveCount(1);
    // The contextual sample script is present before any interaction.
    const sample = await editor.inputValue();
    expect(sample.trim().length, slug).toBeGreaterThan(0);

    // SSR ships the embed inert; lazy hydration (client:visible) has not run yet
    // because the embed sits below the fold.
    await expect(embed.locator('.editor-shell[inert]'), slug).toHaveCount(1);

    const illustration = page.locator('.guide-hero-art img');
    const hasIllustration = guidesWithIllustration.has(slug);
    await expect(illustration, slug).toHaveCount(hasIllustration ? 1 : 0);
    if (hasIllustration) {
      await expect(illustration, slug).toHaveAttribute('src', /^\/illustrations\/guides\//);
      await expect(illustration, slug).toHaveAttribute('width', '1024');
      await expect(illustration, slug).toHaveAttribute('height', '683');
      await expect(illustration, slug).toHaveAttribute('loading', 'lazy');
      const alt = await illustration.getAttribute('alt');
      expect(alt?.trim().length, slug).toBeGreaterThan(0);
    }
  }
});

const interactiveGuides = [
  { slug: 'teleprompter-for-zoom', mirror: false },
  { slug: 'teleprompter-mirror-mode-glass', mirror: true },
  { slug: 'teleprompter-for-phone-and-tablet', mirror: false },
];

for (const { slug, mirror } of interactiveGuides) {
  test(`practice embed on ${slug} hydrates, presents, and stays isolated`, async ({ page }) => {
    await page.goto(`/guides/${slug}`);
    const embed = page.locator(`[data-teleprompter-embed="guide-${slug}"]`);
    const editor = embed.locator('textarea.script-editor');
    const sample = await editor.inputValue();
    expect(sample.trim().length).toBeGreaterThan(0);

    await expect(embed.locator('.editor-shell[inert]')).toHaveCount(1);
    await embed.scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      document.querySelector('[data-teleprompter-embed] .editor-shell:not([inert])'),
    );
    await expect(embed.locator('.editor-shell[inert]')).toHaveCount(0);

    await embed.getByRole('button', { name: /Start teleprompter/ }).click();
    await expect(page.getByRole('dialog', { name: 'Teleprompter presenter' })).toBeVisible();
    const scroller = page.getByTestId('presenter-scroll');
    await expect(scroller).toBeVisible();

    if (mirror) {
      await expect(page.locator('.presenter__script')).toHaveCSS(
        'transform',
        /matrix\(-1, 0, 0, 1/,
      );
    }

    await page.waitForTimeout(400);
    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    const pausedPosition = await scroller.evaluate((element) => element.scrollTop);
    await page.waitForTimeout(400);
    expect(await scroller.evaluate((element) => element.scrollTop)).toBeCloseTo(pausedPosition, 0);

    await page.keyboard.press('Escape');
    await expect(scroller).toBeHidden();
    await expect(embed.getByRole('button', { name: /Start teleprompter/ })).toBeFocused();

    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), embedStorageKey(slug)))
      .toBeTruthy();
    const stored = await page.evaluate(
      ([primaryKey, namespacedKey]) => ({
        primary: primaryKey ? localStorage.getItem(primaryKey) : null,
        embed: namespacedKey ? localStorage.getItem(namespacedKey) : null,
      }),
      [PRIMARY_STORAGE_KEY, embedStorageKey(slug)],
    );
    expect(stored.primary).toBeNull();
    const persisted = JSON.parse(stored.embed ?? '{}') as {
      script?: string;
      preferences?: { mirror?: boolean };
    };
    expect(persisted.script).toBe(sample);
    if (mirror) expect(persisted.preferences?.mirror).toBe(true);
  });
}
