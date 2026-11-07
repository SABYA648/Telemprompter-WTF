import type { ScriptStatus, StudioScript } from './types';

/** The three stages the Studio shows everywhere: library rows, filter chips and the editor. */
export type ScriptStage = 'draft' | 'recorded' | 'posted';
export const SCRIPT_STAGES: ReadonlyArray<{ value: ScriptStage; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'recorded', label: 'Recorded' },
  { value: 'posted', label: 'Posted' },
];

/**
 * Reads any saved status as one of the three stages. Older scripts may carry "idea" or "ready";
 * those stay stored as they are (backups and transfers keep the five values) and read as
 * Recorded when the script already has a take, otherwise Draft. Draft, Recorded and Posted map
 * to themselves, so a status the user picked is never overridden.
 */
export function scriptStage(
  script: Pick<StudioScript, 'status' | 'takeCount' | 'lastRecordedAt'>,
): ScriptStage {
  const status: ScriptStatus = script.status;
  if (status === 'draft' || status === 'recorded' || status === 'posted') return status;
  return script.takeCount > 0 || script.lastRecordedAt ? 'recorded' : 'draft';
}
