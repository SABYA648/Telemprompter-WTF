import type { PresetId, StudioPreset } from './types';

/** `/studio?preset=<id>` applies the aspect, target and safe zone to this session's settings. */
export const presets: StudioPreset[] = [
  {
    id: 'instagram-reels',
    name: 'Instagram Reels',
    platform: 'Instagram',
    aspect: '9:16',
    targetSeconds: 30,
    safeZone: 'instagram',
    starterId: 'starter-reels',
    ctaLabel: 'Record a Reel now',
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    platform: 'YouTube',
    aspect: '9:16',
    targetSeconds: 60,
    safeZone: 'youtube_shorts',
    starterId: 'starter-shorts',
    ctaLabel: 'Record a Short now',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    platform: 'TikTok',
    aspect: '9:16',
    targetSeconds: 30,
    safeZone: 'tiktok',
    starterId: 'starter-tiktok',
    ctaLabel: 'Record a TikTok now',
  },
  {
    id: 'youtube',
    name: 'YouTube (landscape)',
    platform: 'YouTube',
    aspect: '16:9',
    targetSeconds: 0,
    safeZone: 'off',
    starterId: 'starter-youtube',
    ctaLabel: 'Record a YouTube video now',
  },
  {
    id: 'linkedin-video',
    name: 'LinkedIn video',
    platform: 'LinkedIn',
    aspect: '9:16',
    targetSeconds: 60,
    safeZone: 'off',
    starterId: 'starter-linkedin',
    ctaLabel: 'Record a LinkedIn video now',
  },
];

export const presetById = new Map<PresetId, StudioPreset>(presets.map((p) => [p.id, p]));
