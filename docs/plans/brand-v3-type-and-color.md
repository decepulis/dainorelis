# Brand v3: typography and color

A handoff brief. The brand exploration (Oct 2026) settled the direction, the palette and the type.
This document carries those decisions to whoever implements them. It covers **typography and color
only**. The wordmark and the app icon are out of scope: Darius is finishing them by hand in Affinity,
so leave `HeaderLogo`, `assets/images/icon*` and the splash alone.

## Why this exists

v1 (the original brand) was coherent: Modekan's cut letters, Klavika's flat-sided type, the angular
X mark, sage and cream, a misty pine forest. Everything came from one source: Lithuanian woven sashes
(juostos) and woodcarving.

v2 drifted. Rounded corners, a softer UI and SF Symbols sat next to the angular mark and Modekan, so
the app ran two visual grammars at once and read as childish. Sage (`#70997F`) also fails contrast
behind white text (3.2:1), and the dark-mode primary (`#53745e` on `#121314`) is 3.6:1.

v3 is called **Audinys** (weave): back to v1's roots, rebuilt so it's accessible and works in dark
mode and under Liquid Glass.

## Principles

1. **Color carries the brand.** Under Liquid Glass the chrome is clear glass, so the brand reaches the
   screen through the tint color, the content behind the glass (the forest header, surfaces) and the
   icon. Typography matters in titles, but color is what's on every screen.
2. **Two layers.** The *chrome* (toolbars, menus, search, player controls) belongs to the platform:
   SF Symbols and Material, rounded, tinted with the brand color. The *content* (header, song titles,
   brand glyphs) is angular and branded. Don't put an SF Symbol right next to the wordmark or a brand
   glyph.
3. **One voice per role.** Modeka Extended is the wordmark. Saira Semi Condensed is for titles. The system
   font is for everything you read at length.

## Color

Named after Lithuanian nature, the way the sash threads were. Contrast ratios are WCAG, computed for
these exact values.

### Core tokens

| Role | Light | Dark | Notes |
|---|---|---|---|
| `background` | `#EEECE5` linas (linen) | `#121614` naktis (night) | Light shifts from neutral `#f1f1ee` to a warmer linen. Dark gets a slight green bias instead of neutral `#121314`. |
| `card` (raised) | `#FFFFFF` | `#1C221F` | |
| `card0` (sunken) | `#E2E0D8` | `#0B0E0C` | |
| `text` | `#18201B` (14.1 on linas) | `#ECEAE3` (15.2 on naktis) | Ink with a green bias, never pure black. |
| secondary text | `#56615A` (5.5) | `#9AA59E` (7.2) | |
| `primary` / tint | `#2F5240` eglė (fir): 7.4 on linas, 8.7 behind white text | `#8FBA9C` eglė, lifted: 8.4 on naktis | **Dark-mode primary is a light color.** Anything filled with it needs dark text (`#0E1B13`, 8.2), not white. Check every place `primary` is used as a background. |
| `chrome` (green bars) | `#597D66` samanos, tuned (white 4.6) | `#2F5240` eglė (white 8.7) | Header bar, round header buttons, bottom pill, floating player, the iOS 26 title band. White content only. Added during implementation. Light is samanos a step deeper than v1's sage so the bars sit with the misty forest photo (deep eglė fought it); don't use `#70997F` itself for bars (white is 3.2). Dark stays deep evergreen at night instead of turning mint. HC `#4C6B58` light (white 5.9), `#234033` dark. **In light mode, content on `chrome` is full white, never dimmed**: white at 0.75 is 3.4 and fails. |
| high-contrast `primary` | `#234033` (9.6) | `#A9CDB4` (10.5) | For `LightHighContrastTheme` / `DarkHighContrastTheme`. |

### Supporting colors

| Name | Value | Use |
|---|---|---|
| samanos (moss) | `#70997F` | v1's sage. **Decorative only**: header gradients, splash, illustration. Never behind or as text (3.2:1). |
| ramunė (chamomile yellow) | `#E6BD5C` bright, `#B8862A` deep | The brand **accent**, chosen over red (red read as Christmas). Decorative only: small highlights, the heart of the star mark, a selected-playlist marker. Bright passes on eglė (4.9) and on night (10.3). Deep fails as text on linas (2.7). If it ever has to be text on light, use `#8A6414` (4.5). |

