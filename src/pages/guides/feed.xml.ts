import type { APIRoute } from 'astro';
import { guides } from '../../content/guides';

export const prerender = true;

const BASE = 'https://www.teleprompter.wtf';
const CHANNEL_LINK = `${BASE}/guides`;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Midday UTC keeps the date stable across server time zones.
const toRssDate = (updated: string): string => new Date(`${updated}T12:00:00Z`).toUTCString();

export const GET: APIRoute = () => {
  const sorted = [...guides].sort((a, b) => b.updated.localeCompare(a.updated));
  const items = sorted
    .map((guide) => {
      const link = `${CHANNEL_LINK}/${guide.slug}`;
      return `    <item>
      <title>${escapeXml(guide.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(guide.description)}</description>
      <pubDate>${toRssDate(guide.updated)}</pubDate>
      <category>${escapeXml(guide.cluster)}</category>
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>teleprompter.wtf guides</title>
    <link>${CHANNEL_LINK}</link>
    <atom:link href="${CHANNEL_LINK}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Practical teleprompter guides for creators, presenters, and remote speakers.</description>
    <language>en</language>
    <lastBuildDate>${toRssDate(sorted[0]?.updated ?? '2026-01-01')}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
