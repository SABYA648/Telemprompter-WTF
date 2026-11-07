import { getDb } from './db';
import { randomId } from './ids';
import type { StudioIdea } from './types';

export async function listIdeas(): Promise<StudioIdea[]> {
  return ((await (await getDb()).getAll('ideas')) as StudioIdea[]).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export async function createIdea(text: string): Promise<StudioIdea> {
  const clean = text.trim().slice(0, 10000);
  if (!clean) throw new Error('Write an idea first.');
  const idea = { id: randomId(), text: clean, createdAt: Date.now() };
  await (await getDb()).put('ideas', idea);
  return idea;
}

export async function deleteIdea(id: string): Promise<void> {
  await (await getDb()).delete('ideas', id);
}
