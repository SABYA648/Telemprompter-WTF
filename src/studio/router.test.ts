import { expect, it } from 'vitest';
import { bootHash, routeFromHash } from './router';
it('resolves known routes without treating arbitrary hashes as screens', () => {
  expect(routeFromHash('#/scripts/abc')).toEqual({ screen: 'editor', id: 'abc' });
  expect(routeFromHash('#/record/quick')).toEqual({ screen: 'record', id: 'quick' });
  expect(routeFromHash('#/unknown')).toEqual({ screen: 'home' });
});
it('keeps boot parameters to known actions', () => {
  expect(bootHash('?go=scripts&utm_source=test')).toBe('#/scripts');
  expect(bootHash('?go=unknown')).toBeNull();
});
