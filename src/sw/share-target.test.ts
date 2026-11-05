import { describe, expect, it } from 'vitest';
import { shareRedirect, sharedIdea } from './share-target.js';

describe('sharedIdea', () => {
  it('combines safe share fields and only accepts web URLs', () => {
    expect(
      sharedIdea({ title: '  Title ', text: '  Body ', url: 'https://example.org/a' }, 'id', 12),
    ).toEqual({ id: 'id', text: 'Title\nBody\nhttps://example.org/a', createdAt: 12 });
    expect(sharedIdea({ title: '', text: '', url: 'javascript:alert(1)' }, 'id', 12)).toBeNull();
    expect(sharedIdea({ url: 'data:text/html,hi' }, 'id', 12)).toBeNull();
    expect(sharedIdea({ text: 'Keep me', url: 'not a url' }, 'id', 12)?.text).toBe('Keep me');
  });
  it('keeps every combination of present fields in reading order', () => {
    expect(sharedIdea({ title: 'T' }, 'id', 1)?.text).toBe('T');
    expect(sharedIdea({ text: 'B' }, 'id', 1)?.text).toBe('B');
    expect(sharedIdea({ url: 'http://example.org/' }, 'id', 1)?.text).toBe('http://example.org/');
    expect(sharedIdea({ title: 'T', url: 'http://example.org/' }, 'id', 1)?.text).toBe(
      'T\nhttp://example.org/',
    );
  });
  it('bounds each field and ignores non-string form values', () => {
    const result = sharedIdea(
      { title: 'a'.repeat(500), text: 'b'.repeat(20000), url: 3 },
      'id',
      12,
    );
    expect(result?.text.length).toBeLessThanOrEqual(10000);
    expect(result?.text.startsWith(`${'a'.repeat(200)}\nb`)).toBe(true);
    expect(sharedIdea({ title: null, text: new Blob(['file']), url: undefined }, 'id', 1)).toBe(
      null,
    );
    expect(sharedIdea({ url: `https://example.org/${'x'.repeat(3000)}` }, 'id', 1)).toBeNull();
  });
  it('keeps the URL and stays inside the transfer limit when the text is huge', () => {
    const url = `https://example.org/${'u'.repeat(2000)}`;
    const result = sharedIdea({ title: 'a'.repeat(200), text: 'b'.repeat(20000), url }, 'id', 1);
    expect(result?.text.length).toBeLessThanOrEqual(10000);
    expect(result?.text.endsWith(`\n${url}`)).toBe(true);
  });
  it('is pure: the same input gives the same idea and input is not changed', () => {
    const fields = Object.freeze({ title: ' T ', text: ' B ', url: 'https://example.org/' });
    expect(sharedIdea(fields, 'id', 5)).toEqual(sharedIdea(fields, 'id', 5));
  });
});

describe('shareRedirect', () => {
  it('lands on the inbox and only claims a save that happened', () => {
    expect(shareRedirect('stored')).toBe('/studio#/inbox?shared=1');
    expect(shareRedirect('empty')).toBe('/studio#/inbox');
    expect(shareRedirect('failed')).toBe('/studio#/inbox?shared=error');
  });
});
