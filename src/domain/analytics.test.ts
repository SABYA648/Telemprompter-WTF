import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  filterSafeProperties,
  isAllowedAnalyticsEvent,
  normalizeStudioPath,
  validateEventProperties,
} from './analytics';

describe('analytics taxonomy', () => {
  it('allows the classic and studio events while rejecting retired events', () => {
    expect(ANALYTICS_EVENTS).toContain('started_teleprompter');
    expect(ANALYTICS_EVENTS).toContain('kept_take');
    expect(isAllowedAnalyticsEvent('kept_take')).toBe(true);
    expect(isAllowedAnalyticsEvent('allowed_usage_analytics')).toBe(false);
    expect(isAllowedAnalyticsEvent('unknown_event')).toBe(false);
  });
  it('keeps only valid properties and enum values', () => {
    expect(
      validateEventProperties('started_take', {
        aspect: '9_16',
        resolution: '1080p',
        fps: 30,
        facing: 'front',
        mode: 'full',
        countdown: 3,
        has_target: true,
        title: 'private',
        invalid: true,
      }),
    ).toEqual({
      aspect: '9_16',
      resolution: '1080p',
      fps: 30,
      facing: 'front',
      mode: 'full',
      countdown: 3,
      has_target: true,
    });
    expect(validateEventProperties('camera_failed', { reason: 'not-real' })).toEqual({});
    expect(
      validateEventProperties('clicked_open_teleprompter', {
        page_type: 'guide',
        cta_location: 'inline',
        content_cluster: 'creator',
        title: 'private',
      }),
    ).toEqual({ page_type: 'guide', cta_location: 'inline', content_cluster: 'creator' });
  });
  it('filters malformed keys and strings over 40 characters', () => {
    expect(
      filterSafeProperties({
        good_key: 'a'.repeat(40),
        long: 'a'.repeat(41),
        'Bad Key': 'x',
        infinite: Infinity,
      }),
    ).toEqual({ good_key: 'a'.repeat(40) });
  });
  it('normalizes Studio paths without carrying identifiers', () => {
    expect(normalizeStudioPath('/studio#/scripts/private-title')).toBe('/studio/editor');
    expect(normalizeStudioPath('#/takes/secret')).toBe('/studio/take');
    expect(normalizeStudioPath('#/receive/private')).toBe('/studio/receive');
    expect(normalizeStudioPath('#/settings/camera')).toBe('/studio/settings/camera');
    expect(normalizeStudioPath('#/settings/private')).toBe('/studio/settings');
  });
});

describe('analytics transport', () => {
  it('queues at most 50 events and flushes after identification', async () => {
    const { vi } = await import('vitest');
    const { webcrypto } = await import('node:crypto');
    const store = new Map<string, string>();
    const calls: Array<{ event: unknown; data: unknown }> = [];
    const identify = vi.fn();
    const fakeWindow = {
      umami: undefined as
        undefined | { identify: typeof identify; track: (event: unknown, data?: unknown) => void },
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
    };
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('screen', { width: 1440, height: 900 });
    vi.stubGlobal('crypto', webcrypto);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    vi.stubGlobal('document', { querySelector: () => null });
    try {
      const { Analytics } = await import('./analytics');
      const analytics = new Analytics();
      for (let index = 0; index < 55; index++) analytics.track('finished_teleprompter');
      fakeWindow.umami = { identify, track: (event, data) => calls.push({ event, data }) };
      analytics.initialize();
      expect(identify).toHaveBeenCalledOnce();
      expect(identify.mock.calls[0]?.[0]).toMatch(/^[A-Za-z0-9_-]{22}$/);
      expect(calls).toHaveLength(50);
      expect(store.get('tw.did')).toMatch(/^[A-Za-z0-9_-]{22}$/);
      analytics.page('#/scripts/private-title', 'private title');
      const pageCall = calls.at(-1)?.event;
      expect(typeof pageCall).toBe('function');
      expect((pageCall as (payload: object) => object)({})).toEqual({
        url: '/studio/editor',
        title: 'studio / editor',
      });
      for (let index = 0; index < 7; index++) analytics.error('site', 'TypeError');
      expect(calls.filter((call) => call.event === 'js_error')).toHaveLength(5);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
