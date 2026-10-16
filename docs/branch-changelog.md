# dc/2026.1: what the AI agents did while you were away

This covers every agentic commit on this branch since it left `main` at `f22bb70`. That's 10 commits
from May to August 2026, plus everything from the 2026-10-16 session. Your own commits show up as
one-line markers so the timeline makes sense.

**Short version:**

- Expo SDK 55 → **58**, React Native 0.83 → **0.88** (React 19.3).
- Airtable was replaced by a Next.js + Supabase admin CMS in `admin/`. It's code only and not
  provisioned yet.
- The iOS 26 header-title hack became a native patch to react-native-screens.
- Today (2026-10-16): the native projects were regenerated, custom code was swapped for
  Expo-provided equivalents, and the earlier agent work was audited and fixed.
- **Nobody has run the app on a device since about March 2026.** Everything since SDK 56 has only
  passed typecheck, lint and bundling. The checklist at the end says what's needed to ship.

> Notes in Phases 0–4 that say something is still pending were written before Phase 5. Phase 5
> resolved several of them: the native projects were regenerated, both pnpm overrides were removed,
> the Switch colours were restored, the screens patch was re-ported, and lint now actually runs.
> The checklist at the end is current.

---

## Phase 0: Your SDK 55 / Liquid Glass work (context)

- you: `76fa58b` Update packages (2025-12-22)
- you: `23998cf` move search to bottom (2025-12-29)
- you: `0afaab0` / `9f92233` wip: expo ui & liquid glass, wip 2 (2026-01-05/06)
- you: `777a6dc`…`50eab38` wip expo 55, bye rnap, liquid glass, drop descriptions, peek and pop, swipe to favorite (2026-02-05)
- you: `ba9666c` wip: expo 55, which switched npm → **pnpm** (deleted `package-lock.json` files and added `pnpm-workspace.yaml` with only `nodeLinker: hoisted`) (2026-03-01)
- you: `a0d995a` wip: dev and build fixes, which added the `withAndroidReleaseSigning` / `withIosReleaseScheme` plugins (2026-03-02)

### 2026-03-02 · `368bc74` · fix: dark mode broken after SDK 55 upgrade

_(authored by you, `Co-Authored-By: Claude Opus 4.6`)_

- `DarkTheme.dark` was `false`, which made React Navigation force a light `userInterfaceStyle` on the nav bar. That broke Liquid Glass headers that use `DynamicColorIOS`. It's now `true`.
- Moved `Appearance.setColorScheme()` out of a React effect and into module-level init plus an MMKV `addOnValueChangedListener`. This worked around an RN 0.83 bug where the hook returned `null`/`'unspecified'`.
- `StorageProvider` now reads all MMKV values synchronously in its `useState` initializer instead of in a `useEffect`, which removes a one-render delay for every stored setting. **This part is still in effect today.**
- `useColorScheme` now always returns `'light' | 'dark'`. All callers (MediaMenu, SongMenu, VariantMenu) import it from `@/lib/hooks/useColorScheme`.
- ⚠️ Most of the `_layout.tsx` and `useColorScheme` logic was **reverted two months later by `2cb53d8`** (see below).

---

## Phase 1: Expo SDK 55 → 56 (May–June 2026)

### 2026-05-08 · `2cb53d8` · wip: expo 56 (SDK 56 _beta_, preview.6)

