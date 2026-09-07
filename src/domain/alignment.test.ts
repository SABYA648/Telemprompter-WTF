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
    const phrase = 'section 20 contains a distinct sentence about topic number 20';

    const engine = new ScriptAlignmentEngine(longScript);
    const result = engine.align(phrase);
    expect(result.confidence).toBeGreaterThan(0.5);

    // Timed separately and as a median. The first call on a fresh engine pays for JIT warm-up, and
    // a single sample on a shared runner measures the scheduler as much as the algorithm. The
    // implementation this replaced took 6,300 ms per call here.
    const samples: number[] = [];
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const warm = new ScriptAlignmentEngine(longScript);
      warm.align(phrase);
      warm.setPosition(0);
      const started = performance.now();
      warm.align(phrase);
      samples.push(performance.now() - started);
    }
    samples.sort((left, right) => left - right);
    expect(samples[Math.floor(samples.length / 2)] ?? 0).toBeLessThan(5);
  });
});
