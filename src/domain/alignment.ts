export interface ScriptToken {
  value: string;
  start: number;
  end: number;
}

export interface AlignmentResult {
  tokenIndex: number;
  characterIndex: number;
  confidence: number;
  movement: 'hold' | 'gentle' | 'correct';
}

const contractionMap: Record<string, string> = {
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

const normalizeWord = (word: string): string => {
  const compact = word
    .toLocaleLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
  return contractionMap[compact] ?? compact;
};

export function tokenizeScript(input: string): ScriptToken[] {
  const tokens: ScriptToken[] = [];
  const pattern = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;
  for (const match of input.matchAll(pattern)) {
    const value = normalizeWord(match[0]);
    if (!value || match.index === undefined) continue;
    tokens.push({ value, start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

const editSimilarity = (left: string, right: string): number => {
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
};

const sequenceScore = (fragment: string[], candidate: string[]): number => {
  if (!fragment.length || !candidate.length) return 0;
  const rows = fragment.length + 1;
  const columns = candidate.length + 1;
  const matrix = Array.from({ length: rows }, () => new Float32Array(columns));
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const similarity = editSimilarity(fragment[row - 1] ?? '', candidate[column - 1] ?? '');
      const previousRow = matrix[row - 1];
      const currentRow = matrix[row];
      if (!previousRow || !currentRow) continue;
      matrix[row]![column] = Math.max(
        (previousRow[column] ?? 0) - 0.34,
        (currentRow[column - 1] ?? 0) - 0.34,
        (previousRow[column - 1] ?? 0) + (similarity >= 0.72 ? similarity : -0.48),
      );
    }
  }
  const raw = matrix[rows - 1]?.[columns - 1] ?? 0;
  return Math.max(0, raw / Math.max(fragment.length, candidate.length));
};

export class ScriptAlignmentEngine {
  readonly tokens: ScriptToken[];
  private position = 0;

  constructor(script: string) {
    this.tokens = tokenizeScript(script);
  }

  get currentTokenIndex(): number {
    return this.position;
  }

  align(fragmentInput: string, recognitionConfidence = 1): AlignmentResult {
    const fragment = tokenizeScript(fragmentInput)
      .map((token) => token.value)
      .slice(-36);
    const hold = (): AlignmentResult => ({
      tokenIndex: this.position,
      characterIndex: this.tokens[this.position]?.start ?? 0,
      confidence: 0,
      movement: 'hold',
    });
    if (fragment.length < 2 || !this.tokens.length) return hold();

    const expected = Math.min(
      this.tokens.length - 1,
      this.position + Math.max(1, fragment.length - 2),
    );
    let best = this.search(fragment, expected, 90, 260);
    if (best.confidence < 0.58) best = this.search(fragment, expected, 260, 900);

    const confidence = Math.min(1, best.confidence * Math.max(0.45, recognitionConfidence));
    if (confidence < 0.43) return { ...hold(), confidence };

    const nextPosition = Math.min(this.tokens.length - 1, best.start + best.length);
    const distance = nextPosition - this.position;
    if (distance < -20 && confidence < 0.78) return { ...hold(), confidence };
    if (distance > 180 && confidence < 0.82) return { ...hold(), confidence };

    this.position = nextPosition;
    return {
      tokenIndex: nextPosition,
      characterIndex: this.tokens[nextPosition]?.start ?? this.tokens.at(-1)?.end ?? 0,
      confidence,
      movement: confidence >= 0.78 && Math.abs(distance) > 8 ? 'correct' : 'gentle',
    };
  }

  setPosition(tokenIndex: number): void {
    this.position = Math.min(this.tokens.length - 1, Math.max(0, Math.round(tokenIndex)));
  }

  private search(
    fragment: string[],
    expected: number,
    backward: number,
    forward: number,
  ): { start: number; length: number; confidence: number } {
    const startAt = Math.max(0, expected - backward);
    const endAt = Math.min(this.tokens.length - 1, expected + forward);
    const minLength = Math.max(
      2,
      fragment.length - Math.max(2, Math.floor(fragment.length * 0.25)),
    );
    const maxLength = Math.min(
      44,
      fragment.length + Math.max(3, Math.floor(fragment.length * 0.3)),
    );
    let best = { start: this.position, length: 0, confidence: 0 };

    for (let start = startAt; start <= endAt; start += 1) {
      for (
        let length = minLength;
        length <= maxLength && start + length <= this.tokens.length;
        length += 1
      ) {
        const candidate = this.tokens.slice(start, start + length).map((token) => token.value);
        const similarity = sequenceScore(fragment, candidate);
        if (similarity < 0.25) continue;
        const distance = Math.abs(start - expected);
        const continuity = Math.max(0.78, 1 - distance / Math.max(600, forward * 3));
        const backwardPenalty = start < this.position ? 0.96 : 1;
        const confidence = similarity * continuity * backwardPenalty;
        if (confidence > best.confidence) best = { start, length, confidence };
      }
    }
    return best;
  }
}
