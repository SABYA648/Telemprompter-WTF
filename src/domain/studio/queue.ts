import { getDb } from './db';
import { listScripts } from './scriptsRepo';
import type { StudioScript } from './types';

export function upNext(scripts: StudioScript[]): StudioScript[] {
  return scripts
    .filter((script) => !script.deletedAt && script.order > 0)
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
}

/** Store the queue order. Queueing is not an edit, so `updatedAt` stays as it was. */
export async function setUpNext(ids: string[]): Promise<void> {
  const db = await getDb();
  const positions = new Map([...new Set(ids)].map((id, index) => [id, index + 1]));
  for (const script of await listScripts()) {
    const order = positions.get(script.id) ?? 0;
    if (order !== script.order) await db.put('scripts', { ...script, order });
  }
}

/** Swap a queued script with its neighbor. Returns the new order. */
export function moveInQueue(ids: string[], index: number, delta: -1 | 1): string[] {
  const target = index + delta;
  if (index < 0 || target < 0 || index >= ids.length || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
