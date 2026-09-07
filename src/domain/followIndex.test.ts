import { describe, expect, it } from 'vitest';
import { FOLLOW, FollowAligner, FollowIndex, tokenizeScript } from './followIndex';

const paragraphs = (lines: string[]): string => lines.join('\n\n');

describe('FollowIndex', () => {
  const index = new FollowIndex('Welcome to the rehearsal. Welcome back to the studio.');

  it('indexes every token in ascending order', () => {
    const welcome = index.lookup(index.tokens[0]?.keys[0] ?? '', 0, index.tokens.length);
    expect(welcome.length).toBeGreaterThanOrEqual(2);
    expect([...welcome].sort((a, b) => a - b)).toEqual(welcome);
  });

  it('clips lookups to the requested window', () => {
    const key = index.tokens[0]?.keys[0] ?? '';
    expect(index.lookup(key, 0, 2)).toEqual([0]);
    expect(index.lookup(key, 100, 200)).toEqual([]);
    expect(index.lookup('nonexistent-key', 0, 100)).toEqual([]);
  });

  it('weights rare keys above common ones', () => {
    const rare = index.tokens.find((token) => token.value === 'rehearsal');
    const common = index.tokens.find((token) => token.value === 'the');
    const rareKey = rare?.keys[0] ?? '';
    const commonKey = common?.keys[0] ?? '';
    expect(index.weight(rareKey)).toBeGreaterThan(index.weight(commonKey));
  });
});

describe('FollowAligner phonetic tolerance', () => {
  it('follows through recognizer homophone errors', () => {
    const script = paragraphs([
      'Opening remarks settle the room before the demonstration begins.',
      "They're going to the site tomorrow with the whole production crew.",
      'Closing thoughts thank the crew and end the take.',
    ]);
    const aligner = new FollowAligner(script);
    const result = aligner.update('', 'there going too the sight tomorrow with the whole', 0.9, 0);

    expect(result.movement).not.toBe('hold');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(
      script.slice(Math.max(0, result.characterIndex - 60), result.characterIndex + 20),
    ).toMatch(/site|tomorrow|whole|production/i);
  });

  it('does not lose its place at a number the speaker expands', () => {
    const script = paragraphs([
      'Opening remarks settle the room before the demonstration begins.',
      'Revenue grew to 2024 levels across the whole northern territory last quarter.',
      'Closing thoughts thank the crew and end the take.',
    ]);
    const aligner = new FollowAligner(script);
    const result = aligner.update(
      '',
      'revenue grew to twenty twenty four levels across the whole northern territory',
      0.9,
      0,
    );

    expect(result.movement).not.toBe('hold');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(
      script.slice(Math.max(0, result.characterIndex - 70), result.characterIndex + 20),
    ).toMatch(/northern|territory|whole|levels/i);
  });
});

