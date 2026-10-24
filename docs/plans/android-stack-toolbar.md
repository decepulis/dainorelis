# Decision: keep the custom Android header (don't adopt `Stack.Toolbar` there)

Status: **not doing it**, decided 2026-10-16. This replaces a May 2026 plan that proposed moving
Android to `Stack.Toolbar`. It is kept only so the idea isn't re-proposed without these facts.

## What Android `Stack.Toolbar` actually is (expo-router 58.0.20)

Read from `node_modules/expo-router/build/layouts/stack-utils/toolbar/*android*`:

- `placement="left" | "right"` sets `headerLeft` / `headerRight` to an `@expo/ui` Compose `Host`
  holding a row of Material `IconButton`s. It is **not** a separate Material app bar. The native-stack
  header, our green `headerBackground` and our custom `headerTitle` (scroll-animated title,
  `VariantMenu` dropdown) are all untouched. The old plan's claim that adopting it means giving up
  the green header, and that "toolbar inside the green header" is "likely not viable", was wrong.
  That combination is the default result.
- The default placement (`bottom`) renders a Material 3 `HorizontalFloatingToolbar`, and
  `Stack.Toolbar.SearchBarSlot` renders `null` on Android. The iOS 26 index layout (search field in
  the bottom bar next to the playlist menu) **cannot** be reproduced. Android would have to keep
  `lib/components/Index/Search.tsx` or move search into the header with `Stack.SearchBar`.
- Buttons are icon-only (labels are dropped), `selected` is ignored, and `accessibilityLabel` is
  not derived from the label. Every item would need an explicit `accessibilityLabel` for TalkBack.
- One `tintColor` drives both the header icons and the dropdown's item text. The dropdown background
  defaults to the Material `surfaceContainer`, and the menu's trigger button gets that background
  too. White icons on green therefore mean either white text on a light menu or extra
  `backgroundColor` plumbing, plus checking how the trigger looks.

## What Android would gain

Very little. Android menus are already native Compose `DropdownMenu`s (`MenuView` wraps
`@expo/ui/community/menu`). Header buttons already have a ripple. The visible change would be
FontAwesome glyphs in green pills turning into 24dp Material Symbols, which is a style choice and
not a fix.

## What it would cost

- A third header code path (iOS 26 / older iOS / Android) in `SongMenu.tsx`, `Header.tsx`,
  `Search.tsx` and the five routes. The old plan's "1–2 h, mostly mechanical" ignored the index
  search problem, the tint and menu colours, and accessibility.
- Android QA on a device for a third header path. (When this was decided, nobody had run the app on
  Android since SDK 56; the current header has since been checked on a Pixel and a Fold emulator.)

## Recommendation

Keep the status quo. (The custom header buttons have since been given accessibility labels.) The
variant menu now lives in the navigation bar on every platform (6e75932): `VariantMenu` in
`HeaderTitle` on Android, so nothing here depends on a bottom bar. Revisit only if the owner explicitly wants a stock
Material look on Android. If so, switch only the song-detail and modal header buttons
(`placement="left"/"right"`, `tintColor="#fff"`, explicit `backgroundColor` and
`accessibilityLabel`). Keep the green background, `HeaderTitle`, `VariantMenu` and the custom
bottom search.
