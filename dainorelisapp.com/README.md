# dainorelisapp.com

The Astro marketing site for Dainorėlis: App Store / Google Play links, and `/qr`, which sends
phones to the right store by user agent (`src/pages/qr.ts`, a Vercel function).

It is a pnpm workspace package (`marketing-site`), so install from the repo root and run:

```sh
pnpm --filter marketing-site dev     # http://localhost:4321
pnpm --filter marketing-site build   # static pages + the /qr function, via @astrojs/vercel
```

Astro 7 (Vite 8) needs Node 22.22 or later. Images are imported from the app's `assets/images/`
through the `~` alias in `astro.config.mjs`, which also pins Vite to this directory's
`tsconfig.json` so the build never reads the Expo app's.

Deployed on Vercel as its own project, with Root Directory `dainorelisapp.com` (see
`vercel.json`). The canonical host is `https://www.dainorelisapp.com`; the repo-root Vercel
project only redirects there.
