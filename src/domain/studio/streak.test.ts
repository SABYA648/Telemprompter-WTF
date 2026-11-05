import { describe, expect, it } from 'vitest';
import { localDay, streakAt } from './streak';

describe('local streak days', () => {
  it('counts one kept take per local day, carries on tomorrow, resets after a gap and keeps best', () => {
    expect(streakAt(['2026-11-05', '2026-11-05'], new Date(2026, 10, 5, 18)).current).toBe(1);
    expect(streakAt(['2026-11-05', '2026-11-06'], new Date(2026, 10, 6, 18))).toMatchObject({
      current: 2,
      best: 2,
    });
    expect(
      streakAt(['2026-11-05', '2026-11-06', '2026-11-09'], new Date(2026, 10, 9, 18)),
    ).toMatchObject({ current: 1, best: 2 });
    expect(streakAt(['2026-11-05', '2026-11-06'], new Date(2026, 10, 9, 18))).toMatchObject({
      current: 0,
      best: 2,
    });
  });
  it('uses the current local calendar date after a timezone change', () => {
    const instant = new Date('2026-11-06T01:00:00Z');
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/Los_Angeles';
      expect(localDay(instant)).toBe('2026-11-05');
      process.env.TZ = 'Asia/Tokyo';
      expect(localDay(instant)).toBe('2026-11-06');
      expect(streakAt(['2026-11-05'], instant).current).toBe(1);
      process.env.TZ = 'America/Los_Angeles';
      expect(streakAt(['2026-11-06'], instant).current).toBe(1);
    } finally {
      process.env.TZ = original;
    }
  });
  it('crosses both DST boundaries as one local calendar day', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      expect(streakAt(['2026-03-07', '2026-03-08'], new Date('2026-03-08T16:00:00Z')).current).toBe(
        2,
      );
      expect(streakAt(['2026-10-31', '2026-11-01'], new Date('2026-11-01T17:00:00Z')).current).toBe(
        2,
      );
    } finally {
      process.env.TZ = original;
    }
  });
});
