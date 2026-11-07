import { describe, expect, it } from 'vitest';
import { editorSegments, parseMarkup } from './markup';

describe('parseMarkup', () => {
  it('handles every supported syntax without speaking production cues', () => {
    const result = parseMarkup(
      `# Intro\nHello **bold** ==bright== {name} [breathe] [pause]\n[b-roll: hands]\n[note: edit]\n// private`,
    );
    expect(result.tokens.map((token) => token.type)).toEqual(
      expect.arrayContaining([
        'section',
        'emphasis',
        'highlight',
        'placeholder',
        'cue',
        'pause',
        'note',
      ]),
    );
    expect(result.spokenText).toContain('Hello bold bright name');
    expect(result.spokenText).not.toContain('b-roll');
    expect(result.sections[0]?.spokenOffset).toBe(0);
  });
  it('keeps unknown brackets as user text', () =>
    expect(parseMarkup('Keep [unknown] words').spokenText).toContain('[unknown]'));
  it('parses nested emphasis into emphasized and highlighted tokens', () => {
    const result = parseMarkup('**A ==bright== word**');
    expect(result.spokenText).toBe('A bright word');
    expect(result.tokens).toEqual([
      { type: 'emphasis', value: 'A ' },
      { type: 'highlight', value: 'bright' },
      { type: 'emphasis', value: ' word' },
    ]);
  });
  it.each(['breathe', 'smile', 'look up', 'slow', 'fast', 'cut'])(
    'handles the %s delivery cue case insensitively',
    (cue) => {
      const result = parseMarkup(`Before [${cue.toUpperCase()}] after`);
      expect(result.tokens).toContainEqual({ type: 'cue', value: cue });
      expect(result.spokenText).toBe('Before after');
    },
  );
  it('keeps private notes and production notes out of spoken text', () => {
    const result = parseMarkup('// private\nSay this [b-roll: hands] [note: edit]\n\nNext');
    expect(result.tokens.filter((token) => token.type === 'note')).toHaveLength(3);
    expect(result.tokens).toContainEqual({ type: 'paragraphBreak' });
    expect(result.spokenText).toBe('Say this Next');
  });
});

describe('editorSegments', () => {
  it('labels section headings, cues and notes without changing a character', () => {
    const body = '# Hook\nI film [pause] seven videos.\n// say it slowly\n\n#nospace\n# ';
    const lines = editorSegments(body);
    expect(lines.map((line) => line.map((segment) => segment.text).join('')).join('\n')).toBe(body);
    expect(lines[0]).toEqual([
      { kind: 'hash', text: '# ' },
      { kind: 'section', text: 'Hook' },
    ]);
    expect(lines[1]?.map((segment) => segment.kind)).toEqual(['text', 'cue', 'text']);
    expect(lines[2]).toEqual([{ kind: 'note', text: '// say it slowly' }]);
    expect(lines[3]).toEqual([]);
    expect(lines[4]).toEqual([{ kind: 'text', text: '#nospace' }]);
    expect(lines[5]).toEqual([{ kind: 'hash', text: '# ' }]);
  });
});