- **Versions:** expo `56.0.0-preview.6`, react-native 0.83.2 → **0.85.3**, react 19.2.3, expo-router 56.1, reanimated 4.3, worklets 0.8, gesture-handler 2.31, screens `4.25.0-beta.3`, keyboard-controller 1.21, **TypeScript 5.9 → 6.0**. Also bumped without being mentioned in the message: safe-area-context 5.6 → 5.7, webview 13.16.1, react-native-web `~0.21.0`.
- **`@react-navigation/native` and `@react-navigation/elements` were removed.** expo-router now forks them, so imports changed to `expo-router/react-navigation` (via codemod). `Theme` in `lib/constants/themes.ts` now declares its own `colors` shape.
- **Dark mode was rewritten again.** `368bc74`'s module-level init and MMKV listener were removed and replaced by a `ThemedRoot` component that calls `Appearance.setColorScheme(... 'unspecified' ...)` in a `useLayoutEffect`. `useColorScheme` is back to a plain passthrough. The justification was "RN 0.85 fixes the bug", but nobody tested it at runtime (the message says so). **Toggle light/dark/auto on a real device and check the result.**
- **Switch:** the `Switch.ios.tsx` (SwiftUI Toggle) and `Switch.android.tsx` (Jetpack Switch in brand colours) files were deleted. One universal `@expo/ui` `Switch` is used everywhere now. **The Android switch lost your green theme colours** and uses default Material colours. The message suggests a follow-up if that looks wrong, but nobody did one. (Your own `a5131d5` later removed the `label` prop on the settings screen.)
- Converted forwardRef components to React 19 ref-as-prop: `Button`, `BorderlessButtonOpacity`, `ScrollViewWithHeader`. Also deleted the unused `UnstableContextMenu.*` and changed `absoluteFillObject` to `absoluteFill`. `dainorelisapp.com` is now excluded from `tsconfig.json`.
- **Follow-up that never happened:** a plan for adopting Android `Stack.Toolbar` was saved to `.claude/stack-toolbar-android.md`. No commit acted on it. Its open question was whether to drop the green Android header in favour of Material. (Phase 5 moved it to `docs/plans/android-stack-toolbar.md` and then decided against it in `9b03cd7`.)

### 2026-05-08 · `9fae3b6` · chore: migrate @expo/vector-icons → @react-native-vector-icons/fontawesome6

- `@expo/vector-icons` (deprecated in SDK 56) was replaced by `@react-native-vector-icons/fontawesome6@^13.1.1`, using the `/static` import in 11 files.
- **Native change:** the package's config plugin was added to `app.config.ts`, so the font is now bundled by prebuild. Your `a5131d5` prebuild did pick this up: `UIAppFonts` and the Xcode copy phase both list the FontAwesome6 TTFs.
- `solid={…}` was replaced with `iconStyle="solid" | "regular"`. The favourite heart toggles between regular and solid in both the song screen and the swipe action.

### 2026-05-22 · `abafb45` · chore: bump expo 56.0.0-preview.6 → 56.0.3 (stable)

- Moved off the preview to stable SDK 56. `expo install --fix` re-pinned every satellite package (expo-router 56.2.5, screens 4.25.1, reanimated 4.3.1…).
- **New config plugins** in `app.config.ts`: `expo-asset`, `expo-image`, `expo-web-browser`. These need a prebuild.
- Added `@expo/metro-runtime` as a direct dependency, to kill a stale transitive copy.
- **New `pnpm.overrides`:** `zod-validation-error: ^4.0.2`. eslint-plugin-react-hooks 7.1 needs its `/v4` subpath. Remove the override once upstream sorts this out.

### 2026-06-10 · `bec7aff` · fix: post-SDK-56 cleanups

- Ran `expo install --fix` again for 13 drifted packages (expo ~56.0.9, expo-router 56.2.9, screens **4.25.2**, @expo/ui 56.0.16).
- **Android `compileSdkVersion`/`targetSdkVersion` went from 35 → 36** in `app.config.ts` (expo-build-properties). Play requires targetSdk 36 from Aug 2026. Your `a5131d5` prebuild did carry this into `android/gradle.properties`.
- `openai` moved to devDependencies. It later moved again, into `admin/`.
- Visible fix: the AI-translation wand icon on the translation screen now uses the theme text colour, so you can see it in dark mode.
- Latent fixes: an operator-precedence bug in `HeaderLeft`'s `href` (no current caller is affected), and a no-op `items.filter` in `useSongList` was deleted.

### 2026-06-10 · `9623bc4` · fix: restore dainorelisapp.com Vercel deploys

