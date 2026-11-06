import { analytics } from '../analytics';
import { getDb } from './db';

/** Appendix B `StreakState`. Freezes and the run are replayed from `activeDates` on every read. */
export interface Streak {
  current: number;
  best: number;
  lastActiveDate: string | null;
  activeDates: string[];
  freezes: number;
  freezeUsedDates: string[];
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) / 86400000);
}
const fromNumber = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);
const valid = (day: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(day) && fromNumber(dayNumber(day)) === day;
export const streakBucket = (n: number): '1' | '2_6' | '7_29' | '30_99' | '100_plus' =>
  n >= 100 ? '100_plus' : n >= 30 ? '30_99' : n >= 7 ? '7_29' : n >= 2 ? '2_6' : '1';

/** Replays local days so a freeze is spent once, even after a long absence or reload. */
export function streakAt(dates: string[], now: Date, previousBest = 0): Streak {
  const today = dayNumber(localDay(now));
  const activeDates = [...new Set(dates.filter(valid))].sort().slice(-400);
  const active = new Set(activeDates.map(dayNumber));
  const lastActiveDate = activeDates.at(-1) ?? null;
  if (!active.size)
    return {
      current: 0,
      best: previousBest,
      lastActiveDate,
      activeDates,
      freezes: 0,
      freezeUsedDates: [],
    };
  let current = 0;
  let best = previousBest;
  let freezes = 0;
  let earnedAt = 0;
  const freezeUsedDates: string[] = [];
  const first = Math.min(...active);
  const last = Math.max(...active);
  // A future date by one day is possible after westward travel.
  const end = Math.max(today, Math.min(last, today + 1));
  for (let day = first; day <= end; day++) {
    if (active.has(day)) {
      current++;
      earnedAt++;
      if (earnedAt % 7 === 0) freezes = Math.min(2, freezes + 1);
      best = Math.max(best, current);
    } else if (current && day < today && freezes) {
      freezes--;
      current++;
      freezeUsedDates.push(fromNumber(day));
      best = Math.max(best, current);
    } else if (day < today || day < last) current = 0;
  }
  // The UI shows the current run through yesterday until the user records today.
  return { current, best, lastActiveDate, activeDates, freezes, freezeUsedDates };
}

export async function readStreak(now = new Date()): Promise<Streak> {
  const db = await getDb();
  const stored = (await db.get('kv', 'streak')) as Partial<Streak> | undefined;
  const next = streakAt(
    Array.isArray(stored?.activeDates) ? stored.activeDates : [],
    now,
    stored?.best ?? 0,
  );
  if (stored && JSON.stringify(stored) !== JSON.stringify(next)) {
    await db.put('kv', next, 'streak');
    // A D-027 record has no freeze history, so only a freeze for yesterday or the day before is new.
    const known = Array.isArray(stored.freezeUsedDates) ? stored.freezeUsedDates : null;
    const recent = dayNumber(localDay(now)) - 2;
    for (const day of next.freezeUsedDates)
      if (known ? !known.includes(day) : dayNumber(day) >= recent)
        analytics.track('used_streak_freeze');
    if (stored.current && !next.current)
      analytics.track('lost_streak', { previous_bucket: streakBucket(stored.current) });
  }
  mirrorStreakBucket(next.current);
  return next;
}
/** Umami session data reads this enum mirror; IndexedDB is async and analytics is not. */
function mirrorStreakBucket(current: number): void {
  try {
    localStorage.setItem('tw.streak_bucket', current ? streakBucket(current) : '0');
  } catch {
    /* Private mode or tests. */
  }
}
export async function markActiveDay(now = new Date()): Promise<Streak> {
  const before = await readStreak(now);
  const next = streakAt([...before.activeDates, localDay(now)], now, before.best);
  await (await getDb()).put('kv', next, 'streak');
  if (next.current > before.current)
    analytics.track('extended_streak', { streak_bucket: streakBucket(next.current) });
  mirrorStreakBucket(next.current);
  if (typeof dispatchEvent === 'function') dispatchEvent(new Event('studio-streak-changed'));
  return next;
}
