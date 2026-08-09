import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.teleprompter.wtf',
  outDir: process.env.TELEPROMPTER_OUT_DIR ?? 'dist',
  integrations: [preact(), sitemap()],
  output: 'static',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
