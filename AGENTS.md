# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dainorėlis is a React Native mobile and web app built with Expo for viewing and performing Lithuanian folk songs. The app displays song lyrics with chords, translations, audio recordings, sheet music (PDFs), and descriptions. All song data comes from the custom admin app in `admin/`, which stores it in Supabase Postgres.

## Essential Commands

### Requirements

- Node.js 22.13+ or 24.3+ (Expo SDK 58 / React Native 0.88 engines).
- **pnpm 10.x**. pnpm 9 rejects the lockfile (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`), and npm's
  `latest` pnpm is a newer major, so install `pnpm@10` explicitly. The root `package.json`
  deliberately has no `packageManager` or `engines` field: Vercel reads both, and
  `packageManager` broke its deployments. pnpm settings live in `pnpm-workspace.yaml`
  (hoisted linker, ignored build scripts) and `package.json` `pnpm.patchedDependencies`.

### Development

```bash
pnpm dev                        # Start Expo dev server (choose platform)
pnpm dev:web                    # Start web development server
pnpm dev:ios                    # Start iOS development server (requires setup)
pnpm dev:android                # Start Android development server (requires setup)
```

### Data Synchronization

```bash
pnpm update-songs               # Fetch songs from the admin app and regenerate search indices
pnpm generate-indices           # Regenerate search indices (title and lyric search)
pnpm admin                      # Run the admin app locally (see admin/README.md)
```

`update-songs` reads `ADMIN_EXPORT_URL` and `ADMIN_EXPORT_TOKEN` from `.env`. It
never talks to the database directly — the admin app's `/api/export` endpoint
owns the content transforms.

### Code Quality

```bash
pnpm lint                       # Run ESLint (`eslint .`; `expo lint` silently lints nothing here)
pnpm lint:fix                   # Run ESLint with auto-fix
pnpm format                     # Format code with Prettier
```

### Building

```bash
# Production builds for local device testing (prebuilds ios/ or android/ if it is missing)
npx expo run:android --variant release --device
npx expo run:ios --configuration Release --device

# After an SDK bump, any change to app.config.ts, config plugins or native dependencies,
# and right before every store build
npx expo prebuild --clean
```

The project uses **Continuous Native Generation**: `ios/` and `android/` are gitignored and
generated from `app.config.ts` and `/plugins` by `npx expo prebuild --clean` (or by
`npx expo run:ios|android` when the folder doesn't exist yet). Prebuilding iOS runs
`pod install` (on a Mac; `--no-install` skips it), and `ios/Podfile.lock` isn't committed. Never
edit the generated folders: the next `--clean` prebuild wipes them. Native config goes in
`app.config.ts` or a config plugin in `/plugins` (`withAndroidReleaseSigning`,
`withIosReleaseScheme`). Release builds on Android run R8; keep rules go in
`expo-build-properties` `android.extraProguardRules` in `app.config.ts`. compileSdk, targetSdk and
minSdk are the SDK defaults.

**Build numbers come from prebuild.** `app.config.ts` computes `yymmdd##` (`buildToday` is the
`##`) for `versionCode` / `CFBundleVersion` each time the config is evaluated, so a fresh prebuild
always writes the current date. `expo run:*` only prebuilds when the folder is missing, though, and
Gradle and Xcode reuse what is on disk, so run `npx expo prebuild --clean` right before a store
build (bump `buildToday` for a second build on the same day).

**Android release signing**: `withAndroidReleaseSigning` points the release build type at an
upload keystore taken from the Gradle properties `MYAPP_UPLOAD_STORE_FILE`,
`MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_ALIAS` and `MYAPP_UPLOAD_KEY_PASSWORD`. They
belong in `~/.gradle/gradle.properties`, never in the generated `android/gradle.properties`;
without them the release APK/AAB is unsigned. `withIosReleaseScheme` makes the Xcode scheme's
Run action build Release.

`patches/` holds pnpm patches (`pnpm.patchedDependencies`), each pinned to an exact version, so port
it (`pnpm patch <pkg>@<new>`) whenever an upgrade bumps the package. Changes are marked
`dainorelis` / `PATCH(dainorelis)` in the patched source.

