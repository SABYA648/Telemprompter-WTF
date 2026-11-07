// M12 mobile audit: screenshots of the core Studio screens at phone widths, plus layout checks.
// Usage: npm run build && node scripts/m12-screenshots.mjs [outDir]
// Fails (exit 1) on horizontal overflow, tap targets under 44px, overlapping targets, content
// that cannot scroll clear of the fixed bottom bar, or a tab bar where it should (not) be: the
// live camera and Practice are full-bleed with no tab bar (M12 P3); every other screen has one.
/* global document, window, getComputedStyle, innerHeight -- audit() and covered() run in the page. */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const outDir = process.argv[2] ?? 'test-results/m12-shots';
const port = 48173;
const base = `http://127.0.0.1:${port}`;
const viewports = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
];
mkdirSync(outDir, { recursive: true });

const server = spawn(
  'npx',
  ['serve', 'dist', '--listen', `tcp://127.0.0.1:${port}`, '--no-clipboard'],
  {
    stdio: 'ignore',
  },
);
for (let i = 0; i < 100; i++) {
  try {
    await fetch(base);
    break;
  } catch {
    await sleep(200);
  }
}

/** Runs in the page: every visible interactive target, measured. */
function audit() {
  const selector =
    'a[href], button, summary, select, textarea, input:not([type="hidden"]), [role="button"]';
  const clipped = (el, rect) => {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
      const box = node.getBoundingClientRect();
      if (rect.right <= box.left || rect.left >= box.right) return true;
      if (rect.bottom <= box.top || rect.top >= box.bottom) return true;
    }
    return false;
  };
  const layerOf = (el) => {
    for (let node = el; node; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === 'fixed' || position === 'sticky') return node;
    }
    return null;
  };
  const label = (el) =>
    (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40);
  const targets = [...document.querySelectorAll(selector)]
    .map((el) => {
      const measured =
        el.matches('input[type="checkbox"], input[type="radio"]') && el.closest('label')
          ? el.closest('label')
          : el;
      return { el, rect: measured.getBoundingClientRect(), measured };
    })
    .filter(({ el, rect }) => {
      if (rect.width < 1 || rect.height < 1) return false;
      if (el.closest('.studio-visually-hidden, [inert], [aria-hidden="true"]')) return false;
      // Closed <details> content and visibility:hidden still report boxes in Chromium.
      if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false;
      return !clipped(el, rect);
    });
  const small = targets
    .filter(({ rect }) => rect.width < 43.5 || rect.height < 43.5)
    .map(({ el, rect }) => `${label(el)} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
  const overlaps = [];
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i];
      const b = targets[j];
      if (a.measured.contains(b.measured) || b.measured.contains(a.measured)) continue;
      if (layerOf(a.el) !== layerOf(b.el)) continue;
      const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (x > 1 && y > 1) overlaps.push(`${label(a.el)} <> ${label(b.el)}`);
    }
  }
  const root = document.documentElement;
  return {
    overflow: root.scrollWidth > root.clientWidth ? `${root.scrollWidth}>${root.clientWidth}` : '',
    small,
    overlaps,
    targets: targets.length,
  };
}

/** Runs in the page at max scroll: content targets hidden under the fixed bottom bar. */
function covered() {
  window.scrollTo(0, document.documentElement.scrollHeight);
  const nav = document.querySelector('.studio-tabs');
  if (!nav) return [];
  const top = nav.getBoundingClientRect().top;
  return [...document.querySelectorAll('a[href], button, summary, select, textarea, input')]
    .filter((el) => !nav.contains(el) && !el.closest('.record-screen'))
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || !el.checkVisibility()) return false;
      let fixed = false;
      for (let node = el; node; node = node.parentElement)
        if (getComputedStyle(node).position === 'fixed') fixed = true;
      return !fixed && rect.bottom > top + 1 && rect.top < innerHeight;
    })
    .map((el) =>
      (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40),
    );
}

const problems = [];
async function shoot(page, name, width, { nav = true } = {}) {
  await page.waitForTimeout(250);
  const result = await page.evaluate(audit);
  const tabs = await page.locator('.studio-tabs').count();
  const active = await page.locator('.studio-tabs .is-active').count();
  await page.screenshot({ path: `${outDir}/${name}-${width}.png` });
  const hidden = await page.evaluate(covered);
  await page.screenshot({ path: `${outDir}/${name}-${width}-bottom.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  const line = `${name}@${width}: ${result.targets} targets`;
  const issues = [
    result.overflow && `horizontal overflow ${result.overflow}`,
    result.small.length && `small: ${result.small.join(', ')}`,
    result.overlaps.length && `overlap: ${result.overlaps.join(', ')}`,
    hidden.length && `under nav: ${hidden.join(', ')}`,
    nav && tabs !== 1 && 'tab bar missing',
    nav && active !== 1 && `${active} active tabs`,
    !nav && tabs !== 0 && 'tab bar over the live camera',
  ].filter(Boolean);
  console.log(issues.length ? `${line}\n  ${issues.join('\n  ')}` : `${line}, ok`);
  if (issues.length) problems.push(line);
}

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      permissions: ['camera', 'microphone'],
    });
    const page = await context.newPage();
    const w = viewport.width;
    await page.goto(`${base}/studio`);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    await shoot(page, 'home-first-run', w);

    await page.goto(`${base}/studio#/record/quick`);
    await page.getByRole('button', { name: 'Allow camera' }).waitFor();
    await shoot(page, 'record-permission', w);
    await page.getByRole('button', { name: 'Allow camera' }).click();
    await page.getByRole('button', { name: 'Start recording' }).waitFor();
    await page.getByRole('button', { name: 'Quick settings' }).click();
    await page.getByLabel('Countdown').selectOption('0');
    await page
      .getByRole('dialog', { name: 'Quick settings' })
      .getByRole('button', { name: 'Close' })
      .click();
    await shoot(page, 'record-camera', w, { nav: false });
    // M12 P4: at rest the safe-zone frame has gone; the Aa tray holds speed, text and fit.
    await page.locator('.record-safe-zone').waitFor({ state: 'detached', timeout: 8000 });
    await shoot(page, 'record-camera-rest', w, { nav: false });
    await page.getByRole('button', { name: 'Prompter controls' }).click();
    await shoot(page, 'record-camera-tray', w, { nav: false });
    await page.getByRole('button', { name: 'Prompter controls' }).click();
    for (let take = 0; take < 3; take++) {
      if (take) {
        await page.goto(`${base}/studio#/record/quick`);
        const allow = page.getByRole('button', { name: 'Allow camera' });
        const start = page.getByRole('button', { name: 'Start recording' });
        await allow.or(start).waitFor();
        if (await allow.isVisible()) await allow.click();
      }
      await page.getByRole('button', { name: 'Start recording' }).click();
      await page.waitForTimeout(900);
      await page.getByRole('button', { name: 'Stop recording' }).click();
      const review = page.getByRole('dialog', { name: 'Review take' });
      await review.getByRole('button', { name: 'Keep', exact: true }).click();
      await review.getByRole('button', { name: 'Done' }).click();
      await page.waitForURL(/#\/takes/);
    }

    for (const [title, body] of [
      ['Three lighting fixes under ten dollars', 'Fix one. Face the window. Fix two. Bounce it.'],
      [
        'How I film a whole week of short videos in one Sunday afternoon without burning out',
        '# Hook\nI film seven videos in two hours.\n# Body\nHere is the system.',
      ],
    ]) {
      await page.goto(`${base}/studio#/scripts`);
      await page.getByRole('button', { name: 'New script' }).click();
      await page.getByRole('button', { name: 'Blank' }).click();
      await page.getByLabel('Title', { exact: true }).fill(title);
      await page.getByLabel('Script', { exact: true }).fill(body);
      await page.getByText('Saved').waitFor();
    }
    await shoot(page, 'scripts-editor', w);
    await page.getByText('More', { exact: true }).click();
    await page.screenshot({ path: `${outDir}/scripts-editor-more-${w}.png`, fullPage: true });
    // M12 P5: caption fields live in a sheet from the ... menu.
    await page.getByLabel('More script actions').click();
    await page.getByRole('button', { name: 'Captions' }).click();
    await page.getByRole('dialog', { name: 'Captions' }).waitFor();
    await page.screenshot({ path: `${outDir}/scripts-editor-captions-${w}.png` });
    await page.keyboard.press('Escape');

    await page.goto(`${base}/studio#/scripts`);
    await page.locator('article.studio-script-card').first().waitFor();
    await shoot(page, 'scripts-library', w);
    await page.locator('.studio-overflow summary').first().click();
    await page.screenshot({ path: `${outDir}/scripts-library-menu-${w}.png` });
    await page.keyboard.press('Escape');
    // M12 P6: "+" is the one way to start a script: Blank, Template or Import in one sheet.
    await page.getByRole('button', { name: 'New script' }).click();
    await page.getByRole('dialog', { name: 'New script' }).waitFor();
    await page.screenshot({ path: `${outDir}/scripts-library-new-${w}.png` });
    await page.keyboard.press('Escape');

    await page.goto(`${base}/studio#/takes`);
    await page.locator('.studio-take-tile').first().waitFor();
    await shoot(page, 'takes', w);

    await page.goto(`${base}/studio#/practice/quick`);
    await page.getByRole('button', { name: 'Start practice' }).waitFor();
    await shoot(page, 'practice', w, { nav: false });

    await page.goto(`${base}/studio#/`);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    await shoot(page, 'home', w);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(
  problems.length ? `FAIL: ${problems.length} screen(s) with issues` : 'All screens pass',
);
process.exit(problems.length ? 1 : 0);
