import { describe, expect, it } from 'vitest';
import { buildChapters, buildCues, formatChapterTime, formatSrt, formatSrtTime } from './timeline';

const titles = ['Hook', 'Story', 'Call to action'];
const mark = (t: number, section: number, line = 0) => ({ t, section, line });

describe('YouTube chapters', () => {
  it('lists each section the take passed, starting at 00:00', () => {
    const result = buildChapters(
      [mark(120, 0), mark(5000, 0, 2), mark(12_400, 1), mark(31_900, 2)],
      titles,
      48_000,
    );
    expect(result).toEqual({
      ok: true,
      chapters: [
        { startMs: 0, section: 0, title: 'Hook' },
        { startMs: 12_400, section: 1, title: 'Story' },
        { startMs: 31_900, section: 2, title: 'Call to action' },
      ],
      text: '00:00 Hook\n00:12 Story\n00:31 Call to action',
    });
  });
  it('needs at least three sections in the script', () => {
    const result = buildChapters([mark(0, 0), mark(20_000, 1)], ['A', 'B'], 60_000);
    expect(result).toMatchObject({ ok: false, reason: expect.stringContaining('at least 3') });
  });
  it('needs at least three chapters in the take', () => {
    const result = buildChapters([mark(0, 0), mark(20_000, 1)], titles, 60_000);
    expect(result).toEqual({
      ok: false,
      reason: 'This take passed 2 sections. Chapters need at least 3.',
    });
  });
  it('needs at least ten seconds per chapter, including the last one', () => {
    expect(buildChapters([mark(0, 0), mark(9_000, 1), mark(30_000, 2)], titles, 60_000)).toEqual({
      ok: false,
      reason: 'Each chapter needs at least 10 seconds. "Hook" ran 9 seconds.',
    });
    expect(
      buildChapters([mark(0, 0), mark(10_000, 1), mark(20_000, 2)], titles, 29_000),
    ).toMatchObject({ ok: false, reason: expect.stringContaining('"Call to action" ran 9') });
    expect(buildChapters([mark(0, 0), mark(10_000, 1), mark(20_000, 2)], titles, 30_000).ok).toBe(
      true,
    );
  });
  it('ignores scrolling back into an earlier section', () => {
    const result = buildChapters(
      [mark(0, 0), mark(15_000, 1), mark(18_000, 0), mark(26_000, 1), mark(40_000, 2)],
      titles,
      70_000,
    );
    expect(result.ok && result.chapters.map((c) => c.startMs)).toEqual([0, 15_000, 40_000]);
  });
  it('names untitled sections and formats hour-long stamps', () => {
    const result = buildChapters(
      [mark(0, 0), mark(1_800_000, 1), mark(3_725_000, 2)],
      ['Intro', ' ', 'End'],
      4_000_000,
    );
    expect(result.ok && result.text).toBe('00:00 Intro\n30:00 Section 2\n1:02:05 End');
    expect(formatChapterTime(59_999)).toBe('00:59');
  });
  it('explains a take with no marks', () => {
    expect(buildChapters([], titles, 30_000)).toMatchObject({ ok: false });
  });
});

describe('SRT captions', () => {
  it('formats times as HH:MM:SS,mmm', () => {
    expect(formatSrtTime(0)).toBe('00:00:00,000');
    expect(formatSrtTime(1_234)).toBe('00:00:01,234');
    expect(formatSrtTime(61_005)).toBe('00:01:01,005');
    expect(formatSrtTime(3_723_456)).toBe('01:02:03,456');
    expect(formatSrtTime(-5)).toBe('00:00:00,000');
  });
  it('runs each line from when it reached the cue band to when the next line did', () => {
    const cues = buildCues(
      [mark(150, 0, 0), mark(2_000, 0, 1), mark(4_500, 0, 2)],
      'one two three four five six seven',
      3,
      6_000,
    );
    expect(cues).toEqual([
      { startMs: 0, endMs: 2_000, text: 'one two three' },
      { startMs: 2_000, endMs: 4_500, text: 'four five six' },
      { startMs: 4_500, endMs: 6_000, text: 'seven' },
    ]);
    expect(formatSrt(cues)).toBe(
      '1\n00:00:00,000 --> 00:00:02,000\none two three\n\n' +
        '2\n00:00:02,000 --> 00:00:04,500\nfour five six\n\n' +
        '3\n00:00:04,500 --> 00:00:06,000\nseven\n',
    );
  });
  it('merges a line repeated by a section change and drops lines past the script', () => {
    const cues = buildCues(
      [mark(0, 0, 0), mark(1_000, 1, 0), mark(2_000, 1, 1), mark(3_000, 1, 9)],
      'a b c d',
      2,
      5_000,
    );
    expect(cues).toEqual([
      { startMs: 0, endMs: 2_000, text: 'a b' },
      { startMs: 2_000, endMs: 3_000, text: 'c d' },
    ]);
  });
  it('returns no cues without words or a line size', () => {
    expect(buildCues([mark(0, 0)], '', 3, 1_000)).toEqual([]);
    expect(buildCues([mark(0, 0)], 'a b', 0, 1_000)).toEqual([]);
  });
});
