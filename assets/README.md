# assets

- **`brand/source/`**: the hand-made brand sources. `icon_v3.svg` is the mark on the app icon's 500x500 canvas (edit
  it with `scripts/brand/icon-studio.html`, whose "Mark size in the icon" sets the app icon's proportions);
  `miskas_v3.jpg` is the forest photo (Sebastian Unrau, Unsplash).
- **`brand/kit/`** (generated): the logo and the unframed lockup in white, ink and eglė as SVG and 3x PNG, the
  wordmarks and a square favicon. A reference kit for print, slides and the press; nothing in the app loads it.
- **`brand/store/`** (generated): images uploaded to the stores and link previews by hand: the Play Store icon and
  feature graphic, and the Open Graph and Twitter cards.
- **`images/`**: what the app, `app.config.ts` and the web build load. The app icons (`icon.png`, `icon.icon`,
  `adaptive-icon*.png`), `splash-icon.png`, the home header's `logo_white_v3*.png` and `miskas_v3_fade.webp` are
  generated; `profiles/` (Settings' credits), `stores/` (the web store badges) and `screenshots/` (the store
  screenshots, composed by `pnpm store-screenshots`) aren't.
- **`fonts/`**: the app's fonts; `ModekaExtended-Bold.otf` is also the logo's lettering.
- **`design/`**: v1's brand sheet, for reference.

`pnpm brand-assets` (`scripts/brand/generate-brand-assets.ts`) regenerates everything marked generated, plus the
favicons and `og.jpg` in `public/` and the admin app's icons; AGENTS.md's Brand Assets section has the details.
Generated files aren't edited by hand.
