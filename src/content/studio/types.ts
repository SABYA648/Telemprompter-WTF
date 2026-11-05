/**
 * Content pack contracts for the Studio. Content is authored once at build
 * time and imported by Astro pages and the Studio island. Nothing here is
 * generated at runtime.
 */

import type { Guide } from '../guides';

export type ContentAspect = '9:16' | '16:9';

export type Niche =
  | 'fitness'
  | 'personal-finance'
  | 'food'
  | 'beauty'
  | 'real-estate'
  | 'tech'
  | 'education'
  | 'small-business';

export type PresetId =
  'instagram-reels' | 'youtube-shorts' | 'tiktok' | 'youtube' | 'linkedin-video';

export type SafeZoneId = 'off' | 'instagram' | 'youtube_shorts' | 'tiktok';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PageSeo {
  /** 30 to 65 characters. */
  title: string;
  /** 120 to 160 characters. */
  description: string;
  h1: string;
}

/* Templates (14.1) */

export type TemplateFormat = 'short-form' | 'youtube' | 'ad' | 'business';

export interface TemplateBeat {
  label: string;
  startSeconds: number;
  endSeconds: number;
  instruction: string;
}

export interface TemplateExample {
  title: string;
  niche: Niche | 'general';
  /** Filled script in Studio markup (11.6). No unfilled placeholders. */
  body: string;
}

export interface StudioTemplate {
  /** Equals the URL slug and the analytics template_id. */
  id: string;
  name: string;
  /** 30 to 65 characters: "{name} Template | teleprompter.wtf". */
  seoTitle: string;
  /** 120 to 160 characters. */
  seoDescription: string;
  h1: string;
  /** One sentence for cards and pickers. */
  summary: string;
  format: TemplateFormat;
  aspect: ContentAspect;
  /** 0 means no target. */
  targetSeconds: number;
  /** "When to use it" paragraphs. */
  whenToUse: string[];
  beats: TemplateBeat[];
  /** The template in Studio markup with {placeholder} slots. */
  body: string;
  /** Exactly two filled examples, each within 20% of the target at 140 WPM. */
  examples: [TemplateExample, TemplateExample];
  tips: string[];
  /** Exactly three. */
  faq: FaqItem[];
  related: {
    /** Two other template ids. */
    templates: [string, string];
    hooksNiche: Niche;
    recordPreset: PresetId;
  };
}

/* Hooks (14.2) */

export type HookGroupId = 'curiosity' | 'mistake' | 'result' | 'contrarian' | 'story';

export interface Hook {
  /** `${niche}-${group}-${1..5}` */
  id: string;
  /** Fill-in-the-blank text, {placeholders} allowed. */
  text: string;
}

export interface HookGroup {
  id: HookGroupId;
  name: string;
  /** Why this group works, one short paragraph. */
  why: string;
  /** Exactly five. */
  hooks: Hook[];
}

export interface HookNiche {
  id: Niche;
  name: string;
  /** "{Niche} Hooks for Reels and Shorts | teleprompter.wtf" */
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string[];
  /** Five groups in the order curiosity, mistake, result, contrarian, story. */
  groups: HookGroup[];
  howToAdapt: string[];
  /** Exactly three. */
  faq: FaqItem[];
  relatedNiches: [Niche, Niche, Niche];
  /** A template to pair with this niche. */
  suggestedTemplateId: string;
}

/* Daily prompts (14.3) and the 30-day challenge (14.4) */

export interface DailyPrompt {
  id: string;
  title: string;
  templateId: string;
  hook: string;
  angle: string;
  niches: 'any' | Niche[];
}

export interface ChallengeDay {
  day: number;
  title: string;
  templateId: string;
  prompt: string;
}

/* Starter scripts (14.5) and presets (14.6) */

export interface StarterScript {
  id: string;
  name: string;
  /** The preset this starter belongs to, or null for the default first-run script. */
  presetId: PresetId | null;
  title: string;
  aspect: ContentAspect;
  targetSeconds: number;
  /** Studio markup. Placeholders allowed. */
  body: string;
}

export interface StudioPreset {
  id: PresetId;
  name: string;
  platform: string;
  aspect: ContentAspect;
  /** 0 means no target. */
  targetSeconds: number;
  safeZone: SafeZoneId;
  starterId: string;
  /** The primary CTA label on the matching /record page. */
  ctaLabel: string;
}

/* Platform facts (Appendix C) */

export interface PlatformFact {
  id: string;
  platform: string;
  /** Visible sentence. Always show `verifiedOn` next to it. */
  text: string;
  kind: 'limit' | 'spec' | 'advice' | 'browser';
  /** True when the plan says the owner must verify the fact before it ships. */
  needsOwnerVerification?: boolean;
}

export interface SafeZone {
  platform: string;
  /** Percent of a 1080x1920 frame. */
  top: number;
  bottom: number;
  right: number;
  left: number;
  note: string;
}

/* Page copy (13.1, 13.2) */

export interface PageScript {
  id: string;
  title: string;
  targetSeconds: number;
  body: string;
}

export interface RecordPageCopy {
  slug: string;
  presetId: PresetId;
  seo: PageSeo;
  /** One or two sentences. */
  directAnswer: string;
  ctaLabel: string;
  /** `/studio?preset=<id>` */
  ctaHref: string;
  /** Exactly three. */
  trustChips: string[];
  /** Exactly three steps. */
  howItWorks: { title: string; text: string }[];
  settingsIntro: string;
  /** Ids from platformFacts to show with the verified date. */
  factIds: string[];
  /** Page specific recommended settings (advice, not platform rules). */
  settingsTips: string[];
  /** Exactly three. */
  starterScripts: PageScript[];
  builtInApp: { heading: string; paragraphs: string[] };
  /** Four to six. */
  faq: FaqItem[];
  related: {
    /** Three template ids. */
    templates: string[];
    hooksNiche: Niche;
    /** Two guide slugs from guides.ts or creatorGuides.ts. */
    guides: string[];
    /** Other record pages. */
    records: string[];
  };
}

export interface HubCopy {
  seo: PageSeo;
  intro: string[];
  howToChoose: { heading: string; paragraphs: string[] };
}

export interface RecordHubCopy extends HubCopy {
  ctaLabel: string;
  ctaHref: string;
  cards: { presetId: PresetId; slug: string; summary: string }[];
}

export interface ToolCopy {
  slug: string;
  seo: PageSeo;
  directAnswer: string;
  howToRead: { heading: string; paragraphs: string[] };
  factsIntro: string;
  factIds: string[];
  limits: string[];
  faq: FaqItem[];
  related: { label: string; href: string }[];
  /** Strings for the tool island. */
  ui: Record<string, string>;
}

/* Creator guides (13.2). The shared GuideCluster in guides.ts has no
   short_form or creator values yet, so these guides carry their own type. */

export type CreatorGuideCluster = 'short_form' | 'creator';

export interface CreatorGuide extends Omit<Guide, 'cluster'> {
  cluster: CreatorGuideCluster;
  /** Creator pages (record, templates, hooks) to link from the guide. */
  relatedPages: { label: string; href: string }[];
}
