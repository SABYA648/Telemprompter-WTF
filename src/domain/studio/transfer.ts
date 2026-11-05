import { deviceId, analytics } from '../analytics';
import { getDb } from './db';
import { isPhone, loadSettings, sanitizeSettings, saveSettings } from './settings';
import type { StudioIdea, StudioScript } from './types';

const MAX_BYTES = 1024 * 1024;
const TOO_LARGE = 'Transfer exceeds 1 MB';
const INVALID = 'Invalid transfer code';
export interface TransferPayload {
  scripts: StudioScript[];
  ideas: StudioIdea[];
  settings: unknown;
  streak: unknown;
  did: string;
}
const statuses = ['idea', 'draft', 'ready', 'recorded', 'posted'];
const text = (value: unknown, max: number): string => {
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid transfer field');
  return value;
};
const id = (value: unknown): string => {
  const clean = text(value, 128);
  if (!clean) throw new Error('Invalid transfer field');
  return clean;
};
const number = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error('Invalid transfer field');
  return value;
};
const nullableTime = (value: unknown): number | null => (value === null ? null : number(value));
const nullableText = (value: unknown, max: number): string | null =>
  value === null ? null : text(value, max);
function script(raw: unknown): StudioScript {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid script');
  const s = raw as Record<string, unknown>;
  const status = text(s.status, 20);
  const aspect = text(s.aspect, 5);
  if (!statuses.includes(status) || !['9:16', '16:9'].includes(aspect))
    throw new Error('Invalid script');
  return {
    id: id(s.id),
    title: text(s.title, 500),
    body: text(s.body, MAX_BYTES),
    status: status as StudioScript['status'],
    templateId: nullableText(s.templateId, 128),
    targetSeconds: number(s.targetSeconds, 0, 86400),
    aspect: aspect as StudioScript['aspect'],
    caption: text(s.caption, 10000),
    hashtags: text(s.hashtags, 10000),
    youtubeTitle: text(s.youtubeTitle, 1000),
    youtubeDescription: text(s.youtubeDescription, 10000),
    order: number(s.order, -1000000, 1000000),
    plannedFor: nullableText(s.plannedFor, 64),
    createdAt: number(s.createdAt),
    updatedAt: number(s.updatedAt),
    deletedAt: nullableTime(s.deletedAt),
    lastRecordedAt: nullableTime(s.lastRecordedAt),
    takeCount: number(s.takeCount, 0, 1000000),
  };
}
function idea(raw: unknown): StudioIdea {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid idea');
  const i = raw as Record<string, unknown>;
  return { id: id(i.id), text: text(i.text, 10000), createdAt: number(i.createdAt) };
}
function safeStreak(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return number(value, -Number.MAX_SAFE_INTEGER);
  if (typeof value === 'string') return text(value, 256);
  if (depth >= 5 || !value || typeof value !== 'object') throw new Error('Invalid streak');
  if (Array.isArray(value)) {
    if (value.length > 366) throw new Error('Invalid streak');
    return value.map((item) => safeStreak(item, depth + 1));
  }
  const entries = Object.entries(value);
  if (entries.length > 64) throw new Error('Invalid streak');
  const clean: Record<string, unknown> = {};
  for (const [key, item] of entries) {
    if (
      !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key) ||
      ['constructor', 'prototype', '__proto__'].includes(key)
    )
      throw new Error('Invalid streak');
    clean[key] = safeStreak(item, depth + 1);
  }
  return clean;
}
async function collect(stream: ReadableStream<Uint8Array>, limit = MAX_BYTES): Promise<Uint8Array> {
  const reader = stream.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error(TOO_LARGE);
      parts.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}
