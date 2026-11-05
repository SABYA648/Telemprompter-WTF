import { creatorGuidesA } from './studio/_partGuidesA';
import { creatorGuidesB } from './studio/_partGuidesB';

/** New creator guides for the M10 guide route integration. */
export const creatorGuides = [...creatorGuidesA, ...creatorGuidesB];
export const creatorGuideBySlug = new Map(creatorGuides.map((guide) => [guide.slug, guide]));
