import { expect, test } from '@playwright/test';

test('homepage creator CTA is visible on a phone and opens Studio', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const cta = page.getByRole('link', { name: 'Record a video' });
  await expect(cta).toBeVisible();
  expect((await cta.boundingBox())!.y).toBeLessThan(844);
  await cta.click();
  await expect(page).toHaveURL(/\/studio\?go=record/);
});

test('streak badge follows the local calendar with the Playwright clock', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T12:00:00') });
  await page.goto('/studio#/');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put({ current: 1, best: 1, activeDates: ['2026-11-05'] }, 'streak');
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByText('1-day streak')).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00'));
  await page.reload();
  await expect(page.getByText('1-day streak')).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-11-08T12:00:00'));
  await page.reload();
  await expect(page.getByText('Fresh start today', { exact: true })).toBeVisible();
  await page.goto('/studio#/settings/habit');
  await page.getByLabel('Show streak badge').uncheck();
  await page.goto('/studio#/');
  await expect(page.getByText('Fresh start today', { exact: true })).toHaveCount(0);
});

test('reminder settings download a daily local calendar event', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T12:00:00') });
  await page.goto('/studio#/settings/reminders');
  await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible();
  await page.getByLabel('Reminder time').fill('18:30');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  expect((await download).suggestedFilename()).toBe('teleprompter-daily-reminder.ics');
});

test('practice credits the streak after 80 percent', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T12:00:00') });
  await page.goto('/studio#/practice/quick');
  await expect(page.getByRole('heading', { name: /Practice:/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.clock.fastForward(60_000);
  await expect(page.getByText('Practice counted for today.')).toBeVisible();
  await page.goto('/studio#/');
  await expect(page.getByText('1-day streak')).toBeVisible();
});
