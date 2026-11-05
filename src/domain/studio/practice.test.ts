import { describe, expect, it } from 'vitest';
import { paceBucket, practicePercent, practiceSummary } from './practice';

describe('practice summary', () => {
  it('reports active pace, excluding paused time by construction', () => {
    const summary = practiceSummary(70, 70, 30, 30);
    expect(summary).toMatchObject({ percent: 100, seconds: 30, averageWpm: 140, fit: 'on_target' });
  });

  it('projects a partial run against the target', () => {
    expect(practiceSummary(35, 70, 15, 30).fit).toBe('on_target');
    expect(practiceSummary(35, 70, 30, 30).fit).toBe('over');
    expect(practiceSummary(35, 70, 5, 30).fit).toBe('under');
  });

  it('handles a missing target and a run that never started', () => {
    expect(practiceSummary(70, 70, 30, 0).fit).toBe('no_target');
    expect(practiceSummary(0, 70, 0, 30)).toMatchObject({ averageWpm: 0, fit: 'no_target' });
  });

  it('clamps progress and handles an empty script', () => {
    expect(practicePercent(120, 100)).toBe(100);
    expect(practicePercent(79.9, 100)).toBe(79);
    expect(practicePercent(5, 0)).toBe(0);
  });

  it('buckets pace with the analytics boundaries', () => {
    expect([119, 120, 149, 150, 179, 180].map(paceBucket)).toEqual([
      'under_120',
      '120_150',
      '120_150',
      '150_180',
      '150_180',
      '180_plus',
    ]);
  });
});
