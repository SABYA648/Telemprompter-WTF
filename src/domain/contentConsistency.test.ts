import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public content', () => {
  it('describes manual scrolling without retired product claims', () => {
    for (const file of ['src/pages/index.astro', 'src/pages/features.astro', 'public/llms.txt']) {
      const content = readFileSync(resolve(__dirname, '../..', file), 'utf8');
      expect(content).not.toMatch(
        new RegExp(
          ['smart' + ' pace', 'private' + ' precision', 'follows your' + ' pace'].join('|'),
          'i',
        ),
      );
      expect(content).toMatch(/scroll/i);
    }
  });
});
