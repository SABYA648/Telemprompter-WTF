import type { Route } from './router';
import { upNext } from '../domain/studio/queue';
import type { StudioScript } from '../domain/studio/types';

export type TabId = 'home' | 'scripts' | 'record' | 'takes' | 'settings';

const TABS: Array<{ id: TabId; label: string; href: string }> = [
  { id: 'home', label: 'Home', href: '#/' },
  { id: 'scripts', label: 'Scripts', href: '#/scripts' },
  { id: 'record', label: 'Record', href: '#/record/quick' },
  { id: 'takes', label: 'Takes', href: '#/takes' },
  { id: 'settings', label: 'Settings', href: '#/settings' },
];

const TAB_FOR_SCREEN: Record<Route['screen'], TabId> = {
  home: 'home',
  inbox: 'home',
  scripts: 'scripts',
  editor: 'scripts',
  batch: 'scripts',
  challenge: 'home',
  receive: 'scripts',
  record: 'record',
  practice: 'record',
  'prompter-window': 'record',
  takes: 'takes',
  take: 'takes',
  settings: 'settings',
};

/**
 * The script the center Record button records: the one in Record, or the one being edited.
 * Anywhere else it is the most recently edited script, then the first in Up next, then quick.
 */
export function recordTarget(route: Route, scripts: StudioScript[] = []): string {
  if (route.screen === 'record') return route.id ?? 'quick';
  if (route.screen === 'editor' && route.id && route.id !== 'new') return route.id;
  const live = scripts.filter((script) => !script.deletedAt);
  const edited = live
    .filter((script) => script.updatedAt > script.createdAt)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return edited?.id ?? upNext(live)[0]?.id ?? 'quick';
}

/** Every route belongs to exactly one tab, so exactly one item can ever be current. */
export function tabItems(route: Route, scripts: StudioScript[] = []) {
  const active = TAB_FOR_SCREEN[route.screen];
  return TABS.map((tab) =>
    tab.id === 'record'
      ? {
          ...tab,
          // In the editor, the nav button is the screen's only Record action (M12 P2).
          label: route.screen === 'editor' && route.id !== 'new' ? 'Record this script' : tab.label,
          href: `#/record/${recordTarget(route, scripts)}`,
          current: tab.id === active,
        }
      : { ...tab, current: tab.id === active },
  );
}

/** Live camera screens are full-bleed: the X closes them, so the tab bar steps aside. */
export function showsTabs(route: Route, cameraLive: boolean): boolean {
  if (route.screen === 'practice') return false;
  return !(route.screen === 'record' && cameraLive);
}
