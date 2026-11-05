import { getDb } from './db';

export function minutesLeft(
  availableBytes: number,
  videoBitsPerSecond: number,
  audioBitsPerSecond = 128000,
): number {
  return Math.max(
    0,
    Math.floor((availableBytes * 8) / (videoBitsPerSecond + audioBitsPerSecond) / 60),
  );
}
export async function storageEstimate(): Promise<{ usage: number; quota: number }> {
  try {
    const result = await navigator.storage?.estimate?.();
    return { usage: result?.usage ?? 0, quota: result?.quota ?? 0 };
  } catch {
    return { usage: 0, quota: 0 };
  }
}
export function formatBytes(bytes: number): string {
  return bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;
}
/**
 * Ask for durable storage on the first standalone launch. This key is separate from the first-kept
 * take's, because Android shares storage between the browser and the installed app.
 */
export async function persistOnFirstStandaloneLaunch(standalone: boolean): Promise<boolean> {
  if (!standalone || !navigator.storage?.persist) return false;
  const db = await getDb();
  if (await db.get('kv', 'storage.persistRequestedStandalone')) return false;
  await db.put('kv', true, 'storage.persistRequestedStandalone');
  // Firefox can show a permission prompt here, so boot must not wait for the answer.
  void navigator.storage.persist().catch(() => undefined);
  return true;
}
