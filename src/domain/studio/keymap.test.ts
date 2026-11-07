import { describe, expect, it, vi } from 'vitest';
import { assignKey, handleMappedKey } from './keymap';
import { DEFAULT_KEYS } from './settings';
describe('remote keys', () => {
  it.each([
    ['PageDown', 'lineForward'],
    ['b', 'toggleScroll'],
    ['F5', 'toggleRecord'],
  ])('%s runs %s and prevents browser action', (key, action) => {
    const preventDefault = vi.fn(),
      run = vi.fn();
    expect(handleMappedKey({ key, target: null, preventDefault }, DEFAULT_KEYS, run)).toBe(true);
    expect(run).toHaveBeenCalledWith(action);
    expect(preventDefault).toHaveBeenCalledOnce();
  });
  it('ignores focused text fields', () => {
    const preventDefault = vi.fn();
    expect(
      handleMappedKey(
        { key: 'F5', target: { matches: () => true } as unknown as HTMLElement, preventDefault },
        DEFAULT_KEYS,
        vi.fn(),
      ),
    ).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });
  it('reassigns a key without duplicate actions', () => {
    const next = assignKey(DEFAULT_KEYS, 'faster', 'b');
    expect(next.faster).toContain('b');
    expect(next.toggleScroll).not.toContain('b');
  });
});
