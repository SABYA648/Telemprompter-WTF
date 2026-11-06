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
  challenge: 'home',
  receive: 'scripts',
  record: 'record',
  practice: 'record',
  'prompter-window': 'record',
  takes: 'takes',
  take: 'takes',
  settings: 'settings',
};

/** The script the center Record button records: the one in Record, or the one being edited. */
function recordTarget(route: Route): string | null {
  if (route.screen === 'record') return route.id ?? 'quick';
  if (route.screen === 'editor' && route.id && route.id !== 'new') return route.id;
  return null;
}

/** Every route belongs to exactly one tab, so exactly one item can ever be current. */
export function tabItems(route: Route) {
  const active = TAB_FOR_SCREEN[route.screen];
  const target = recordTarget(route);
  return TABS.map((tab) =>
    tab.id === 'record' && target
      ? {
          ...tab,
          // In the editor, the nav button is the screen's only Record action (M12 P2).
          label: route.screen === 'editor' ? 'Record this script' : tab.label,
          href: `#/record/${target}`,
          current: tab.id === active,
        }
      : { ...tab, current: tab.id === active },
  );
}
