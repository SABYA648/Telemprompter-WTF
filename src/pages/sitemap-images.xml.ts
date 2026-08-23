import type { APIRoute } from 'astro';

export const prerender = true;

const BASE = 'https://www.teleprompter.wtf';

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

interface ImageSitemapEntry {
  pages: string[];
  image: string;
  title: string;
}

// Lost-script and og artwork are intentionally excluded: the 404 page is
// noindex, and the og image only serves as social metadata.
const entries: ImageSitemapEntry[] = [
  {
    pages: ['/'],
    image: '/illustrations/teleprompter-hero.webp',
    title: 'Blank script cards flowing through teleprompter glass toward a camera lens',
  },
  {
    pages: [
      '/guides/teleprompter-for-youtube',
      '/guides/teleprompter-for-video-recording',
      '/guides/teleprompter-for-online-courses',
      '/guides/teleprompter-for-podcasts',
      '/guides/teleprompter-for-short-form-video',
    ],
    image: '/illustrations/guides/video-creator.webp',
    title: 'A creator presenting naturally through a camera-mounted teleprompter',
  },
  {
    pages: [
      '/guides/teleprompter-for-presentations',
      '/guides/how-to-read-a-teleprompter-naturally',
      '/guides/how-to-maintain-eye-contact',
      '/guides/teleprompter-for-webinars',
    ],
    image: '/illustrations/guides/speech-stage.webp',
    title: 'A speaker at a lectern using two discreet teleprompter glass panels',
  },
  {
    pages: ['/guides/teleprompter-for-zoom', '/guides/teleprompter-for-interviews'],
    image: '/illustrations/guides/remote-meeting.webp',
    title: 'A speaker reading near a laptop camera during a remote meeting',
  },
  {
    pages: ['/guides/teleprompter-for-phone-and-tablet'],
    image: '/illustrations/guides/mobile-teleprompter.webp',
    title: 'A phone teleprompter mounted beside a camera for natural eye contact',
  },
  {
    pages: [
      '/guides/what-is-a-teleprompter',
      '/guides/teleprompter-camera-distance-and-font-size',
      '/guides/teleprompter-mirror-mode-glass',
    ],
    image: '/illustrations/guides/mirrored-glass.webp',
    title: 'Script light reflecting from a tablet through teleprompter glass toward a speaker',
  },
  {
    pages: [
      '/guides/teleprompter-speed',
      '/guides/how-to-format-a-teleprompter-script',
      '/guides/voice-activated-teleprompters',
    ],
    image: '/illustrations/guides/script-pacing.webp',
    title: 'Short and long script cards following a calm visual rhythm into a teleprompter',
  },
];

export const GET: APIRoute = () => {
  const urls = entries
    .flatMap((entry) =>
      entry.pages.map(
        (page) => `  <url>
    <loc>${escapeXml(`${BASE}${page}`)}</loc>
    <image:image>
      <image:loc>${escapeXml(`${BASE}${entry.image}`)}</image:loc>
      <image:title>${escapeXml(entry.title)}</image:title>
    </image:image>
  </url>`,
      ),
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
