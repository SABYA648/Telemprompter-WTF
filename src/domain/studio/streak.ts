import { getDb } from './db';

export interface Streak {
  current: number;
  best: number;
  activeDates: string[];
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ordinal(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) / 86400000);
}

export function streakAt(dates: string[], now: Date): Streak {
  const days = [...new Set(dates.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort();
  const today = ordinal(localDay(now));
  let cursor = today;
  const ordinals = new Set(days.map(ordinal));
  if (!ordinals.has(cursor)) {
    // A westward timezone change can put a recent active date one day ahead locally.
    cursor = ordinals.has(today + 1) ? today + 1 : today - 1;
  }
  let current = 0;
  while (ordinals.has(cursor)) {
    current++;
    cursor--;
  }
  let run = 0;
  let best = 0;
  let previous = -Infinity;
  for (const day of days) {
    const value = ordinal(day);
    run = value === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = value;
  }
  return { current, best, activeDates: days };
}

export async function readStreak(now = new Date()): Promise<Streak> {
  const stored = (await (await getDb()).get('kv', 'streak')) as Partial<Streak> | undefined;
  const value = streakAt(Array.isArray(stored?.activeDates) ? stored.activeDates : [], now);
  return { ...value, best: Math.max(value.best, stored?.best ?? 0) };
}

export async function markActiveDay(now = new Date()): Promise<Streak> {
  const before = await readStreak(now);
  const value = streakAt([...before.activeDates, localDay(now)], now);
  const next = {
    ...value,
    best: Math.max(before.best, value.best),
    activeDates: value.activeDates.slice(-366),
  };
  await (await getDb()).put('kv', next, 'streak');
  if (typeof dispatchEvent === 'function') dispatchEvent(new Event('studio-streak-changed'));
  return next;
}
