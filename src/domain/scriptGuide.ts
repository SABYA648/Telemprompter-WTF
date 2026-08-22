import { countWords, durationSeconds } from './calculations';

export type GuideKind = 'plain' | 'guided';
export type GuideRole = 'speak' | 'screen' | 'visual';
export type BeatFit = 'fits' | 'tight' | 'loose';

export interface GuideBeat {
  role: GuideRole;
  display: string;
  start: number;
  end: number;
}

export interface GuideSection {
  title: string;
  timecodeLabel: string | null;
  startSeconds: number | null;
  endSeconds: number | null;
  beats: GuideBeat[];
  spokenStart: number;
  spokenEnd: number;
  fit: BeatFit | null;
}

export interface GuidedScript {
  kind: GuideKind;
  sections: GuideSection[];
  spokenText: string;
  spokenWordCount: number;
}

const ROLE_ALIASES: Array<{ role: GuideRole; names: string[] }> = [
  { role: 'speak', names: ['VOICEOVER', 'VOICE OVER', 'NARRATION', 'VO', 'DIALOGUE', 'DIALOG'] },
  {
    role: 'screen',
    names: ['ON SCREEN', 'ON-SCREEN', 'ONSCREEN', 'SUPER', 'SUPERS', 'GFX', 'LOWER THIRD', 'TITLE'],
  },
  {
    role: 'visual',
    names: [
      'VISUAL',
      'VISUALS',
      'B-ROLL',
      'B ROLL',
      'ACTION',
      'SFX',
      'MUSIC',
      'NOTE',
      'NOTES',
      'DIRECTOR',
      'CAMERA',
    ],
  },
];

const TIMECODE = String.raw`(\d{1,2}:\d{2}(?::\d{2})?)`;
const HEADING_RE = new RegExp(
  `^#{1,6}\\s*(?:${TIMECODE}\\s*[\\u2013\\u2014\\-]\\s*${TIMECODE}\\s*[\\u2013\\u2014\\-]\\s*)?(.*)$`,
);
const BARE_TIMECODE_HEADING_RE = new RegExp(
  `^${TIMECODE}\\s*[\\u2013\\u2014\\-]\\s*${TIMECODE}\\s*[\\u2013\\u2014\\-]\\s*(.+)$`,
);

const normalizeRoleKey = (line: string): string =>
  line
    .replace(/[*_`#]/g, '')
    .replace(/:$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

export function parseRoleLabel(line: string): GuideRole | null {
  const key = normalizeRoleKey(line);
  if (!key || key.length > 24) return null;
  for (const group of ROLE_ALIASES) {
    if (group.names.includes(key)) return group.role;
  }
  return null;
}

export function parseTimecodeSeconds(value: string): number {
  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

export function stripCueMarkup(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      return inner.trim();
    })
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const looksLikeHorizontalRule = (line: string): boolean =>
  /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());

interface ParsedHeading {
  title: string;
  start: string | null;
  end: string | null;
}

export function parseHeadingLine(line: string): ParsedHeading | null {
  const trimmed = line.trim();
  const heading = trimmed.match(HEADING_RE);
  if (heading && trimmed.startsWith('#')) {
    return {
      start: heading[1] ?? null,
      end: heading[2] ?? null,
      title: (heading[3] ?? '').trim(),
    };
  }
  const bare = trimmed.match(BARE_TIMECODE_HEADING_RE);
  if (bare) {
    return { start: bare[1] ?? null, end: bare[2] ?? null, title: (bare[3] ?? '').trim() };
  }
  return null;
}

export function structureScore(script: string): number {
  const lines = script.replace(/\r\n?/g, '\n').split('\n');
  let score = 0;
  let roleLines = 0;
  let timecodeHeadings = 0;
  let rules = 0;
  let fences = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('```')) {
      fences += 1;
      continue;
    }
    if (looksLikeHorizontalRule(trimmed)) {
      rules += 1;
      continue;
    }
    if (parseRoleLabel(trimmed)) {
      roleLines += 1;
      continue;
    }
    const heading = parseHeadingLine(trimmed);
    if (heading?.start && heading.end) timecodeHeadings += 1;
  }
  score += Math.min(6, timecodeHeadings * 3);
  score += Math.min(8, roleLines * 2);
  if (rules && roleLines) score += 1;
  if (fences && roleLines) score += 1;
  return score;
}

const isGuided = (score: number): boolean => score >= 4;

