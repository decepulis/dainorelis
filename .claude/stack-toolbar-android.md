# Plan: Adopt `Stack.Toolbar` on Android

Saved 2026-05-08. Picks up where the SDK 56 upgrade left off.

## Background

Today the app has two header schemes, gated on `isLiquidGlassStyleHeader()` (= iOS ≥ 26 with Liquid Glass available):

- **Liquid Glass iOS:** `Stack.Toolbar` (system bar). Implemented in `lib/components/SongMenu.tsx::SongDetailToolbar`, `lib/components/Header.tsx::ModalToolbar`, and `lib/components/Index/Search.tsx::IndexToolbar`. Uses SF Symbol names directly: `chevron.left`, `heart` / `heart.fill`, `ellipsis`, `book`, `translate`, `guitars`, `exclamationmark.bubble`, `xmark`, `slider.horizontal.3`, `music.note.list`.
- **Everywhere else (older iOS + Android):** custom green `HeaderRight` buttons (`HeaderButtonContainer` → `Button` → `FontAwesome6` glyph). Same actions, bespoke chrome.

In SDK 56 expo-router 56.0.0 [shipped Android `Stack.Toolbar` support](https://github.com/expo/expo/blob/main/packages/expo-router/CHANGELOG.md#5600--2026-05-05) (PR [#43970](https://github.com/expo/expo/pull/43970), #43979 for menus, #44052 for header toolbar). On Android the toolbar renders as a Material Toolbar on the system header — a structurally different look than the current green branded header.

## Goal

Render `Stack.Toolbar` on Android instead of the custom green `HeaderRight` buttons, so Android gets the same system-toolbar treatment iOS 26 does. Drop the redundant `HeaderRight`/`HeaderButtonContainer` paths on Android.

## Open question to resolve before starting

Is "give up the green branded Android header in favor of a Material toolbar + Material-style header" actually what you want? It's a big visual change. Three options:

1. **Full system-Material on Android** (what this plan assumes): drop the green header. App looks like a "real" Material app on Android.
2. **Keep the green header, add the toolbar inside it**: probably looks odd, since `Stack.Toolbar` is a system feature, not a custom child of your `headerBackground`. Likely not viable.
3. **Stay status quo on Android**: don't adopt it. Skip this plan.

Recommend confirming **(1)** before doing the work below.

## Required icon work

The toolbar takes an `icon` prop. On iOS that's an SF Symbol name; on Android it's a Jetpack Compose vector or a drawable. Existing Material drawables in `assets/images/icons/` (wired through `withAndroidDrawables`):

```
description_20px, feedback_20px, format_quote_20px, menu_book_20px,
share_20px, music_note_20px, translate_20px
```

Mapping needed for the existing toolbar icons:

| Used by | iOS (SF Symbol) | Android — exists? | Action |
|---|---|---|---|
| `SongDetailToolbar` back | `chevron.left` | system back arrow | use `Stack.Toolbar.Button` w/o icon, or platform-select |
| `SongDetailToolbar` favorite | `heart` / `heart.fill` | not in repo | add `favorite_border_24px` + `favorite_24px` drawables |
| `SongDetailToolbar` more | `ellipsis` | not in repo | add `more_vert_24px` |
| Song menu — about | `book` | use `menu_book_20px` | platform-select |
| Song menu — translation | `translate` | `translate_20px` ✓ | platform-select |
| Song menu — chords | `guitars` | use `music_note_20px` | platform-select (chords ≠ music note ideally; consider `music_note_with_underline` / fall back) |
| Song menu — feedback | `exclamationmark.bubble` | `feedback_20px` ✓ | platform-select |
| `ModalToolbar` close | `xmark` | system close | `close_24px` drawable |
| `IndexToolbar` settings | `slider.horizontal.3` | not in repo | add `tune_24px` |
| `IndexToolbar` playlist menu | `music.note.list` | not in repo | add `playlist_play_24px` or reuse |

Action: extend `assets/images/icons/` with the missing drawables (Material Symbols Outlined, 24dp). Add to the `withAndroidDrawables` plugin in `app.config.ts`.

## Code changes

### 1. Toolbar icon helper

Add a small helper, e.g. `lib/components/toolbarIcon.ts`:

```ts
import { Platform } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

type IconSpec = { ios: string; androidDrawable: string };

export function toolbarIcon({ ios, androidDrawable }: IconSpec): string | ImageSourcePropType {
  return Platform.select({
    ios,
    default: { uri: androidDrawable }, // referenced via asset:// when wired through withAndroidDrawables
  })!;
}
```

(Verify the exact `image` prop shape that `Stack.Toolbar.Button` accepts on Android — see `expo-router` types or `https://docs.expo.dev/versions/v56.0.0/sdk/router/` once docs catch up. If it takes `Platform.select`-able plain strings, simplify.)

### 2. Drop the iOS-only gate on toolbars

In `lib/components/SongMenu.tsx::SongDetailToolbar`, `lib/components/Header.tsx::ModalToolbar`, `lib/components/Index/Search.tsx::IndexToolbar`:

- Remove `if (!isLiquidGlassStyleHeader()) return null;`
- Replace each hardcoded `icon="chevron.left"` etc. with `icon={toolbarIcon({ ios: '...', androidDrawable: '...' })}`
- Audit each call site for SF-Symbol-only props (e.g. `selected={isFavorite}`) and confirm Android support; fall back behavior may differ.

### 3. Remove the now-redundant `HeaderRight` / `HeaderButtonContainer` paths on Android

Today `app/index.tsx` and `app/dainos/[id].tsx` set `headerRight: !isLiquidGlassStyleHeader() ? () => <HeaderButtonContainer>...</HeaderButtonContainer> : undefined`. After this plan, that condition collapses to `Platform.OS !== 'ios' || isLiquidGlassStyleHeader() ? undefined : () => <HeaderButtonContainer>...</HeaderButtonContainer>` — i.e., custom HeaderRight is **only** for older iOS now.

`HeaderLeft` similarly: drop on Android (toolbar handles back/close), keep for older iOS.

### 4. Header background on Android

`HeaderBackground` currently renders the green `SystemView` everywhere except Liquid Glass iOS. With Stack.Toolbar on Android, the system header background becomes Material — likely transparent or theme-colored. Decide whether to:

- (a) keep the green `SystemView` background on Android (toolbar floats on top of it — verify it still looks OK), or
- (b) drop `headerBackground` on Android and let the system header show.

Recommend (b) for a coherent Material look.

### 5. Status bar / navigation bar

`expo-status-bar` and `expo-navigation-bar` may need to be told to use the new theme on Android — verify status bar contrast against the system Material header.

## Test plan

- iOS pre-26 (custom green header): unchanged.
- iOS 26+ (Liquid Glass): unchanged from today.
- Android: toolbar back / favorite / overflow menu all work and use the right Material drawables. Modal screens (`vertimas`, `aprasymas`) get the close X. Index screen gets the playlist menu + settings button. Verify TalkBack reads the icon-only buttons (expo-router 56.0.3 added `accessibilityLabel` → `contentDescription` forwarding for this).

## Effort estimate

- Drawables: ~30 min (download from Material Symbols, verify on emulator).
- Code changes: ~1–2 hours, mostly mechanical Platform.select on icons + condition flips.
- Visual QA: ~1 hour, mostly Android. iOS should be a no-op.

## Files touched

- `app.config.ts` — add new drawables to `withAndroidDrawables`.
- `assets/images/icons/*.xml` — new Material drawables.
- `lib/components/toolbarIcon.ts` — new helper.
- `lib/components/SongMenu.tsx` — `SongDetailToolbar`.
- `lib/components/Header.tsx` — `ModalToolbar`, `HeaderBackground`, `HeaderLeft`.
- `lib/components/Index/Search.tsx` — `IndexToolbar`.
- `app/index.tsx`, `app/dainos/[id].tsx`, `app/dainos/[id]/vertimas.tsx`, `app/dainos/[id]/aprasymas.tsx`, `app/nustatymai.tsx` — drop Android `headerRight` / `headerLeft` overrides.

## What I left in place during the SDK 56 upgrade

The SDK 56 commit kept all toolbar usage iOS-Liquid-Glass-only, exactly as it was. Android still uses the custom green header. Nothing in the upgrade pre-emptively assumes this plan ships.
