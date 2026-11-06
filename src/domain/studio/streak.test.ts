import { describe, expect, it } from 'vitest';
import { bestStreakInPreviousWeek, localDay, streakAt } from './streak';

const run = (from: string, days: number) => {
  const start = new Date(`${from}T12:00:00`);
  return Array.from({ length: days }, (_, i) =>
    localDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)),
  );
};

describe('streak freezes', () => {
  it('earns the first freeze on the seventh streak day, not before', () => {
    expect(streakAt(run('2026-11-01', 6), new Date(2026, 10, 6)).freezes).toBe(0);
    expect(streakAt(run('2026-11-01', 7), new Date(2026, 10, 7)).freezes).toBe(1);
    expect(streakAt(run('2026-11-01', 13), new Date(2026, 10, 13)).freezes).toBe(1);
    expect(streakAt(run('2026-11-01', 14), new Date(2026, 10, 14)).freezes).toBe(2);
  });
  it('holds at most two freezes', () => {
    expect(streakAt(run('2026-10-01', 35), new Date(2026, 10, 4)).freezes).toBe(2);
  });
  it('auto-applies two freezes across a two-day gap and keeps counting', () => {
    const dates = run('2026-11-01', 14);
    const onDay17 = streakAt(dates, new Date(2026, 10, 17, 9));
    expect(onDay17.freezeUsedDates).toEqual(['2026-11-15', '2026-11-16']);
    expect(onDay17).toMatchObject({ current: 16, freezes: 0, best: 16 });
    expect(streakAt([...dates, '2026-11-17'], new Date(2026, 10, 17, 20)).current).toBe(17);
  });
  it('loses the streak when a gap is longer than the freezes held, and keeps the best', () => {
    const dates = run('2026-11-01', 7);
    const onDay10 = streakAt(dates, new Date(2026, 10, 10));
    expect(onDay10.current).toBe(0);
    expect(onDay10.best).toBe(8);
    expect(onDay10.freezeUsedDates).toEqual(['2026-11-08']);
    expect(streakAt([...dates, '2026-11-10'], new Date(2026, 10, 10)).current).toBe(1);
  });
  it('does not spend a freeze on today, which can still be recorded', () => {
    const today = streakAt(run('2026-11-01', 7), new Date(2026, 10, 8, 23, 59));
    expect(today).toMatchObject({ current: 7, freezes: 1, freezeUsedDates: [] });
  });
  it('does not earn freezes from frozen days', () => {
    // 7 real days earn one freeze, one frozen day, then 6 real days: 13 real days earn just one.
    const dates = [...run('2026-11-01', 7), ...run('2026-11-09', 6)];
    const value = streakAt(dates, new Date(2026, 10, 14));
    expect(value.current).toBe(14);
    expect(value.freezes).toBe(0);
    expect(streakAt([...dates, '2026-11-15'], new Date(2026, 10, 15)).freezes).toBe(1);
  });
  it('fills the Appendix B fields and ignores invalid dates', () => {
    expect(streakAt(['2026-02-30', 'nope', '2026-11-05'], new Date(2026, 10, 5))).toMatchObject({
      current: 1,
      lastActiveDate: '2026-11-05',
      activeDates: ['2026-11-05'],
    });
    expect(streakAt([], new Date(2026, 10, 5), 4)).toMatchObject({
      current: 0,
      best: 4,
      lastActiveDate: null,
    });
  });
  it('keeps at most 400 active dates', () => {
    expect(streakAt(run('2025-01-01', 450), new Date(2026, 2, 26)).activeDates).toHaveLength(400);
  });
});

describe('local streak days', () => {
  it('limits the Monday recap streak to the previous week', () => {
    const older = run('2026-09-01', 30);
    const streak = streakAt([...older, '2026-11-11'], new Date(2026, 10, 16));
    expect(streak.best).toBeGreaterThanOrEqual(30);
    expect(bestStreakInPreviousWeek(streak, new Date(2026, 10, 16))).toBe(1);
  });
  it('earns one freeze per seven active days, caps at two and spends them across gaps', () => {
    const dates = Array.from({ length: 21 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    expect(streakAt(dates, new Date(2026, 10, 21))).toMatchObject({ current: 21, freezes: 2 });
    const afterGap = streakAt(dates, new Date(2026, 10, 24));
    expect(afterGap.freezeUsedDates).toEqual(['2026-11-22', '2026-11-23']);
    expect(afterGap.freezes).toBe(0);
    expect(afterGap.current).toBe(23);
    const resumed = streakAt([...dates, '2026-11-24'], new Date(2026, 10, 24));
    expect(resumed.current).toBe(24);
    expect(streakAt(dates, new Date(2026, 10, 25)).current).toBe(0);
  });
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
