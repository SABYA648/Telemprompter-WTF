import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:8080';
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(base + '/');
await page.locator('.editor-shell[data-hydrated]').waitFor();
await page.getByRole('button', { name: 'Allow analytics' }).click();
await page.waitForTimeout(1200);
await page.goto(base + '/guides/teleprompter-for-youtube');
await page.evaluate(() => {
  document.querySelectorAll('a[data-cta-cluster]').forEach((a) => (a.href = '#'));
});
await page.locator('a[data-cta-cluster]').first().click();
await page.waitForTimeout(800);
const events = await page.evaluate(() =>
  (window.dataLayer ?? []).filter((e) => Array.isArray(e) && e[0] === 'event').map((e) => e.slice(1)),
);
console.log(JSON.stringify(events));
// tool page CTA
await page.goto(base + '/tools/words-to-minutes');
await page.evaluate(() => {
  document.querySelectorAll('a[href="/"]').forEach((a) => (a.href = '#'));
});
const toolLink = page.locator('a:has-text("Start teleprompter")').first();
await toolLink.click();
await page.waitForTimeout(800);
const events2 = await page.evaluate(() =>
  (window.dataLayer ?? []).filter((e) => Array.isArray(e) && e[0] === 'event').map((e) => e.slice(1)),
);
console.log(JSON.stringify(events2));
await browser.close();