### Rules

- One tint everywhere: eglė. No second interactive color.
- Never place yellow, green and red side by side in that order. Together they read as the flag, not a
  sash.
- Dark mode is a first-class mode, not an afterthought. The app gets used at night by a campfire.
- iOS separators can stay `PlatformColor('separator')`.
- The header photo stays the current misty forest (`assets/images/miskas*`). Its pale greens are why the light-mode
  bars are samanos rather than eglė.

## Typography

| Role | Face | Weights | Where |
|---|---|---|---|
| Wordmark | Modeka Extended (licensed, WildOnes Design; replaced Modekan in Oct 2026) | 400, 700 | The home header wordmark only, in Bold (`fonts.brandBold`; Regular is `fonts.brand`). |
| Titles | **Saira Semi Condensed** (SIL OFL, Google Fonts) | 500 list rows, 600 screen titles | Song titles (song screen title, song list rows) and their parenthetical second lines, playlist names, section headers on the home list and in Settings. |
| Everything else | System (SF Pro / Roboto) | as now | Lyrics, chords, translations, descriptions, settings, menus, buttons, search. |

- Saira was picked as the licensable stand-in for v1's Klavika (flat-sided rounds, slightly squared,
  slightly condensed). Darius rejected it for body text because it's hard to read at length. Don't
  use it for lyrics or paragraphs.
- Bundle only the weights in use (Medium and SemiBold) through `expo-font` in `app.config.ts`, next to
  Modeka Extended. On Android a custom family can't switch weights through `fontWeight`, so expose one family
  name per weight, the way `fonts.brand` pins Modeka Extended.
- Titles must honor Dynamic Type and font scaling like the system text around them.
- The iOS large title is UIKit's. Set the font through the header's large-title style, then check it
  against the `react-native-screens` patch. The patch shrinks a large title that's too wide (down to
  28pt) and keeps room for the caron of š/ž. Saira's metrics differ from SF, so verify both behaviors
  still hold.
- Test titles: `Parveski, Viešpatie (Kaip grįžtančius namo paukščius)` (longest),
  `Žalia pieva - nekelmynė (Valio, Pjovėjėliai)` (diacritics and carons), `Aisim sesės į darželį`.

## Icons in the UI

- Keep SF Symbols and Material Symbols for chrome. On iOS prefer outline forms at medium weight, and
  avoid the `circle.fill` variants, which push the roundness furthest.
- Material Symbols' **Sharp** style (square corners) would match Audinys on Android. That's a
  proposal, not approved: ask Darius before switching.

## Explicitly rejected (don't reintroduce)

- **Nunito**, anywhere ("never want to see it again"). Also Chakra Petch, Exo 2, Sofia Sans Condensed.
- Saturated flag green (`#006B3F`-ish) as the primary. It reads official and loses the mist.
- Red as the accent.
- Rounded "friendly" brand elements next to angular ones: the pill-shaped wordmark, rounded logo box.
- Pixel or bitmap "thread" graphics.

## Not decided (don't build yet)

- **Playlist thread colors**: each playlist gets a color from a sash palette (rugiagėlė `#34508F` /
  `#A3B8EA`, viržis `#6A4579` / `#CBA6DA`, šermukšnis `#A23B2C` / `#E88A73`) shown as a stripe on its
  rows. Darius hasn't approved it.
- A sash edge stripe as a divider under the home header. He was unsure about it.
- The star mark (žvaigždutė) as an in-app glyph. It depends on the final drawing.

## Validation

- Light, dark, and both high-contrast themes, on iPhone, iPad and Android, in the simulators.
- Liquid Glass (iOS 26) and the custom header (older iOS, Android).
- Dynamic Type at the largest accessibility sizes, using the test titles above.
- Every surface where `primary` is a fill: check the text on top in both modes.
- `npx tsc --noEmit` and `pnpm lint`.

## Background material

- Brand directions page: https://claude.ai/artifact/4cZ1aFVFiMBh6U1RVXNJNs
- Marks and sash history: https://claude.ai/artifact/K9T75X8cr1RH4CbyGEBPNL
- Affinity exploration exports: `assets/design/v3_exploration_*.pdf`, v1 board `assets/design/v1_brand.jpg`
