# Plan: App Intents for song search (Siri, Shortcuts, Spotlight)

> Status: **core done 2026-10-23** (iOS; see "What shipped" below). The rest of this file is the
> original scoping, written 2026-10-16 against Expo SDK 58 (expo-router 58, @expo/ui 58, RN 0.88).
> Confidence labels: **[verified]** = read in code/node_modules, **[doc]** = Expo/Apple docs, **[unverified]** = inference.
>
> Prerequisite (done): the native projects were regenerated for SDK 58 in 08ef613, so the iOS
> scene lifecycle (SceneDelegate + UIApplicationSceneManifest) required by the iOS 27 SDK is in place.
> The URL scheme is now `dainorelis` (was the template's `myapp`), so deep links are
> `dainorelis://dainos/<id>`.

### What shipped (2026-10-23)

- `expo-app-intents@0.5.11`, pinned exactly. The Swift is in `modules/app-intents/` (not the
  default `app-intents/`), watched by `experiments.inlineModules` and passed to the plugin as
  `directory`. Inline modules add the folder to the app target as a synchronized group, so its
  `.xcstrings` files compile in too.
- `SongEntity` + `SongQuery` (`EntityStringQuery`, `EnumerableEntityQuery`): title plus the English
  title as a synonym, matched case- and diacritic-insensitively. `IndexedEntity` on iOS 18+
  (registered with `registerIndexed("song")`), `IndexedEntityQuery` behind `#if compiler(>=6.4)`.
- `OpenSongIntent` (`OpenIntent`, `openAppWhenRun`) dispatches `openSong`; Spotlight taps go through
  it too. Routing is the primary option above: `lib/components/AppIntentsHandler.tsx`, mounted next
  to the root `Stack`, `router.push`es `/dainos/<id>` and dequeues; it also publishes the catalog
  (titles only, all songs) on every launch. `update-songs` needs no change: the catalog comes from
  `songs.ts` at runtime, so a new `songs.ts` (build or OTA) republishes it on its first launch.
- One App Shortcut (`AppShortcuts`) with four phrases ("Open <song> in Dainorėlis", "Show …",
  "Open a song …", "Find a song …"). English is the source in Swift; Lithuanian is in
  `Localizable.xcstrings` (titles, descriptions) and `lt.lproj/AppShortcuts.strings` (phrases;
  `AppShortcuts.xcstrings` needs iOS 17). Siri has no Lithuanian, so the LT phrases only matter if
  it ever does.
- Answers to the open questions, as built: Spotlight and Shortcuts first, voice best-effort (1);
  ids assumed stable (2, still to confirm); titles only, no lyrics (3); everything in `songs.ts` (4);
  scheme unchanged, not needed (5); alpha dependency accepted (6); localized (7).

Remaining:

- Owner: confirm the admin export keeps `rec…` ids forever (saved Shortcuts and Spotlight entries
  hold them).
- Test on a device. Verified on the iOS 26.5 simulator: the catalog publishes (57 KB), Shortcuts
  lists the action and the App Shortcut tile, its song picker lists and searches the songs, and
  Spotlight finds songs by Lithuanian title without diacritics ("Aguonele") and opens the right song
  screen, from a cold start and with the app in the background. Not verified: running the action
  from Shortcuts. On the simulator linkd rejects the ad-hoc-signed app ("Rejecting invalid client
  due to requiresValidBundle", no team id), so the picked song arrives as nil and the App Shortcut
  tile says "Couldn't find AppShortcutsProvider"; a team-signed device build should not hit this.
  Also unverified: Siri voice (no Siri on the simulator), Spotlight matching the English title
  (it shows as the result's subtitle, but "little poppy" didn't surface it), and index persistence.
- Not done (optional): `SearchSongsIntent` (needs `?q=` on `app/index.tsx`), first-verse snippets in
  Spotlight, donations, `AppEntityView` on the song screen.

### What `expo-app-intents` requires

Sources: https://docs.expo.dev/versions/v58.0.0/sdk/app-intents/ and the npm package `expo-app-intents@0.5.7`, which is the SDK 58 bundled version (`~0.5.7` in `expo/bundledNativeModules.json` **[verified]**). I downloaded it to the scratchpad and read its bundled skill and templates.

- **Alpha.** "will frequently experience breaking changes." Not in Expo Go. Needs a dev or production build.
- Setup: `npx expo install expo-app-intents`, then `npx expo-app-intents init --examples minimal`. That adds the `"expo-app-intents"` plugin and `experiments.inlineModules.watchedDirectories: ["app-intents"]`, and scaffolds `app-intents/AppIntentsSetup.swift`. `app.config.ts` is dynamic TS, so expect to merge the printed changes by hand.
- The Swift intent, entity, query and shortcut types must be **app-owned Swift in the app target**. Apple's metadata extractor can't see them inside a pod. Expo **inline modules** (itself an `experiments` flag) compile `app-intents/` into the target. Keep it at the project root, **outside `app/`**. The plugin warns if it is placed inside the router directory. **[verified]** plugin source
- Runtime: iOS 16.4+, which matches the project's `IPHONEOS_DEPLOYMENT_TARGET = 16.4` **[verified]**. The pod depends on `ExpoUI`, which is already installed.
- Feature gates:
  - `IndexedEntity` / Spotlight registration: iOS 18+.
  - On-screen entity association (`AppEntityView`): **iOS 18.4+ and built with Xcode 27+**.
  - `IndexedEntityQuery` (system-driven reindex) and the `.system.open` schema: iOS 27 SDK.
  - The core intents, entity and query work with older Xcode. Xcode 27 is only needed for the newer pieces, but you'll be on it anyway for iOS 27 (section 0).
- JS ↔ native: `AppIntentDispatcher.shared.dispatch(name:params:)` in Swift. It is one-way, stored in a queue of at most 100, and delivered **at least once**. JS reads it with `useAppIntents(handler)` and must call `removePendingInvocationAsync(id)` after handling. There's no JS → Siri response channel. No headless JS: `openAppWhenRun = true` is required for anything JS must do (task-manager support is "coming soon").
- Entity data: `setEntityCatalogAsync(kind, entities[])` stores `{id, title, subtitle?, synonyms?, metadata?, hideInSpotlight?}` in **UserDefaults**. Swift queries read it with `AppIntentEntityStore.shared.entities(ofKind:)`. Publishing an identical catalog is a no-op, so it is safe to call on every launch. For indexed kinds it also syncs Spotlight.
- `AppShortcutsProvider` phrases are compiled and static. Each must contain `\(.applicationName)`, at most one interpolated parameter, and at most 10 App Shortcuts.
- **Android: none.** `isAvailable()` returns false on Android and web. Calls no-op or return empty.

### Fit with this app's data

- 619 songs, all static in `songs.ts`. 616 have an English translated title. **[verified]** A catalog of `{id, title, synonyms:[EN title]}` serialises to about **57 KB**, which is fine for UserDefaults. Adding a first-lyric-line `subtitle` would roughly double it, still fine. **Index all songs.** There's no need to subset.
- IDs are stable Airtable-style record IDs (`rec…`), already used as keys for favourites and variant storage. They must stay stable forever, because saved Shortcuts and Spotlight entries keep them. Confirm the admin/Supabase export preserves them (open question).
- Search semantics: Swift `EntityStringQuery.entities(matching:)` must match natively, because JS isn't running. Use `.caseInsensitive, .diacriticInsensitive` over title plus synonyms (EN title, maybe an ASCII-folded LT title). Fuse.js fuzzy and lyric search won't be available to Siri or Shortcuts. Spotlight does its own full-text matching over the indexed attributes, so lyrics could be added as `contentDescription` / `textContent` for lyric search from Spotlight. Watch the catalog size if full lyrics go in UserDefaults (`songs.ts` is 1.3 MB). Prefer a first-verse snippet.
- **Siri doesn't speak Lithuanian.** Voice matching of Lithuanian titles by an English (or other) Siri will be unreliable. Synonyms with EN titles help. The realistic value is **Spotlight** (typing "Aguonėlė" on the home screen) and **Shortcuts**, more than voice.

### Proposed intents and entities

```
app-intents/
  AppIntentsSetup.swift      (scaffolded) + in OnCreate:
                               if #available(iOS 18.0, *) { AppEntityIdentifierRegistry.shared.registerIndexed("song", as: SongEntity.self) }
                               + shortcuts refresh handler (only if AppShortcuts exists)
  SongEntity.swift           AppEntity, AppIntentEntityRecordConvertible; id, @Property title, subtitle, synonyms; init(record:)
  SongQuery.swift            EntityStringQuery + EnumerableEntityQuery (allEntities = whole "song" catalog)
  SongEntity+Spotlight.swift @available(iOS 18) IndexedEntity: attributeSet title/displayName/alternateNames/keywords(+ snippet)
                             #if compiler(>=6.4) iOS 27: IndexedEntityQuery → AppEntityIdentifierRegistry.shared.replaceIndexFromCatalog(kind:"song")
  OpenSongIntent.swift       OpenIntent; @Parameter var target: SongEntity; openAppWhenRun = true;
                             perform(): dispatch(name: "openSong", params: ["id": .string(target.id)])
  SearchSongsIntent.swift    (optional) @Parameter query: String; openAppWhenRun; dispatch("searchSongs", ["query": …])
  AppShortcuts.swift         (optional) "Open \(\.$target) in \(.applicationName)", "Search songs in \(.applicationName)"
```

- Spotlight tap: when a user taps an indexed entity, the system uses the app's `OpenIntent` for that entity type to open it. That is the WWDC24 "What's new in App Intents" pattern (https://developer.apple.com/videos/play/wwdc2024/10134/). So `OpenSongIntent` is what makes Spotlight results land on the right song, not just open the app. **[doc, Apple]**; I didn't test it with expo-app-intents.
- JS side, new `lib/components/AppIntentsHandler.tsx`, mounted in `App` in `app/_layout.tsx` after the splash work is done:
  ```ts
  AppIntents.useAppIntents(async (pending) => {
    for (const inv of pending) {
      if (inv.name === 'openSong' && typeof inv.params.id === 'string' && songs.some((s) => s.id === inv.params.id)) {
        router.push(`/dainos/${inv.params.id}`); // navigation is idempotent enough; no persistent dedupe needed
      }
      await AppIntents.removePendingInvocationAsync(inv.id); // also discards unknown/invalid ones after logging
    }
  });
  ```
  The catalog is published once at startup, guarded by `Platform.OS === 'ios' && AppIntents.isAvailable()`: `setEntityCatalogAsync('song', songs.map(s => ({ id: s.id, title: s.fields.Name, synonyms: [enTitle].filter(Boolean) })))`. It only changes when `songs.ts` ships in a new build or OTA.
- Routing into expo-router:
  - **Primary option:** the JS handler calls `router.push('/dainos/<id>')`. Make sure it runs only once the root navigator is mounted. On a cold launch the app starts at `/`, and the push then stacks the song over the list. That's the right back-stack, and it works with the A4 split layout too.
  - **Alternative:** in Swift, return `.result(opensIntent: OpenURLIntent(URL(string: "<scheme>://dainos/\(id)")!))` (iOS 18+). That routes through expo-router's normal deep-link handling, with no queue and cold-start-safe. It needs a real scheme instead of `dainorelis` (section 0). Either option is fine. The URL variant is simpler to reason about, but I haven't verified it with this library.
- Optional extras:
  - Donations (`donateIntentAsync('openSong', { id })` when a song is opened) for Siri suggestions.
  - `AppEntityView entity="song" entityId={id}` around the song screen for "what's on screen" / Apple Intelligence. That needs iOS 18.4 and Xcode 27.
  - Neither is needed for a first version.

### Android parity

Nothing from Expo. The rough Android equivalents are launcher dynamic shortcuts for recent or favourite songs (ShortcutManager; community module `expo-quick-actions`), Google Assistant App Actions (`shortcuts.xml` / BIIs, no Expo support, uncertain future) and AppSearch on-device indexing (no RN binding). Deep links (`<scheme>://dainos/<id>`) already work on Android through the scheme intent filter. Recommendation: treat B as iOS-only. Maybe add launcher shortcuts later as a separate small item.

### Risks (B)

- **Alpha library.** APIs, the plugin and the CLI may break between patch releases, and SDK 58 is the first SDK shipping it. Pin the exact version and budget for rework on SDK 59.
- **Experimental inline modules.** The integration only works after a clean prebuild. Native changes (new intents, phrases) can't ship over the air.
- Metadata extraction (`ExtractAppIntentsMetadata`) failures surface only at Xcode build time. That needs a Mac with current Xcode in the loop, so it can't be done in this Linux container.
- Siri voice quality for Lithuanian titles (B2). Spotlight is the dependable win.
- Parameterised App Shortcut phrases over about 619 entities: Apple caps or deprioritises large parameter sets. **[unverified]** Plan on Spotlight plus a generic "Open song" action with a picker, rather than relying on 619 voice phrases.
- Entity ID stability across admin exports (saved Shortcuts break silently otherwise).
- Spotlight indexing is best-effort and evictable (use `reindexEntitiesAsync` for recovery). Test on device, not just the simulator.

### Effort (B)

- Section 0 re-prebuild: shared with A, 0.5–1 day.
- Core (Song entity and query, `OpenSongIntent`, Spotlight indexing, catalog publish, JS handler and routing): **3–4 days** including on-device testing of Spotlight, Shortcuts and a Siri cold start.
- Optional App Shortcuts phrases, `SearchSongsIntent` (needs `app/index.tsx` to accept a `?q=` param), donations, `AppEntityView`: **+1–3 days**.
- Alpha churn and localisation of intent titles and phrases (LT/EN `.xcstrings`): **+1 day**.
- Total realistic: **~1–1.5 weeks** for a solid iOS-only first version.

### Open questions for the owner (B)

1. Is the goal Spotlight discoverability (high value, low risk) or Siri voice (limited by Lithuanian support)? This sets whether phrases and `SearchSongsIntent` are worth doing.
2. Are song IDs (`rec…`) guaranteed stable through the admin/Supabase export forever?
3. Should Spotlight index lyrics or a first-verse snippet (better search, more data), or titles only?
4. Index hidden or song-festival-only items? (The export already filters hidden songs.)
5. OK to change the URL scheme from `dainorelis` to e.g. `dainorelis`? This affects any existing shared links, though probably none exist.
6. Acceptable to take an alpha dependency in a production release, or wait for beta (SDK 59)?
7. Should intent titles and phrases be localised to LT/EN, given Siri doesn't support LT but Shortcuts UI follows the device language?

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
