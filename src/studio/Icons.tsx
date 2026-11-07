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
  | 'landscape'
  | 'monitor'
  | 'chapters'
  | 'captions'
  | 'convert'
  | 'scissors'
  | 'import'
  | 'print'
  | 'fullscreen'
  | 'mirror'
  | 'storage'
  | 'text-smaller'
  | 'text-larger'
  | 'fit'
  | 'format'
  | 'sliders'
  | 'restart'
  | 'check'
  | 'mic'
  | 'sun'
  | 'battery'
  | 'rotate'
  | 'gauge'
  | 'timer-check'
  | 'pencil';

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
  monitor: (
    <>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M7 9h10M7 12h6M9 21h6m-3-4v4" />
    </>
  ),
  chapters: (
    <>
      <circle cx="5" cy="6" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="5" cy="18" r="1.5" />
      <path d="M10 6h10M10 12h10M10 18h10" />
    </>
  ),
  captions: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M10 10.5a2.5 2.5 0 1 0 0 3M17 10.5a2.5 2.5 0 1 0 0 3" />
    </>
  ),
  convert: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15m0 5v-5h5" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.1 8.1 20 20M8.1 15.9 20 4" />
    </>
  ),
  import: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5" />
      <path d="M5 15v5h14v-5" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  fullscreen: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
  mirror: (
    <>
      <path d="M12 3v18" />
      <path d="M9 7 4 17h5zM15 7l5 10h-5z" />
    </>
  ),
  storage: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  'text-smaller': <path d="m3 19 5-14 5 14M5 14h6M16 12h6" />,
  'text-larger': <path d="m3 19 5-14 5 14M5 14h6M16 12h6M19 9v6" />,
  fit: <path d="M4 5v14M20 5v14M8 12h8m-5-3-3 3 3 3m2-6 3 3-3 3" />,
  format: (
    <>
      <path d="m2 19 5-14 5 14M4 14h6M21.5 12v7" />
      <circle cx="18" cy="15.5" r="3.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  restart: <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7M4 4v4.7h4.7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="17" height="10" rx="2" />
      <path d="M22 11v2M6 10v4" />
    </>
  ),
  rotate: (
    <>
      <rect x="8" y="3" width="8" height="13" rx="1.5" />
      <path d="M4 14a8 8 0 0 0 12.5 6.6M17 21h-1v-1" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path d="m12 14 4-5" />
      <circle cx="12" cy="14" r="1" />
    </>
  ),
  'timer-check': (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M9 2h6m-6.5 11 2.5 2.5 4.5-5" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
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
