import { describe, expect, it } from 'vitest';
import { ScriptAlignmentEngine, tokenizeScript } from './alignment';

const script = [
  'Welcome to the practical guide. We will start with a simple idea about clear communication.',
  'The middle section explains why a calm pace helps every listener follow the argument.',
  'A repeated phrase appears here. Keep your eyes near the camera and speak to one person.',
  'Now we skip ahead to a completely different paragraph about recording a clean final take.',
  'A repeated phrase appears here. This later version ends with a distinct closing thought.',
].join('\n\n');

describe('Private Precision script alignment', () => {
  it('normalizes case, punctuation, whitespace, and contractions', () => {
    expect(tokenizeScript("  YOU’RE ready, aren't you? ").map((token) => token.value)).toEqual([
      'youare',
      'ready',
      'arenot',
      'you',
    ]);
  });

  it('jumps to a distinctive later sentence from the start', () => {
    const localScript = [
      'Opening remarks stay near the start of this rehearsal.',
      'A middle section talks about calm breathing and a steady camera.',
      'The recovery paragraph mentions purple lanterns and cedar smoke.',
      'Closing thoughts thank the crew and end the take.',
    ].join('\n\n');
    const engine = new ScriptAlignmentEngine(localScript);
    const result = engine.align('The recovery paragraph mentions purple lanterns and cedar smoke.');
    expect(result.movement).not.toBe('hold');
    expect(
      localScript.slice(Math.max(0, result.characterIndex - 80), result.characterIndex + 40),
    ).toMatch(/recovery|purple|lanterns|Closing/i);
  });

  it('aligns a single live word to the next script token', () => {
    const engine = new ScriptAlignmentEngine(script);
    const first = engine.align('Welcome');
    expect(first.movement).toBe('gentle');
    expect(first.tokenIndex).toBe(0);
    const second = engine.align('to');
    expect(second.tokenIndex).toBe(1);
  });

  it('keeps the caret on the last spoken word of a growing transcript', () => {
    const engine = new ScriptAlignmentEngine(script);
    const growing = [
      'Welcome',
      'Welcome to',
      'Welcome to the practical',
      'Welcome to the practical guide we will start with a simple idea',
    ];
    let result = engine.align(growing[0] ?? '');
    for (const fragment of growing.slice(1)) {
      result = engine.align(fragment);
    }
    expect(result.movement).not.toBe('hold');
    expect(engine.tokens[result.tokenIndex]?.value).toBe('idea');
    const next = tokenizeScript(script)[result.tokenIndex + 1];
    expect(next?.value).toBe('about');
  });

  it('aligns exact and imperfect fragments', () => {
    const engine = new ScriptAlignmentEngine(script);
    const exact = engine.align('start with a simple idea about clear communication');
    expect(exact.confidence).toBeGreaterThan(0.6);
    const dropped = engine.align(
      'middle section explains calm pace every listener follow argument',
    );
    expect(dropped.tokenIndex).toBeGreaterThan(exact.tokenIndex);
    const incorrect = engine.align('calm place helps every listener follow the arguments');
    expect(incorrect.confidence).toBeGreaterThan(0.4);
  });

  it('holds during ad-lib and recovers after a skipped paragraph', () => {
    const engine = new ScriptAlignmentEngine(script);
    engine.align('welcome to the practical guide we will start');
    const before = engine.currentTokenIndex;
    const adlib = engine.align('yesterday my dog invented seven purple sandwiches');
    expect(adlib.movement).toBe('hold');
    expect(engine.currentTokenIndex).toBe(before);
    const skipped = engine.align('skip ahead to a completely different paragraph about recording');
    expect(skipped.tokenIndex).toBeGreaterThan(before + 10);
  });

  it('uses continuity for duplicate phrases and permits strong backwards recovery', () => {
    const engine = new ScriptAlignmentEngine(script);
    const first = engine.align('a repeated phrase appears here keep your eyes near');
    expect(first.characterIndex).toBeLessThan(script.lastIndexOf('A repeated phrase'));
    const later = engine.align('a repeated phrase appears here this later version ends');
    expect(later.characterIndex).toBeGreaterThan(first.characterIndex);
    const backwards = engine.align('middle section explains why a calm pace helps');
    expect(backwards.characterIndex).toBeLessThan(later.characterIndex);
  });

  it('keeps long-script matching bounded', () => {
    const longScript = Array.from(
      { length: 500 },
      (_, index) => `Section ${index} contains a distinct sentence about topic number ${index}.`,
    ).join('\n');
    const engine = new ScriptAlignmentEngine(longScript);
    const started = performance.now();
    const result = engine.align('section 20 contains a distinct sentence about topic number 20');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(performance.now() - started).toBeLessThan(750);
  });
});
