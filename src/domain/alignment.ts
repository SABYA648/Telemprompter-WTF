import { FollowAligner } from './followIndex';

export { editSimilarity, normalizeWord, tokenizeScript } from './followIndex';
export type { ScriptToken } from './followIndex';

export interface AlignmentResult {
  tokenIndex: number;
  characterIndex: number;
  confidence: number;
  movement: 'hold' | 'gentle' | 'correct';
}

/**
 * Whole-transcript facade over {@link FollowAligner}, kept for callers that hand over the current
 * spoken fragment in full rather than as a committed delta plus an unstable tail.
 */
export class ScriptAlignmentEngine {
  private readonly aligner: FollowAligner;

  constructor(script: string) {
    this.aligner = new FollowAligner(script);
  }

  get tokens(): readonly { value: string; start: number; end: number }[] {
    return this.aligner.index.tokens;
  }

  get currentTokenIndex(): number {
    return this.aligner.tokenIndex;
  }

  align(fragment: string, recognitionConfidence = 1): AlignmentResult {
    const result = this.aligner.update('', fragment, recognitionConfidence, 0);
    return {
      tokenIndex: result.tokenIndex,
      characterIndex: result.characterIndex,
      confidence: result.confidence,
      movement: result.movement,
    };
  }

  setPosition(tokenIndex: number): void {
    this.aligner.setTokenIndex(tokenIndex);
  }
}
