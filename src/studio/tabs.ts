import type { Route } from './router';

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
  receive: 'scripts',
  record: 'record',
  practice: 'record',
  takes: 'takes',
  take: 'takes',
  settings: 'settings',
};

/** Every route belongs to exactly one tab, so exactly one item can ever be current. */
export function tabItems(route: Route) {
  const active = TAB_FOR_SCREEN[route.screen];
  return TABS.map((tab) => ({
    ...tab,
    href:
      tab.id === 'record' && route.screen === 'record'
        ? `#/record/${route.id ?? 'quick'}`
        : tab.href,
    current: tab.id === active,
  }));
}
