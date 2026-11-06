import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  claimSessionAsk,
  emptyAskState,
  inlineAsk,
  markMilestoneOffered,
  mayAsk,
  nextAsk,
  offeredMilestones,
  ratingDone,
  saveRating,
  sessionAsk,
  shareMilestone,
} from './asks';
import { resetDbForTests } from './db';

const DAY = 86400000;
const base = {
  recording: false,
  exported: 1,
  sessions: 1,
  activeDays: 2,
  installed: false,
  keptTakes: 3,
  now: Date.UTC(2026, 10, 6),
};
const all = { install: true, reminder: true, share_card: true, rating: true };
const session = new Map<string, string>();
beforeEach(async () => {
  await resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
  session.clear();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => session.set(key, value),
  });
});

describe('ask ladder', () => {
  it('gives only one ask per session and none during recording', () => {
    expect(mayAsk('install', emptyAskState(), base)).toBe(true);
    expect(mayAsk('install', { ...emptyAskState(), sessionAsk: 'reminder' }, base)).toBe(false);
    expect(mayAsk('rating', { ...emptyAskState(), sessionAsk: 'install' }, base)).toBe(false);
    expect(mayAsk('rating', emptyAskState(), { ...base, recording: true })).toBe(false);
    expect(mayAsk('reminder', emptyAskState(), { ...base, recording: true })).toBe(false);
    // The ask that holds the session may stay on screen after navigation.
    expect(mayAsk('rating', { ...emptyAskState(), sessionAsk: 'rating' }, base)).toBe(true);
  });
  it('claims the session slot once, in sessionStorage', () => {
    expect(sessionAsk()).toBeNull();
    expect(claimSessionAsk('reminder')).toBe(true);
    expect(claimSessionAsk('reminder')).toBe(true);
    expect(claimSessionAsk('install')).toBe(false);
    expect(claimSessionAsk('rating')).toBe(false);
    expect(sessionAsk()).toBe('reminder');
  });
  it('limits installs to three and waits seven days after a dismissal', () => {
    expect(mayAsk('install', { ...emptyAskState(), installShown: 2 }, base)).toBe(true);
    expect(mayAsk('install', { ...emptyAskState(), installShown: 3 }, base)).toBe(false);
    const dismissed = (ago: number) => ({ ...emptyAskState(), installDismissedAt: base.now - ago });
    expect(mayAsk('install', dismissed(7 * DAY - 1), base)).toBe(false);
    expect(mayAsk('install', dismissed(7 * DAY), base)).toBe(true);
    expect(mayAsk('install', emptyAskState(), { ...base, exported: 0, sessions: 1 })).toBe(false);
    expect(mayAsk('install', emptyAskState(), { ...base, exported: 0, sessions: 2 })).toBe(true);
    expect(mayAsk('install', emptyAskState(), { ...base, installed: true })).toBe(false);
  });
  it('asks for the reminder after two active days or right after installing', () => {
    expect(mayAsk('reminder', emptyAskState(), { ...base, activeDays: 1 })).toBe(false);
    expect(mayAsk('reminder', emptyAskState(), base)).toBe(true);
    expect(mayAsk('reminder', emptyAskState(), { ...base, activeDays: 0, installed: true })).toBe(
      true,
    );
  });
  it('asks for a rating once, after the third kept take', async () => {
    expect(mayAsk('rating', emptyAskState(), { ...base, keptTakes: 2 })).toBe(false);
    expect(mayAsk('rating', emptyAskState(), base)).toBe(true);
    expect(mayAsk('rating', { ...emptyAskState(), ratingDone: true }, base)).toBe(false);
    expect(await ratingDone()).toBe(false);
    expect(await saveRating(4)).toBe(true);
    expect(await saveRating(2)).toBe(false);
    expect(await ratingDone()).toBe(true);
  });
  it('treats a skipped rating as done', async () => {
    expect(await saveRating(0)).toBe(true);
    expect(await ratingDone()).toBe(true);
  });
  it('picks the first eligible step in ladder order and respects switched-off steps', () => {
    const quiet = { ...base, exported: 0, activeDays: 1, keptTakes: 0 };
    expect(nextAsk(emptyAskState(), quiet, all)).toBeNull();
    expect(nextAsk(emptyAskState(), { ...quiet, milestone: true, keptTakes: 3 }, all)).toBe(
      'share_card',
    );
    expect(nextAsk(emptyAskState(), base, { ...all, install: false })).toBe('reminder');
    expect(nextAsk(emptyAskState(), base, { ...all, install: false, reminder: false })).toBe(
      'rating',
    );
    expect(nextAsk({ ...emptyAskState(), sessionAsk: 'rating' }, base, all)).toBe('rating');
    // Answered within the session: the slot stays used and nothing else replaces it.
    expect(
      nextAsk({ ...emptyAskState(), sessionAsk: 'rating', ratingDone: true }, base, all),
    ).toBeNull();
    expect(
      nextAsk({ ...emptyAskState(), sessionAsk: 'rating' }, base, { ...all, rating: false }),
    ).toBe(null);
  });
  it('offers each share milestone once: streak 3, 7, 30, a weekly goal and the challenge', async () => {
    const input = {
      streak: 2,
      weeklyGoalReached: false,
      challengeComplete: false,
      week: '2026-11-02',
    };
    expect(shareMilestone({ ...input, offered: [] })).toBeNull();
    expect(shareMilestone({ ...input, streak: 3, offered: [] })).toEqual({
      key: 'streak_3',
      kind: 'streak',
    });
    expect(shareMilestone({ ...input, streak: 4, offered: [] })).toBeNull();
    expect(shareMilestone({ ...input, streak: 7, offered: ['streak_3'] })?.key).toBe('streak_7');
    expect(shareMilestone({ ...input, streak: 30, offered: [] })?.key).toBe('streak_30');
    expect(shareMilestone({ ...input, weeklyGoalReached: true, offered: [] })?.key).toBe(
      'weekly_2026-11-02',
    );
    expect(
      shareMilestone({ ...input, weeklyGoalReached: true, offered: ['weekly_2026-11-02'] }),
    ).toBeNull();
    expect(shareMilestone({ ...input, challengeComplete: true, offered: [] })?.kind).toBe(
      'challenge',
    );
    await markMilestoneOffered('streak_3');
    await markMilestoneOffered('streak_3');
    expect(await offeredMilestones()).toEqual(['streak_3']);
  });
  it('shows inline save guidance and storage cleanup at their thresholds', () => {
    expect(inlineAsk('save_take', { review: true })).toBe(true);
    expect(inlineAsk('save_take', {})).toBe(false);
    expect(inlineAsk('storage_cleanup', { quotaUsedPct: 80, unexportedTakes: 20 })).toBe(false);
    expect(inlineAsk('storage_cleanup', { quotaUsedPct: 81 })).toBe(true);
    expect(inlineAsk('storage_cleanup', { unexportedTakes: 21 })).toBe(true);
  });
});
