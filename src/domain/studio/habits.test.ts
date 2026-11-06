import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb, resetDbForTests } from './db';
import { analytics } from '../analytics';
import {
  dailyPromptIndex,
  mondayOf,
  onKeptTake,
  promptScriptBody,
  readHabits,
  refreshBadges,
  markBadgeSeen,
  unseenBadges,
  unlockBadge,
  weeklyVideos,
  joinChallenge,
} from './habits';
import { readStreak, markActiveDay } from './streak';
import type { StudioTake } from './types';

const take = (scriptId: string, date: string): StudioTake => ({
  id: `${scriptId}-${date}`,
  scriptId,
  sectionIndex: null,
  number: 1,
  status: 'ready',
  mimeType: 'video/webm',
  container: 'webm',
  width: 720,
  height: 1280,
  frameRate: 30,
  facing: 'front',
  durationMs: 60000,
  sizeBytes: 12345,
  chunkCount: 1,
  kept: true,
  starred: false,
  exportedAt: null,
  createdAt: new Date(`${date}T12:00:00`).getTime(),
  timeline: [],
  trim: null,
});
beforeEach(async () => {
  await resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
  vi.stubGlobal('dispatchEvent', () => true);
  vi.restoreAllMocks();
});
const at = (date: string, hour = 12) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour);
};
const keptOn = (scriptId: string, date: string, n = 1): StudioTake => ({
  ...take(scriptId, date),
  id: `${scriptId}-${date}-${n}`,
  createdAt: at(date, 9 + n).getTime(),
});

