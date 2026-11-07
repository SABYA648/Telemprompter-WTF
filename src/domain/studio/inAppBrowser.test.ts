import { expect, test } from 'vitest';
import { browserHandoffScript, browserHandoffUrl, isInAppBrowser } from './inAppBrowser';
test('detects embedded browsers', () => {
  for (const token of [
    'Instagram',
    'FBAN',
    'FBAV',
    'FB_IAB',
    'musical_ly',
    'TikTok',
    'BytedanceWebview',
    'Line/',
    'Snapchat',
  ])
    expect(isInAppBrowser(`Mozilla ${token}`)).toBe(true);
  expect(isInAppBrowser('Chrome Safari')).toBe(false);
});
test('carries script content in the URL fragment for an external browser', () => {
  const original = {
    title: 'A short script',
    body: 'Keep this private and local.',
    targetSeconds: 30,
    aspect: '9:16' as const,
  };
  const url = browserHandoffUrl('https://example.com', original);
  expect(url).toContain('/studio#/record/quick?handoff=');
  expect(browserHandoffScript(new URL(url).hash)).toEqual(original);
  expect(browserHandoffScript('#/record/quick?handoff=%7B%7D')).toBeNull();
});
