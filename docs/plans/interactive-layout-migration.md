# Runbook: interactive layout migration (owner + agent, at the keyboard)

> Status: not started. Written 2026-10-16 against SDK 58 (expo-router 58.0.20, screens 4.30.0 +
> patch, safe-area-context 5.10, RN 0.88). This is the "how we do it together" companion to
> `master-detail-iphone-duo.md` (the why/what) and `android-stack-toolbar.md` (Android keeps its
> custom header). Read those first; this file does not repeat their reasoning.

## 1. Goal and non-goals

**In scope**

- Header/inset modernisation: replace the `marginTop: headerHeight` hack in
  `lib/components/ScrollViewWithHeader.tsx` with native inset handling, re-validate the
  react-native-screens title patch, fix `Player`/`Search` on resizable windows.
- List/detail on wide windows (iPad, iPhone Duo open, Android tablets/foldables) via the
  width-based `app/(dainos)/_layout.tsx` route (Option 4 of the master-detail plan).
- Below the breakpoint the app must look **pixel-identical** to today.

**Not in scope:** Android `Stack.Toolbar` (decided against), web (`build:web:disabled`),
`expo-hinge`, `ArrangementView` lyrics+translation, a global mini-player, App Intents.

## 2. Prerequisites (gate: do not start Session 0 until all pass)

From the device checklist in the PR #52 description ("Action required from you"). Layout work on a broken build just
records bugs in the baseline.

- [ ] Clean `pnpm install` (pnpm 10.x, Node 22.13+; see README); the `react-native-screens@4.30.0` patch applies.
- [ ] `npx expo prebuild --clean` on a Mac (generates `ios/` and runs `pod install`; native
      folders aren't committed). Build `ios/Dainorelis.xcworkspace` with **Xcode 27.1** (27.0
      runs Duo builds in a compatibility box, no edge-to-edge).
- [ ] `npx expo run:ios` on: an iOS 26+ iPhone sim, an **iOS 18** sim (the non-glass header and
      custom `Search` path), an iPad sim, the iPhone Duo sim, and the physical iPhone.
      There is no `expo-dev-client`; `run:ios`/`run:android` debug builds load from Metro.
- [ ] `npx expo run:android` on a phone emulator and a foldable/tablet emulator (e.g. Pixel Fold,
      Pixel Tablet, or the "Resizable" AVD).
- [ ] Checklist items that gate layout: theme light/dark/auto works; header title + variant
      dropdown OK on iOS 26 iPhone and iPad; all menus open and anchor correctly; deep link
      `dainorelis://dainos/<id>` opens a song. Anything broken here is fixed (own commit) first.

## 3. Session 0: baseline capture (~1.5–2 h, no code changes)

**Test songs** (from `songs.ts`; use these everywhere so screenshots line up):

| Key   | id                  | Why                                                           |
| ----- | ------------------- | ------------------------------------------------------------- |
| FULL  | `recTMFKZF1Hx4Moiq` | Baltas paukštis: lyrics + 3 PDFs, 7 audio, translation, desc. |
| CHORD | `recCHuPRITsL5MoII` | Raskila: several lyric variants with chords                   |
| LONG  | `recul1EalqrorRGul` | Longest title (truncation, patch)                             |
| PLAIN | `recCjk1A6VNES3giP` | Abba Tėve: one variant, no audio                              |

**Devices** (the owner drives Device Hub poses, Stage Manager and the physical phone):

- iPhone small (iPhone 16e / SE-class) and large (Pro Max), iOS 26+; one iPhone on iOS 18.
- iPad (11" and 13"): portrait, landscape, Stage Manager at ~ half / ~ two-thirds width,
  Split View 1/3.
- iPhone Duo: closed (portrait + landscape), open, partially folded, Split View when open.
- Android: phone; foldable folded/unfolded; tablet landscape. For width sweeps the agent can use
  `adb shell wm size 700x1600` … `wm size reset`.

**Screens × states** (light and dark each):

1. Index at top; index scrolled (header faded in); search focused with keyboard; search with
   results; favourites playlist (and empty favourites).
2. Song FULL: top, scrolled (title in header), variant menu open, PDF variant, player visible and
   playing, media menu open. CHORD: switch variant. LONG: header title. PLAIN: no player.
3. Modals: `vertimas`, `aprasymas`, `nustatymai` (top and scrolled).
4. Cold-start deep link to FULL (back goes to index), peek-and-pop preview from the list.

**Storage and naming.** Outside git: `~/dainorelis-layout/<step>/<device>_<screen>_<state>_<theme>.png`
(e.g. `00-baseline/ipad11-land_song-full_scrolled_dark.png`). Commit nothing binary.