- Your pnpm migration (`ba9666c`) deleted the marketing site's lockfile but didn't add the site to the workspace. That broke every `dainorelis-site` Vercel deploy from 2026-05-22 onward.
- `pnpm-workspace.yaml` now lists `packages: [dainorelisapp.com]`, and the root lockfile gained the Astro importer. `dainorelisapp.com/.gitignore` now ignores `.vercel/`.
- Verified locally with `pnpm --filter marketing-site build`. **Check that Vercel actually went green after this landed.**

- you: `a5131d5` wip: prebuild (2026-06-22). You regenerated `ios/` and `android/` against SDK 56: Podfile.lock at RN 0.85.3 / ExpoModulesCore 56.0.15, compileSdk 36, FontAwesome6 fonts, iOS deployment target 16.4, new launcher and splash assets, build number 26061901. You also removed the `label` prop from the settings `Switch`. **This is the last time the committed native folders were regenerated.**

---

## Phase 2: Expo SDK 56 → 57 (July 2026)

### 2026-07-01 · `218d091` · chore: upgrade Expo SDK 56 → 57

- expo 56.0.9 → **57.0.1**, with every `expo-*` package on 57.x. react-native 0.85.3 → **0.86.0**, reanimated **4.5.0**, worklets **0.10.0**, gesture-handler 2.32, keyboard-controller 1.21.9. react stays at 19.2.3. react-native-screens stays at **4.25.2**, which matters for the patch in Phase 3.
- Only `package.json`, `app.config.ts` and the lockfile changed. **No app code changed and no codemods ran.** Checks were limited to typecheck, lint and expo-doctor. Nobody tested it at runtime.
- **New config plugin:** `expo-status-bar`.
- **Another pnpm override:** `@expo/dom-webview: 57.0.0`, to fix a stale 56.0.4 transitive copy.
- ⚠️ **The native folders were not regenerated.** At `origin/dc/2026.1`, `ios/Podfile.lock` still pins React-Core 0.85.3 and ExpoModulesCore 56.0.15. The JS is SDK 57 but the native projects are still SDK 56. expo-doctor's "prebuild/native-folders" note was waved off as pre-existing.

---

## Phase 3: iOS 26 header title patch (August 2026)

### 2026-08-18 · `6b6319e` · fix: size the iOS 26 header title from measured toolbar geometry

- Removed the `marginRight: 135 / 65` hack (and the `withControls` prop) from `HeaderTitle`. That hack reserved guessed space for the Liquid Glass toolbar buttons and broke on iPad.
- **Added a pnpm patch:** `patches/react-native-screens@4.25.2.patch`, registered under `pnpm.patchedDependencies`. On iOS 26 only, `computeEdgeInsetsOfNavigationBar` now measures the space the bar-button groups actually take up and sizes the title from that. If the measurement looks wrong, it falls back to the stock maths.
- **Native Objective-C++ change:** this needs `pod install` and a native iOS rebuild before it does anything.
- **Fragile pin:** the patch is tied to the exact version `react-native-screens@4.25.2`. Any screens bump (an SDK patch or `expo install --fix`) will break the install or silently drop the fix. You'd need to re-port the patch, or delete it once react-native-screens 5.x ships the real fix. The upstream PR #3210 was closed unmerged.
- The title and variant dropdown should now fill the real gap on iPhone and iPad. **Check this on iPad and on an iPhone running iOS 26.**

---

## Phase 4: Admin CMS on Supabase + Vercel, replacing Airtable (August 2026)

### 2026-08-19 · `6f656e6` · feat: replace Airtable with a custom admin app on Supabase

