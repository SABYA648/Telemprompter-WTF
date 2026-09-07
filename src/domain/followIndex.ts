import { indexKeys, phoneticKeys } from './phonetics';

/**
 * Real-time script following.
 *
 * The previous implementation scanned every plausible start position in a wide token window and
 * ran a full dynamic-programming pass for every candidate length, calling a Levenshtein per DP
 * cell. On a 2,280 token script that measured 6.3 s for the near window and 21.9 s for the wide
 * one, on the main thread, for every interim speech result. Following could never keep up.
 *
 * This module inverts the problem. Every script token is indexed by its phonetic keys, so a spoken
 * word can propose the handful of script positions where it could belong. Each proposal votes for
 * a diagonal offset, rare words voting louder than common ones, and only the few best-supported
 * offsets are scored with a banded local alignment. Cost is bounded by the search window rather
 * than by script length, and lands under a millisecond.
 */

export interface ScriptToken {
  value: string;
  start: number;
  end: number;
}

export interface IndexedToken extends ScriptToken {
  /** Broad keys used to nominate this position during voting. */
  keys: string[];
  /** Narrow keys used to assert a match during scoring. */
  matchKeys: string[];
}

export interface FollowResult {
  tokenIndex: number;
  characterIndex: number;
  characterEnd: number;
  confidence: number;
  movement: 'hold' | 'gentle' | 'correct';
  wordsPerMinute: number;
}

export const FOLLOW = {
  /** Spoken words retained as context. */
  tailWords: 24,
  /**
   * Most recent spoken words allowed to vote. Must cover everything the scoring pass will look at:
   * the words that identify a passage are often at the front of a phrase, and a word that cannot
   * vote can never nominate the position it belongs to.
   */
  voteWords: 16,
  /** Most recent spoken words scored by the alignment pass. */
  scoreWords: 16,
  /** Vote search window behind and ahead of the current position, in tokens. */
  backWindow: 80,
  forwardWindow: 400,
  /** Half-width of the alignment band, so up to this many words may be skipped on either side. */
  band: 6,
  /** Offsets scored per update, on top of the always-present hold-position candidate. */
  candidates: 5,
  /** A key this common carries no positional information, so it does not vote. */
  maxKeyOccurrences: 40,
  gapPenalty: -0.34,
  mismatchPenalty: -0.48,
  matchFloor: 0.72,
  /** Score awarded when two words are not spelled alike but sound alike. */
  phoneticMatch: 0.86,
  /** Larger jumps are damped by this divisor rather than forbidden. */
  continuityDivisor: 1200,
  continuityFloor: 0.85,
  backwardPenalty: 0.96,
  acceptConfidence: 0.43,
  strongConfidence: 0.78,
  /**
   * Local score below which a whole-script re-anchor is also tried. Higher than acceptConfidence on
   * purpose: on a script with repetitive structure a neighbouring near-duplicate scores acceptably
   * well, which would otherwise mask the passage the speaker actually moved to.
   */
  recoverBelow: 0.78,
  /** A jump further than this needs strong confidence or a second agreeing update. */
  jumpForward: 25,
  jumpBackward: -12,
  backwardConfidence: 0.75,
  wpmWindowMs: 12_000,
  wpmMinimumSpanMs: 2_000,
} as const;

const UNREACHABLE = -1e6;

const CONTRACTIONS: Record<string, string> = {
  cannot: 'cant',
  wont: 'willnot',
  isnt: 'isnot',
  arent: 'arenot',
  didnt: 'didnot',
  doesnt: 'doesnot',
  dont: 'donot',
  ive: 'ihave',
  im: 'iam',
  youre: 'youare',
  were: 'weare',
  theyre: 'theyare',
};

const WORD_PATTERN = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;

