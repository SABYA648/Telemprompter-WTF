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
      // mediabunny is one lazy chunk of about 575 KB (141 KB gzip), loaded only to convert or trim.
      chunkSizeWarningLimit: 640,
      rollupOptions: {
        output: {
          // Named so the service worker can leave this large on-demand chunk out of its precache.
          manualChunks: (id: string) =>
            id.includes('/node_modules/mediabunny/') ? 'mediabunny' : undefined,
        },
      },
    },
  },
});
