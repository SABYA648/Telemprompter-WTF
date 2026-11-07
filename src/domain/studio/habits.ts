import { analytics, BADGE_IDS } from '../analytics';
import { getDb } from './db';
import { listScripts } from './scriptsRepo';
import { dayNumber, localDay, readStreak } from './streak';
import { listTakes } from './takesRepo';
import type { StudioTake } from './types';
import { parseMarkup } from './markup';

export type BadgeId = (typeof BADGE_IDS)[number];
/** H7 badges with fixed display copy. */
export const BADGES: Record<BadgeId, { label: string; detail: string }> = {
  first_take: { label: 'First take', detail: 'You kept your first take.' },
  first_save: { label: 'First save', detail: 'You saved a video off this device.' },
  takes_10: { label: '10 takes', detail: 'You kept 10 takes.' },
  takes_50: { label: '50 takes', detail: 'You kept 50 takes.' },
  takes_100: { label: '100 takes', detail: 'You kept 100 takes.' },
  streak_3: { label: '3 days in a row', detail: 'You showed up 3 days running.' },
  streak_7: { label: '7 days in a row', detail: 'You showed up 7 days running.' },
  streak_30: { label: '30 days in a row', detail: 'You showed up 30 days running.' },
  streak_100: { label: '100 days in a row', detail: 'You showed up 100 days running.' },
  batch_day: { label: 'Batch day', detail: 'You kept takes of 5 scripts in one day.' },
  challenge_30: { label: '30-day challenge', detail: 'You recorded on 30 different days.' },
};
const isBadge = (id: unknown): id is BadgeId =>
  typeof id === 'string' && (BADGE_IDS as readonly string[]).includes(id);
const takesBucket = (n: number) =>
  n >= 21 ? '21_plus' : n >= 6 ? '6_20' : n >= 2 ? '2_5' : n === 1 ? '1' : '0';