- **react-native-screens** (iOS 26+ header; Android only gets no-op setters for the new props): sizes the
  title around Stack.Toolbar buttons (header edge insets); adds the `titleMenu` (native title menu
  and subtitle) and `overflowMenu` (song actions in UIKit's overflow menu) header props; holds the
  variant pop-up button under the large title (`largeSubtitleView`, with hit testing); keeps a large
  title expanded while its screen is pushed (UIKit underestimates its height, from a subtitle or the
  caron of š/ž); shrinks a large title too wide for the bar (to 28pt at the least) instead of
  truncating it; lines a large title up with a centred content column (`largeTitleMaxWidth`, through
  the bar's layout margins); makes the inline subtitle readable;
  makes large title (and subtitle) colors follow the bar's scroll state; and adds the screen prop
  `topScrollEdgeEffectThreshold` (iOS 27's bar background for screens without a native title, see
  `useTopScrollEdgeEffect`), which switches the top scroll edge effect to hard past the threshold on
  the main thread, observing the scroll view's contentOffset.
- **react-native-pdf**: cancels a pending download on remount so overlapping downloads (variant
  switch, Fast Refresh) don't delete each other's file.

### AI Metadata Generation

```bash
pnpm generate-metadata          # Generate AI descriptions/translations for all songs
pnpm generate-metadata:test     # Test on first 5 songs only
```

## Architecture

### Core Technology Stack

- **Framework**: Expo (React Native framework)
- **Router**: expo-router (file-based routing)
- **State Management**: React Context + MMKV storage for persistent settings
- **Audio**: expo-audio for background audio playback
- **Search**: Fuse.js with pre-generated indices
- **Backend**: `admin/` — a Next.js 16 CMS on Vercel backed by Supabase Postgres
- **AI**: OpenAI API for generating song descriptions and translations (in `admin/`)

### Project Structure

- **`/app`** - File-based routing (expo-router)
  - `index.tsx` - Home screen with song list and search; Favorites and user playlists reorder by drag
  - `_layout.tsx` - Root layout, theme provider, splash screen, audio config
  - `dainos/[id].tsx` - Song detail view (lyrics + chords)
  - `dainos/[id]/vertimas.tsx` - Translation modal
  - `dainos/[id]/aprasymas.tsx` - Description modal
  - `nustatymai.tsx` - Settings modal
  - `grojarasciai/[id]/bendrinti.tsx` - Share sheet (form sheet): QR code and share link
  - `p.tsx` - Landing modal for shared playlist links: preview and add to playlists

- **`/lib`** - Reusable components, hooks, utilities
  - `/components` - React components (ThemedText, Markdown, SongMenu, MenuView, Player, etc.)
  - `/hooks` - Custom hooks (useStorage, useThemeColor, useSongList, usePlaylists, usePlaylistActions, useContentColumnStyle, etc.)
  - `/schemas` - Zod schemas for type-safe data validation
  - `/constants` - Theme definitions, i18n config, layout constants
  - `/utils` - Utility functions

- **`/plugins`** - Local Expo config plugins (release signing, iOS release scheme)

- **`/modules/app-intents`** - iOS App Intents (Siri, Shortcuts, Spotlight), app-target Swift compiled in by Expo inline modules (see App Intents below)

- **`/patches`** - pnpm patches for dependencies (see Building)

- **`/docs/plans`** - Scoped-but-not-started work (master-detail, the rest of App Intents, the at-the-keyboard layout-migration runbook) and one decision memo (Android stays on the custom header)

- **`/scripts`** - Data pipeline scripts (run with tsx)
  - `update-songs.ts` - Fetch all song data from the admin app's export endpoint
  - `generate-search-indices.ts` - Create Fuse.js search indices

- **`/admin`** - The CMS (separate Vercel deployment, its own README)
  - Owns the schema, the editor UI, and every content transform
  - `supabase/migrations/` - timestamped migrations (`supabase migration new`), applied to production by `.github/workflows/db-push.yml` when they reach `main`; never edit one that has shipped
  - `src/proxy.ts` - Next 16's renamed middleware: refreshes the Supabase session, gates every non-public route
  - `scripts/generate-metadata.ts` - OpenAI translations (was `generate-song-metadata.ts`)

- **Generated Files** (do not edit manually)
  - `songs.ts` - Complete song database exported from the admin app
  - `song-festival.ts` - The song festival programme (indices into `songs.ts`), shipped as a curated playlist
  - `title-index.json` - Search index for song titles
  - `lyric-index.json` - Search index for song lyrics

### Data Flow

1. Song data lives in Supabase Postgres, edited through `admin/`:
   - `songs` (main table)
   - `lyrics` (multiple variants per song)
   - `translations` (English translations of lyrics)
   - `audio` (Spotify/YouTube links)
   - `pdfs` (sheet music)
   - `videos` (performance recordings)

2. `admin/`'s `/api/export` applies the content transforms (variant naming, chord
   whitespace, hidden-song filtering, title ordering) and returns the song file.
   `update-songs.ts` fetches it, validates with Zod schemas, drops the fields
   `fieldFlags` disables, and generates `songs.ts` and `song-festival.ts`

3. `generate-search-indices.ts` processes `songs.ts` to create Fuse.js indices for fast client-side search

4. The app imports `songs.ts` directly (no runtime API calls) and loads search indices on demand

### Key Design Patterns

**Lyrics with Chords**: Lyrics are stored as markdown with inline chord notation `[space](Chord)`. The admin app's export automatically adjusts whitespace based on chord width to improve visual alignment. The `Markdown` component (`lib/components/Markdown`) renders this markdown with react-native-markdown-display.

**Variant Names**: Each song can have multiple variants (different arrangements, translations, etc.). If a variant lacks a name, the export auto-generates one as `"Default Name {number}"` (e.g., "Žodžiai 1", "Lyrics 2"), numbered by the variant's position within its song. A blank variant name in the admin UI is therefore meaningful, not missing data.

**Theme System**: The app uses React Navigation's theming with custom light/dark themes defined in `lib/constants/themes.ts`. The user's theme preference is stored in MMKV and applied via `Appearance.setColorScheme()`. Colors and type follow `docs/plans/brand-v3-type-and-color.md`: `primary` (eglė) is the one tint and is a light color in dark mode, so anything filled with it takes `onPrimary` on top; the green bars with white content (custom header, its buttons, the bottom pill, the player, the iOS 26 title band) use `chrome` (samanos in light mode, deep eglė in dark), and content on it is full white, never dimmed. Titles (song titles, playlist names, the list's section headers) use Saira Semi Condensed via `ThemedText`'s `title` prop (Medium, SemiBold with `bold`); everything else is the system font.

**I18n**: Uses i18next with Lithuanian (lt) and English (en) translations. Language files are in `lib/constants/i18n.ts`. The language is the user's stored preference (MMKV), defaulting to Lithuanian; the device language is not consulted. On iOS, `lib/utils/systemLanguage.ts` mirrors it into the app's `AppleLanguages` default, so system UI (List edit mode, share sheets) follows it from the next launch; `CFBundleLocalizations` in `app.config.ts` declares both languages. Android's share sheet runs in another process and always follows the device language.

**Audio Playback**: Configured for background playback with lock screen controls. Uses `expo-audio` configured in `app/_layout.tsx`.

**Storage**: MMKV via `useStorage` hook for fast, synchronous persistent storage of user preferences (theme, language, etc.). Every key and its Zod schema is declared in `lib/hooks/useStorage.tsx`.

**Playlists**: `usePlaylists` (data) and `usePlaylistActions` (menu actions: rename, share, duplicate, delete) combine three kinds: Favorites (storage key `favorites`, the pre-playlists key; editable, not renamable or deletable), curated playlists built from `song-festival.ts` (read-only, in programme sections; the old song festival mode is retired) and user playlists (`playlists`). `selectedPlaylistId` is the playlist the home screen shows (`'all'`, `'favorites'` or a playlist id). Favorites and user playlists are always reorderable on the home screen: their list is react-native-reorderable-list's instead of the FlatList (it shares `listRef`, so the header's scroll effects and search's scrolling follow it), and a song held for 250 ms lifts to be dragged; tapping still opens it and the swipe actions stay, but those rows drop the link preview and its menu. Rows offer Move up / Move down screen reader actions (every row also offers its swipe actions that way; the actions themselves are hidden from screen readers, and the add-to-playlist menu isn't mounted, until the row is first swiped), the order saves as it changes (songs missing from `songs.ts` stay at the end), search results don't drag, and a footnote under the songs says how. Shared playlists travel as `https://www.dainorelisapp.com/p?n=<name>&s=<ids>` (`lib/utils/playlistLink.ts`): song ids drop their shared `rec` prefix to keep the QR code small. The link opens `app/p.tsx` as a universal link / Android App Link (`associatedDomains` and `intentFilters` in `app.config.ts`, verified by `dainorelisapp.com/public/.well-known/apple-app-site-association` and `assetlinks.json`); without the app it lands on the site's `/p` page, which links to the stores.

**Layout**: Reading content sits in a centred column from `useContentColumnStyle` (max width, padding clear of the horizontal safe area; plain flex, no window maths).

**Platform-Specific Code**: Platform variants use `.web.ts` / `.android.tsx` extensions (e.g., `useColorScheme.web.ts`, `Switch.android.tsx`). For small branches inside a file prefer `process.env.EXPO_OS`, which Metro inlines and tree-shakes.

**Headers**: Two schemes, gated on `isLiquidGlassStyleHeader()` (iOS 26+ with Liquid Glass): native `Stack.Toolbar` items there, custom green header buttons (`HeaderButtonContainer`) elsewhere. On Liquid Glass the home screen's playlist and playlist settings menus sit in the bottom toolbar beside search on iPhone, and at the top bar's leading edge on iPad (every window size; search is in the bar there). Android deliberately keeps the custom header; see `docs/plans/android-stack-toolbar.md` for why.

**Icons**: In-app glyphs use `@react-native-vector-icons/fontawesome6`. Native menus and toolbars use SF Symbol names on iOS and Material Symbols on Android (`import X from '@expo/material-symbols/<name>.xml'`), chosen with `process.env.EXPO_OS === 'ios' ? 'sf.name' : X`.

**App Intents (iOS)**: `expo-app-intents` (alpha, pinned) with the Swift in `modules/app-intents/`, which `experiments.inlineModules` compiles into the app target (Apple's metadata extractor can't see intents in a pod). `SongEntity` is searchable in Shortcuts and Siri (`SongQuery`, title and English title, ignoring case and diacritics) and indexed in Spotlight on iOS 18+; `OpenSongIntent` opens one, also for a tapped Spotlight result, and `AppShortcuts` gives it phrases. `lib/components/AppIntentsHandler.tsx` publishes the catalog from `songs.ts` on every launch (an unchanged one is a no-op) and pushes `/dainos/<id>` for each queued `openSong`. English strings are in the Swift; Lithuanian in the folder's `Localizable.xcstrings` and `lt.lproj/AppShortcuts.strings` (phrases; the `.xcstrings` form needs iOS 17). Swift or phrase changes need a native build, not an OTA. Android has none.

**Menus**: Use `lib/components/MenuView` (wraps `@expo/ui/community/menu`: SwiftUI `Menu` on iOS, Compose `DropdownMenu` on Android).

**Gestures**: react-native-gesture-handler 3. Use `Touchable` (not the deprecated `RectButton`/`BorderlessButton`) and hook gestures (`usePanGesture`, …) rather than the `Gesture.*()` builders.

**Navigation**: Use `useRouter()` from expo-router rather than the module-level `router`.

**React Compiler**: This project uses React Compiler for automatic optimization. Do not use manual memoization techniques like `useCallback`, `useMemo`, or `React.memo` - the compiler handles this automatically.

## Environment Variables

The app requires a `.env` file (see `.env.example`):

- `ADMIN_EXPORT_URL` - The admin app's export endpoint (defaults to production)
- `ADMIN_EXPORT_TOKEN` - Shared secret for that endpoint

The admin app has its own variables; see `admin/.env.example`.

## Testing and Release

There are currently no automated tests (`pnpm test` exits successfully). Check changes with
`npx tsc --noEmit` and `pnpm lint`.

For production releases, see the Expo documentation on creating production builds, and the
build-number and signing notes under Building: `app.config.ts` generates `yymmdd##` build numbers
and reads the version from `package.json` whenever prebuild generates the native projects.

## TypeScript Configuration

- `tsconfig.json` - Main app TypeScript config (React Native with path aliases). Excludes `admin/` and `dainorelisapp.com`, which have their own configs.
- Scripts in `/scripts` run with `tsx` (no separate tsconfig; `tsc --noEmit` typechecks them with the app)

## Linting and Formatting

ESLint uses Expo's flat config (which includes eslint-plugin-react-hooks 7 and its React Compiler rules) with Prettier integration. `admin/` uses `eslint-config-next`'s flat config instead (run with the ESLint CLI; Next 16 removed `next lint`). Key rules:

- Prettier formatting enforced as errors
- Unused imports are automatically flagged and removed
- Global ignores (`globalIgnores` in `eslint.config.js`): build artifacts, ios/android, `admin/`, `dainorelisapp.com/`, generated `songs.ts` / `song-festival.ts`, `.claude/worktrees/`

## Astro Website

The `dainorelisapp.com/` directory is the Astro marketing site (App Store / Play Store links and the `/qr` redirect), deployed on Vercel as its own pnpm workspace package. The repo-root Vercel project only redirects to it (`vercel.json` + `public/`) until the Expo web build is enabled.