export function normalizeWord(word: string): string {
  const compact = word
    .toLocaleLowerCase()
    .replace(/[’']/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
  return CONTRACTIONS[compact] ?? compact;
}

interface RawToken extends ScriptToken {
  raw: string;
}

function tokenizeRaw(input: string): RawToken[] {
  const tokens: RawToken[] = [];
  for (const match of input.matchAll(WORD_PATTERN)) {
    const raw = match[0];
    const value = normalizeWord(raw);
    if (!value || match.index === undefined) continue;
    tokens.push({ raw, value, start: match.index, end: match.index + raw.length });
  }
  return tokens;
}

export function tokenizeScript(input: string): ScriptToken[] {
  return tokenizeRaw(input).map(({ value, start, end }) => ({ value, start, end }));
}

/** Keys for one token, taken from both its written form and its contraction-expanded form. */
function keysFor(raw: string, value: string, build: (word: string) => string[]): string[] {
  const keys = new Set(build(raw));
  if (value !== raw.toLocaleLowerCase()) {
    for (const key of build(value)) keys.add(key);
  }
  return [...keys];
}

/** Levenshtein ratio, with an early exit for words too different in length to matter. */
export function editSimilarity(left: string, right: string): number {
  if (left === right) return 1;
  if (!left || !right) return 0;
  if (Math.abs(left.length - right.length) > 3) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return Math.max(
    0,
    1 - (previous[right.length] ?? right.length) / Math.max(left.length, right.length),
  );
}

/** Lowest index in an ascending array whose value is at least `target`. */
function lowerBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((values[middle] ?? 0) < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** An inverted phonetic index over one script, built once and reused for the whole session. */
export class FollowIndex {
  readonly tokens: readonly IndexedToken[];
  private readonly byKey = new Map<string, number[]>();
  private readonly weights = new Map<string, number>();

  constructor(script: string) {
    const raw = tokenizeRaw(script);
    this.tokens = raw.map((token) => ({
      value: token.value,
      start: token.start,
      end: token.end,
      keys: keysFor(token.raw, token.value, indexKeys),
      matchKeys: keysFor(token.raw, token.value, phoneticKeys),
    }));

    this.tokens.forEach((token, index) => {
      for (const key of token.keys) {
        const list = this.byKey.get(key);
        if (list) list.push(index);
        else this.byKey.set(key, [index]);
      }
    });

    for (const [key, list] of this.byKey) {
      this.weights.set(key, 1 / (1 + list.length));
    }
  }

  count(key: string): number {
    return this.byKey.get(key)?.length ?? 0;
  }

  /** Rare keys carry more positional information, so they vote louder. */
  weight(key: string): number {
    return this.weights.get(key) ?? 0;
  }

  /**
   * How much a word narrows down position, as an inverse-frequency weight.
   *
   * Without this every word counts the same, so fourteen words of boilerplate outweigh the two
   * distinctive words that actually identify a passage, and the aligner settles for whichever
   * near-duplicate paragraph happens to be closest. Weighting by rarity is what lets it key on the
   * words a reader would key on.
   */
  informativeness(keys: Iterable<string>): number {
    let rarest = Number.POSITIVE_INFINITY;
    for (const key of keys) {
      const count = this.count(key);
      if (count > 0 && count < rarest) rarest = count;
    }
    // A word absent from the script is treated as merely rare, not infinitely informative, so one
    // recognizer error cannot dominate the score.
    const occurrences = Number.isFinite(rarest) ? Math.max(1, rarest) : 1;
    return Math.log(1 + this.tokens.length / (1 + occurrences));
  }

  /** Token indices carrying `key` inside [low, high]. Bounded by the window, not by script size. */
  lookup(key: string, low: number, high: number): number[] {
    const list = this.byKey.get(key);
    if (!list || high < low) return [];
    const from = lowerBound(list, low);
    const to = lowerBound(list, high + 1);
    return from >= to ? [] : list.slice(from, to);
  }
}

interface SpokenWord {
  value: string;
  /** Broad keys, used to vote for candidate offsets. */
  voteKeys: Set<string>;
  /** Narrow keys, used to score a match. */
  matchKeys: Set<string>;
  /** How much this word narrows down position. Filled in per script by the aligner. */
  weight: number;
}

interface PaceSample {
  tokenIndex: number;
  atMs: number;
}

interface Candidate {
  offset: number;
  score: number;
  endIndex: number;
}

const toSpokenWords = (text: string): SpokenWord[] =>
  tokenizeRaw(text).map((token) => ({
    value: token.value,
    voteKeys: new Set(keysFor(token.raw, token.value, indexKeys)),
    matchKeys: new Set(keysFor(token.raw, token.value, phoneticKeys)),
    weight: 1,
  }));

export class FollowAligner {
  readonly index: FollowIndex;
  private position = 0;
  private confirmed: SpokenWord[] = [];
  private previousOffset = 0;
  private pendingOffset: number | null = null;
  private pendingCount = 0;
  private samples: PaceSample[] = [];

  constructor(script: string) {
    this.index = new FollowIndex(script);
  }

  get tokenIndex(): number {
    return this.position;
  }

  setTokenIndex(index: number): void {
    const last = Math.max(0, this.index.tokens.length - 1);
    this.position = Math.min(last, Math.max(0, Math.round(index)));
  }

  reset(): void {
    this.position = 0;
    this.confirmed = [];
    this.previousOffset = 0;
    this.pendingOffset = null;
    this.pendingCount = 0;
    this.samples = [];
  }

  /**
   * @param finalDelta words the recognizer has just committed, never the whole transcript
   * @param interim the current unstable tail, replaced wholesale on every call
   */
  update(finalDelta: string, interim: string, recognitionConfidence = 1, atMs = 0): FollowResult {
    const tokens = this.index.tokens;
    const hold = (confidence = 0): FollowResult => ({
      tokenIndex: this.position,
      characterIndex: tokens[this.position]?.start ?? 0,
      characterEnd: tokens[this.position]?.end ?? 0,
      confidence,
      movement: 'hold',
      wordsPerMinute: this.wordsPerMinute(),
    });

    const committed = toSpokenWords(finalDelta);
    if (committed.length) {
      this.confirmed = [...this.confirmed, ...committed].slice(-FOLLOW.tailWords);
    }
    const tail = [...this.confirmed, ...toSpokenWords(interim)].slice(-FOLLOW.tailWords);
    if (!tokens.length || !tail.length) return hold();
    for (const word of tail) word.weight = this.index.informativeness(word.voteKeys);

    const best = this.bestCandidate(tail);
    if (!best) return hold();

    const confidence = Math.min(1, best.score * Math.max(0.45, recognitionConfidence));
    if (confidence < FOLLOW.acceptConfidence) return hold(confidence);

    const nextIndex = Math.min(tokens.length - 1, Math.max(0, best.endIndex));
    const distance = nextIndex - this.position;

    if (distance > FOLLOW.jumpForward && confidence < FOLLOW.strongConfidence) {
      // A long jump on middling confidence is usually a duplicate phrase. Wait for a second
      // update that agrees before moving the reader.
      if (this.pendingOffset === best.offset) this.pendingCount += 1;
      else {
        this.pendingOffset = best.offset;
        this.pendingCount = 1;
      }
      if (this.pendingCount < 2) return hold(confidence);
    }

    if (distance < FOLLOW.jumpBackward && confidence < FOLLOW.backwardConfidence) {
      return hold(confidence);
    }

    this.pendingOffset = null;
    this.pendingCount = 0;
    this.position = nextIndex;
    this.previousOffset = best.offset;
    this.recordSample(nextIndex, atMs);

    return {
      tokenIndex: nextIndex,
      characterIndex: tokens[nextIndex]?.start ?? 0,
      characterEnd: tokens[nextIndex]?.end ?? 0,
      confidence,
      movement:
        confidence >= FOLLOW.strongConfidence && Math.abs(distance) > 8 ? 'correct' : 'gentle',
      wordsPerMinute: this.wordsPerMinute(),
    };
  }

  /** Words per minute over a rolling window, or 0 until there is enough evidence. */
  wordsPerMinute(): number {
    if (this.samples.length < 2) return 0;
    const oldest = this.samples[0];
    const newest = this.samples[this.samples.length - 1];
    if (!oldest || !newest) return 0;
    const spanMs = newest.atMs - oldest.atMs;
    if (spanMs < FOLLOW.wpmMinimumSpanMs) return 0;
    const words = newest.tokenIndex - oldest.tokenIndex;
    if (words <= 0) return 0;
    return Math.min(400, Math.max(0, words / (spanMs / 60_000)));
  }

  private recordSample(tokenIndex: number, atMs: number): void {
    if (!Number.isFinite(atMs)) return;
    this.samples.push({ tokenIndex, atMs });
    const cutoff = atMs - FOLLOW.wpmWindowMs;
    while (this.samples.length > 2 && (this.samples[0]?.atMs ?? 0) < cutoff) {
      this.samples.shift();
    }
  }

  /** Accumulate weighted votes for diagonal offsets from the spoken tail. */
  private collectVotes(
    tail: SpokenWord[],
    low: number,
    high: number,
    maxOccurrences: number,
  ): Map<number, number> {
    const votes = new Map<number, number>();
    const voteFrom = Math.max(0, tail.length - FOLLOW.voteWords);
    for (let spokenIndex = voteFrom; spokenIndex < tail.length; spokenIndex += 1) {
      const word = tail[spokenIndex];
      if (!word) continue;
      for (const key of word.voteKeys) {
        if (this.index.count(key) > maxOccurrences) continue;
        const weight = this.index.weight(key);
        for (const tokenIndex of this.index.lookup(key, low, high)) {
          const offset = tokenIndex - spokenIndex;
          votes.set(offset, (votes.get(offset) ?? 0) + weight);
        }
      }
    }
    return votes;
  }

  /** Vote for plausible diagonal offsets, then score only the strongest few. */
  private bestCandidate(tail: SpokenWord[]): Candidate | null {
    const lastIndex = Math.max(0, this.index.tokens.length - 1);
    const scored = tail.slice(-FOLLOW.scoreWords);
    const scoredFrom = tail.length - scored.length;

    const local = this.searchWindow(
      tail,
      scored,
      scoredFrom,
      Math.max(0, this.position - FOLLOW.backWindow),
      Math.min(lastIndex, this.position + FOLLOW.forwardWindow),
      true,
    );
    if (local && local.score >= FOLLOW.recoverBelow) return local;

    // The speaker has left the local window. That is a retake, a section delivered out of order, or
    // an ad-lib. Re-anchor against the whole script: the rarity filter caps the work at a few
    // hundred operations, which is what makes a global search affordable at all. When every key is
    // too common the filter yields nothing, and rightly so, since no position is distinctive.
    const recovered = this.searchWindow(tail, scored, scoredFrom, 0, lastIndex, false);
    if (!recovered) return local;
    if (!local) return recovered;
    return recovered.score > local.score ? recovered : local;
  }

  private searchWindow(
    tail: SpokenWord[],
    scored: SpokenWord[],
    scoredFrom: number,
    low: number,
    high: number,
    includeHold: boolean,
  ): Candidate | null {
    const tokens = this.index.tokens;

    // Common words carry no positional information and cost the most to scan, so they sit out the
    // first pass. On boilerplate scripts every word can be common, which leaves nothing to vote at
    // all, so the local pass repeats without the filter. The window bounds the cost either way.
    let votes = this.collectVotes(tail, low, high, FOLLOW.maxKeyOccurrences);
    if (votes.size === 0 && includeHold) {
      votes = this.collectVotes(tail, low, high, Number.POSITIVE_INFINITY);
    }

    const offsets = [...votes.entries()]
      .sort((left, right) => {
        if (right[1] !== left[1]) return right[1] - left[1];
        return Math.abs(left[0] - this.previousOffset) - Math.abs(right[0] - this.previousOffset);
      })
      .slice(0, FOLLOW.candidates)
      .map(([offset]) => offset);

    if (includeHold) {
      // Holding position is always a candidate, so a wandering ad-lib has something to lose
      // against. It is clamped rather than dropped: without it an update could have nothing to
      // score at all.
      const lastIndex = Math.max(0, tokens.length - 1);
      offsets.push(
        Math.min(lastIndex - scoredFrom, Math.max(-scoredFrom, this.position - (tail.length - 1))),
      );
    }

    let best: Candidate | null = null;
    const seen = new Set<number>();
    for (const offset of offsets) {
      if (seen.has(offset)) continue;
      seen.add(offset);
      const startAt = offset + scoredFrom;
      if (startAt < 0 || startAt >= tokens.length) continue;

      const aligned = this.alignBanded(scored, startAt);
      if (!aligned) continue;

      const continuity = Math.max(
        FOLLOW.continuityFloor,
        1 - Math.abs(offset - this.previousOffset) / FOLLOW.continuityDivisor,
      );
      const backward = offset < this.previousOffset ? FOLLOW.backwardPenalty : 1;
      const score = Math.max(0, aligned.raw) * continuity * backward;
      if (!best || score > best.score) {
        best = { offset, score, endIndex: aligned.endIndex };
      }
    }

    return best;
  }

  /**
   * Local alignment of the spoken tail against the script from `startAt`, restricted to a band so
   * cost is linear in the number of spoken words rather than quadratic.
   */
  private alignBanded(
    scored: SpokenWord[],
    startAt: number,
  ): { raw: number; endIndex: number } | null {
    const tokens = this.index.tokens;
    const rows = scored.length;
    const columns = Math.min(tokens.length - startAt, rows + FOLLOW.band);
    if (rows === 0 || columns <= 0) return null;

    let total = 0;
    for (const word of scored) total += word.weight;
    if (total <= 0) return null;
    // Gaps are structural rather than evidential, so they are charged at the average word's rate.
    // With uniform weights this reduces exactly to the unweighted alignment.
    const gap = FOLLOW.gapPenalty * (total / rows);

    // Row zero stays at zero across the whole row: the alignment may begin anywhere in the script
    // window. Column zero accrues the gap penalty, because every spoken word must be accounted for.
    let previous = new Float64Array(columns + 1);
    let current = new Float64Array(columns + 1);

    for (let row = 1; row <= rows; row += 1) {
      const word = scored[row - 1];
      const weight = word?.weight ?? 0;
      const from = Math.max(1, row - FOLLOW.band);
      const to = Math.min(columns, row + FOLLOW.band);
      current[0] = row * gap;
      for (let column = 1; column < from; column += 1) current[column] = UNREACHABLE;
      for (let column = to + 1; column <= columns; column += 1) current[column] = UNREACHABLE;

      for (let column = from; column <= to; column += 1) {
        const token = tokens[startAt + column - 1];
        const similarity = word && token ? wordSimilarity(word, token) : 0;
        const diagonal =
          (previous[column - 1] ?? UNREACHABLE) +
          weight * (similarity >= FOLLOW.matchFloor ? similarity : FOLLOW.mismatchPenalty);
        const up = (previous[column] ?? UNREACHABLE) + gap;
        const left = (current[column - 1] ?? UNREACHABLE) + gap;
        current[column] = Math.max(diagonal, up, left);
      }

      const swap = previous;
      previous = current;
      current = swap;
    }

    const lastFrom = Math.max(1, rows - FOLLOW.band);
    const lastTo = Math.min(columns, rows + FOLLOW.band);
    let raw = UNREACHABLE;
    let bestColumn = lastFrom;
    for (let column = lastFrom; column <= lastTo; column += 1) {
      const value = previous[column] ?? UNREACHABLE;
      if (value > raw) {
        raw = value;
        bestColumn = column;
      }
    }

    // Normalized by the evidence available, so the score stays on a 0..1 scale.
    return { raw: raw / total, endIndex: startAt + bestColumn - 1 };
  }
}

function wordSimilarity(spoken: SpokenWord, token: IndexedToken): number {
  if (spoken.value === token.value) return 1;
  for (const key of token.matchKeys) {
    if (spoken.matchKeys.has(key)) return FOLLOW.phoneticMatch;
  }
  return editSimilarity(spoken.value, token.value);
}