- **New service `admin/`:** a Next.js 15 app (`@dainorelis/admin`, added to the pnpm workspace) for editing songs. It's backed by **Supabase Postgres** and meant to be **deployed separately on Vercel at `admin.dainorelis.app`**. Auth is Supabase email/password. There are no roles: RLS lets any authenticated user do anything, so **sign-ups must be turned off in the dashboard**.
- **The mobile app is unchanged at runtime.** It still bundles a committed `songs.ts`. What changed is where `pnpm update-songs` gets its data: it now does `GET https://admin.dainorelis.app/api/export` with a bearer token (`ADMIN_EXPORT_TOKEN`) instead of calling the Airtable API. The variant naming, chord-whitespace widening, hidden-song filtering and title sort that used to live in `scripts/update-songs.ts` moved to `admin/src/lib/song-file/build.ts`. The app keeps only `fieldFlags`.
- The schema keeps Airtable `rec…` ids (deep links depend on them), nullable variant names and explicit `position` columns. Unchecked checkboxes are omitted rather than set to `false`, and sorting uses `en` collation. All of this keeps `songs.ts` byte-identical. `pnpm --filter @dainorelis/admin verify` checks the round trip without a database.
- **Keep-alive cron:** `admin/vercel.json` calls `/api/health` daily at 07:00 UTC so the free-tier Supabase project doesn't pause. `/api/health` is **open to anyone unless `CRON_SECRET` is set**.
- Scripts moved: `scripts/generate-song-metadata.ts` → `admin/scripts/generate-metadata.ts`. It now writes to the `translations` table instead of the unused `EN Title`/`EN Translation` columns. Root `generate-metadata` scripts now delegate to it, and `airtable`/`openai` left the root devDependencies. New root script: `pnpm admin`. The one-time migration script is `admin/scripts/import-from-airtable.ts`.
- Fixes included in the same commit: `tsconfig.scripts.json` gained `types: ["node"]`, because `generate-indices` couldn't compile without it. `lyric-index.json` was regenerated because it was stale. The root `.env.example` now uses `ADMIN_EXPORT_URL` and `ADMIN_EXPORT_TOKEN` instead of `AIRTABLE_TOKEN`. `AGENTS.md` was updated. Root eslint and tsconfig now exclude `admin/`.
- ⚠️ **Everything in this commit is code only.** Nothing shows that a Supabase project, a Vercel project or the domain exists, or that the Airtable import has run. **Until they do, `pnpm update-songs` fails**: it throws when `ADMIN_EXPORT_TOKEN` is missing, and the Airtable code path is gone. The message says "sign-ups are disabled in the dashboard" as if it were done, but that's really a manual step (README step 2).

### 2026-08-19 · `c5e5663` · chore: drop unneeded pgcrypto extension from the admin migration

- Removed `create extension if not exists pgcrypto` from `admin/supabase/migrations/0001_init.sql`. `gen_record_id()` only uses core functions. The commit says it was checked against a fresh Postgres 16.

---

## Phase 5: Expo SDK 57 → 58, cleanup and audit (2026-10-16)

