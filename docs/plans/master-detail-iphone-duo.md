# Plan: large-screen master-detail (iPhone Duo, iPad, foldables)

> Status: scoping only, not started. Written 2026-10-16 against Expo SDK 58 (expo-router 58, @expo/ui 58, RN 0.88).
> Confidence labels: **[verified]** = read in code/node_modules, **[doc]** = Expo/Apple docs, **[unverified]** = inference.
>
> Prerequisite (done): the native projects were regenerated for SDK 58 in 08ef613, so the iOS
> scene lifecycle (SceneDelegate + UIApplicationSceneManifest) required by the iOS 27 SDK is in place.
> The URL scheme is now `dainorelis` (was the template's `myapp`), so deep links are
> `dainorelis://dainos/<id>`.

### What changes on iOS 27 / iPhone Duo

| Topic                                                                                                                                                                                                                                                                                          | What it means for Dainorėlis                                                                                                                                                                                                                            | Source                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scene lifecycle mandatory with iOS 27 SDK                                                                                                                                                                                                                                                      | Handled by SDK 58 prebuild, but this repo needs a re-prebuild (section 0).                                                                                                                                                                              | [doc] SDK 58 changelog                                                                                                                                  |
| Apps become resizable on iPhone automatically. `requireFullScreen` no longer opts out. `ScreenOrientation.lockAsync` may be ignored.                                                                                                                                                           | The app doesn't lock orientation (`orientation: 'default'`, `UIRequiresFullScreen=false`), so nothing to undo. All layout already goes through `useSafeAreaFrame()` (index, ListItem, Search, Player, `useMaxWidthPadding`) and reacts to size changes. | [doc] changelog; [verified] grep                                                                                                                        |
| iPhone Duo outer display is compact width (portrait). Inner display is regular width and height. "The inner display doesn't honor your supported interface orientations. Size classes are the reliable signal."                                                                                | On the inner display the app will hit the existing `width > maxWidth (640)` "wide" path. That gives a centred card, the exact centred-column layout Apple says to audit ("consider whether you can make it a two-column layout").                       | [doc] Apple iPhone Duo group lab https://developer.apple.com/forums/thread/847644; Tech Talk https://developer.apple.com/videos/play/tech-talks/111463/ |
| On the closed display, system toolbars and tab bars move to the trailing edge (vertical bars). Custom bars do **not** move.                                                                                                                                                                    | `Stack.Toolbar` items are native `UIBarButtonItem`s and should adapt. The custom **`Player`** bar (bottom-anchored RN view) and the custom non-glass `Search` header will not. Safe-area insets become asymmetric.                                      | [doc] group lab                                                                                                                                         |
| SDK build modes: iOS 26 SDK builds run in an iPhone-aspect compatibility box. iOS 27 SDK extends further. **iOS 27.1 SDK is needed for full edge-to-edge.**                                                                                                                                    | Build with Xcode 27.1 for Duo.                                                                                                                                                                                                                          | [doc] group lab                                                                                                                                         |
| `ArrangementView`, `ReservedRegion`, `onHingeChange`, `UIHingeInteraction` are **iOS 27.1+**.                                                                                                                                                                                                  | Any Duo-specific API needs 27.1 gating.                                                                                                                                                                                                                 | [doc] group lab; `@expo/ui` source says `@platform ios 27.1+` [verified]                                                                                |
| "Prefer system containers (`NavigationSplitView`/`UISplitViewController` …) — they adapt to the fold for free." In Reminders "the system keeps both columns visible … into an even 50/50 split." "Avoid putting navigation containers like NavigationSplitViews inside of an ArrangementView." | This is the main design tension: the best Duo behaviour comes from a _native_ split container, and the app's navigation is a native-stack JS router.                                                                                                    | [doc] Tech Talk                                                                                                                                         |
| SDK 58 popovers: `SceneGeometry.anchorPopover` for module authors.                                                                                                                                                                                                                             | Relevant only if menus (`@react-native-menu/menu`, `Stack.Toolbar.Menu`) mis-anchor on the inner display. Test it.                                                                                                                                      | [doc] changelog                                                                                                                                         |

### Is `expo-hinge` useful here?

**No, not for layout.** The Expo docs say: _"Use hinge state for interactions and effects, not for layout."_ (https://docs.expo.dev/versions/v58.0.0/sdk/hinge/). Apple says the same: hinge angle drives effects, and layout belongs to arrangement and reserved-region APIs. The package only reports `angle` and `status`. It does **not** report the fold's bounds, so it couldn't place a column boundary even if we wanted to. On Android it never reports `closed`, and it reports `unknown` when the window doesn't span the fold. iOS needs 27.1 and Xcode 27.1.

Possible non-layout uses: maybe a "tabletop" mode for the PDF/sheet-music view or lyrics teleprompter. That would be a product idea, not part of this scope. Don't add the dependency now.

### Layout options

**Option 1: `expo-router/unstable-split-view` (`SplitView`)**

- Exists in SDK 58: `node_modules/expo-router/build/split-view/*`, exported as `expo-router/unstable-split-view`. **[verified]** Docs: https://docs.expo.dev/versions/v58.0.0/sdk/router/split-view/
- It wraps `react-native-screens`' gamma `Split.Host`, a real `UISplitViewController`. On iPhone it collapses to one column. **[verified]** So in theory it gets Apple's free fold behaviour.
- Blockers for this app:
  - **Alpha.** The docs say it is "not ready for production usage yet". iOS only. On Android and web it degrades to a `Slot` with a console warning, so there is **no split on Android tablets or foldables**. **[verified]** in `split-view.js`
  - It must be the root navigator. It throws `'SplitView cannot be used inside another native navigator.'` **[verified]** So the current root `Stack` (which hosts the modals `nustatymai`, `vertimas`, `aprasymas`) would have to move _inside_ the detail column.
  - **"The header (navigation bar) within split view columns cannot be customized."** [doc] Each column is wrapped in an `RNSSplitNavigationController` with a visible nav bar. **[verified]** in `RNSSplitHostController.mm` The app depends heavily on header customisation: the custom `HeaderTitle` with scroll-linked fade, the `VariantMenu` title wrapper, the `Stack.Toolbar` search bar slot, and the favourite/menu toolbar items. A `Stack` nested in the detail column would probably produce a **second nav bar** under the split's own bar. **[unverified]** That needs a spike to confirm.
  - The list column isn't a route, so the `Stack.Toolbar.SearchBarSlot` search on iOS 26+ wouldn't be available there.
- Verdict: wrong time to adopt it. Re-evaluate when it leaves alpha and supports column headers.

**Option 2: `@expo/ui` `NavigationSplitView` (SwiftUI)**

- iOS/tvOS 16+. Two or three columns. Selection lives in JS state (`useState`), and `preferredCompactColumn` is needed to show the detail on iPhone. **[verified]** source; [doc] https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/navigationsplitview/
- To use it, the RN list and detail screens would have to be hosted inside SwiftUI via `RNHostView`. Navigation state would then live **outside expo-router**. That breaks or duplicates deep links (`/dainos/[id]`), `Stack.Screen` options, `Stack.Toolbar`, `useLocalSearchParams` (`v`, `m` params), and modal presentation. It also has nested-header problems, because SwiftUI's nav bar and RN Screens' nav bar don't coordinate. iOS only.
- Verdict: no. It suits SwiftUI-first screens, not an expo-router app built around native-stack headers.

**Option 3: `@expo/ui` `ArrangementView`**

- iOS/tvOS **27.1+**. Below that, children render without a container. Two slots, `Primary` and `Secondary`, with `arrangementViewStyle('split' | 'overlay')`. **[verified]** source; [doc] https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/arrangementview/
- Apple says it is for primary/secondary _content within a screen_ and explicitly not for navigation containers. The docs don't say whether RN children via `RNHostView` are supported. All examples are pure SwiftUI.
- Verdict: not a master-detail solution. A possible **later** use inside the song screen: on Duo/iPad, lyrics as primary and translation (`vertimas`, now a modal) as secondary. That is Apple's own Podcasts-transcript pattern. Park it as a follow-up and spike `RNHostView` inside it first.

**Option 4: custom width-based master-detail in an expo-router layout route (recommended)**

- A group layout `app/(dainos)/_layout.tsx` renders `[ListPane | nested <Stack/>]` side by side when the window is wide, and only `<Stack/>` when narrow. URLs don't change (groups are URL-less), so `/dainos/[id]` deep links keep working.
- Keeps `Stack.Screen` options, `Stack.Toolbar`, the patched header, modal routes and query params. It works the same on **iOS, iPadOS, Android tablets and foldables, and web**.
- Cost: no "free" fold adaptation. JS can't currently read `ReservedRegion` (iOS) or `FoldingFeature` bounds (Android), so the column split is heuristic (see the 50/50 rule below).

### Recommendation

1. **Phase 0, readiness (do first, needed regardless):** re-prebuild `ios/` (section 0). Build with Xcode 27.1. Run through Device Hub iPhone Duo poses (closed, open, partially folded, Split View) and iPad window resizing. Fix what breaks. Likely suspects:
   - the `react-native-screens` header-inset patch (`patches/react-native-screens@4.30.0.patch` reimplements `computeEdgeInsetsOfNavigationBar` for iOS 26 and may misbehave with vertical bars or asymmetric margins);
   - `Player` and custom `Search` under trailing-edge toolbars and asymmetric insets;
   - the `ultraWideLayoutMode` background-image maths in `app/index.tsx`;
   - menu and popover anchoring.

   Effort: **1–3 days**.

2. **Phase 1, Option 4 master-detail** (sketch below). Effort: **5–8 dev days plus 2 days of QA** across iPhone, iPad (portrait, landscape, Stage Manager resizing), iPhone Duo (simulator), an Android tablet or foldable emulator, and web if it gets re-enabled.
3. **Later:** re-evaluate `unstable-split-view` when it stabilises, and look at `ArrangementView` for lyrics plus translation on 27.1+.

### Sketch of Option 4

Route tree (URLs unchanged):

```
app/_layout.tsx                 root Stack: (dainos), nustatymai [modal], dainos/[id]/vertimas [modal], dainos/[id]/aprasymas [modal]
app/(dainos)/_layout.tsx        NEW: width-aware layout; unstable_settings = { anchor: 'index' }
app/(dainos)/index.tsx          narrow: the list (today's index.tsx); wide: "pick a song" placeholder (or auto-select)
app/(dainos)/dainos/[id].tsx    moved from app/dainos/[id].tsx
app/dainos/[id]/vertimas.tsx    stay at root so they present as modals over both panes
app/dainos/[id]/aprasymas.tsx
```

**[unverified]** expo-router should accept `app/(dainos)/dainos/[id].tsx` next to `app/dainos/[id]/vertimas.tsx`, since the URLs differ, but confirm in the spike. A fallback is to keep the modals in the root Stack via a `(modals)` group.

Layout behaviour:

- `isSplit = windowWidth >= SPLIT_BREAKPOINT`. Suggested ~840 pt/dp, matching Material's "expanded" class; see the open questions. In split mode, wrap each pane in its own `SafeAreaProvider`. Every existing `useSafeAreaFrame()` / `useSafeAreaInsets()` call then becomes pane-relative without touching those components. expo-router's own `SplitView.Column` does exactly this. **[verified]**
- **Column ratio: use 50/50 when the window is narrower than ~1000 pt, and a fixed ~360–400 pt list column above that.** This heuristic puts the pane boundary on the hinge on iPhone Duo's inner display and on book-style Android foldables, and matches what Apple's split view does on the fold. It's the best we can do without reserved-region data. **[unverified]** We don't know Duo's exact point width. Tune it in Device Hub.
- Selection: tapping a list item in split mode keeps the nested stack at depth 2 (`[index, dainos/X]`). Use `router.push` when the top is `index`, otherwise `router.replace`, or `dangerouslySingular` on the screen, which exists in expo-router 58 **[verified]** typings. When the window shrinks (Duo closes, iPad window narrows), the user is on the song with "back" to the list. When it grows, the list pane appears next to it. Nothing re-mounts except the pane wrapper. Verify that.
- Highlight the selected row in `ListItem` (read the `id` from the route).
- Headers: the detail pane keeps its native Stack header and `Stack.Toolbar`. Hide the `chevron.left` back toolbar item (`SongDetailToolbar`) and `HeaderLeft` in split mode. The list pane sits outside any Stack, so it can't use `Stack.Toolbar.SearchBarSlot`. Reuse the existing non-glass `Search` component (already used on Android and iOS < 26) plus a settings button. Possibly an `@expo/ui` `Host` with SwiftUI controls for a glass look. This is the biggest UX decision; see the open questions.
- `maxWidth` (640): keep it as the detail pane's text-measure cap. It becomes pane-relative automatically through the nested `SafeAreaProvider`. Add a separate `SPLIT_BREAKPOINT` constant.
- Audio: `Player` lives in the song screen. In split mode, switching songs replaces the screen and stops playback, which matches today's behaviour when going back. Product question below.
- New code must follow AGENTS.md: React Compiler is on, so no new `useMemo`/`useCallback`.

Files likely touched:

- `app/_layout.tsx`: root Stack screen list
- `app/(dainos)/_layout.tsx`: new
- `app/index.tsx` → `app/(dainos)/index.tsx`, with the list body extracted to e.g. `lib/components/Index/SongList.tsx` so the pane and the narrow route share it
- `app/dainos/[id].tsx` → `app/(dainos)/dainos/[id].tsx`
- `lib/components/Index/ListItem.tsx`: selection highlight, push/replace
- `lib/components/Index/Search.tsx`: pane variant
- `lib/components/SongMenu.tsx` and `lib/components/Header.tsx`: hide back in split mode
- `lib/components/Player.tsx`: insets
- `lib/constants/maxWidth.ts` plus a new `lib/constants/splitBreakpoint.ts`; new `lib/hooks/useIsSplit.ts`
- `lib/hooks/useMaxWidthPadding.ts`: probably unchanged thanks to the nested `SafeAreaProvider`
- `ios/` regenerated (Phase 0)
- No `app.config.ts` change needed for A; `supportsTablet: true` and `orientation: 'default'` are already right

### Risks (A)

- No real iPhone Duo hardware. Device Hub poses are the only test bed, and Xcode 27.1 was reported as still in beta in September. **[unverified]**
- The heuristic column split can't see the hinge or camera reserved regions. A custom `Player` bar or bottom search could sit under the fold or the inner FaceTime camera. Apple warns that touches near the camera region may be suppressed for views that don't adopt reserved regions. Mitigation, if it matters: a small inline Expo module exposing `reservedRegions(kind:)` and `FoldingFeature` bounds. That is about 2–3 extra days and out of scope.
- The `react-native-screens` patch is load-bearing for iOS 26 headers and untested with vertical toolbars, narrow detail panes and iPad split widths.
- Moving routes into a group changes the navigation-state shape: `navigation.getState()` in `[id].tsx` checks for `preloadedRoutes`, and the toolbar back uses `router.navigate('../')`. Both need regression testing, especially peek/preview and cold-start deep links (the `anchor: 'index'` behaviour).
- The `isLiquidGlassStyleHeader()` code paths double the test matrix (iOS 26+ glass vs others) × (split vs stacked).

### Open questions for the owner (A)

1. Is iPad/Duo master-detail wanted at all, or is Phase 0 readiness enough for now? (The app is already resizable and centred.)
2. Breakpoint: split on iPad portrait (~744–834 pt), or only landscape and large iPads? Material says ≥840 dp for two panes.
3. In split mode, should the detail pane be empty ("pick a song"), the last-viewed song, or the first song?
4. List-pane search on iOS 26+: accept the custom (non-glass) search field in the pane, or invest in a SwiftUI-hosted glass search?
5. Should audio keep playing while browsing other songs (a mini-player outside the song screen)? This becomes much more noticeable in split mode.
6. Any appetite for a native spike of `unstable-split-view` (1–2 days) to settle the double-header question, given Apple's "use system containers" guidance?
7. Is web coming back (`build:web:disabled`)? The same layout would serve desktop browsers.

---

## Sources

- SDK 58 changelog (iPhone Duo support, App Intents, scene lifecycle): https://expo.dev/changelog/sdk-58
- Scene lifecycle migration: https://expo.fyi/ios-scene-lifecycle
- expo-hinge: https://docs.expo.dev/versions/v58.0.0/sdk/hinge/
- ArrangementView: https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/arrangementview/
- NavigationSplitView: https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/navigationsplitview/
- Expo Router split view (alpha): https://docs.expo.dev/versions/v58.0.0/sdk/router/split-view/
- expo-app-intents: https://docs.expo.dev/versions/v58.0.0/sdk/app-intents/ (plus the npm package `expo-app-intents@0.5.7`: bundled `skills/` docs and `templates/`)
- Apple Tech Talk "Strike a pose with adaptive layouts on iPhone Duo": https://developer.apple.com/videos/play/tech-talks/111463/
- Apple iPhone Duo group lab summary: https://developer.apple.com/forums/thread/847644
- WWDC24 "What's new in App Intents" (IndexedEntity, OpenIntent from Spotlight): https://developer.apple.com/videos/play/wwdc2024/10134/
- Local code read: `node_modules/expo-router/build/split-view/*`, `node_modules/@expo/ui/src/swift-ui/{NavigationSplitView,ArrangementView,RNHostView}*`, `node_modules/react-native-screens/ios/gamma/split/*`, `ios/Dainorelis/{AppDelegate.swift,Info.plist}`, `ios/Podfile.lock`, `app/**`, `lib/**`

I couldn't locate the Apple HIG iPhone Duo page itself. The Apple guidance above comes from the Tech Talk and the developer-forum group lab.
