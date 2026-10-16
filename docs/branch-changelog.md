# dc/2026.1: what the AI agents did while you were away

This covers every agentic commit on this branch since it left `main` at `f22bb70`. That's 10 commits
from May to August 2026, plus everything from the 2026-10-16 session. Your own commits show up as
one-line markers so the timeline makes sense.

**Short version:**

- Expo SDK 55 → **58**, React Native 0.83 → **0.88** (React 19.3).
- Airtable was replaced by a Next.js + Supabase admin CMS in `admin/`, now on **Next.js 16**. It's
  code only and not provisioned yet.
- The iOS 26 header-title hack became a native patch to react-native-screens.
- Today (2026-10-16): the native projects were regenerated, custom code was swapped for
  Expo-provided equivalents, the earlier agent work was audited and fixed, the admin got its
  missing auth flow and RLS hardening, the marketing site deploys were fixed, and a second audit
  pass over the app, admin and tooling fixed several crashes and a stuck splash screen.
- Then, acting on your answers: `ios/` and `android/` are generated instead of committed (CNG),
  minSdk follows the SDK default (24), Supabase migrations are applied by a GitHub Actions
  workflow, the site is on Astro 7, and Reduce Motion follows the setting live again (an earlier
  fix in the same session had broken that).
- **Nobody has run the app on a device since about March 2026.** Everything since SDK 56 has only
  passed typecheck, lint and bundling. The checklist at the end says what's needed to ship.

> Notes in Phases 0–4 that say something is still pending were written before Phase 5. Phase 5
> resolved several of them: the native projects were regenerated (and are no longer committed at
> all), both pnpm overrides were removed,
> the Switch colours were restored, the screens patch was re-ported, and lint now actually runs.
> The checklist and open decisions at the end are current.

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
- **Android `compileSdkVersion`/`targetSdkVersion` went from 35 → 36** in `app.config.ts` (expo-build-properties). Play requires targetSdk 36 from Aug 2026. Your `a5131d5` prebuild did carry this into `android/gradle.properties`. (Phase 5's `137b78e` dropped both pins again: SDK 58's defaults are compileSdk 37 / targetSdk 36.)
- `openai` moved to devDependencies. It later moved again, into `admin/`.
- Visible fix: the AI-translation wand icon on the translation screen now uses the theme text colour, so you can see it in dark mode.
- Latent fixes: an operator-precedence bug in `HeaderLeft`'s `href` (no current caller is affected), and a no-op `items.filter` in `useSongList` was deleted.

### 2026-06-10 · `9623bc4` · fix: restore dainorelisapp.com Vercel deploys

- Your pnpm migration (`ba9666c`) deleted the marketing site's lockfile but didn't add the site to the workspace. That broke every `dainorelis-site` Vercel deploy from 2026-05-22 onward.
- `pnpm-workspace.yaml` now lists `packages: [dainorelisapp.com]`, and the root lockfile gained the Astro importer. `dainorelisapp.com/.gitignore` now ignores `.vercel/`.
- Verified locally with `pnpm --filter marketing-site build`. **Check that Vercel actually went green after this landed.**

- you: `a5131d5` wip: prebuild (2026-06-22). You regenerated `ios/` and `android/` against SDK 56: Podfile.lock at RN 0.85.3 / ExpoModulesCore 56.0.15, compileSdk 36, FontAwesome6 fonts, iOS deployment target 16.4, new launcher and splash assets, build number 26061901. You also removed the `label` prop from the settings `Switch`. **This was the last time the native folders were regenerated before Phase 5.**

---

## Phase 2: Expo SDK 56 → 57 (July 2026)

### 2026-07-01 · `218d091` · chore: upgrade Expo SDK 56 → 57

