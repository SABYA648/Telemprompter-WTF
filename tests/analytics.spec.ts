import { expect, test } from '@playwright/test';

test('Umami loads on the first page view, identifies the device, and validates events', async ({
  page,
}) => {
  const googleRequests: string[] = [];
  page.on('request', (request) => {
    if (/google/i.test(new URL(request.url()).hostname)) googleRequests.push(request.url());
  });
  let requested = 0;
  await page.route('https://analytics.sabya.pm/script.js', async (route) => {
    requested++;
    await route.fulfill({
      contentType: 'application/javascript',
      body: `window.__umami = []; window.umami = { identify: (id, data) => window.__umami.push({kind:'identify', id, data}), track: (event, data) => window.__umami.push({kind:'track', event, data}) };`,
    });
  });
  await page.goto('/features');
  await expect.poll(() => requested).toBe(1);
  await expect(page.getByRole('heading', { name: 'Optional analytics' })).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as typeof window & { __umami: Array<{ kind: string }> }).__umami?.filter(
            (call) => call.kind === 'identify',
          ).length ?? 0,
      ),
    )
    .toBe(1);
  const calls = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __umami: Array<{ kind: string; id?: string; data?: Record<string, string> }>;
        }
      ).__umami,
  );
  const identity = calls.find((call) => call.kind === 'identify');
  expect(identity?.id).toMatch(/^[A-Za-z0-9_-]{22}$/);
  expect(identity?.data).toMatchObject({
    display: 'browser',
    device_class: 'desktop',
    takes_bucket: '0',
  });
  const cta = page.locator('[data-analytics-cta="header"]');
  await cta.evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault());
  });
  await cta.click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as typeof window & { __umami: Array<{ event?: string }> }).__umami.filter(
            (call) => call.event === 'clicked_open_teleprompter',
          ).length,
      ),
    )
    .toBe(1);
  await cta.evaluate((element) => {
    (element as HTMLElement).dataset.contentCluster = 'not_valid';
  });
  await cta.click();
  const events = await page.evaluate(() =>
    (
      window as typeof window & {
        __umami: Array<{ event?: string; data?: Record<string, unknown> }>;
      }
    ).__umami.filter((call) => call.event === 'clicked_open_teleprompter'),
  );
  expect(events[0]?.data).toEqual({
    page_type: 'feature',
    content_cluster: 'features',
    cta_location: 'header',
  });
  expect(events[1]?.data).toEqual({ page_type: 'feature', cta_location: 'header' });
  expect(googleRequests).toEqual([]);
});
