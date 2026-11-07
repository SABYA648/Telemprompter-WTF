import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { StudioIdea, StudioScript, StudioTake, TakeChunk } from './types';

interface StudioDb extends DBSchema {
  scripts: {
    key: string;
    value: StudioScript;
    indexes: { updatedAt: number; status: string; order: number };
  };
  takes: {
    key: string;
    value: StudioTake;
    indexes: { scriptId: string; createdAt: number; status: string };
  };
  chunks: { key: [string, number]; value: TakeChunk; indexes: { takeId: string } };
  ideas: { key: string; value: StudioIdea; indexes: { createdAt: number } };
  kv: { key: string; value: unknown };
}
type Store = 'scripts' | 'takes' | 'chunks' | 'ideas' | 'kv';
type Key = string | [string, number];
const memory = new Map<Store, Map<string, unknown>>();
let database: Promise<IDBPDatabase<StudioDb>> | null = null;
let memoryMode = false;
const keyString = (key: Key) => JSON.stringify(key);
function memoryStore(name: Store): Map<string, unknown> {
  let store = memory.get(name);
  if (!store) {
    store = new Map();
    memory.set(name, store);
  }
  return store;
}
async function open(): Promise<IDBPDatabase<StudioDb> | null> {
  if (memoryMode) return null;
  try {
    if (!database)
      database = openDB<StudioDb>('teleprompter-wtf', 1, {
        upgrade(db) {
          const scripts = db.createObjectStore('scripts', { keyPath: 'id' });
          scripts.createIndex('updatedAt', 'updatedAt');
          scripts.createIndex('status', 'status');
          scripts.createIndex('order', 'order');
          const takes = db.createObjectStore('takes', { keyPath: 'id' });
          takes.createIndex('scriptId', 'scriptId');
          takes.createIndex('createdAt', 'createdAt');
          takes.createIndex('status', 'status');
          const chunks = db.createObjectStore('chunks', { keyPath: ['takeId', 'seq'] });
          chunks.createIndex('takeId', 'takeId');
          const ideas = db.createObjectStore('ideas', { keyPath: 'id' });
          ideas.createIndex('createdAt', 'createdAt');
          db.createObjectStore('kv');
        },
      });
    return await database;
  } catch {
    memoryMode = true;
    database = null;
    return null;
  }
}
export function isMemoryStorage(): boolean {
  return memoryMode;
}
export async function getDb() {
  const db = await open();
  return {
    async get(name: Store, key: Key): Promise<unknown> {
      if (!db) return memoryStore(name).get(keyString(key));
      try {
        return await db.get(name as 'scripts', key as string);
      } catch {
        memoryMode = true;
        return memoryStore(name).get(keyString(key));
      }
    },
    async getAll(name: Store): Promise<unknown[]> {
      if (!db) return [...memoryStore(name).values()];
      try {
        return await db.getAll(name as 'scripts');
      } catch {
        memoryMode = true;
        return [...memoryStore(name).values()];
      }
    },
    async put(name: Store, value: unknown, key?: Key): Promise<void> {
      const row = value as { id?: string; takeId?: string; seq?: number };
      const actualKey =
        key ?? (name === 'chunks' ? [row.takeId ?? '', row.seq ?? 0] : (row.id ?? ''));
      if (!db || memoryMode) {
        memoryStore(name).set(keyString(actualKey), value);
        return;
      }
      try {
        if (name === 'kv') await db.put('kv', value, key as string);
        else await db.put(name as 'scripts', value as StudioScript);
      } catch (error) {
        if (name === 'takes' || name === 'chunks') throw error;
        memoryMode = true;
        memoryStore(name).set(keyString(actualKey), value);
      }
    },
    async delete(name: Store, key: Key): Promise<void> {
      if (!db || memoryMode) {
        memoryStore(name).delete(keyString(key));
        return;
      }
      try {
        await db.delete(name as 'scripts', key as string);
      } catch {
        memoryMode = true;
        memoryStore(name).delete(keyString(key));
      }
    },
  };
}
export async function resetDbForTests(): Promise<void> {
  const pending = database;
  database = null;
  memoryMode = false;
  memory.clear();
  if (pending) {
    try {
      (await pending).close();
    } catch {
      /* failed open */
    }
  }
}
