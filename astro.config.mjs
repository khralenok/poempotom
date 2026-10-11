import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';

export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.PAGES_BASE_PATH || '/',
  output: 'static',
  build: { format: 'directory' },
  markdown: { processor: unified({ remarkPlugins: [remarkBreaks], smartypants: false }) },
});
