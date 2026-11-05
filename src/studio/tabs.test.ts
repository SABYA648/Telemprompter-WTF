import { describe, expect, it } from 'vitest';
import { routeFromHash } from './router';
import { tabItems } from './tabs';

const current = (hash: string) =>
  tabItems(routeFromHash(hash))
    .filter((tab) => tab.current)
    .map((tab) => tab.id);

describe('bottom navigation', () => {
  it.each([
    ['#/', 'home'],
    ['#/inbox', 'home'],
    ['#/scripts', 'scripts'],
    ['#/scripts/abc', 'scripts'],
    ['#/batch', 'scripts'],
    ['#/receive/S1.abc', 'scripts'],
    ['#/record', 'record'],
    ['#/record/quick', 'record'],
    ['#/record/abc', 'record'],
    ['#/practice/abc', 'record'],
    ['#/takes', 'takes'],
    ['#/takes/abc', 'takes'],
    ['#/settings', 'settings'],
    ['#/settings/camera', 'settings'],
    ['#/unknown', 'home'],
  ])('%s has exactly one current item: %s', (hash, tab) => {
    expect(current(hash)).toEqual([tab]);
  });
});

it('keeps the Record tab on the current script', () => {
  expect(
    tabItems(routeFromHash('#/record/my-script')).find((tab) => tab.id === 'record')?.href,
  ).toBe('#/record/my-script');
  expect(tabItems(routeFromHash('#/scripts')).find((tab) => tab.id === 'record')?.href).toBe(
    '#/record/quick',
  );
});
