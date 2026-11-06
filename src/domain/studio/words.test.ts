import { describe, expect, it, vi } from 'vitest';
import { countWords, wordOffset } from './words';
describe('countWords', () => {
  it('counts English words', () => expect(countWords('one two three')).toBe(3));
  it('counts Hindi words', () => expect(countWords('नमस्ते दुनिया')).toBe(2));
  it('counts Japanese segments', () => expect(countWords('こんにちは世界')).toBe(2));
  it('falls back to whitespace splitting when Segmenter is unavailable', () => {
    vi.stubGlobal('Intl', {});
    try {
      expect(countWords('one two three')).toBe(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
describe('wordOffset', () => {
  it('cuts exactly where countWords reaches the limit, hyphens included', () => {
    const text = Array.from({ length: 40 }, () => 'well-known').join(' ');
    const limit = Math.floor((15 * 140) / 60);
    const offset = wordOffset(text, limit);
    expect(countWords(text.slice(0, offset))).toBe(limit);
    expect(countWords(text.slice(offset))).toBe(countWords(text) - limit);
  });
  it('returns the text length past the last word', () => expect(wordOffset('one two', 5)).toBe(7));
});