describe('habit data', () => {
  it('uses Monday 00:00 local time and counts distinct scripts', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      expect(mondayOf(new Date('2026-11-09T04:59:59Z'))).toBe('2026-11-02');
      expect(mondayOf(new Date('2026-11-09T05:00:00Z'))).toBe('2026-11-09');
      const takes = [take('a', '2026-11-08'), take('a', '2026-11-09'), take('b', '2026-11-09')];
      expect(weeklyVideos(takes, new Date('2026-11-09T05:00:00Z'))).toBe(2);
    } finally {
      process.env.TZ = original;
    }
  });
  it('chooses the same prompt by local date', () => {
    expect(dailyPromptIndex(new Date(2026, 10, 6, 8), 120)).toBe(
      dailyPromptIndex(new Date(2026, 10, 6, 22), 120),
    );
  });
  it('unlocks badges once and tracks challenge days since join', async () => {
    expect(await unlockBadge('first_take')).toBe(true);
    expect(await unlockBadge('first_take')).toBe(false);
    const db = await getDb();
    expect(await db.get('kv', 'badges')).toEqual(['first_take']);
    await joinChallenge(new Date(2026, 10, 6, 0));
    await db.put('takes', take('a', '2026-11-05'));
    await db.put('takes', take('a', '2026-11-06'));
    await db.put('takes', take('b', '2026-11-06'));
    expect((await readHabits(new Date(2026, 10, 6))).challengeDays).toBe(1);
  });
  it('migrates D-027 dates and persists a spent freeze', async () => {
    const db = await getDb();
    await db.put(
      'kv',
      {
        current: 7,
        best: 7,
        activeDates: [
          '2026-11-01',
          '2026-11-02',
          '2026-11-03',
          '2026-11-04',
          '2026-11-05',
          '2026-11-06',
          '2026-11-07',
        ],
      },
      'streak',
    );
    const onNinth = await readStreak(new Date(2026, 10, 9));
    expect(onNinth.freezeUsedDates).toEqual(['2026-11-08']);
    expect(onNinth.freezes).toBe(0);
    expect((await markActiveDay(new Date(2026, 10, 9))).current).toBe(9);
    expect((await readStreak(new Date(2026, 10, 9))).current).toBe(9);
  });
  it('starts the week at Monday 00:00 local time', () => {
    expect(mondayOf(new Date(2026, 10, 8, 23, 59, 59))).toBe('2026-11-02');
    expect(mondayOf(new Date(2026, 10, 9, 0, 0, 0))).toBe('2026-11-09');
    const takes = [
      { ...take('a', '2026-11-08'), createdAt: new Date(2026, 10, 8, 23, 59, 59).getTime() },
      { ...take('b', '2026-11-09'), createdAt: new Date(2026, 10, 9, 0, 0, 0).getTime() },
    ];
    expect(weeklyVideos(takes, new Date(2026, 10, 8, 23, 59, 59))).toBe(1);
    expect(weeklyVideos(takes, new Date(2026, 10, 9, 0, 0, 0))).toBe(1);
    expect(weeklyVideos(takes, new Date(2026, 10, 15, 23, 59, 59))).toBe(1);
    expect(weeklyVideos(takes, new Date(2026, 10, 16, 0, 0, 0))).toBe(0);
  });
  it('counts a video once per script however many takes it has, and ignores unkept takes', () => {
    const takes = [
      keptOn('a', '2026-11-10', 1),
      keptOn('a', '2026-11-10', 2),
      keptOn('a', '2026-11-11', 1),
      { ...keptOn('b', '2026-11-11'), kept: false },
    ];
    expect(weeklyVideos(takes, at('2026-11-12'))).toBe(1);
  });
  it('reports videos, takes, minutes, words read and average WPM', async () => {
    const db = await getDb();
    await db.put('takes', { ...keptOn('a', '2026-11-10', 1), durationMs: 30000, wordsRead: 70 });
    await db.put('takes', { ...keptOn('a', '2026-11-10', 2), durationMs: 90000, wordsRead: 210 });
    await db.put('takes', { ...keptOn('b', '2026-11-11', 1), kept: false, durationMs: 60000 });
    const snap = await readHabits(at('2026-11-12'));
    expect(snap).toMatchObject({ videos: 1, takes: 2, minutes: 2, words: 280, averageWpm: 140 });
  });
  it('builds the recap from the previous Monday-start week', async () => {
    const db = await getDb();
    for (const id of ['a', 'b', 'c']) await db.put('takes', keptOn(id, '2026-11-05'));
    await db.put('takes', keptOn('d', '2026-11-09'));
    await db.put('kv', { habit: { weeklyGoal: 3 } }, 'settings');
    const snap = await readHabits(at('2026-11-09'));
    expect(snap).toMatchObject({
      previousWeekVideos: 3,
      previousWeekMinutes: 3,
      previousWeekGoalMet: true,
      weeklyVideos: 1,
      weeklyGoal: 3,
    });
  });
  it('unlocks each badge exactly once, even when rules fire together', async () => {
    const track = vi.spyOn(analytics, 'track').mockImplementation(() => undefined);
    const results = await Promise.all([
      unlockBadge('first_save'),
      unlockBadge('first_save'),
      unlockBadge('first_save'),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const db = await getDb();
    await db.put('takes', keptOn('a', '2026-11-10'));
    await refreshBadges(at('2026-11-10'));
    await refreshBadges(at('2026-11-10'));
    expect(await db.get('kv', 'badges')).toEqual(['first_save', 'first_take']);
    expect(track.mock.calls.filter(([event]) => event === 'unlocked_badge')).toEqual([
      ['unlocked_badge', { badge_id: 'first_save' }],
      ['unlocked_badge', { badge_id: 'first_take' }],
    ]);
    expect(await unseenBadges()).toEqual(['first_save', 'first_take']);
    await markBadgeSeen('first_save');
    expect(await unseenBadges()).toEqual(['first_take']);
    await markBadgeSeen('first_take');
    expect(await unseenBadges()).toEqual([]);
  });
  it('awards takes, streak and batch day badges at their thresholds', async () => {
    const db = await getDb();
    for (let i = 0; i < 10; i++) await db.put('takes', keptOn(`s${i % 5}`, '2026-11-10', i));
    await db.put('kv', { activeDates: ['2026-11-08', '2026-11-09', '2026-11-10'] }, 'streak');
    await refreshBadges(at('2026-11-10', 22));
    expect(await db.get('kv', 'badges')).toEqual([
      'first_take',
      'takes_10',
      'streak_3',
      'batch_day',
    ]);
  });
  it('gives no batch day badge for four scripts in a day', async () => {
    const db = await getDb();
    for (let i = 0; i < 4; i++) await db.put('takes', keptOn(`s${i}`, '2026-11-10', i));
    await refreshBadges(at('2026-11-10', 22));
    expect(await db.get('kv', 'badges')).toEqual(['first_take']);
  });
  it('tracks the weekly goal once per week and challenge completion once', async () => {
    const track = vi.spyOn(analytics, 'track').mockImplementation(() => undefined);
    const db = await getDb();
    await db.put('kv', { habit: { weeklyGoal: 3 } }, 'settings');
    await joinChallenge(at('2026-10-01', 8));
    for (let day = 0; day < 30; day++) {
      const date = new Date(2026, 9, 1 + day, 12);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      await db.put('takes', keptOn(`v${day % 4}`, key));
      await onKeptTake(date);
    }
    const events = track.mock.calls.map(([event]) => event);
    expect(events.filter((e) => e === 'completed_challenge')).toHaveLength(1);
    // Five Monday-start weeks touch October 1 to 30, and the first holds four videos.
    expect(events.filter((e) => e === 'reached_weekly_goal')).toHaveLength(5);
    expect((await readHabits(at('2026-10-30'))).challengeDays).toBe(30);
    expect(await db.get('kv', 'badges')).toContain('challenge_30');
  });
  it('puts a prompt hook into the template hook section and keeps the angle as a note', () => {
    const body = '# Hook\nIf {your audience} keeps {x}, try this.\n# Value\nFirst, {step}.';
    expect(promptScriptBody(body, 'The mistake I made.', 'Show the cost.')).toBe(
      '# Hook\nThe mistake I made.\n// Show the cost.\n# Value\nFirst, {step}.',
    );
    expect(promptScriptBody(body, '', 'Day 1: Say who you help.')).toBe(
      `// Day 1: Say who you help.\n${body}`,
    );
    expect(promptScriptBody('Plain body', 'Hook line.', '')).toBe('Hook line.\n\nPlain body');
  });
});