export function mondayOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDay(d);
}
export function dailyPromptIndex(date: Date, count: number): number {
  return ((dayNumber(localDay(date)) % count) + count) % count;
}
export function weeklyVideos(takes: StudioTake[], now = new Date()): number {
  const start = dayNumber(mondayOf(now));
  const end = start + 7;
  return new Set(
    takes
      .filter(
        (t) =>
          t.kept &&
          t.scriptId &&
          dayNumber(localDay(new Date(t.createdAt))) >= start &&
          dayNumber(localDay(new Date(t.createdAt))) < end,
      )
      .map((t) => t.scriptId),
  ).size;
}
export interface HabitSnapshot {
  videos: number;
  takes: number;
  minutes: number;
  words: number;
  averageWpm: number;
  weeklyVideos: number;
  weeklyGoal: 3 | 5 | 7;
  previousWeekVideos: number;
  previousWeekMinutes: number;
  previousWeekGoalMet: boolean;
  challengeDays: number;
  challengeJoined: string | null;
  badges: BadgeId[];
}
export async function readHabits(now = new Date()): Promise<HabitSnapshot> {
  const db = await getDb();
  const [takes, scripts, settings, joined, badges, challengeDates] = await Promise.all([
    listTakes(),
    listScripts(true),
    db.get('kv', 'settings'),
    db.get('kv', 'challenge.joined'),
    db.get('kv', 'badges'),
    db.get('kv', 'challenge.activeDates'),
  ]);
  const kept = takes.filter((t) => t.kept);
  try {
    localStorage.setItem('tw.takes_bucket', takesBucket(kept.length));
  } catch {
    /* Private mode or tests. */
  }
  const byId = new Map(scripts.map((s) => [s.id, s]));
  const duration = kept.reduce((sum, t) => sum + t.durationMs, 0);
  const words = kept.reduce(
    (sum, t) =>
      sum +
      (t.wordsRead ??
        (t.scriptId ? parseMarkup(byId.get(t.scriptId)?.body ?? '').spokenWordCount : 0)),
    0,
  );
  const previous = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const previousStart = dayNumber(mondayOf(previous));
  const previousTakes = kept.filter((t) => {
    const day = dayNumber(localDay(new Date(t.createdAt)));
    return day >= previousStart && day < previousStart + 7;
  });
  const previousWeekVideos = new Set(previousTakes.map((t) => t.scriptId).filter(Boolean)).size;
  const goal = ((settings as { habit?: { weeklyGoal?: number } } | undefined)?.habit?.weeklyGoal ??
    5) as 3 | 5 | 7;
  const challengeJoined = typeof joined === 'number' ? localDay(new Date(joined)) : null;
  const challengeDays = challengeJoined
    ? new Set([
        ...((Array.isArray(challengeDates) ? challengeDates : []) as string[]),
        ...kept
          .filter((t) => t.createdAt >= (joined as number))
          .map((t) => localDay(new Date(t.createdAt))),
      ]).size
    : 0;
  return {
    videos: new Set(kept.map((t) => t.scriptId).filter(Boolean)).size,
    takes: kept.length,
    minutes: Math.round(duration / 60000),
    words,
    averageWpm: duration ? Math.round((words * 60000) / duration) : 0,
    weeklyVideos: weeklyVideos(kept, now),
    weeklyGoal: [3, 5, 7].includes(goal) ? goal : 5,
    previousWeekVideos,
    previousWeekMinutes: Math.round(
      previousTakes.reduce((sum, t) => sum + t.durationMs, 0) / 60000,
    ),
    previousWeekGoalMet: previousWeekVideos >= goal,
    challengeDays: Math.min(30, challengeDays),
    challengeJoined,
    badges: Array.isArray(badges) ? badges.filter(isBadge) : [],
  };
}
let unlocking: Promise<unknown> = Promise.resolve();
/** Idempotent: a badge unlocks, tracks and celebrates once, however often its rule fires. */
export function unlockBadge(id: BadgeId): Promise<boolean> {
  // Serialized so a Keep and an export finishing together cannot both unlock the same badge.
  const run = unlocking.then(async () => {
    const db = await getDb();
    const current = (await db.get('kv', 'badges')) as unknown;
    const list = Array.isArray(current) ? current : [];
    if (list.includes(id)) return false;
    const unseen = (await db.get('kv', 'badges.unseen')) as unknown;
    await db.put('kv', [...list, id], 'badges');
    await db.put('kv', [...(Array.isArray(unseen) ? unseen : []), id], 'badges.unseen');
    analytics.track('unlocked_badge', { badge_id: id });
    if (typeof dispatchEvent === 'function') {
      dispatchEvent(new Event('studio-habits-changed'));
      dispatchEvent(new CustomEvent('studio-badge-unlocked', { detail: id }));
    }
    return true;
  });
  unlocking = run.catch(() => undefined);
  return run;
}
/** Badges unlocked but not yet acknowledged in the celebration, oldest first. */
export async function unseenBadges(): Promise<BadgeId[]> {
  const unseen = (await (await getDb()).get('kv', 'badges.unseen')) as unknown;
  return Array.isArray(unseen) ? unseen.filter(isBadge) : [];
}
export async function markBadgeSeen(id: BadgeId): Promise<void> {
  const db = await getDb();
  const rest = (await unseenBadges()).filter((item) => item !== id);
  if (rest.length) await db.put('kv', rest, 'badges.unseen');
  else await db.delete('kv', 'badges.unseen');
}
export async function joinChallenge(now = new Date()): Promise<void> {
  const db = await getDb();
  if (await db.get('kv', 'challenge.joined')) return;
  await db.put('kv', now.getTime(), 'challenge.joined');
  await db.put('kv', [], 'challenge.activeDates');
  analytics.track('joined_challenge');
  if (typeof dispatchEvent === 'function') dispatchEvent(new Event('studio-habits-changed'));
}
/** Recomputes every badge rule. Practice runs call this too, since they extend the streak. */
export async function refreshBadges(now = new Date()): Promise<HabitSnapshot> {
  const snap = await readHabits(now);
  const streak = await readStreak(now);
  const run = Math.max(streak.current, streak.best);
  const earned: BadgeId[] = [
    ...(snap.takes >= 1 ? (['first_take'] as const) : []),
    ...(snap.takes >= 10 ? (['takes_10'] as const) : []),
    ...(snap.takes >= 50 ? (['takes_50'] as const) : []),
    ...(snap.takes >= 100 ? (['takes_100'] as const) : []),
    ...(run >= 3 ? (['streak_3'] as const) : []),
    ...(run >= 7 ? (['streak_7'] as const) : []),
    ...(run >= 30 ? (['streak_30'] as const) : []),
    ...(run >= 100 ? (['streak_100'] as const) : []),
    ...(snap.challengeDays >= 30 ? (['challenge_30'] as const) : []),
  ];
  const today = localDay(now);
  const todaysScripts = new Set(
    (await listTakes())
      .filter((t) => t.kept && t.scriptId && localDay(new Date(t.createdAt)) === today)
      .map((t) => t.scriptId),
  );
  if (todaysScripts.size >= 5) earned.push('batch_day');
  for (const id of earned) await unlockBadge(id);
  return snap;
}
export async function onKeptTake(now = new Date()): Promise<void> {
  const db = await getDb();
  const joinedAt = await db.get('kv', 'challenge.joined');
  if (typeof joinedAt === 'number' && now.getTime() >= joinedAt) {
    const dates = (await db.get('kv', 'challenge.activeDates')) as string[] | undefined;
    await db.put(
      'kv',
      [...new Set([...(Array.isArray(dates) ? dates : []), localDay(now)])].slice(-60),
      'challenge.activeDates',
    );
  }
  const snap = await refreshBadges(now);
  if (snap.weeklyVideos >= snap.weeklyGoal) {
    const key = `goal.reached.${mondayOf(now)}`;
    if (!(await db.get('kv', key))) {
      await db.put('kv', true, key);
      analytics.track('reached_weekly_goal', { goal: snap.weeklyGoal });
    }
  }
  if (snap.challengeDays >= 30 && !(await db.get('kv', 'challenge.completed'))) {
    await db.put('kv', now.getTime(), 'challenge.completed');
    analytics.track('completed_challenge');
  }
  if (typeof dispatchEvent === 'function') dispatchEvent(new Event('studio-habits-changed'));
}
export async function onExportedTake(): Promise<void> {
  await unlockBadge('first_save');
}
/**
 * Puts a prompt's hook into the template's first section and keeps the angle as a note,
 * so the template's own hook placeholder is not read out twice.
 */
export function promptScriptBody(templateBody: string, hook: string, note: string): string {
  const lines = templateBody.split('\n');
  const noteLine = note ? [`// ${note}`] : [];
  if (!hook) return [...noteLine, templateBody].join('\n');
  if (!lines[0]?.startsWith('# ')) return [...noteLine, hook, '', templateBody].join('\n').trim();
  const next = lines.findIndex((line, i) => i > 0 && line.startsWith('# '));
  return [lines[0], hook, ...noteLine, ...(next > 0 ? lines.slice(next) : [])].join('\n');
}
