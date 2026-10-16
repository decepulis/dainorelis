// @ts-check
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import { URL } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dainorelisapp.com',
  vite: {
    // Vite 8 (Rolldown/Oxc) otherwise reads the nearest tsconfig.json for every module. For
    // anything outside this directory (Astro itself, hoisted into the root node_modules; the app
    // images imported through `~`) that is the Expo app's, whose `extends: "expo/tsconfig.base"`
    // its resolver can't follow (it doesn't append `.json` the way tsc does), failing the build.
    // Pinning the site's own tsconfig keeps the build independent of the Expo app's.
    tsconfig: 'tsconfig.json',
    resolve: {
      alias: [
        { find: '@', replacement: new URL('./src/', import.meta.url).pathname },
        { find: '~', replacement: new URL('../', import.meta.url).pathname },
      ],
    },
  },

  adapter: vercel(),
});
