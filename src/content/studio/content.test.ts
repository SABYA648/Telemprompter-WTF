import { describe, expect, it } from 'vitest';
import { guides } from '../guides';
import { creatorGuides } from '../creatorGuides';
import { challenge30 } from './challenge30';
import {
  CREATOR_GUIDE_SLUGS,
  validateGuide,
  validateTemplate,
  dashProblems,
  pageWordCount,
} from './contentChecks';
import { dailyPrompts } from './dailyPrompts';
import { allHooks, hookNiches } from './hooks';
import { platformFacts, verifiedOn, safeZones } from './platformFacts';
import { presets } from './presets';
import { recordHub, templatesHub, hooksHub } from './hubs';
import { recordPages } from './recordPages';
import { FIRST_RUN_BODY, starterScripts } from './starterScripts';
import { templates, templateById } from './templates';
import { toolPages } from './toolPages';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('Studio content packs', () => {
  it('ships all twenty distinct templates with filled, timed examples', () => {
    expect(templates).toHaveLength(20);
    expect(unique(templates.map((t) => t.id))).toBe(true);
    expect(templates.flatMap(validateTemplate)).toEqual([]);
    for (const template of templates) {
      for (const relatedId of template.related.templates)
        expect(templateById.has(relatedId)).toBe(true);
    }
  });

  it('ships eight niches with five distinct groups of five useful hooks', () => {
    expect(hookNiches).toHaveLength(8);
    expect(unique(hookNiches.map((n) => n.id))).toBe(true);
    expect(allHooks).toHaveLength(200);
    expect(unique(allHooks.map((h) => h.id))).toBe(true);
    expect(unique(allHooks.map((h) => h.text.toLowerCase()))).toBe(true);
    for (const niche of hookNiches) {
      expect(niche.groups.map((g) => g.id)).toEqual([
        'curiosity',
        'mistake',
        'result',
        'contrarian',
        'story',
      ]);
      expect(niche.seoTitle.length).toBeGreaterThanOrEqual(30);
      expect(niche.seoTitle.length).toBeLessThanOrEqual(65);
      expect(niche.seoDescription.length).toBeGreaterThanOrEqual(120);
      expect(niche.seoDescription.length).toBeLessThanOrEqual(160);
      expect(niche.faq).toHaveLength(3);
      expect(niche.groups.every((g) => g.hooks.length === 5 && g.why.trim().length > 20)).toBe(
        true,
      );
      expect(niche.groups.flatMap((g) => g.hooks).every((h) => h.text.trim().length > 15)).toBe(
        true,
      );
      expect(
        pageWordCount([niche.intro, niche.groups.map((g) => g.why), niche.howToAdapt, niche.faq]),
      ).toBeGreaterThanOrEqual(300);
      expect(templateById.has(niche.suggestedTemplateId)).toBe(true);
      expect(dashProblems(niche.id, niche)).toEqual([]);
    }
  });

  it('ships daily prompts, a progressive challenge, starters and matching presets', () => {
    expect(dailyPrompts).toHaveLength(120);
    expect(unique(dailyPrompts.map((p) => p.id))).toBe(true);
    for (const p of dailyPrompts) {
      expect(templateById.has(p.templateId)).toBe(true);
      expect(p.title && p.hook && p.angle).toBeTruthy();
      expect(dashProblems(p.id, p)).toEqual([]);
    }
    expect(challenge30.map((d) => d.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    for (const d of challenge30) {
      expect(templateById.has(d.templateId)).toBe(true);
      expect(d.title && d.prompt).toBeTruthy();
    }
    expect(presets).toHaveLength(5);
    expect(unique(presets.map((p) => p.id))).toBe(true);
    expect(starterScripts).toHaveLength(6);
    for (const preset of presets) {
      const starter = starterScripts.find((s) => s.id === preset.starterId);
      expect(starter?.presetId).toBe(preset.id);
      expect(starter?.aspect).toBe(preset.aspect);
    }
    // Starters open straight into the camera, so they are speakable as written: no blanks.
    for (const starter of starterScripts) expect(starter.body, starter.id).not.toMatch(/[{}]/);
    expect(FIRST_RUN_BODY).not.toMatch(/[{}]/);
  });

  it('never shows a fill-in token on a daily prompt', () => {
    for (const p of dailyPrompts)
      for (const text of [p.title, p.hook, p.angle]) expect(text, p.id).not.toMatch(/[{}]/);
  });

  it('keeps dated platform facts and approximate safe zones', () => {
    expect(verifiedOn).toBe('2026-11-04');
    expect(unique(platformFacts.map((f) => f.id))).toBe(true);
    expect(platformFacts.find((f) => f.id === 'tiktok-caption')?.needsOwnerVerification).toBe(true);
    for (const zone of Object.values(safeZones)) {
      expect(zone.note).toContain('Approximate');
      expect(zone.top + zone.bottom).toBeLessThan(100);
    }
  });

  it('ships eight complete creator guides with valid related links', () => {
    expect(creatorGuides).toHaveLength(8);
    expect(unique(creatorGuides.map((g) => g.slug))).toBe(true);
    expect(new Set(creatorGuides.map((g) => g.slug))).toEqual(new Set(CREATOR_GUIDE_SLUGS));
    const slugs = new Set([...guides, ...creatorGuides].map((g) => g.slug));
    for (const guide of creatorGuides) {
      expect(guide.title.length).toBeGreaterThanOrEqual(30);
      expect(guide.title.length).toBeLessThanOrEqual(65);
    }
    expect(creatorGuides.flatMap((g) => validateGuide(g, slugs))).toEqual([]);
  });

  it('provides complete, linked record, hub and tool page copy', () => {
    expect(recordPages).toHaveLength(5);
    expect(unique(recordPages.map((p) => p.slug))).toBe(true);
    expect(recordHub.cards).toHaveLength(5);
    const knownFacts = new Set(platformFacts.map((f) => f.id));
    const knownGuides = new Set([...guides, ...creatorGuides].map((g) => g.slug));
    const knownPresets = new Set(presets.map((p) => p.id));
    const seoProblems: string[] = [];
    const checkSeo = (label: string, seo: { title: string; description: string; h1: string }) => {
      if (seo.title.length < 30 || seo.title.length > 65)
        seoProblems.push(`${label}: title ${seo.title.length}`);
      if (seo.description.length < 120 || seo.description.length > 160)
        seoProblems.push(`${label}: description ${seo.description.length}`);
      if (!seo.h1) seoProblems.push(`${label}: missing h1`);
    };
    for (const page of recordPages) {
      checkSeo(page.slug, page.seo);
      expect(knownPresets.has(page.presetId)).toBe(true);
      expect(page.ctaHref).toBe(`/studio?preset=${page.presetId}`);
      expect(page.trustChips).toHaveLength(3);
      expect(page.howItWorks).toHaveLength(3);
      expect(page.starterScripts).toHaveLength(3);
      expect(page.faq.length).toBeGreaterThanOrEqual(4);
      expect(page.faq.length).toBeLessThanOrEqual(6);
      expect(page.related.templates).toHaveLength(3);
      expect(page.related.templates.every((id) => templateById.has(id))).toBe(true);
      expect(page.related.guides).toHaveLength(2);
      expect(page.related.guides.every((id) => knownGuides.has(id))).toBe(true);
      expect(page.factIds.every((id) => knownFacts.has(id))).toBe(true);
      expect(pageWordCount(page)).toBeGreaterThanOrEqual(600);
      expect(pageWordCount(page)).toBeLessThanOrEqual(1000);
      expect(dashProblems(page.slug, page)).toEqual([]);
    }
    for (const [id, hub] of [
      ['record', recordHub],
      ['templates', templatesHub],
      ['hooks', hooksHub],
    ] as const) {
      checkSeo(id, hub.seo);
      expect(pageWordCount(hub)).toBeGreaterThanOrEqual(300);
      expect(pageWordCount(hub)).toBeLessThanOrEqual(600);
      expect(dashProblems(id, hub)).toEqual([]);
    }
    expect(toolPages.map((p) => p.slug)).toEqual([
      'script-length-checker',
      'caption-counter',
      'hook-generator',
    ]);
    for (const page of toolPages) {
      checkSeo(page.slug, page.seo);
      expect(pageWordCount(page)).toBeGreaterThanOrEqual(400);
      expect(pageWordCount(page)).toBeLessThanOrEqual(700);
      expect(page.faq.length).toBeGreaterThanOrEqual(3);
      expect(page.related.length).toBeGreaterThanOrEqual(3);
      expect(page.factIds.every((id) => knownFacts.has(id))).toBe(true);
      expect(dashProblems(page.slug, page)).toEqual([]);
    }
    expect(seoProblems).toEqual([]);
  });
});
