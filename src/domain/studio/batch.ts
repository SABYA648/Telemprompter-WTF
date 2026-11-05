import { getDb } from './db';
import { analytics } from '../analytics';

export interface BatchState {
  ids: string[];
  index: number;
  takeIds: string[];
}
const key = 'studio.batch';
const BADGE_KEY = 'badge.batch_day';
const save = (state: BatchState) => sessionStorage.setItem(key, JSON.stringify(state));
export function readBatch(): BatchState | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const state = JSON.parse(raw) as BatchState;
    if (
      !Array.isArray(state.ids) ||
      !Array.isArray(state.takeIds) ||
      !Number.isInteger(state.index)
    )
      return null;
    return state;
  } catch {
    return null;
  }
}
export function startBatch(ids: string[]): BatchState {
  const state = { ids: [...new Set(ids)], index: 0, takeIds: [] };
  save(state);
  return state;
}
export function isBatchScript(scriptId: string | undefined): boolean {
  const state = readBatch();
  return Boolean(scriptId && state && state.ids[state.index] === scriptId);
}
export async function advanceBatch(scriptId: string, takeId: string): Promise<boolean> {
  const state = readBatch();
  if (!state || state.ids[state.index] !== scriptId || state.takeIds.includes(takeId)) return false;
  state.takeIds.push(takeId);
  state.index++;
  save(state);
  if (state.index >= 2 && state.index >= state.ids.length) {
    const db = await getDb();
    if (!(await db.get('kv', BADGE_KEY))) {
      await db.put('kv', true, BADGE_KEY);
      analytics.track('unlocked_badge', { badge_id: 'batch_day' });
    }
  }
  return true;
}
export async function hasBatchBadge(): Promise<boolean> {
  return Boolean(await (await getDb()).get('kv', BADGE_KEY));
}
/** End before the last script. Takes already kept still reach the summary. */
export function finishBatchEarly(): BatchState | null {
  const state = readBatch();
  if (!state?.takeIds.length) {
    endBatch();
    return null;
  }
  const next = { ...state, ids: state.ids.slice(0, state.index) };
  save(next);
  return next;
}
export function endBatch(): void {
  sessionStorage.removeItem(key);
}
