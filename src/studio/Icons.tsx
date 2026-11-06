/** Small, consistent outline icons used only by the Studio shell. */
export type IconName =
  | 'home'
  | 'script'
  | 'camera'
  | 'takes'
  | 'settings'
  | 'plus'
  | 'idea'
  | 'grid'
  | 'play'
  | 'share'
  | 'trash'
  | 'star'
  | 'flip'
  | 'timer'
  | 'more'
  | 'copy'
  | 'close'
  | 'pause'
  | 'lock'
  | 'phone'
  | 'present'
  | 'chevron'
  | 'portrait'
  | 'landscape';

const paths: Record<IconName, preact.JSX.Element> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  script: (
    <>
      <path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M15 2v5h4M8 12h8M8 16h8" />
    </>
  ),
  camera: (
    <>
      <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  takes: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4" />
    </>
  ),
  settings: (
    <>
      <path d="M10.3 3.2h3.4l.5 2.4 1.7 1 2.3-.8 1.7 3-1.8 1.6v2l1.8 1.6-1.7 3-2.3-.8-1.7 1-.5 2.4h-3.4l-.5-2.4-1.7-1-2.3.8-1.7-3 1.8-1.6v-2L3.9 8.8l1.7-3 2.3.8 1.7-1z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  idea: (
    <>
      <path d="M9 18h6m-5 3h4M8 15c-1.3-1.1-2-2.6-2-4a6 6 0 1 1 12 0c0 1.4-.7 2.9-2 4l-1 2H9z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7z" />,
  share: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5" />
      <path d="M5 13v7h14v-7" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6" />
    </>
  ),
  star: <path d="m12 2 3 6 6.5 1-4.8 4.7 1.1 6.7L12 17.3l-5.8 3.1 1.1-6.7L2.5 9 9 8z" />,
  flip: (
    <>
      <path d="M20 8a8 8 0 0 0-14-2L4 8m0 8a8 8 0 0 0 14 2l2-2M4 4v4h4m12 12v-4h-4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
    </>
  ),
  close: <path d="M5 5 19 19M19 5 5 19" />,
  pause: <path d="M8 5v14M16 5v14" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  present: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M12 16v4m-4 0h8" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  portrait: <rect x="7" y="3" width="10" height="18" rx="2" />,
  landscape: <rect x="3" y="7" width="18" height="10" rx="2" />,
};

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
