import { describe, expect, it } from 'vitest';
import { routeFromHash } from './router';
import { recordTarget, showsTabs, tabItems } from './tabs';
import type { StudioScript } from '../domain/studio/types';

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

it('records the edited script from the editor, and only there says so', () => {
  const record = (hash: string) => tabItems(routeFromHash(hash)).find((tab) => tab.id === 'record');
  expect(record('#/scripts/my-script')).toMatchObject({
    href: '#/record/my-script',
    label: 'Record this script',
    current: false,
  });
  expect(record('#/scripts/new')).toMatchObject({ href: '#/record/quick', label: 'Record' });
  for (const hash of ['#/', '#/scripts', '#/takes', '#/record/abc', '#/practice/abc'])
    expect(record(hash)?.label, hash).toBe('Record');
});

const script = (id: string, fields: Partial<StudioScript> = {}): StudioScript => ({
  id,
  title: id,
  body: '',
  status: 'draft',
  templateId: null,
  targetSeconds: 30,
  aspect: '9:16',
  caption: '',
  hashtags: '',
  youtubeTitle: '',
  youtubeDescription: '',
  order: 0,
  plannedFor: null,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  lastRecordedAt: null,
  takeCount: 0,
  ...fields,
});

describe('recordTarget', () => {
  const home = routeFromHash('#/');
  it('records the open script on Record and in the editor', () => {
    expect(recordTarget(routeFromHash('#/record/abc'), [script('x', { updatedAt: 9e9 })])).toBe(
      'abc',
    );
    expect(recordTarget(routeFromHash('#/record'))).toBe('quick');
    expect(recordTarget(routeFromHash('#/scripts/abc'), [script('x', { updatedAt: 9e9 })])).toBe(
      'abc',
    );
  });
  it('falls back to quick with no scripts, and from a new script', () => {
    expect(recordTarget(home)).toBe('quick');
    expect(recordTarget(home, [])).toBe('quick');
    expect(recordTarget(routeFromHash('#/scripts/new'), [])).toBe('quick');
  });
  it('prefers the most recently edited script', () => {
    const scripts = [
      script('older', { updatedAt: 2000 }),
      script('newest', { updatedAt: 5000 }),
      script('queued', { order: 1 }),
    ];
    expect(recordTarget(home, scripts)).toBe('newest');
    expect(recordTarget(routeFromHash('#/takes'), scripts)).toBe('newest');
  });
  it('skips deleted and never-edited scripts, then uses the first in Up next', () => {
    const scripts = [
      script('trashed', { updatedAt: 9000, deletedAt: 9000 }),
      script('untouched'),
      script('second', { order: 2 }),
      script('first', { order: 1 }),
    ];
    expect(recordTarget(home, scripts)).toBe('first');
    expect(recordTarget(home, [script('untouched')])).toBe('quick');
  });
  it('drives the nav Record href away from Record and the editor', () => {
    const record = tabItems(home, [script('mine', { updatedAt: 3000 })]).find(
      (tab) => tab.id === 'record',
    );
    expect(record).toMatchObject({ href: '#/record/mine', label: 'Record' });
  });
});

it('hides the tab bar on the live camera and Practice only', () => {
  expect(showsTabs(routeFromHash('#/record/quick'), true)).toBe(false);
  expect(showsTabs(routeFromHash('#/record/quick'), false)).toBe(true);
  expect(showsTabs(routeFromHash('#/practice/quick'), false)).toBe(false);
  for (const hash of ['#/', '#/scripts', '#/scripts/abc', '#/takes', '#/settings'])
    expect(showsTabs(routeFromHash(hash), true), hash).toBe(true);
});