One session working from the [SDK 58 release notes](https://expo.dev/changelog/sdk-58) and the
[Expo Router 57 → 58 migration guide](https://docs.expo.dev/router/migrate/sdk-57-to-58/). Read-only
subagents audited Phases 1–4 (reports summarised below) and scoped iPhone Duo and App Intents
(`docs/plans/`). A worktree subagent fixed the admin CMS audit findings, and its commits were
cherry-picked here.

### Upgrade

- `69b2176` **chore: upgrade Expo SDK 57 → 58**
  - Versions: expo 58.0.11, react-native **0.88.0**, react **19.3.0**, gesture-handler **3.3**
    (major), reanimated 4.7.1, worklets 0.13, screens 4.30.0.
  - The lockfile was regenerated from scratch. pnpm had kept stale auto-installed peers that the old
    `@expo/dom-webview` override hid. **Both pnpm overrides are gone.** Side effect: in-range
    patch/minor drift elsewhere, including admin (next 15.5.28, supabase-js 2.118).
  - The react-native-screens header patch is still needed upstream and was ported to 4.30.0.
  - `eslint-plugin-react-compiler` dropped: its rules now ship in react-hooks 7 via
    eslint-config-expo.
  - **`expo lint` silently linted nothing**, so `pnpm lint` now runs `eslint .`. The ESLint
    ignores weren't global, so `admin/` was being linted; they now use `globalIgnores`.
  - RN strict-TS fixes (TextInputInstance, ref-as-prop). Lock-screen artwork comes from
    `expo-asset`.
  - Deleted the "is this screen preloaded" guard around the song toolbar. Router 58 removed
    `preloadedRoutes`, so the check had become a no-op, and Stack.Toolbar no longer calls
    `setOptions`.
- `08ef613` **chore: regenerate ios/ and android/ for SDK 58** (`expo prebuild --clean --no-install`)
  - iOS scene lifecycle: `SceneDelegate.swift` plus the scene manifest, which the iOS 27 SDK
    requires.
  - The Xcode project is now **`Dainorelis`** (the old prebuild dropped the "ė" and produced
    `Dainorlis`). Bundle id and display name are unchanged.
  - `ios/Podfile.lock` removed (it was two SDKs stale; regenerate with `pod install`).
  - The privacy manifest moved into `app.config.ts` `ios.privacyManifests`, with the same
    declarations.
  - Android: **R8 enabled in release builds** (the SDK 58 default), with a keep rule for
    react-native-pdf's pdfium JNI classes. Gradle 9.4.1.
- `0df5bd4` URL scheme renamed from the template's `myapp` to **`dainorelis`**. Nothing referenced
  `myapp://`.

### Code cleanup (fixes found along the way)

- `40ac348` ESLint passes for real now.
  - **Bug:** Player, Search, MediaMenu and VariantMenu created wrapper components during render,
    so React remounted their subtree every render. For the Player that meant every audio status
    tick. The wrappers were hoisted to module level.
  - `useColorScheme.web` now uses `useSyncExternalStore` for hydration.
  - Deleted the empty `Lyrics.tsx` and the unused Markdown prop.
- `781e013` **Bug:** bold text rendered at regular weight on Android. The Nunito-era
  `android: 'normal'` weight overrides outlived the switch to the system font in February.
- `e43c15b` Removed all `useMemo`/`useCallback`; React Compiler handles memoization, as AGENTS.md
  says.
  - The effects in the song screen depend on values that stay stable even without the compiler.
  - `useRouter()` replaces the module-level `router`.
  - Public reanimated types replace deep imports.

### Replacing custom code with Expo-provided equivalents

- `4b5c6ea` Gesture-handler 3: `Touchable` replaces the deprecated
  `BorderlessButton`/`RectButton`, and `usePanGesture` replaces the `Gesture.Pan()` builder.
  `BorderlessButtonOpacity` and its "weird iOS workaround" are deleted.
- `0340869` Native menus:
  - **`@react-native-menu/menu` → `@expo/ui/community/menu`** (SwiftUI Menu / Compose
    DropdownMenu), which resolves the old VariantMenu TODO.
  - Android icons are now `@expo/material-symbols` imports. The custom `withAndroidDrawables`
    plugin and its 7 copied drawables are deleted, along with the `imageColor` dark-mode hack.
  - Removed unused deps: `react-native-webview`, `expo-navigation-bar`, `expo-symbols`,
    `@expo-google-fonts/nunito`.
- `a9d3d11`
  - **Android Switch brand colours restored** (Compose Switch). Phase 1 dropped them and its
    follow-up never happened. The Switch also gets an accessibility label on both platforms.
  - `packageManager: pnpm@10.28.0` pinned.
  - The redirect-only root Vercel project skips install and build. Its deploys had failed on
    every commit since the screens patch landed. **The root cause is unconfirmed**: I couldn't
    read the Vercel logs.
- `091278b` `ts-node` → `tsx` for the data scripts. ts-node is unmaintained, and
  `tsconfig.scripts.json` didn't typecheck under TS 6, so it's deleted. `lyric-index.json` was
  regenerated for fuse.js 7.5 (only the scoring norms changed).

### Admin CMS fixes (from the audit)

- `6dca439` Read the Supabase env names the Vercel Marketplace integration now provides
  (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), falling back to the legacy
  names. **Without this every page would 500 on first deploy.** Also deleted a dead browser client.
- `24c48e8` `outputFileTracingRoot` points at the repo root. With pnpm's hoisted layout, deps
  live there and Vercel functions could otherwise fail with "Cannot find module".
- `e766eaa` The importers delete every song and re-insert. They now print the target, refuse a
  non-empty DB without `--force`, and require `--yes`.
- `d3d56ad` An empty audio/PDF/video URL no longer locks the whole song in the editor. `/export`
  still flags it.
- `97c0c1b` Fixed an open redirect via the login `next` parameter.
- `f0efd9e` The paged export gets an `id` tie-breaker.
- `dd139b1` `/api/health` fails closed in production without `CRON_SECRET`.
- `1ae5ee1` Deleting a song now asks for confirmation.
- `a5493b2` `update-songs` validates the festival list before writing anything and exits 1 on
  failure. It used to write `songs.ts`, then swallow the error.

### Docs

- `16710f1` `docs/plans/` collects the scoped-but-not-started work: Android Stack.Toolbar (moved
  from `.claude/` and updated for SDK 58), master-detail / iPhone Duo, and App Intents.
  `AGENTS.md` refreshed: pnpm commands, native-folder and patch rules, menu, icon and gesture
  conventions, and corrections (there's no `Lyrics` component; language is a stored preference
  defaulting to `lt`; the marketing site is live).
- `9b03cd7` Re-reviewed the Android `Stack.Toolbar` plan against expo-router 58's Android sources
  and replaced it with a short decision memo: **don't adopt it**. On Android it only fills
  `headerLeft`/`headerRight` with Compose icon buttons inside the existing header. Android already
  has native Compose menus, and `SearchBarSlot` renders nothing there, so the gain is cosmetic and
  the cost is a third header code path.

### What the audits concluded about Phases 1–4

- **App side:** dependency pins were accurate for their time, and all 17 FontAwesome6 icon names
  are valid. Problems were the stale native folders (fixed), false "lint passes" claims (fixed),
  and two untested risks: the dark-mode rewrite in `2cb53d8` (probably correct for RN ≥ 0.85, never
  run) and the screens patch, which can't be checked without a device. The patch is well built
  but may measure button frames one layout pass early, and may misplace a centred title.
- **Admin side:** the design is sound. RLS is on every table, there's no service key in the
  browser, and the export reproduces Airtable's order exactly (all 619 songs checked). It had
  first-deploy blockers and data-loss footguns, fixed above. Still open, needing your call: no
  backups after cut-over; access depends on dashboard toggles (any `authenticated` user, including
  anonymous sign-ins if those are ever enabled, gets full write); Next 16; edits lost on a failed
  save; the `/auth` route is missing, so invite emails and password reset go nowhere.

---

## Where the commit messages and the diffs disagree, or where to be careful

- **`2cb53d8` quietly undoes `368bc74`.** The earlier dark-mode fix (module-level `Appearance` init and a defensive `useColorScheme`) was replaced on the theory that RN 0.85 fixed the bug. That theory hasn't been tested on a device. If dark mode or "auto" breaks again, look here first.
- **`2cb53d8` bumped more than it listed:** safe-area-context 5.7, webview 13.16.1, react-native-web `~0.21.0`.
- **`218d091` says expo-doctor passes "aside from a pre-existing prebuild/native-folders note".** That note is real: the committed native projects are SDK 56 while the JS is SDK 57.
- **`6f656e6` says the CMS is "deployed separately to admin.dainorelis.app" and "sign-ups are disabled in the dashboard".** Nothing in the repo provisions or confirms either one. Read both as a description of the intended setup, not of what has been done.
- `admin/README.md` and `AGENTS.md` said `npm run update-songs` even though the repo has been pnpm since `ba9666c`. Phase 5 (`16710f1`) switched `AGENTS.md` to pnpm. `admin/README.md` (the data-flow diagram and the verify step) and the root `README.md` (`npm run dev:*`) still use npm.
- **Several messages claimed `expo lint` passes.** Here, `expo lint` lints nothing, and real ESLint had been failing since `9fae3b6`. Phase 5 fixed it in `69b2176` (`pnpm lint` now runs `eslint .`) and `40ac348` (the actual errors).

---

## Things you need to do by hand (current as of 2026-10-16)

### Build and run (nothing since SDK 55 has run on a device)

- [ ] `pnpm install` from a clean `node_modules` (pnpm 10.28 via corepack). Confirm the
      react-native-screens patch applies.
- [ ] On a Mac: `cd ios && pod install`, then open **`ios/Dainorelis.xcworkspace`** (renamed from
      `Dainorlis`) and build. Commit the new `Podfile.lock`.
- [ ] `npx expo run:android`, and **also a release build** (`--variant release`). R8 is on now:
      open a PDF-variant song to exercise pdfium, and play audio.
- [ ] Decide on continuous native generation (CNG): either keep committing `ios/`/`android/` after
      every `expo prebuild --clean` (the current approach), or gitignore them and let EAS or
      `expo run` generate them. The custom plugins already make prebuild the source of truth.

### Runtime checks on iOS (26+ and older) and Android

- [ ] Theme: light, dark and auto in settings, each with the system in light and in dark, plus a
      cold start with each stored value (`2cb53d8` rewrote this and it has never run).
- [ ] Header title and variant dropdown on an iPhone and an **iPad** with iOS 26+, including
      push/pop, switching variant and rotation (screens patch).
- [ ] Every native menu (song ⋯, variant title, media, playlist, settings language and theme):
      opens, picks, shows the checkmark, icons tinted correctly in dark mode (new `@expo/ui` menus).
- [ ] Buttons and list rows: press feedback, ripple on Android, swipe-to-favourite, peek-and-pop
      (gesture-handler 3).
- [ ] Player: scrub the progress bar (now `usePanGesture`), lock-screen controls, background audio.
- [ ] Android: bold text is bold now; the Switch shows the green brand colours.
- [ ] Deep link `dainorelis://dainos/<id>` opens a song (scheme renamed).

### Admin CMS (Supabase + Vercel); none of it is provisioned yet

- [ ] Create a Supabase project (the Vercel Marketplace wires `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`). Run
      `admin/supabase/migrations/0001_init.sql`.
- [ ] Supabase Auth: turn **off** sign-ups and **keep anonymous sign-ins off**. Invite editors by
      hand. Set the Site URL.
- [ ] Vercel project with Root Directory `admin`, domain `admin.dainorelis.app`, env
      `EXPORT_TOKEN` and **`CRON_SECRET`** (required in production now).
- [ ] **Export Airtable as a backup** before cut-over, then
      `cd admin && pnpm import:airtable -- --dry-run`, then run it for real with `--yes`.
- [ ] Put `ADMIN_EXPORT_TOKEN` in the app's `.env` and run `pnpm update-songs`. Expect a one-line
      diff in `songs.ts`: the importer trims the name `"Mes broliukai du du du\n"`.
- [ ] Decide on backups (`pg_dump` cron or an unfiltered export) and an editor allowlist in RLS.

## Open decisions for you

1. **Android header: decided. Keep the custom green header** (`9b03cd7`). Android `Stack.Toolbar`
   would only swap the button styling and can't host the bottom search. Reopen this only if you
   want a stock Material look. Separately, the custom header buttons have no accessibility labels,
   which is worth fixing. See `docs/plans/android-stack-toolbar.md`.
2. **Master-detail / iPhone Duo:** recommended approach is a width-based layout route (5–8 days),
   after a short Device Hub test pass. See `docs/plans/master-detail-iphone-duo.md`.
3. **App Intents:** Spotlight search for all 619 songs is the realistic win (Siri has no
   Lithuanian), and the library is alpha. Estimated 1–1.5 weeks. See
   `docs/plans/app-intents-song-search.md`.
4. **Not done, could be later cleanups:**
   - `ScrollViewWithHeader` (its own comment says "I don't remember why"). SDK 58 recommends
     `contentInsetAdjustmentBehavior="automatic"` instead.
   - The header-title native patch can go once react-native-screens 5 lands.
   - The `Button` hit-slop margin trick could become `Touchable`'s native `hitSlop`.
   - Expo's experimental Rust transformer ("Noxcturnal") skips Reanimated files, so it's not
     worth enabling yet.
