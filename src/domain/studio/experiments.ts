import { deviceId } from '../analytics';
import { getDb } from './db';

/** Live experiments. Keep this list at two or fewer so arms stay readable in Umami session data. */
export const EXPERIMENTS = ['priming_copy', 'countdown'] as const;
export const MAX_LIVE_EXPERIMENTS = 2;
export type Experiment = (typeof EXPERIMENTS)[number];
export type Arm = 'control' | 'variant';

/** FNV-1a over the device id and experiment name, so the same device always lands in the same arm. */
export function assignArm(did: string, name: Experiment): Arm {
  let hash = 0x811c9dc5;
  for (const char of `${name}:${did}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 2 ? 'variant' : 'control';
}

/** Assigns once and stores the arm in `kv`. The arm, never the device id, is mirrored for analytics. */
export async function experimentArms(): Promise<Record<Experiment, Arm>> {
  const db = await getDb();
  const out = {} as Record<Experiment, Arm>;
  for (const name of EXPERIMENTS.slice(0, MAX_LIVE_EXPERIMENTS)) {
    const key = `experiment.${name}`;
    let arm = (await db.get('kv', key)) as unknown;
    if (arm !== 'control' && arm !== 'variant') {
      arm = assignArm(deviceId(), name);
      await db.put('kv', arm, key);
    }
    out[name] = arm as Arm;
    try {
      localStorage.setItem(`tw.exp.${name}`, out[name]);
    } catch {
      /* Private mode. */
    }
  }
  return out;
}

export function storedArm(name: Experiment): Arm {
  try {
    return localStorage.getItem(`tw.exp.${name}`) === 'variant' ? 'variant' : 'control';
  } catch {
    return 'control';
  }
}
