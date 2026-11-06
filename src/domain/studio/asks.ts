import { getDb } from './db';
import { installAskAllowed } from './install';

/** The 4.3 ladder steps that compete for the single ask a session may show. */
export type SessionAsk = 'install' | 'reminder' | 'share_card' | 'rating';
export interface AskState {
  /** The ask already shown this session, if any. */
  sessionAsk: SessionAsk | null;
  installShown: number;
  installDismissedAt: number;
  ratingDone: boolean;
}
export const emptyAskState = (): AskState => ({
  sessionAsk: null,
  installShown: 0,
  installDismissedAt: 0,
  ratingDone: false,
});
export interface AskContext {
  recording: boolean;
  exported: number;
  sessions: number;
  activeDays: number;
  installed: boolean;
  keptTakes: number;
  now: number;
  /** Streak, weekly goal or challenge milestone not yet offered as a share card. */
  milestone?: boolean;
}
/** One ask per session and never during recording. The same ask may stay on screen once claimed. */
export function mayAsk(kind: SessionAsk, state: AskState, context: AskContext): boolean {
  if (context.recording) return false;
  if (state.sessionAsk && state.sessionAsk !== kind) return false;
  if (kind === 'install')
    return (
      !context.installed &&
      installAskAllowed({
        exports: context.exported,
        sessions: context.sessions,
        shown: state.installShown,
        dismissedAt: state.installDismissedAt,
        now: context.now,
        shownThisSession: state.sessionAsk === 'install',
        recording: context.recording,
      })
    );
  if (kind === 'reminder') return context.activeDays >= 2 || context.installed;
  if (kind === 'share_card') return Boolean(context.milestone);
  return context.keptTakes >= 3 && !state.ratingDone;
}
/** Ladder order for the Home card: the first eligible step wins the session. */
export function nextAsk(
  state: AskState,
  context: AskContext,
  enabled: Record<SessionAsk, boolean>,
) {
  if (state.sessionAsk)
    return enabled[state.sessionAsk] && mayAsk(state.sessionAsk, state, context)
      ? state.sessionAsk
      : null;
  return (
    (['install', 'reminder', 'share_card', 'rating'] as const).find(
      (kind) => enabled[kind] && mayAsk(kind, state, context),
    ) ?? null
  );
}
/** Inline steps that never use the session ask: save guidance and the storage guardrail. */
export function inlineAsk(
  kind: 'save_take' | 'storage_cleanup',
  context: { review?: boolean; quotaUsedPct?: number; unexportedTakes?: number },
): boolean {
  if (kind === 'save_take') return Boolean(context.review);
  return (context.quotaUsedPct ?? 0) > 80 || (context.unexportedTakes ?? 0) > 20;
}
/** Share milestones from 4.3: streak 3, 7 and 30, a weekly goal and challenge completion. */
export function shareMilestone(input: {
  streak: number;
  weeklyGoalReached: boolean;
  challengeComplete: boolean;
  week: string;
  offered: string[];
}): { key: string; kind: 'streak' | 'weekly' | 'challenge' } | null {
  const candidates = [
    ...([3, 7, 30] as const)
      .filter((day) => input.streak >= day)
      .map((day) => ({ key: `streak_${day}`, kind: 'streak' as const })),
    ...(input.weeklyGoalReached ? [{ key: `weekly_${input.week}`, kind: 'weekly' as const }] : []),
    ...(input.challengeComplete ? [{ key: 'challenge', kind: 'challenge' as const }] : []),
  ];
  return candidates.find((c) => !input.offered.includes(c.key)) ?? null;
}

const SESSION_KEY = 'studio.ask.shown';
export function sessionAsk(): SessionAsk | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value === 'install' ||
      value === 'reminder' ||
      value === 'share_card' ||
      value === 'rating'
      ? value
      : null;
  } catch {
    return null;
  }
}
/** Claims this session's ask. Returns false if another ask already holds it. */
export function claimSessionAsk(kind: SessionAsk): boolean {
  const current = sessionAsk();
  if (current && current !== kind) return false;
  try {
    sessionStorage.setItem(SESSION_KEY, kind);
  } catch {
    /* Private mode: the in-memory state of this page still limits it. */
  }
  return true;
}

export async function ratingDone(): Promise<boolean> {
  return (await (await getDb()).get('kv', 'asks.rating')) !== undefined;
}
/** Stores the score, or `0` when skipped, exactly once. */
export async function saveRating(score: 0 | 1 | 2 | 3 | 4 | 5): Promise<boolean> {
  const db = await getDb();
  if ((await db.get('kv', 'asks.rating')) !== undefined) return false;
  await db.put('kv', score, 'asks.rating');
  return true;
}
export async function offeredMilestones(): Promise<string[]> {
  const value = (await (await getDb()).get('kv', 'asks.shareOffered')) as unknown;
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}
export async function markMilestoneOffered(key: string): Promise<void> {
  const db = await getDb();
  const current = await offeredMilestones();
  if (!current.includes(key)) await db.put('kv', [...current, key].slice(-60), 'asks.shareOffered');
}
