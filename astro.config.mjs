// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { site } from './src/data/site.ts';

export default defineConfig({
  site: site.domain,
  output: 'static',
  // Directory-style URLs with trailing slashes are the friendliest shape for
  // Apache/LiteSpeed static hosting (Hostinger) — every route is an index.html.
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
