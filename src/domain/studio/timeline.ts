import type { TimelineMark } from './types';

/** Shown next to every chapters and captions export (M11). */
export const TIMELINE_LABEL = 'Timed from your scroll, not from speech.';

export interface Chapter {
  startMs: number;
  title: string;
  section: number;
}
export type ChaptersResult =
  { ok: true; chapters: Chapter[]; text: string } | { ok: false; reason: string };
export interface Cue {
  startMs: number;
  endMs: number;
  text: string;
}

const MIN_CHAPTERS = 3;
const MIN_CHAPTER_MS = 10_000;
const pad = (value: number, size = 2) => String(value).padStart(size, '0');

/** YouTube chapter stamps: `00:00` under an hour, `1:02:03` from an hour on. */
export function formatChapterTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** SRT stamps are always `HH:MM:SS,mmm`. */
export function formatSrtTime(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(total % 1000, 3)}`;
}

/**
 * Chapters follow the sections the prompter passed, in reading order. Scrolling back into an
 * earlier section does not start a new chapter. YouTube needs the first stamp at 00:00, at least
 * three chapters and at least ten seconds per chapter, so anything else explains why not.
 */
export function buildChapters(
  marks: readonly TimelineMark[],
  sectionTitles: readonly string[],
  durationMs: number,
): ChaptersResult {
  if (sectionTitles.length < MIN_CHAPTERS)
    return {
      ok: false,
      reason: 'Chapters need at least 3 sections. Add # headings to the script, then record again.',
    };
  const chapters: Chapter[] = [];
  for (const mark of marks) {
    const last = chapters.at(-1);
    if (!last || mark.section > last.section)
      chapters.push({
        startMs: last ? mark.t : 0,
        section: mark.section,
        title: sectionTitles[mark.section]?.trim() || `Section ${mark.section + 1}`,
      });
  }
  if (chapters.length < MIN_CHAPTERS)
    return {
      ok: false,
      reason: `This take passed ${chapters.length} ${chapters.length === 1 ? 'section' : 'sections'}. Chapters need at least 3.`,
    };
  for (const [index, chapter] of chapters.entries()) {
    const end = chapters[index + 1]?.startMs ?? durationMs;
    if (end - chapter.startMs < MIN_CHAPTER_MS)
      return {
        ok: false,
        reason: `Each chapter needs at least 10 seconds. "${chapter.title}" ran ${Math.max(0, Math.round((end - chapter.startMs) / 1000))} seconds.`,
      };
  }
  return {
    ok: true,
    chapters,
    text: chapters.map((c) => `${formatChapterTime(c.startMs)} ${c.title}`).join('\n'),
  };
}

/**
 * One cue per prompter line: it runs from when the line reached the cue band to when the next line
 * did. Line `n` holds the words the scroll engine passes in that line's height, which is how the
 * speed is derived from words per minute (11.5).
 */
export function buildCues(
  marks: readonly TimelineMark[],
  spokenText: string,
  wordsPerLine: number,
  durationMs: number,
): Cue[] {
  const words = spokenText.split(/\s+/).filter(Boolean);
  if (!words.length || !(wordsPerLine > 0)) return [];
  const cues: Cue[] = [];
  marks.forEach((mark, index) => {
    const startMs = index === 0 ? 0 : mark.t;
    const endMs = Math.min(durationMs, marks[index + 1]?.t ?? durationMs);
    const text = words
      .slice(Math.floor(mark.line * wordsPerLine), Math.floor((mark.line + 1) * wordsPerLine))
      .join(' ');
    if (!text || endMs <= startMs) return;
    const last = cues.at(-1);
    if (last && last.text === text && last.endMs === startMs) last.endMs = endMs;
    else cues.push({ startMs, endMs, text });
  });
  return cues;
}

export function formatSrt(cues: readonly Cue[]): string {
  return cues
    .map(
      (cue, index) =>
        `${index + 1}\n${formatSrtTime(cue.startMs)} --> ${formatSrtTime(cue.endMs)}\n${cue.text}\n`,
    )
    .join('\n');
}