- expo 56.0.9 → **57.0.1**, with every `expo-*` package on 57.x. react-native 0.85.3 → **0.86.0**, reanimated **4.5.0**, worklets **0.10.0**, gesture-handler 2.32, keyboard-controller 1.21.9. react stays at 19.2.3. react-native-screens stays at **4.25.2**, which matters for the patch in Phase 3.
- Only `package.json`, `app.config.ts` and the lockfile changed. **No app code changed and no codemods ran.** Checks were limited to typecheck, lint and expo-doctor. Nobody tested it at runtime.
- **New config plugin:** `expo-status-bar`.
- **Another pnpm override:** `@expo/dom-webview: 57.0.0`, to fix a stale 56.0.4 transitive copy.
- ⚠️ **The native folders were not regenerated.** Until Phase 5, `ios/Podfile.lock` still pinned React-Core 0.85.3 and ExpoModulesCore 56.0.15: the JS was SDK 57 but the native projects were still SDK 56. expo-doctor's "prebuild/native-folders" note was waved off as pre-existing.

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

- Removed `create extension if not exists pgcrypto` from the init migration (then `0001_init.sql`, now `admin/supabase/migrations/20260819234728_init.sql`). `gen_record_id()` only uses core functions. The commit says it was checked against a fresh Postgres 16.

---

## Phase 5: Expo SDK 57 → 58, cleanup and audit (2026-10-16)