function encodeBase64(bytes: Uint8Array): string {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeBase64(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error(INVALID);
  // Check the size before decoding, so a huge paste never reaches atob.
  if (Math.floor((value.length * 3) / 4) - 1 > MAX_BYTES) throw new Error(TOO_LARGE);
  const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}
/** Pack a payload as `T1.` + base64url of a flag byte (0x00 raw, 0x01 deflate-raw) and the bytes. */
export async function encodeTransfer(payload: unknown): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if (raw.byteLength > MAX_BYTES) throw new Error(TOO_LARGE);
  let bytes: Uint8Array = raw;
  let flag = 0;
  if (typeof CompressionStream !== 'undefined') {
    try {
      const compressed = await collect(
        new Blob([Uint8Array.from(raw)]).stream().pipeThrough(new CompressionStream('deflate-raw')),
        MAX_BYTES,
      );
      if (compressed.byteLength < raw.byteLength) {
        bytes = compressed;
        flag = 1;
      }
    } catch {
      /* This browser cannot produce deflate-raw; use raw bytes. */
    }
  }
  const result = new Uint8Array(bytes.byteLength + 1);
  result[0] = flag;
  result.set(bytes, 1);
  return `T1.${encodeBase64(result)}`;
}
/** Unpack bytes before field validation; both code types use the same size bound. */
async function unpack(code: string, prefix: 'T1.' | 'S1.'): Promise<unknown> {
  const trimmed = code.trim();
  if (!trimmed.startsWith(prefix)) throw new Error(INVALID);
  const bytes = decodeBase64(trimmed.slice(3));
  const data = bytes.subarray(1);
  let raw: Uint8Array;
  if (bytes[0] === 0) raw = data;
  else if (bytes[0] === 1) {
    if (typeof DecompressionStream === 'undefined')
      throw new Error('This browser cannot read compressed transfer codes');
    try {
      raw = await collect(
        new Blob([Uint8Array.from(data)])
          .stream()
          .pipeThrough(new DecompressionStream('deflate-raw')),
      );
    } catch (error) {
      throw new Error((error as Error).message === TOO_LARGE ? TOO_LARGE : INVALID, {
        cause: error,
      });
    }
  } else throw new Error(INVALID);
  if (raw.byteLength > MAX_BYTES) throw new Error(TOO_LARGE);
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  } catch (error) {
    throw new Error(INVALID, { cause: error });
  }
  return parsed;
}
/** Pack one script as `S1.`; local queue and recording history stay on this device. */
export async function encodeSingleScript(value: StudioScript): Promise<string> {
  const shared = {
    ...value,
    order: 0,
    plannedFor: null,
    deletedAt: null,
    lastRecordedAt: null,
    takeCount: 0,
  };
  return `S1.${(await encodeTransfer(shared)).slice(3)}`;
}
export async function decodeSingleScript(code: string): Promise<StudioScript> {
  try {
    return script(await unpack(code, 'S1.'));
  } catch (error) {
    if (error instanceof Error && error.message === TOO_LARGE) throw error;
    throw new Error(INVALID, { cause: error });
  }
}
/** Unpack and parse a transfer code without trusting anything in it. Never reads the database. */
export async function decodeTransfer(code: string): Promise<TransferPayload> {
  const parsed = await unpack(code, 'T1.');
  if (!parsed || typeof parsed !== 'object') throw new Error(INVALID);
  const p = parsed as Record<string, unknown>;
  if (
    !Array.isArray(p.scripts) ||
    !Array.isArray(p.ideas) ||
    !p.settings ||
    typeof p.settings !== 'object' ||
    typeof p.did !== 'string' ||
    !/^[A-Za-z0-9_-]{22}$/.test(p.did)
  )
    throw new Error(INVALID);
  try {
    return {
      scripts: p.scripts.map(script),
      ideas: p.ideas.map(idea),
      settings: p.settings,
      streak: p.streak === null || p.streak === undefined ? null : safeStreak(p.streak),
      did: p.did,
    };
  } catch {
    throw new Error(INVALID);
  }
}
export async function exportTransfer(): Promise<string> {
  const db = await getDb();
  return encodeTransfer({
    scripts: await db.getAll('scripts'),
    ideas: await db.getAll('ideas'),
    settings: await loadSettings(),
    streak: (await db.get('kv', 'streak')) ?? null,
    did: deviceId(),
  });
}
export async function importTransfer(code: string): Promise<{ scripts: number; ideas: number }> {
  const payload = await decodeTransfer(code);
  const settings = sanitizeSettings(payload.settings, isPhone());
  const db = await getDb();
  let scripts = 0;
  for (const item of payload.scripts) {
    const existing = (await db.get('scripts', item.id)) as StudioScript | undefined;
    if (!existing || item.updatedAt > existing.updatedAt) {
      // Takes never travel, so the take fields describe what this device actually holds.
      await db.put('scripts', {
        ...item,
        takeCount: existing?.takeCount ?? 0,
        lastRecordedAt: existing?.lastRecordedAt ?? null,
      });
      scripts++;
    }
  }
  let ideas = 0;
  for (const item of payload.ideas) {
    if (await db.get('ideas', item.id)) continue;
    await db.put('ideas', item);
    ideas++;
  }
  await saveSettings(settings);
  if (payload.streak !== null) await db.put('kv', payload.streak, 'streak');
  try {
    localStorage.setItem('tw.did', payload.did);
  } catch {
    /* Storage is blocked; analytics keeps this session's id. */
  }
  analytics.identify();
  return { scripts, ideas };
}
