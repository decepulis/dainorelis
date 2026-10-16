# Plan: Adopt `Stack.Toolbar` on Android

Saved 2026-05-08. Picks up where the SDK 56 upgrade left off.
Updated 2026-10-16 for SDK 58: Stack.Toolbar is now **stable** on both platforms, Android toolbars
need `@expo/ui` (already a dependency), and icons come from `@expo/material-symbols` (already a
dependency since the menu migration), so the drawables plugin and helper below are no longer needed.

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

## Required icon work (SDK 58)

`Stack.Toolbar.Button`/`Menu`/`MenuAction` take an SF Symbol name on iOS and an
`ImageSourcePropType` on Android. Use Material Symbols from `@expo/material-symbols` (Metro assets,
tinted by the toolbar) and branch on `process.env.EXPO_OS`, which Metro inlines so the other
platform's icon is tree-shaken. This is the pattern in the Expo docs and the one the song/variant/media
menus already use:

```tsx
import MoreVert from '@expo/material-symbols/more_vert.xml';

<Stack.Toolbar.Menu icon={process.env.EXPO_OS === 'ios' ? 'ellipsis' : MoreVert}>…</Stack.Toolbar.Menu>;
```

| Used by                                            | iOS (SF Symbol)                                             | Android (`@expo/material-symbols/…`)                                                          |
| -------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `SongDetailToolbar` back                           | `chevron.left`                                              | `arrow_back.xml` (or rely on the system back arrow)                                           |
| `SongDetailToolbar` favorite                       | `heart` / `heart.fill`                                      | `favorite.xml` (outlined only today; filled needs `npx add-material-symbols --fill favorite`) |
| `SongDetailToolbar` more                           | `ellipsis`                                                  | `more_vert.xml`                                                                               |
| Song menu: about / translation / chords / feedback | `book` / `translate` / `guitars` / `exclamationmark.bubble` | `menu_book` / `translate` / `music_note` / `feedback` (already imported in `SongMenu.tsx`)    |
| `ModalToolbar` close                               | `xmark`                                                     | `close.xml`                                                                                   |
| `IndexToolbar` settings                            | `slider.horizontal.3`                                       | `tune.xml`                                                                                    |
| `IndexToolbar` playlist menu                       | `music.note.list`                                           | `queue_music.xml`                                                                             |

## Code changes

### 1. Icons

No helper needed; inline the `process.env.EXPO_OS` ternary per icon, as above.

### 2. Drop the iOS-only gate on toolbars

In `lib/components/SongMenu.tsx::SongDetailToolbar`, `lib/components/Header.tsx::ModalToolbar`, `lib/components/Index/Search.tsx::IndexToolbar`:

- Remove `if (!isLiquidGlassStyleHeader()) return null;`
- Replace each hardcoded `icon="chevron.left"` etc. with the `process.env.EXPO_OS === 'ios' ? '…' : MaterialIcon` ternary
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

- Code changes: ~1–2 hours, mostly mechanical Platform.select on icons + condition flips.
- Visual QA: ~1 hour, mostly Android. iOS should be a no-op.

## Files touched

- `lib/components/SongMenu.tsx` — `SongDetailToolbar`.
- `lib/components/Header.tsx` — `ModalToolbar`, `HeaderBackground`, `HeaderLeft`.
- `lib/components/Index/Search.tsx` — `IndexToolbar`.
- `app/index.tsx`, `app/dainos/[id].tsx`, `app/dainos/[id]/vertimas.tsx`, `app/dainos/[id]/aprasymas.tsx`, `app/nustatymai.tsx` — drop Android `headerRight` / `headerLeft` overrides.

## What I left in place during the SDK 56 upgrade

The SDK 56 commit kept all toolbar usage iOS-Liquid-Glass-only, exactly as it was. Android still uses the custom green header. Nothing in the upgrade pre-emptively assumes this plan ships.
