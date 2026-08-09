import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:8080';
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
const canary = 'SCRIPT_SECRET_CANARY_ctacheck99';
await page.goto(base + '/');
await page.locator('.editor-shell[data-hydrated]').waitFor();
const layerBeforeConsent = await page.evaluate(() => window.dataLayer?.length ?? 'absent');
await page.getByRole('button', { name: 'Allow analytics' }).click();
await page.waitForTimeout(1500);
await page.goto(base + '/guides/teleprompter-for-youtube');
await page.locator('a[data-cta-cluster]').first().click();
await page.locator('.editor-shell[data-hydrated]').waitFor();
await page.getByLabel('Teleprompter script').fill(`${canary}\n\nMore local words here.`);
await page.getByRole('button', { name: /Start teleprompter/ }).click();
await page.getByRole('dialog', { name: 'Teleprompter presenter' }).waitFor();
await page.waitForTimeout(1500);
await page.keyboard.press('Space'); // pause
await page.waitForTimeout(500);
const events = await page.evaluate(() =>
  (window.dataLayer ?? []).filter((e) => Array.isArray(e) && e[0] === 'event').map((e) => e.slice(1)),
);
const layerText = JSON.stringify(events);
console.log(JSON.stringify({
  dataLayerBeforeConsent: layerBeforeConsent,
  events,
  canaryLeaked: layerText.includes(canary),
}, null, 1));
await browser.close();