One session working from the [SDK 58 release notes](https://expo.dev/changelog/sdk-58) and the
[Expo Router 57 → 58 migration guide](https://docs.expo.dev/router/migrate/sdk-57-to-58/). Read-only
subagents audited Phases 1–4 (reports summarised below) and scoped iPhone Duo and App Intents
(`docs/plans/`). A worktree subagent fixed the admin CMS audit findings, and its commits were
cherry-picked here. Later the same day: accessibility labels, the admin follow-ups the first audit
left open, Next.js 16, the marketing-site deploy fix, and a second audit pass over the app, admin
and tooling. A last round acted on your answers to the open decisions (CNG, minSdk, Astro 7, the
festival list) and moved the Supabase migrations to GitHub Actions.

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
  - `ios/Podfile.lock` removed (it was two SDKs stale). Since `b4331b2` neither native folder is
    committed, so pods always resolve fresh.
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
  - `packageManager: pnpm@10.28.0` pinned. **Removed again in `2ffb01d`**: the `dainorelis-site`
    Vercel deploys failed from the first push that included it (see "Marketing site deploy fix").
  - The redirect-only root Vercel project skips install and build. Its deploys had failed on
    every commit since the screens patch landed. Likely cause, per `2ffb01d`: by project age
    Vercel gives it pnpm 9, which rejects the lockfile's pnpm 10 patch hash. Still unconfirmed,
    since nobody could read the Vercel logs.
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
  still flags it (since `cee72a5`, only as a warning).
- `97c0c1b` Fixed an open redirect via the login `next` parameter.
- `f0efd9e` The paged export gets an `id` tie-breaker.
- `dd139b1` `/api/health` fails closed in production without `CRON_SECRET`.
- `1ae5ee1` Deleting a song now asks for confirmation.
- `a5493b2` `update-songs` validates the festival list before writing anything and exits 1 on
  failure. It used to write `songs.ts`, then swallow the error. (`58a6c9b` later made a missing
  festival song a warning.)

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
- `664a82c` Both READMEs use pnpm commands.
- `1b6fe18` `docs/plans/interactive-layout-migration.md`: a runbook for you and an agent working
  together at the keyboard with simulators and devices. It starts from the device checklist below,
  takes a baseline screenshot matrix with fixed test songs, then goes through seven small steps
  that can each ship alone: native content insets, a screens-patch re-check, Player/Search on
  resizable windows, the `(dainos)` layout route, list/detail panes, Duo/iPad/foldable tuning, and
  a11y plus dark mode. Each step has acceptance criteria, a rollback and decision points.

### What the audits concluded about Phases 1–4

- **App side:** dependency pins were accurate for their time, and all 17 FontAwesome6 icon names
  are valid. Problems were the stale native folders (fixed), false "lint passes" claims (fixed),
  and two untested risks: the dark-mode rewrite in `2cb53d8` (probably correct for RN ≥ 0.85, never
  run) and the screens patch, which can't be checked without a device. The patch is well built
  but may measure button frames one layout pass early, and may misplace a centred title.
- **Admin side:** the design is sound. RLS is on every table, there's no service key in the
  browser, and the export reproduces Airtable's order exactly (all 619 songs checked). It had
  first-deploy blockers and data-loss footguns, fixed above. The items it left open were mostly
  fixed later the same day (next sections): anonymous sign-ins can no longer write (`8fc3588`),
  Next 16 (`b4d861a`), a failed save keeps your edits (`e9e9d91`), and invites and password
  resets have a route (`d86a853`, `52420a8`). **Still open:** no backups after cut-over, and any
  non-anonymous signed-in user is an editor (no allowlist in RLS).

### Accessibility

- `5394a9f` **Bug:** VoiceOver and TalkBack announced the header, player and search buttons as
  unlabelled, or read out the icon font's private-use glyph. RNGH 3's `Touchable` sets no role.
  - `Button` defaults to `accessible` + role `button`, and every caller passes a label (back/close,
    favourite, settings, play/pause, player details, clear search).
  - `@expo/ui`'s menu leaves the trigger to declare its own accessibility, so our `MenuView`
    wrapper View is now the focusable button with a label/hint: song ⋯, recording picker, variant
    title.
  - The iOS 26 `Stack.Toolbar` icon buttons are labelled. The collapsed player controls and the
    hidden search cancel button / playlist menu are hidden from screen readers, as they are from
    touch. New en + lt strings.
- `c866f96` Android's song "more" button shows the vertical ellipsis, Material's overflow
  convention.
- `c896c14` Search only renders without Liquid Glass, so its `isLiquidGlassAvailable()` branches
  were dead and are inlined. No visual change.

### Admin follow-ups

- **Auth flow** (`d86a853`, reworked in `52420a8` below): invite emails had nowhere to land
  (`/auth` was a public path with no route), there was no way to set a first password, and a
  forgotten password meant a manual reset in the dashboard. New: `/auth/confirm`,
  `/account/password` (linked from the header, so editors can change theirs) and `/login/forgot`,
  which doesn't reveal who is an editor. The README documents the Site URL and the Invite /
  Reset password email templates.
- **RLS hardening** (`8fc3588`): Supabase's anonymous users get the `authenticated` role too, so
  enabling anonymous sign-ins would have made the whole database writable with the publishable
  key that ships in the browser. `20261016021807_editors_not_anonymous.sql` (then `0002_…`) adds
  an `is_anonymous = false` check to every policy. It can be re-run; the init migration is
  unchanged.
- **Unique positions** (`8422ccf`): two variants of one song could share a `position`, which made
  their order and the generated "Žodžiai N" names depend on Postgres's row order.
  `20261016021831_unique_child_positions.sql` (then `0003_…`) renumbers any duplicates and adds
  a deferrable `unique (song_id, position)` to all five child tables. `generate-metadata` now
  inserts at max + 1. (The reorder approach from this commit was replaced by `07c7f22`.)
- **Paging** (`9a3c984`): PostgREST silently caps a response at 1000 rows. The editor's song list
  and `generate-metadata` now use the export's paging loop (`src/lib/supabase/fetch-all.ts`),
  with the `id` tie-breaker.
- **Form state** (`e9e9d91`): **one invalid URL threw away everything typed since the last save.**
  React 19 resets an uncontrolled form after its action returns. A failed save now returns the
  submitted values as the fields' defaults and keeps the form key.
- `5149610` A failed lyrics insert in `createSong` now throws instead of leaving a song with no
  lyrics. `9829224` `CRON_SECRET` is compared in constant time, like the export token.

### Next.js 16

- `b4d861a` next and eslint-config-next 15.5 → **16.4.2**. React stays on 19.3.0, now pinned
  exactly to match the app, because with the hoisted layout a caret range could add a second
  React copy. ESLint uses eslint-config-next 16's native flat configs. No source changes were
  needed: the request APIs were already awaited and there's no `next/image` or webpack config.
- `bd9a75a` `middleware.ts` → `proxy.ts` (official codemod). It never used the edge runtime, so
  nothing changes.
- `7ea3b0b` AGENTS.md and `admin/README.md` say Next.js 16, Node 20.9+, `src/proxy.ts`, and that
  lint goes through the ESLint CLI (Next 16 removed `next lint`).

### Marketing site deploy fix

- `2ffb01d` **Bug: every `dainorelis-site` deploy failed after `a9d3d11`**, within about 5
  seconds, during install setup. From the GitHub commit statuses: `4b5c6ea` deployed, and the next
  push (`a9d3d11..e43c15b`) failed. In that push only the root `package.json` and lockfile could
  affect the site, and the lockfile only dropped RN deps. That leaves the `packageManager` pin:
  Vercel reads it when choosing the pnpm binary, and pnpm 10 then re-execs as exactly 10.28.0.
  The failing step couldn't be reproduced locally, so the exact cause is unconfirmed, but without
  the pin Vercel goes back to choosing pnpm as it did when deploys worked. Locally,
  `pnpm install --frozen-lockfile` + `pnpm run build` pass with pnpm 10.28 and 10.34. pnpm 9
  rejects the lockfile, so the site has always been on pnpm 10.
- `52d148f` `dainorelisapp.com/vercel.json` pins the site's build settings in code: framework
  astro, `pnpm install --frozen-lockfile`, `pnpm run build`, and no `outputDirectory` (the Astro
  adapter writes `.vercel/output`). No `corepack enable`: without a `packageManager` field it
  would pick its own pnpm, possibly 11+.

### Second audit pass

**App**

- `ea6371d` **Bug: a cold-start deep link (`dainorelis://dainos/<id>`, `/nustatymai`) left the app
  on the splash screen forever.** Router 58 seeded the stack with only that screen, so the home
  screen whose images gate the splash never mounted, and the iOS 26 back/close buttons had no
  history to go back to. Fixed with `unstable_settings = { anchor: 'index' }`, a 1.5 s splash
  fallback, and back/close that replace with `/` when there's no history.
- `df603e1` **Bug: an unknown song id, or `/vertimas` for one of the 3 songs without a
  translation, crashed the app in release.** The "TODO 404" guards were empty. Each route now
  shows a localized not-found screen with a working back/close. The description screen falls
  back to the English description in Lithuanian.
- `1b84498` **Bug: a stored or linked variant id that no longer exists crashed the song screen;
  a stale recording id made the player (and its recording menu) disappear for that song for
  good; and every song open flashed the first variant before switching.** The variant and
  recording are now derived on each render (URL, then stored, then first) instead of synced into
  the URL by effects.
- `a390e0b` **Bug:** the variant menu remounted on every song-screen render, the same class of
  bug as `40ac348`. `titleWrapper` is now a render function.
- `ddbac0a` **Bug:** the bottom search bar lagged the keyboard while it animated (the keyboard
  height was multiplied by progress twice). It now uses `KeyboardStickyView`. It also left Reduce
  Motion to reanimated's springs, which only read the setting at launch; `59529cd` undid that part
  (see the last round below).
- `9b0d0c2` **Bug: on iOS, sheet-music PDFs were downloaded without checking the TLS
  certificate.** react-native-pdf defaults `trustAllCerts` to true and the old workaround only
  turned it off on Android.
- Performance: `dcb3101` one shared accessibility-settings store instead of five native queries
  and listeners per `ThemedText` (thousands on a chorded song); `e410bd0` forest background as
  WebP, 4.5 MB → 0.8 MB, with the alpha fade bit-identical; `38f8aeb` search indices load on the
  first search, not at startup; `c2a8a21` i18n initializes synchronously, so the first render no
  longer waits on an effect.
- Cleanups, no behaviour change: `359b574` the vestigial wordmark splash gate; `5f1e4ef` dead
  code, unused styles and i18n keys, stale comments; `6b186ba` `process.env.EXPO_OS` everywhere
  and one Liquid Glass check; `1b7a35e` Pressable's own press state instead of mirrored state.

**Admin**

- `52420a8` **Bug: mail security scanners open every link before the recipient, so they used up
  the single-use invite and reset tokens.** `/auth/confirm` is now a page with a Continue button
  whose server action verifies the token. `type` is allowlisted to invite/recovery, a bad link
  shows its error on that page, the Redirect URLs step is gone from the README, and login and
  forgot-password keep the typed email after an error.
- `07c7f22` Editor writes:
  - **Reorder** swaps two rows in one upsert (one transaction) instead of 2n PATCHes, so a failure
    can no longer leave the list rotated and the "Žodžiai N" names renumbered.
  - UPDATE and DELETE check that a row matched, so "Saved." no longer shows when another editor
    deleted the song or variant.
  - Saving only writes variants that changed, so their `updated_at` and other editors' edits to
    them survive.
  - Deleting a variant asks first; Add/Move/Delete are disabled while saving; "New song" can't be
    double-submitted; an error page keeps the editor header.
- `cee72a5` `/export`'s "Blocking errors" now mean exactly what fails `update-songs`; blank links
  and fields the app doesn't bundle are warnings.
- `26cfb79` dead code; `fb19c79` one home each for the "already English" prefixes, the song
  SELECT and variant naming (the editor's "(auto)" label now uses the export's code); `24a130d`
  field hints and "Saved." reach screen readers, one primary button style, pnpm commands on
  `/export`, `turbopack.root` pinned. `pnpm verify` stays byte-identical across 619 songs.

**Tooling, scripts and site**

- `1c45fef` **Bug: one untouched "Add video" row on any song failed `update-songs` for the whole
  catalogue.** It now drops disabled fields before validating, skips blank audio/PDF links with a
  SKIPPED warning, and `generate-indices` exits 1 on failure instead of leaving stale indices.
- `137b78e` Dropped the stale compileSdk/targetSdk 36 pins; SDK 58 defaults to compileSdk 37.
  (`671a97d` later dropped the `minSdkVersion` 26 pin too.)
- `8b5d722` `withIosReleaseScheme` no longer requires an undeclared `glob`.
- `6b469b2` `pnpm format` no longer rewrites generated files, the lockfile or build output.
- `ef5581d` Dropped unused `markdown-it` and `eslint-plugin-expo`, `zod` moved to dependencies,
  and pnpm's build-script warning silenced.
- `478747e` Deleted the unused `useAppState` hook and the `find-similar-lyrics` script, which had
  silently done nothing since `76fa58b`.
- `1320219` README and AGENTS.md: Node 22.13+ / 24.3+, pnpm 10.x, the `MYAPP_UPLOAD_*` signing
  properties, and that the build number is only written at prebuild.
- `eb72eea` **Bug:** link previews of dainorelisapp.com had no image (relative `og:image`). Also
  dead CSS and a real README.
- `d868f85` **Bug:** the root redirect dropped the path, so **the `/qr` link printed on QR codes
  landed on the home page**, after two hops. It now goes straight to
  `https://www.dainorelisapp.com/:path*`.

### Last round: CNG, the migrations Action, Astro 7

- `b4331b2` **`ios/` and `android/` are no longer committed (Continuous Native Generation).**
  `npx expo prebuild` / `npx expo run:*` (or EAS) generate them from `app.config.ts` and
  `plugins/`. Safety check before untracking: a clean `npx expo prebuild --clean --no-install`
  reproduced the committed tree exactly, apart from random object IDs in `project.pbxproj`.
  Release signing, the Release scheme, the privacy manifest, the Modekan font, the icon, the R8
  keep rule and the Info.plist keys all come out of config. This also ends the stale build
  numbers and expo-doctor's native-folders warning. `c03d11e` rewrote AGENTS.md, the README and
  the layout-migration plan for this workflow (no more committing `Podfile.lock`).
- `671a97d` `minSdkVersion` follows the SDK default (**24**, from React Native's version
  catalog) instead of the pinned 26, as compileSdk and targetSdk already did.
- `59529cd` **Bug, introduced earlier this session by `ddbac0a`: toggling Reduce Motion with the
  app open did nothing until the next launch.** `ddbac0a` left Reduce Motion to reanimated, but
  reanimated 4.7 reads the setting once at startup. Reduce Motion is back in the shared
  accessibility store (still one query and one listener, so `dcb3101`'s win stays), and every
  spring passes `ReduceMotion.Always`/`.Never` from the live value: the search bar, the header
  title, and the audio player (which had only ever had the launch-time value). List scrolls use
  `animated: !isReduceMotionEnabled`.
- `58a6c9b` `update-songs` **warns** about a festival title that no longer matches a song, leaves
  it out of `song-festival.ts` and carries on. Since `a5493b2` it had exited 1, so renaming one
  song in the admin blocked every data update. Fetch and validation failures still exit 1.
- `4000172` **Supabase migrations are applied by GitHub Actions**
  (`.github/workflows/db-push.yml`, "Apply DB migrations"), modelled on your apartment-hunt repo:
  `supabase link` + `supabase db push` from `admin/` with three repository secrets. It runs on
  pushes to `main` that touch the migrations, the Supabase config or the workflow, can be run by
  hand, and queues instead of racing. Supabase's migration history makes a re-run a no-op. The
  migrations were renamed to the timestamp prefixes `supabase migration new` generates:
  `20260819234728_init.sql`, `20261016021807_editors_not_anonymous.sql`,
  `20261016021831_unique_child_positions.sql`. Tested with `supabase db push` against a fresh
  Postgres: all three apply and a second push reports "up to date". `a364c6a` replaced the
  README's "paste each migration into the SQL editor" step and added a "Changing the database
  schema" section.
- `9d905d3` **dainorelisapp.com: Astro 5 → 7** (7.4.0) and `@astrojs/vercel` 8 → **11**. Nothing
  in the v6/v7 upgrade guides touches the site. The one break was Vite 8, which reads the
  nearest tsconfig for every module: images imported through `~` landed on the app's tsconfig,
  whose `extends: "expo/tsconfig.base"` the new resolver can't follow. `vite.tsconfig` now points
  at the site's own tsconfig. Astro 7 needs **Node 22.22+**. Checked: the Vercel build output,
  absolute `og:image`, `/qr` still redirects by user agent, and `astro check` is clean.

---

## Where the commit messages and the diffs disagree, or where to be careful

- **`2cb53d8` quietly undoes `368bc74`.** The earlier dark-mode fix (module-level `Appearance` init and a defensive `useColorScheme`) was replaced on the theory that RN 0.85 fixed the bug. That theory hasn't been tested on a device. If dark mode or "auto" breaks again, look here first.
- **`2cb53d8` bumped more than it listed:** safe-area-context 5.7, webview 13.16.1, react-native-web `~0.21.0`.
- **`218d091` says expo-doctor passes "aside from a pre-existing prebuild/native-folders note".** That note was real: the committed native projects were SDK 56 while the JS was SDK 57. `08ef613` regenerated them, and since `b4331b2` they aren't committed at all.
- **`6f656e6` says the CMS is "deployed separately to admin.dainorelis.app" and "sign-ups are disabled in the dashboard".** Nothing in the repo provisions or confirms either one. Read both as a description of the intended setup, not of what has been done.
- `admin/README.md` and `AGENTS.md` said `npm run update-songs` even though the repo has been pnpm since `ba9666c`. Phase 5 switched `AGENTS.md` (`16710f1`), both READMEs (`664a82c`) and the admin's `/export` page (`24a130d`) to pnpm.
- **Several messages claimed `expo lint` passes.** Here, `expo lint` lints nothing, and real ESLint had been failing since `9fae3b6`. Phase 5 fixed it in `69b2176` (`pnpm lint` now runs `eslint .`) and `40ac348` (the actual errors).
- **The Vercel root causes are inferred, not seen.** `2ffb01d` and `a9d3d11` reason from GitHub commit statuses and Vercel's build-utils source; nobody could read the deploy logs.

---

## Things you need to do by hand (current as of 2026-10-16)

### Build and run (nothing since SDK 55 has run on a device)

- [ ] `pnpm install` from a clean `node_modules` with Node 22.13+ / 24.3+ and pnpm 10.x (pnpm 9
      rejects the lockfile's patch hash). Confirm the react-native-screens patch applies.
- [ ] In an existing clone, delete the stale `ios/` and `android/` (git ignores them now, so a
      pull leaves the old SDK 56 copies behind), or just run `npx expo prebuild --clean`.
- [ ] On a Mac: `npx expo run:ios` (it prebuilds and runs `pod install`; pods resolve fresh and
      there's nothing to commit), or open **`ios/Dainorelis.xcworkspace`** (renamed from
      `Dainorlis`) after a prebuild and build there.
- [ ] `npx expo run:android`, and **also a release build** (`--variant release`, with the
      `MYAPP_UPLOAD_*` properties in `~/.gradle/gradle.properties` or it's unsigned). R8 is on now:
      open a PDF-variant song to exercise pdfium, and play audio.
- [ ] Smoke-test on an **Android 7 (API 24) emulator** now that minSdk is the SDK default
      (`671a97d`): launch, open a song, play audio, open a PDF.
- [ ] Run `npx expo prebuild --clean` before **every** store build so the build number is
      current: `expo run:*` only prebuilds a missing folder, and the ignored folders keep the
      number they were generated with.

### Runtime checks on iOS (26+ and older) and Android

- [ ] Theme: light, dark and auto in settings, each with the system in light and in dark, plus a
      cold start with each stored value (`2cb53d8` rewrote this and it has never run). The forest
      background (now WebP) looks right in both, including the fade and the top overscroll.
- [ ] Cold launch in each language: the splash fades onto the song list with logo and forest
      drawn, and there's no flash of the other language.
- [ ] Header title and variant dropdown on an iPhone and an **iPad** with iOS 26+, including
      push/pop, switching variant and rotation (screens patch). iOS 26 shows the native toolbar,
      iOS < 26 and Android the green header.
- [ ] Every native menu (song ⋯, variant title, media, playlist, settings language and theme):
      opens, picks, shows the checkmark, icons tinted correctly in dark mode (new `@expo/ui` menus).
      Switching variants repeatedly doesn't flicker.
- [ ] A song whose saved variant isn't the first opens on it with no flash; leave and reopen, and
      both variant and recording are remembered.
- [ ] Buttons and list rows: press feedback, ripple on Android, swipe-to-favourite, peek-and-pop
      (gesture-handler 3). The translation feedback and "Write to us" links lose their underline
      while held.
- [ ] Player: scrub the progress bar (now `usePanGesture`), lock-screen controls, background audio
      with the silent switch on.
- [ ] Search: title and lyric searches return the same results as before, and the bottom bar
      tracks the keyboard while it opens and closes (Android, iOS < 26).
- [ ] Open a PDF on iOS with an empty cache (TLS is verified now).
- [ ] Android: bold text is bold now; the Switch shows the green brand colours; the song menu uses
      the vertical ellipsis.
- [ ] Deep links from a cold start: `dainorelis://dainos/<id>` and `dainorelis://nustatymai` clear
      the splash and back/close lands on the list. `dainorelis://dainos/does-not-exist` and
      `/vertimas` on a song without a translation show the not-found message.
- [ ] Reduce Motion (`59529cd`): with the app open, toggle it (iOS Settings > Accessibility >
      Motion; Android "Remove animations") and, without relaunching, check the bottom search bar
      (Android, iOS < 26), the header title appearing as you scroll a song, and the audio player
      opening and closing. They should jump with it on and spring with it off. Bold Text and
      Increase Contrast (Android: high-contrast text) should follow live too.
- [ ] Screen readers (`5394a9f`): VoiceOver and TalkBack read every icon button; double-tap opens
      the song ⋯, media and variant menus (the label sits on our wrapper View around `@expo/ui`'s
      menu trigger); the collapsed player and hidden search buttons are skipped.

### Admin CMS (Supabase + Vercel); none of it is provisioned yet

- [ ] Create a Supabase project (the Vercel Marketplace wires `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`).
- [ ] Add the GitHub repository secrets `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` and
      `SUPABASE_DB_PASSWORD`. Once this branch is on `main`, run **Actions → Apply DB migrations →
      Run workflow** once. Later migrations apply themselves when they land on `main`.
- [ ] Supabase Auth: turn **off** sign-ups and **keep anonymous sign-ins off**. Invite editors by
      hand.
- [ ] Supabase auth emails, exactly as `admin/README.md` step 3: Site URL
      `https://admin.dainorelis.app`; the **Invite user** and **Reset password** templates link to
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (or `type=recovery`).
      No Redirect URLs entry is needed any more. Optionally set up custom SMTP.
- [ ] Vercel project with Root Directory `admin`, Node 20.9+ (Next 16; the 22.x/24.x defaults are
      fine), domain `admin.dainorelis.app`, env `EXPORT_TOKEN` and **`CRON_SECRET`** (required in
      production).
- [ ] In a browser, try invite → Continue → set password, and forgot password, once each.
- [ ] Sign in as an editor and confirm reads and writes work. The migrations rely on Supabase's
      default table grants, so a project with changed grants would fail here.
- [ ] **Export Airtable as a backup** before cut-over, then
      `cd admin && pnpm import:airtable -- --dry-run`, then run it for real with `--yes`.
- [ ] In the editor: reorder variants, delete one (confirm prompt), save with a validation error
      (typing is kept), double-click Add (one row).
- [ ] Put `ADMIN_EXPORT_TOKEN` in the app's `.env` and run `pnpm update-songs` against the real
      admin. Blank links print SKIPPED warnings rather than failing. Expect a one-line diff in
      `songs.ts`: the importer trims the name `"Mes broliukai du du du\n"`.
- [ ] Decide on backups (`pg_dump` cron or an unfiltered export) and an editor allowlist in RLS.

### Infra

- [ ] Check the Vercel dashboards: is the root redirect project green after `a9d3d11`, and does
      `/qr` keep its path (`d868f85`)? Is `dainorelis-site` green after `2ffb01d` / `52d148f`? If
      either still fails, its dashboard settings may override `vercel.json`.
- [ ] `dainorelis-site` project: Node **22.22+** for Astro 7 (22.x current or 24.x). Its server
      function is about 41 MB (sharp binaries): fine, but worth knowing.
- [ ] Paste dainorelisapp.com into a chat app and check the link preview has an image.

## Open decisions for you

**Answered (2026-10-16):**

- **Song-festival mode: not coming back.** `song-festival.ts`, its `update-songs` step and the
  sections in `useSongList` stay on purpose, for the playlist feature you're building. A renamed
  festival song now only warns (`58a6c9b`).
- **~124 MB of design files and screenshots:** keep them in the repo.
- **Astro 7:** done (`9d905d3`).
- **CNG:** done (`b4331b2`).
- **`minSdkVersion`:** the SDK default, 24 (`671a97d`).
- **Android header: keep the custom green header** (`9b03cd7`). Android `Stack.Toolbar` would
  only swap the button styling and can't host the bottom search. Reopen this only if you want a
  stock Material look. See `docs/plans/android-stack-toolbar.md`.

**Still open:**

1. **`@supabase/ssr` 0.7 → 0.12** in the admin (forwards cache-control headers from the proxy).
2. **Supabase type generation** to replace the admin's hand-written row types.
3. **Concurrent editors can still overwrite each other.** `07c7f22` narrowed it (only changed
   variants are written), but there's no version check, so two editors saving the same variant
   lose one edit, and a variant deleted mid-reorder comes back blank.
4. **CI:** a GitHub Actions workflow running tsc and ESLint for the app and admin. On hold. (The
   only workflow so far is Apply DB migrations.)
5. **Master-detail / iPhone Duo:** recommended approach is a width-based layout route (5–8 days),
   after a short Device Hub test pass. See `docs/plans/master-detail-iphone-duo.md`.
6. **App Intents:** Spotlight search for all 619 songs is the realistic win (Siri has no
   Lithuanian), and the library is alpha. Estimated 1–1.5 weeks. See
   `docs/plans/app-intents-song-search.md`.
7. **Layout migration:** when to run the at-the-keyboard session in
   `docs/plans/interactive-layout-migration.md` (it needs the device checklist above first).

**Not decisions, just possible later cleanups:**

- `ScrollViewWithHeader` (its own comment says "I don't remember why"). SDK 58 recommends
  `contentInsetAdjustmentBehavior="automatic"` instead; it's step 1 of the layout-migration
  runbook.
- The header-title native patch can go once react-native-screens 5 lands.
- The `Button` hit-slop margin trick could become `Touchable`'s native `hitSlop`.
- Expo's experimental Rust transformer ("Noxcturnal") skips Reanimated files, so it's not worth
  enabling yet.
