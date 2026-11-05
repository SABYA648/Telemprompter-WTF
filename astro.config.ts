import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import noindexRoutes from './src/content/noindexRoutes.json';

export default defineConfig({
  site: 'https://www.teleprompter.wtf',
  integrations: [
    preact(),
    sitemap({ filter: (page) => !noindexRoutes.includes(new URL(page).pathname) }),
  ],
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
