# dainorelisapp.com

The old domain. The site moved to https://dainorelis.app (the Expo web build, deployed from the repo root), and this
Vercel project (Root Directory `dainorelisapp.com`) now only redirects: `vercel.json` 308s every path, query
included, to the same path on dainorelis.app, so `/qr` on printed QR codes and shared `/p?…` playlist links keep
working.

The exception is `public/.well-known/`, which it keeps serving: app versions that only list
`www.dainorelisapp.com` in their associated domains and intent filters verify against these files (the app
links don't follow redirects), and open its `/p` links directly. Keep them, and the domain, for as long as such
versions are in use.

Nothing to install or build; it is not a pnpm workspace package.