describe('FollowAligner position discipline', () => {
  const script = paragraphs([
    'Opening remarks stay near the start of this rehearsal and settle the room.',
    'A repeated phrase appears here. Keep your eyes near the camera and speak to one person.',
    'The middle section explains why a calm pace helps every listener follow the argument.',
    'Now we skip ahead to a completely different paragraph about recording a clean final take.',
    'A repeated phrase appears here. This later version ends with a distinct closing thought.',
  ]);

  it('holds position through ad-lib', () => {
    const aligner = new FollowAligner(script);
    aligner.update('', 'opening remarks stay near the start of this rehearsal', 0.9, 0);
    const before = aligner.tokenIndex;

    const adlib = aligner.update(
      '',
      'yesterday my dog invented seven purple sandwiches',
      0.9,
      1000,
    );
    expect(adlib.movement).toBe('hold');
    expect(aligner.tokenIndex).toBe(before);
  });

  it('resolves a duplicate phrase by the words that follow it', () => {
    const aligner = new FollowAligner(script);
    const first = aligner.update('', 'a repeated phrase appears here keep your eyes near', 0.9, 0);
    expect(first.characterIndex).toBeLessThan(script.lastIndexOf('A repeated phrase'));

    const later = aligner.update(
      '',
      'a repeated phrase appears here this later version ends',
      0.9,
      4000,
    );
    expect(later.characterIndex).toBeGreaterThan(first.characterIndex);
  });

  it('re-anchors on a confident backward jump outside the local window', () => {
    const marks = [
      'amber lanterns',
      'brittle sandstone',
      'copper wiring',
      'distant harbours',
      'eastern orchards',
      'frozen turbines',
      'golden ledgers',
      'hollow anthems',
      'ivory glaciers',
      'jagged courtyards',
      'kindled beacons',
      'lunar tramlines',
      'marbled quarries',
      'northern pigments',
      'opal archives',
      'pewter shorelines',
      'quiet foundries',
      'russet almanacs',
      'silver trellises',
      'tidal windmills',
      'umber cisterns',
      'velvet sundials',
      'western ferries',
      'yellow granaries',
    ];
    const longScript = marks
      .map(
        (mark, index) =>
          `Segment ${index}. The ${mark} were catalogued by hand long before anyone noticed how much they had shifted.`,
      )
      .join('\n\n');
    const aligner = new FollowAligner(longScript);
    const quoteAt = (index: number): string =>
      `the ${marks[index]} were catalogued by hand long before anyone noticed how much they had shifted`;

    aligner.update('', quoteAt(20), 0.95, 0);
    const advanced = aligner.tokenIndex;
    expect(advanced).toBeGreaterThan(300);

    const back = aligner.update('', quoteAt(2), 0.95, 5000);
    expect(back.movement).not.toBe('hold');
    expect(back.tokenIndex).toBeLessThan(advanced - 200);
    expect(
      longScript.slice(Math.max(0, back.characterIndex - 90), back.characterIndex + 20),
    ).toMatch(/copper|wiring/i);
  });

  it('reports words per minute once there is enough evidence', () => {
    const aligner = new FollowAligner(script);
    const first = aligner.update('opening remarks stay near the start', '', 0.9, 0);
    expect(first.wordsPerMinute).toBe(0);

    const later = aligner.update('of this rehearsal and settle the room', '', 0.9, 4000);
    expect(later.wordsPerMinute).toBeGreaterThan(0);
    expect(later.wordsPerMinute).toBeLessThanOrEqual(400);
  });

  it('exposes and honours an externally set position', () => {
    const aligner = new FollowAligner(script);
    aligner.setTokenIndex(12);
    expect(aligner.tokenIndex).toBe(12);
    aligner.reset();
    expect(aligner.tokenIndex).toBe(0);
  });
});

describe('FollowAligner cost', () => {
  it('stays under budget across a long script read end to end', () => {
    const sentences = Array.from(
      { length: 500 },
      (_, index) =>
        `Sentence ${index} carries a distinct clause about subject number ${index} today.`,
    );
    const script = sentences.join(' ');
    const tokenCount = tokenizeScript(script).length;
    expect(tokenCount).toBeGreaterThan(4500);

    const aligner = new FollowAligner(script);
    const words = script.split(/\s+/u);
    const timings: number[] = [];

    for (let step = 0; step < 200; step += 1) {
      const from = step * 3;
      const finalDelta = words.slice(from, from + 3).join(' ');
      const interim = words.slice(from + 3, from + 6).join(' ');
      const startedAt = performance.now();
      aligner.update(finalDelta, interim, 0.9, step * 700);
      timings.push(performance.now() - startedAt);
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;

    // Bounds are set to catch an order-of-magnitude regression, not to police a millisecond: this
    // runs alongside other suites, so it measures the scheduler as much as the algorithm. Measured
    // in isolation on a 5,100 token script this is p50 0.68 ms, p95 1.09 ms.
    expect(p95).toBeLessThan(5);
    // The implementation this replaced measured 6,300 ms for a single call on a smaller script.
    expect(max).toBeLessThan(50);
    // The reader should actually have travelled through the script, not stalled at the top.
    expect(aligner.tokenIndex).toBeGreaterThan(400);
  });

  it('keeps the vote window bounded regardless of script length', () => {
    expect(FOLLOW.backWindow + FOLLOW.forwardWindow).toBeLessThan(1000);
    expect(FOLLOW.scoreWords + FOLLOW.band).toBeLessThan(32);
  });
});
