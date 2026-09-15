// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: isGitHubPages
    ? 'https://gitbondteam.github.io'
    : 'https://cortesargentinos.com.ar',
  base: isGitHubPages ? '/cortes' : '/',
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
