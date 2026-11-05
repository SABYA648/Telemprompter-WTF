import { getDb } from './db';
import type { StudioTake, TakeChunk } from './types';

export async function listTakes(): Promise<StudioTake[]> {
  return ((await (await getDb()).getAll('takes')) as StudioTake[]).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}
export async function getTake(id: string): Promise<StudioTake | undefined> {
  return (await getDb()).get('takes', id) as Promise<StudioTake | undefined>;
}
export async function saveTake(take: StudioTake): Promise<void> {
  await (await getDb()).put('takes', take);
}
export async function saveChunk(chunk: TakeChunk): Promise<void> {
  await (await getDb()).put('chunks', chunk);
}
export function orderedChunks(chunks: TakeChunk[]): TakeChunk[] {
  return [...chunks].sort((a, b) => a.seq - b.seq);
}
export async function takeBlob(take: StudioTake): Promise<Blob> {
  const chunks = ((await (await getDb()).getAll('chunks')) as TakeChunk[]).filter(
    (c) => c.takeId === take.id,
  );
  return new Blob(
    orderedChunks(chunks).map((c) => c.blob),
    { type: take.mimeType },
  );
}
export async function deleteTake(id: string): Promise<void> {
  const db = await getDb();
  for (const chunk of (await db.getAll('chunks')) as TakeChunk[])
    if (chunk.takeId === id) await db.delete('chunks', [id, chunk.seq]);
  await db.delete('takes', id);
}
export async function recoverTakes(): Promise<StudioTake[]> {
  const recovered: StudioTake[] = [];
  const db = await getDb();
  const chunks = (await db.getAll('chunks')) as TakeChunk[];
  for (const take of await listTakes()) {
    if (take.status === 'recovered') {
      if (!(await db.get('kv', `recovery.announced.${take.id}`))) {
        recovered.push(take);
        await db.put('kv', true, `recovery.announced.${take.id}`);
      }
      continue;
    }
    if (take.status !== 'recording') continue;
    const own = chunks.filter((c) => c.takeId === take.id);
    if (!own.length) {
      await deleteTake(take.id);
      continue;
    }
    const next = {
      ...take,
      status: 'recovered' as const,
      chunkCount: own.length,
      sizeBytes: own.reduce((n, c) => n + c.blob.size, 0),
      durationMs: own.length * 1000,
    };
    await saveTake(next);
    recovered.push(next);
    await db.put('kv', true, `recovery.announced.${take.id}`);
  }
  return recovered;
}