const normalizeForCompare = (value: string): string =>
  stripCueMarkup(value)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isNearDuplicate = (left: string, right: string): boolean => {
  const a = normalizeForCompare(left);
  const b = normalizeForCompare(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
};

const beatFit = (
  windowSeconds: number | null,
  spokenCount: number,
  wordsPerMinute: number,
): BeatFit | null => {
  if (windowSeconds === null || windowSeconds <= 0 || spokenCount <= 0) return null;
  const spokenSeconds = durationSeconds(spokenCount, wordsPerMinute);
  if (spokenSeconds > windowSeconds * 1.2) return 'tight';
  if (spokenSeconds < windowSeconds * 0.45) return 'loose';
  return 'fits';
};

export function compileScriptGuide(script: string, wordsPerMinute = 130): GuidedScript {
  const source = script.replace(/\r\n?/g, '\n');
  if (!isGuided(structureScore(source))) {
    return {
      kind: 'plain',
      sections: [],
      spokenText: source,
      spokenWordCount: countWords(source),
    };
  }

  const lines = source.split('\n');
  const sections: Array<{
    title: string;
    start: string | null;
    end: string | null;
    beats: Array<{ role: GuideRole; lines: string[]; start: number; end: number }>;
  }> = [];

  let offset = 0;
  let inFence = false;
  let current = {
    title: '',
    start: null as string | null,
    end: null as string | null,
    beats: [] as Array<{ role: GuideRole; lines: string[]; start: number; end: number }>,
  };
  let beat: { role: GuideRole; lines: string[]; start: number; end: number } | null = null;

  const flushBeat = () => {
    if (!beat) return;
    const displayLines = beat.lines.join('\n').trim();
    if (displayLines) current.beats.push(beat);
    beat = null;
  };
  const flushSection = () => {
    flushBeat();
    if (current.title || current.beats.length) sections.push(current);
    current = { title: '', start: null, end: null, beats: [] };
  };

  for (const line of lines) {
    const lineStart = offset;
    const lineEnd = offset + line.length;
    offset = lineEnd + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      if (!beat) beat = { role: 'visual', lines: [], start: lineStart, end: lineEnd };
      beat.lines.push(line);
      beat.end = lineEnd;
      continue;
    }
    if (inFence) {
      if (!beat) beat = { role: 'visual', lines: [], start: lineStart, end: lineEnd };
      beat.lines.push(line);
      beat.end = lineEnd;
      continue;
    }

    if (looksLikeHorizontalRule(trimmed)) {
      flushSection();
      continue;
    }

    const heading = parseHeadingLine(trimmed);
    if (heading && (trimmed.startsWith('#') || heading.start)) {
      flushSection();
      current = {
        title: heading.title,
        start: heading.start,
        end: heading.end,
        beats: [],
      };
      continue;
    }

    const role = parseRoleLabel(trimmed);
    if (role) {
      flushBeat();
      beat = { role, lines: [], start: lineEnd + 1, end: lineEnd + 1 };
      continue;
    }

    if (!beat) beat = { role: 'speak', lines: [], start: lineStart, end: lineEnd };
    beat.lines.push(line);
    beat.end = lineEnd;
  }
  flushSection();

  const compiled: GuideSection[] = [];
  const spokenParts: string[] = [];
  let spokenCursor = 0;

  for (const section of sections) {
    const beats: GuideBeat[] = [];
    let lastSpeak = '';
    const spokenBefore = spokenCursor;

    for (const rawBeat of section.beats) {
      const display = stripCueMarkup(rawBeat.lines.join('\n'));
      if (!display) continue;
      if (rawBeat.role === 'screen' && lastSpeak && isNearDuplicate(lastSpeak, display)) continue;
      beats.push({
        role: rawBeat.role,
        display,
        start: rawBeat.start,
        end: rawBeat.end,
      });
      if (rawBeat.role === 'speak') {
        lastSpeak = display;
        if (spokenParts.length) spokenCursor += 2;
        spokenParts.push(display);
        spokenCursor += display.length;
      }
    }

    const sectionSpoken = beats
      .filter((beat) => beat.role === 'speak')
      .map((beat) => beat.display)
      .join('\n\n');
    const startSeconds = section.start ? parseTimecodeSeconds(section.start) : null;
    const endSeconds = section.end ? parseTimecodeSeconds(section.end) : null;
    const window =
      startSeconds !== null && endSeconds !== null ? Math.max(0, endSeconds - startSeconds) : null;
    compiled.push({
      title: section.title,
      timecodeLabel: section.start && section.end ? `${section.start}-${section.end}` : null,
      startSeconds,
      endSeconds,
      beats,
      spokenStart: spokenBefore,
      spokenEnd: spokenCursor,
      fit: beatFit(window, countWords(sectionSpoken), wordsPerMinute),
    });
  }

  const spokenText = spokenParts.join('\n\n');
  return {
    kind: 'guided',
    sections: compiled.filter((section) => section.beats.length || section.title),
    spokenText,
    spokenWordCount: countWords(spokenText),
  };
}

export function sectionAtSpokenOffset(
  guide: GuidedScript,
  characterIndex: number,
): GuideSection | null {
  if (guide.kind !== 'guided' || !guide.sections.length) return null;
  const index = Math.max(0, characterIndex);
  for (const section of guide.sections) {
    if (index >= section.spokenStart && index <= section.spokenEnd) return section;
  }
  return guide.sections.at(-1) ?? null;
}

export function cueSummary(section: GuideSection | null, role: GuideRole): string {
  if (!section) return '';
  return section.beats
    .filter((beat) => beat.role === role)
    .map((beat) => beat.display)
    .join('\n');
}

export function firstCueLine(text: string): string {
  const line = text
    .split('\n')
    .map((part) => part.trim())
    .find(Boolean);
  return line ?? '';
}
