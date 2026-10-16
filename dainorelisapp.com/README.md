# dainorelisapp.com

The Astro marketing site for Dainorėlis: App Store / Google Play links, and `/qr`, which sends
phones to the right store by user agent (`src/pages/qr.ts`, a Vercel function).

It is a pnpm workspace package (`marketing-site`), so install from the repo root and run:

```sh
pnpm --filter marketing-site dev     # http://localhost:4321
pnpm --filter marketing-site build   # static pages + the /qr function, via @astrojs/vercel
```

Images are imported from the app's `assets/images/` through the `~` alias in `astro.config.mjs`.

Deployed on Vercel as its own project, with Root Directory `dainorelisapp.com` (see
`vercel.json`). The canonical host is `https://www.dainorelisapp.com`; the repo-root Vercel
project only redirects there.
