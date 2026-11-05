import { describe, expect, it, vi } from 'vitest';
import { countWords } from './words';
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