**Agent can capture alone:** `xcrun simctl status_bar booted override --time 9:41` (stable
diffs), `xcrun simctl ui booted appearance dark|light`, `xcrun simctl openurl booted
dainorelis://dainos/<id>`, `xcrun simctl io booted screenshot <file>`; Android
`adb shell cmd uimode night yes|no`, `adb shell am start -a android.intent.action.VIEW -d
dainorelis://dainos/<id>`, `adb exec-out screencap -p > <file>`, demo mode for the status bar.
The agent can Read the PNGs and diff them with ImageMagick (`compare -metric AE -fuzz 1%`).
**Owner needed for:** physical iPhone, Duo poses, Stage Manager resizing, scrolling to a
specific state, the feel of animations and haptics.

## 4. Steps

Each step is one or more small commits on the session branch and is shippable on its own.
Format: **Change** / **Look at** / **Accept** / **Rollback** / **Decide**.

### Step 1: native content insets instead of `marginTop: headerHeight` (2–3 h)

- **Change:** `ScrollViewWithHeader.tsx`: on iOS pass `contentInsetAdjustmentBehavior="automatic"`
  and drop `marginTop`. On Android keep the header offset (the prop is iOS-only and the root
  `Stack` forces `headerTransparent: true` everywhere in `app/_layout.tsx`), as `paddingTop`
  instead of `marginTop`. Then check whether Android's `paddingBottom: headerHeight` was only
  compensating for the margin. Users: `app/dainos/[id].tsx`, `vertimas.tsx`, `aprasymas.tsx`,
  `nustatymai.tsx`. `app/index.tsx` is **not** touched (its FlatList intentionally draws the
  forest/logo under the header; RN's default `never` keeps that).
- **Scroll maths:** with automatic insets the iOS `contentOffset.y` rests at about `-headerHeight`
  instead of 0 **[unverified]**: have the agent log `useScrollOffset` at rest on the first reload.
  `HeaderTitle`'s threshold (`scrollOffset > layout.y + layout.height` in `lib/components/Header.tsx`)
  and `HeaderBackground`'s `[0, 40]` fade then need that resting offset added. Prefer a small
  helper (e.g. `useHeaderScrollOffset`) that normalises the offset to "0 = at rest", rather
  than per-call `Platform` maths.
- **Also check:** on iOS 26, SDK 58's system header appearance applies only when a screen sets no
  `headerBackground`. `HeaderBackground` returns `null` on glass, but the option is still set.
  Try `headerBackground: isLiquidGlassStyleHeader() ? undefined : …` and compare the scroll edge
  effect. The green title block in `[id].tsx` (`top: -headerHeight * 10`) must still fill under
  the glass header. Scroll indicators should now stop below the header (a small win).
- **Look at:** song FULL/CHORD scrolled to the exact point where the big title passes under the
  header (title fades in at the same scroll position as baseline), modals, settings. iOS 26,
  iOS 18, Android.
- **Accept:** resting screenshots identical to baseline (±1 px); title/header fade trigger at
  the same visual point; no content hidden under the header on rotation or iPad resize.
- **Rollback:** revert the commit (one component + one hook).
- **Decide:** Q1. If iOS <26 looks different with the automatic inset, keep the hack there
  (`isLiquidGlassStyleHeader()` gate) or accept the new look?

### Step 2: re-validate the react-native-screens title patch (1–2 h incl. rebuild)

- **Change:** none at first. Check upstream for a release that fixes the iOS 26 title inset
  (PR #3210 was closed; screens 5.x). Then on a throwaway branch remove the
  `pnpm.patchedDependencies` entry, `pnpm install`, `pod install`, rebuild, and screenshot.
  Fix the stale `4.25.2` path in the comment in `Header.tsx` regardless.
- **Look at:** song header for LONG and CHORD (variant dropdown), on iPhone 16e, Pro Max, iPad
  11" in a narrow Stage Manager window, and **Duo closed with vertical trailing toolbars**.
  The patch only measures horizontal bar items. Compare with and without the patch.
- **Accept:** title never under the heart/⋯ buttons; ellipsis truncation; the dropdown opens
  from the title on every device; after push/pop and rotation the title re-sizes.
- **Rollback:** restore the patch entry, `pnpm install`, `pod install`.
- **Decide:** Q2. Keep the patch, drop it (if stock is now fine), or extend it for Duo
  vertical bars (native Obj-C++ work, separate commit, timebox 2 h)?

### Step 3: `Player` and bottom `Search` on resizable windows (2–3 h)

- **Change:** `lib/components/Player.tsx` (width `isAppWide ? 360 : width - insets`, right/bottom
  from insets), `lib/components/Index/Search.tsx` (non-glass bottom bar; `expandedSearchWidth`,
  keyboard translate), the `ultraWideLayoutMode` background-image height in `app/index.tsx`.
  Fix only what the device pass shows; no refactors.
- **Look at:** Duo closed (asymmetric insets, trailing bars), iPad Stage Manager resizing while
  playing, iPad floating keyboard with search open (iOS 18 sim), Android foldable fold/unfold
  with search open, landscape phone with the player over a PDF.
- **Accept:** player and search never under system bars, camera region or the home indicator;
  they follow live resizes without remounting (audio keeps playing); search stays above the
  keyboard (docked and floating).
- **Rollback:** per-file revert.
- **Decide:** Q3. On wide windows should the player stay a 360 pt bottom-trailing pill, or centre
  under the 640 pt text column?

### Step 4: introduce `app/(dainos)/_layout.tsx`, single pane only (3–4 h)

- **Change:** move `app/index.tsx` → `app/(dainos)/index.tsx` and `app/dainos/[id].tsx` →
  `app/(dainos)/dainos/[id].tsx`; the new layout renders only a nested `<Stack>` with the same
  `screenOptions` (`headerTransparent: true, title: ''`) and `unstable_settings = { anchor: 'index' }`.
  The root `Stack` in `app/_layout.tsx` lists `(dainos)` (`headerShown: false`) plus the three
  modals. **No split yet.** Add `lib/constants/splitBreakpoint.ts` and `lib/hooks/useIsSplit.ts`,
  unused for now.
- **Watch for:** expo-router accepting `(dainos)/dainos/[id].tsx` next to
  `dainos/[id]/vertimas.tsx` **[unverified]**. Fallback: move the modals into a `(modals)`
  group at the root. `router.navigate('../')` in `SongDetailToolbar`/`ModalToolbar` and
  `HeaderLeft`'s `'../'` link must still go where they did.
- **Look at:** the whole baseline matrix below the breakpoint. The agent diffs everything it can
  capture alone.
- **Accept:** screenshot diffs ≈ 0 against baseline; cold-start deep link shows the song with back
  to index; peek-and-pop preview and its "favourite" action work; modals present over the song;
  Android back button/gesture unchanged.
- **Rollback:** revert the single move commit (`git mv` keeps history).
- **Decide:** none if it is identical. If it isn't, stop and fix before step 5.

### Step 5: list pane + detail pane (2–3 days, 3 commits)

- **5a. Panes.** `(dainos)/_layout.tsx`: when `useIsSplit()`, render
  `[<SafeAreaProvider>ListPane</SafeAreaProvider> | <SafeAreaProvider><Stack/></SafeAreaProvider>]`
  so every `useSafeAreaFrame()` caller (Player, Search, ListItem, `useMaxWidthPadding`) becomes
  pane-relative without changes. Extract the list body from `(dainos)/index.tsx` into
  `lib/components/Index/SongList.tsx` (shared by the pane and the narrow route). In split mode,
  `(dainos)/index.tsx` renders the empty-detail state (Q5). The list pane has no native header,
  so it uses the custom `Search` (it already renders `GlassView` when glass is available) plus a
  settings button that pushes `/nustatymai`.
- **5b. Selection.** `ListItem.tsx`: highlight the row whose id matches the active route. In split
  mode navigate with `push` when the detail top is `index`, else `replace` (or try
  `dangerouslySingular` first). Hide `HeaderLeft` and the `chevron.left` toolbar button
  (`SongDetailToolbar` in `lib/components/SongMenu.tsx`) in split mode.
- **5c. Transitions and entry points.** Cold-start deep link in both modes; resizing across the
  breakpoint while on a song, on the placeholder and with a modal open; `vertimas`/`aprasymas`/
  `nustatymai` presented as sheets over both panes; the player when switching songs (Q6);
  Android back in split mode (should leave the app or clear the selection? Q7).
- **Look at:** iPad landscape + portrait, Duo open, Android tablet/unfolded, plus a sweep across
  the breakpoint (Stage Manager drag / `adb shell wm size`).
- **Accept:** below the breakpoint, still identical to baseline; above it, selecting 10 songs in
  a row leaves a stack depth of 2; resizing never remounts the list (scroll position and search
  text survive); the variant `v` and media `m` query params still persist per song.
- **Rollback:** each sub-commit reverts on its own. Disabling is one line (`useIsSplit` returns
  `false`).

### Step 6: Duo poses, iPad sizes, foldables tuning (0.5–1 day)

- **Change:** column ratio in `(dainos)/_layout.tsx` (50/50 below ~1000 pt, fixed ~360–400 pt list
  above, per the master-detail plan), breakpoint value, any per-pose fixes.
- **Look at:** the Duo inner display: does the pane boundary sit on the hinge, and is anything
  tappable under the inner camera region? Then partially folded, Split View when open, iPad
  Stage Manager widths, Pixel Fold book posture.
- **Accept:** no control under the hinge or camera; no layout jump while dragging Stage Manager
  except at the breakpoint; menus and popovers anchor on the right pane.
- **Decide:** Q4 confirmed with real numbers. Is a native `ReservedRegion`/`FoldingFeature`
  module needed (out of scope, ~2–3 days)?

### Step 7: accessibility and dark mode pass (0.5 day)

- VoiceOver/TalkBack order across panes; after selecting a song, focus moves to the detail
  title (`AccessibilityInfo.setAccessibilityFocus`). The selected row announces "selected".
  Add the missing labels on custom header buttons (`Button.tsx` `TODO A11y label`).
- Largest Dynamic Type / font scale in both panes (list rows, header title, player). Reduce
  Motion (Search springs already respect it). Increase Contrast. Bold Text.
- Toggle light/dark/auto in settings **while split** and while a modal is open; both panes and
  the empty state recolour; no white flash on resize.

## 5. How the agent works during the session

- Branch `dc/layout-migration` off `dc/2026.1`. One step at a time; never start step N+1 with
  step N uncommitted. Commits are small, with a conventional message and the before/after file
  names from `~/dainorelis-layout/` in the body.
- Loop per change: agent proposes the diff and says exactly which device/screen/state to look at
  → applies it → Metro fast-refreshes (full reload `r` for layout-route changes; native rebuild
  only for step 2) → agent captures what it can and diffs against baseline → owner checks the
  rest and says "ok" or describes what's wrong → commit.
- Agent verifies alone before asking: `pnpm lint`, `npx tsc --noEmit`, sim/emulator screenshots
  and diffs, deep-link opens, appearance toggles, width sweeps via `adb shell wm size`.
- Follow AGENTS.md: no `useMemo`/`useCallback`/`React.memo` (React Compiler); `useRouter()`;
  never hand-edit `ios/`/`android/`. Native config goes through `app.config.ts` and prebuild.
- If a step blows its timebox by 2×, stop, write down what was learned in this file, and move
  on to the next independent step. Don't push. The owner decides when to merge.

## 6. Decisions to settle in the first 15 minutes

1. **Q1** iOS <26 header insets: same automatic insets everywhere, or keep the old hack there?
2. **Q2** Screens patch: keep / drop / extend for Duo vertical bars?
3. **Q3** Player position on wide windows (trailing pill vs centred under the text column)?
4. **Q4** Breakpoint: ~840 pt/dp (Material "expanded"; split only on iPad landscape/large and Duo
   open) or ~700 (also iPad portrait)? Column ratio as in step 6?
5. **Q5** Empty detail: "pick a song" placeholder (logo + forest), last-viewed song, or first
   song? (Last-viewed needs a new MMKV key.)
6. **Q6** Player when selecting another song in split mode: stop (today's behaviour), or keep
   playing (needs a mini-player outside the song screen; out of scope here)?
7. **Q7** List pane chrome: custom bottom `Search` + floating settings button (cheap), or a top
   search field? Does the forest/logo header appear in the pane at all? Android back in split.
8. **Q8** Timebox **1 hour** for `expo-router/unstable-split-view` on iOS first? Its column
   headers can't be customised and it must be the root navigator, so only worth it to see
   Apple's free fold behaviour. Recommended: skip unless the owner is curious; revisit when it
   leaves alpha.

## 7. Effort and cut lines

| Step                       | Estimate  | Ships alone?             |
| -------------------------- | --------- | ------------------------ |
| Prereqs                    | 0.5–1 day | yes (builds + lockfile)  |
| 0 Baseline                 | 1.5–2 h   | n/a                      |
| 1 Insets                   | 2–3 h     | yes                      |
| 2 Screens patch            | 1–2 h     | yes                      |
| 3 Player/Search            | 2–3 h     | yes                      |
| 4 `(dainos)` route, 1 pane | 3–4 h     | yes (no visible change)  |
| 5 Split panes (a/b/c)      | 2–3 days  | yes, behind `useIsSplit` |
| 6 Device tuning            | 0.5–1 day | yes                      |
| 7 A11y + dark              | 0.5 day   | yes                      |

- **Half a day:** Session 0 + steps 1–2. That is the "Phase 0 readiness" of the master-detail
  plan and makes the app correct on every device, without list/detail.
- **One day:** add steps 3–4 (resizable-window fixes + the route move, which de-risks step 5).
- **Full migration:** about 4–5 working days including steps 5–7.
