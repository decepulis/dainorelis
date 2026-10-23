# dainorelisapp.com

The old domain. The site moved to https://dainorelis.app (the Expo web build, deployed from the repo root), and this
Vercel project (Root Directory `dainorelisapp.com`) now only redirects: `vercel.json` 308s every path, query
included, to the same path on dainorelis.app, so `/qr` on printed QR codes and shared `/p?…` playlist links keep
working. No app version lists this domain in its app links, so it serves no `.well-known` files.

Nothing to install or build; it is not a pnpm workspace package.
