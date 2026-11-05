export type Route = {
  screen:
    | 'home'
    | 'scripts'
    | 'editor'
    | 'record'
    | 'practice'
    | 'takes'
    | 'take'
    | 'settings'
    | 'inbox'
    | 'receive'
    | 'batch';
  id?: string;
};
export function routeFromHash(hash: string): Route {
  const path = hash.replace(/^#/, '').split('?')[0] ?? '';
  const parts = path.split('/').filter(Boolean);
  const [first, second] = parts;
  if (!first && parts.length === 0) return { screen: 'home' };
  if (first === 'scripts' && second === 'new' && parts.length === 2)
    return { screen: 'editor', id: 'new' };
  if (first === 'scripts' && second && parts.length === 2) return { screen: 'editor', id: second };
  if (first === 'scripts' && parts.length === 1) return { screen: 'scripts' };
  if (first === 'inbox' && parts.length === 1) return { screen: 'inbox' };
  if (first === 'receive' && second && parts.length === 2) return { screen: 'receive', id: second };
  if (first === 'batch' && parts.length === 1) return { screen: 'batch' };
  if (first === 'record' && parts.length === 1) return { screen: 'record', id: 'quick' };
  if (first === 'record' && second && parts.length === 2) return { screen: 'record', id: second };
  if (first === 'practice' && second && parts.length === 2)
    return { screen: 'practice', id: second };
  if (first === 'takes' && second && parts.length === 2) return { screen: 'take', id: second };
  if (first === 'takes' && parts.length === 1) return { screen: 'takes' };
  if (first === 'settings' && parts.length <= 2)
    return second ? { screen: 'settings', id: second } : { screen: 'settings' };
  return { screen: 'home' };
}
export function bootHash(search: string): string | null {
  const query = new URLSearchParams(search);
  switch (query.get('go')) {
    case 'scripts':
      return '#/scripts';
    case 'record':
      return '#/record/quick';
    case 'idea':
      return '#/inbox';
    default:
      return null;
  }
}
