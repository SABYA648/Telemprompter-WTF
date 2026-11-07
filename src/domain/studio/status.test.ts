import { describe, expect, it } from 'vitest';
import { blankScript } from './scriptsRepo';
import { SCRIPT_STAGES, scriptStage } from './status';

describe('scriptStage', () => {
  it('offers one list of three stages', () => {
    expect(SCRIPT_STAGES.map((stage) => stage.label)).toEqual(['Draft', 'Recorded', 'Posted']);
  });

  it('keeps the three current statuses as they are', () => {
    for (const status of ['draft', 'recorded', 'posted'] as const)
      expect(scriptStage({ ...blankScript(), status, takeCount: 3 })).toBe(status);
  });

  it('reads legacy idea and ready scripts as Draft until they have a take', () => {
    for (const status of ['idea', 'ready'] as const) {
      const script = { ...blankScript(), status };
      expect(scriptStage(script)).toBe('draft');
      expect(scriptStage({ ...script, takeCount: 1 })).toBe('recorded');
      expect(scriptStage({ ...script, lastRecordedAt: 1 })).toBe('recorded');
      // The stored value is untouched, so backups and transfers still round-trip.
      expect(script.status).toBe(status);
    }
  });
});
