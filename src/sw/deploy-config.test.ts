import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const file = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const buffer = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url));
const headers = file('public/_headers');
const nginx = file('nginx.conf');
const security = file('nginx-security-headers.conf');
const block = (location: string) => {
  const start = nginx.indexOf(`location ${location} {`);
  expect(start, location).toBeGreaterThan(-1);
  return nginx.slice(start, nginx.indexOf('\n  }', start));
};
const csp = (text: string) =>
  text.match(/Content-Security-Policy:? "?([^"\n]+)/)?.[1]?.trim() ?? '';

describe('nginx', () => {
  it('never lets a cache hold the service worker', () => {
    expect(block('= /sw.js')).toContain('add_header Cache-Control "no-cache" always;');
    expect(block('= /sw.js')).toContain('security-headers.conf');
  });
  it('serves the manifest with its media type and a one hour cache', () => {
    const manifest = block('= /site.webmanifest');
    expect(manifest).toContain('types { }');
    expect(manifest).toContain('default_type application/manifest+json;');
    expect(manifest).toContain('max-age=3600');
  });
  it('falls back for a share when no service worker is installed', () => {
    expect(block('= /share-target')).toContain('return 303 /studio#/inbox;');
    expect(nginx).toContain('absolute_redirect off;');
  });
});

describe('_headers', () => {
  const rule = (path: string) => {
    const start = headers.indexOf(`\n${path}\n`);
    expect(start, path).toBeGreaterThan(-1);
    return headers.slice(start, headers.indexOf('\n\n', start + 1));
  };
  it('matches the nginx cache rules', () => {
    expect(rule('/sw.js')).toContain('Cache-Control: no-cache');
    expect(rule('/site.webmanifest')).toContain('Cache-Control: public, max-age=3600');
    expect(rule('/site.webmanifest')).toContain('Content-Type: application/manifest+json');
    expect(rule('/_astro/*')).toContain('immutable');
  });
  it('adds no global cache header that would merge into the immutable asset rule', () => {
    expect(headers.slice(0, headers.indexOf('\n\n'))).not.toContain('Cache-Control');
  });
});

describe('security headers', () => {
  it('keep the same policy in both deployment files', () => {
    expect(csp(headers)).toBe(csp(security));
    const policy = (text: string) => text.match(/Permissions-Policy:? "?([^"\n]+)/)?.[1]?.trim();
    expect(policy(headers)).toBe(policy(security));
  });
  it('allow what the installed app needs and nothing removed by 11.9', () => {
    const policy = csp(security);
    expect(policy).toContain("manifest-src 'self'");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).toContain("media-src 'self' blob:");
    expect(policy).toContain("connect-src 'self' https://analytics.sabya.pm");
    expect(policy).toContain("script-src 'self' 'unsafe-inline' https://analytics.sabya.pm");
    expect(policy).not.toContain('wasm-unsafe-eval');
    expect(policy).not.toMatch(/google/i);
    for (const feature of [
      'screen-wake-lock',
      'accelerometer',
      'gyroscope',
      'camera',
      'microphone',
    ])
      expect(security).toContain(`${feature}=(self)`);
  });
});

describe('icons', () => {
  const png = (name: string) => {
    const bytes = buffer(`public/icons/${name}.png`);
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
  };
  it('are committed at the sizes the manifest declares', () => {
    expect(png('icon-192')).toMatchObject({ width: 192, height: 192 });
    expect(png('icon-512')).toMatchObject({ width: 512, height: 512 });
    expect(png('maskable-512')).toMatchObject({ width: 512, height: 512 });
    expect(png('apple-touch-icon')).toMatchObject({ width: 180, height: 180 });
  });
  it('are opaque where the platform demands it', () => {
    const RGB = 2;
    const PALETTE = 3;
    expect([RGB, PALETTE]).toContain(png('apple-touch-icon').colorType);
    expect([RGB, PALETTE]).toContain(png('maskable-512').colorType);
  });
  it('do not need sharp at build time', () => {
    const scripts = JSON.parse(file('package.json')).scripts as Record<string, string>;
    expect(scripts.build).toBe('astro build && node scripts/build-sw.mjs');
    expect(file('scripts/build-sw.mjs')).not.toContain('sharp');
    expect(file('scripts/sw-precache.mjs')).not.toContain('sharp');
  });
});
