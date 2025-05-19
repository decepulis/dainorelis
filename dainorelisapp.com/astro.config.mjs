// @ts-check
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import { URL } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dainorelisapp.com',
  vite: {
    resolve: {
      alias: [
        { find: '@', replacement: new URL('./src/', import.meta.url).pathname },
        { find: '~', replacement: new URL('../', import.meta.url).pathname },
      ],
    },
  },

  adapter: vercel(),
});
