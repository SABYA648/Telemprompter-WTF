import type { PlatformFact, SafeZone } from './types';

/** Re-verify every quarter. Show this date wherever a fact appears on a page. */
export const verifiedOn = '2026-11-04';

export const platformFacts: PlatformFact[] = [
  {
    id: 'instagram-reels-format',
    platform: 'Instagram Reels',
    kind: 'spec',
    text: 'Reels are vertical 9:16, and 1080x1920 is the recommended size.',
  },
  {
    id: 'instagram-reels-length',
    platform: 'Instagram Reels',
    kind: 'limit',
    text: 'The maximum Reel length varies by account and rollout, so check the limit in your own app before you plan a long take.',
  },
  {
    id: 'instagram-reels-advice',
    platform: 'Instagram Reels',
    kind: 'advice',
    text: 'Common creator guidance is 15 to 90 seconds for reach. That is advice from creators, not a platform rule.',
  },
  {
    id: 'instagram-hashtags',
    platform: 'Instagram',
    kind: 'limit',
    text: 'Instagram allows up to 5 hashtags per post or Reel. The cap was announced in December 2025 and is rolling out gradually.',
  },
  {
    id: 'instagram-caption',
    platform: 'Instagram',
    kind: 'limit',
    text: 'Captions can be up to 2,200 characters. About the first 125 characters show before the "more" link, and this varies by device.',
  },
  {
    id: 'youtube-shorts-length',
    platform: 'YouTube Shorts',
    kind: 'limit',
    text: 'Shorts can run up to 3 minutes (since October 2024) and can be vertical or square.',
  },
  {
    id: 'youtube-title-description',
    platform: 'YouTube',
    kind: 'limit',
    text: 'Titles can be up to 100 characters and descriptions up to 5,000 characters.',
  },
  {
    id: 'youtube-chapters',
    platform: 'YouTube',
    kind: 'spec',
    text: 'Chapters need the first timestamp at 00:00, at least 3 timestamps, and at least 10 seconds per chapter.',
  },
  {
    id: 'tiktok-caption',
    platform: 'TikTok',
    kind: 'limit',
    text: 'Captions can be up to 4,000 characters.',
    needsOwnerVerification: true,
  },
  {
    id: 'browser-recording',
    platform: 'Browsers',
    kind: 'browser',
    text: 'Safari and recent Chrome and Edge record MP4 with MediaRecorder. Firefox records WebM. Always feature-detect before you promise a format.',
  },
  {
    id: 'browser-share',
    platform: 'Browsers',
    kind: 'browser',
    text: 'Sharing a video file with the Web Share API works on iOS, Android, macOS and Windows. Linux falls back to a download.',
  },
  {
    id: 'ios-home-screen-default',
    platform: 'iOS',
    kind: 'browser',
    text: 'iOS 26 opens sites added to the Home Screen as web apps by default.',
  },
  {
    id: 'ios-storage-separate',
    platform: 'iOS',
    kind: 'browser',
    text: 'Home Screen web apps have storage separate from Safari, so scripts and takes do not carry over on their own.',
  },
  {
    id: 'ios-storage-eviction',
    platform: 'iOS',
    kind: 'browser',
    text: 'Safari deletes site data for sites you have not opened in 7 days of Safari use. Home Screen apps are excepted.',
  },
  {
    id: 'ios-web-push',
    platform: 'iOS',
    kind: 'browser',
    text: 'Web push needs a Home Screen install and a server, so teleprompter.wtf does not use it. Reminders are calendar alerts instead.',
  },
];

export const factById = new Map(platformFacts.map((fact) => [fact.id, fact]));

/** Numeric limits for counters (caption-counter tool and the Studio caption fields). */
export const limits = {
  instagramHashtags: 5,
  instagramCaption: 2200,
  instagramCaptionVisible: 125,
  youtubeTitle: 100,
  youtubeDescription: 5000,
  youtubeShortsSeconds: 180,
  youtubeChapterMinimumSeconds: 10,
  youtubeChapterMinimumCount: 3,
  tiktokCaption: 4000,
} as const;

/** Approximate overlays for a 1080x1920 frame, in percent. Apps change their UI. */
export const safeZones: Record<'instagram' | 'youtube_shorts' | 'tiktok', SafeZone> = {
  instagram: {
    platform: 'Instagram Reels',
    top: 13,
    bottom: 20,
    right: 12,
    left: 4,
    note: 'Approximate, apps change their UI.',
  },
  youtube_shorts: {
    platform: 'YouTube Shorts',
    top: 10,
    bottom: 20,
    right: 15,
    left: 0,
    note: 'Approximate, apps change their UI.',
  },
  tiktok: {
    platform: 'TikTok',
    top: 8,
    bottom: 20,
    right: 15,
    left: 0,
    note: 'Approximate, apps change their UI.',
  },
};

// The M5 recorder consumes these existing safe-zone percentage defaults.
export const SAFE_ZONES = {
  instagram: { top: 13, bottom: 20, left: 4, right: 12 },
  youtube_shorts: { top: 10, bottom: 20, left: 0, right: 15 },
  tiktok: { top: 8, bottom: 20, left: 0, right: 15 },
} as const;
export const PLATFORM_FACTS_VERIFIED_ON = '2026-11-04';
