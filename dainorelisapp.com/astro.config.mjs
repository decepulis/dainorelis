// @ts-check
import { defineConfig } from 'astro/config';
import { URL } from 'node:url';

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: [
        { find: '@', replacement: new URL('./src/', import.meta.url).pathname },
        { find: '~', replacement: new URL('../', import.meta.url).pathname },
      ],
    },
  },
});
