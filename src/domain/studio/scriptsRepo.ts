import { getDb } from './db';
import { randomId } from './ids';
import type { StudioScript } from './types';
import { FIRST_RUN_BODY, FIRST_RUN_TITLE } from '../../content/studio/starterScripts';

export function blankScript(now = Date.now()): StudioScript {
  return {
    id: randomId(),
    title: 'Untitled script',
    body: '',
    status: 'draft',
    templateId: null,
    targetSeconds: 30,
    aspect: '9:16',
    caption: '',
    hashtags: '',
    youtubeTitle: '',
    youtubeDescription: '',
    order: 0,
    plannedFor: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    lastRecordedAt: null,
    takeCount: 0,
  };
}
export async function listScripts(includeDeleted = false): Promise<StudioScript[]> {
  const db = await getDb();
  return ((await db.getAll('scripts')) as StudioScript[])
    .filter((script) => includeDeleted || !script.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getScript(id: string): Promise<StudioScript | undefined> {
  return (await getDb()).get('scripts', id) as Promise<StudioScript | undefined>;
}
export async function saveScript(script: StudioScript): Promise<StudioScript> {
  const next = { ...script, updatedAt: Date.now() };
  await (await getDb()).put('scripts', next);
  return next;
}
export async function createScript(partial: Partial<StudioScript> = {}): Promise<StudioScript> {
  const script = { ...blankScript(), ...partial };
  await (await getDb()).put('scripts', script);
  return script;
}
export async function softDelete(id: string): Promise<void> {
  const script = await getScript(id);
  if (script) await saveScript({ ...script, deletedAt: Date.now() });
}
export async function restoreScript(id: string): Promise<void> {
  const script = await getScript(id);
  if (script) await saveScript({ ...script, deletedAt: null });
}
export async function migrateQuickScript(): Promise<void> {
  const db = await getDb();
  if (await db.get('kv', 'migrations.quickImported')) return;
  let legacy = '';
  try {
    legacy = JSON.parse(localStorage.getItem('teleprompter-wtf.state') ?? '{}').script ?? '';
  } catch {
    /* ignored */
  }
  if (typeof legacy === 'string' && legacy.trim() && !(await getScript('quick')))
    await db.put('scripts', { ...blankScript(), id: 'quick', title: 'Quick script', body: legacy });
  await db.put('kv', true, 'migrations.quickImported');
}
export async function ensureFirstScript(): Promise<StudioScript | undefined> {
  const db = await getDb();
  const scripts = await listScripts();
  const quick = await getScript('quick');
  if (scripts.length) {
    await db.put('kv', true, 'library.initialized');
    return quick && !quick.deletedAt ? quick : scripts[0];
  }
  if ((await db.get('kv', 'library.initialized')) || (await listScripts(true)).length)
    return undefined;
  await db.put('kv', true, 'library.initialized');
  return createScript({
    id: 'quick',
    title: FIRST_RUN_TITLE,
    body: FIRST_RUN_BODY,
    targetSeconds: 30,
  });
}

export async function duplicateScript(id: string): Promise<StudioScript | undefined> {
  const original = await getScript(id);
  if (!original || original.deletedAt) return undefined;
  return createScript({
    ...original,
    id: randomId(),
    title: `${original.title} copy`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    takeCount: 0,
    lastRecordedAt: null,
  });
}

export async function purgeDeletedScripts(now = Date.now()): Promise<number> {
  const db = await getDb();
  const old = (await listScripts(true)).filter(
    (script) => script.deletedAt && now - script.deletedAt >= 30 * 86400000,
  );
  for (const script of old) await db.delete('scripts', script.id);
  return old.length;
}
