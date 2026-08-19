# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dainorėlis is a React Native mobile and web app built with Expo for viewing and performing Lithuanian folk songs. The app displays song lyrics with chords, translations, audio recordings, sheet music (PDFs), and descriptions. All song data comes from the custom admin app in `admin/`, which stores it in Supabase Postgres.

## Essential Commands

### Development

```bash
npm run dev              # Start Expo dev server (choose platform)
npm run dev:web          # Start web development server
npm run dev:ios          # Start iOS development server (requires setup)
npm run dev:android      # Start Android development server (requires setup)
```

### Data Synchronization

```bash
npm run update-songs     # Fetch songs from the admin app and regenerate search indices
npm run generate-indices # Regenerate search indices (title and lyric search)
npm run admin            # Run the admin app locally (see admin/README.md)
```

`update-songs` reads `ADMIN_EXPORT_URL` and `ADMIN_EXPORT_TOKEN` from `.env`. It
never talks to the database directly — the admin app's `/api/export` endpoint
owns the content transforms.

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run format           # Format code with Prettier
```

### Building

```bash
# Production builds for local device testing
npx expo run:android --variant release --device
npx expo run:ios --configuration Release --device

# After changes to assets or libraries, sync native projects
npx expo prebuild --clean
```

### AI Metadata Generation

```bash
npm run generate-metadata       # Generate AI descriptions/translations for all songs
npm run generate-metadata:test  # Test on first 5 songs only
```

## Architecture

### Core Technology Stack

- **Framework**: Expo (React Native framework)
- **Router**: expo-router (file-based routing)
- **State Management**: React Context + MMKV storage for persistent settings
- **Audio**: expo-audio for background audio playback
- **Search**: Fuse.js with pre-generated indices
- **Backend**: `admin/` — a Next.js CMS on Vercel backed by Supabase Postgres
- **AI**: OpenAI API for generating song descriptions and translations (in `admin/`)

### Project Structure

- **`/app`** - File-based routing (expo-router)
  - `index.tsx` - Home screen with song list and search
  - `_layout.tsx` - Root layout, theme provider, splash screen, audio config
  - `dainos/[id].tsx` - Song detail view (lyrics + chords)
  - `dainos/[id]/vertimas.tsx` - Translation modal
  - `dainos/[id]/aprasymas.tsx` - Description modal
  - `nustatymai.tsx` - Settings modal

- **`/lib`** - Reusable components, hooks, utilities
  - `/components` - React components (ThemedText, Lyrics, Markdown, SongMenu, etc.)
  - `/hooks` - Custom hooks (useStorage, useThemeColor, useSongList, etc.)
  - `/schemas` - Zod schemas for type-safe data validation
  - `/constants` - Theme definitions, i18n config, layout constants
  - `/utils` - Utility functions

- **`/scripts`** - Data pipeline scripts (run with ts-node)
  - `update-songs.ts` - Fetch all song data from the admin app's export endpoint
  - `generate-search-indices.ts` - Create Fuse.js search indices

- **`/admin`** - The CMS (separate Vercel deployment, its own README)
  - Owns the schema, the editor UI, and every content transform
  - `scripts/import-from-airtable.ts` - the one-time migration
  - `scripts/generate-metadata.ts` - OpenAI translations (was `generate-song-metadata.ts`)

- **Generated Files** (do not edit manually)
  - `songs.ts` - Complete song database exported from the admin app
  - `song-festival.ts` - Curated lists for song festival repertoire
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

**Lyrics with Chords**: Lyrics are stored as markdown with inline chord notation `[space](Chord)`. The admin app's export automatically adjusts whitespace based on chord width to improve visual alignment. The `Lyrics` component renders this markdown with react-native-markdown-display.

**Variant Names**: Each song can have multiple variants (different arrangements, translations, etc.). If a variant lacks a name, the export auto-generates one as `"Default Name {number}"` (e.g., "Žodžiai 1", "Lyrics 2"), numbered by the variant's position within its song. A blank variant name in the admin UI is therefore meaningful, not missing data.

**Theme System**: The app uses React Navigation's theming with custom light/dark themes defined in `lib/constants/themes.ts`. The user's theme preference is stored in MMKV and applied via `Appearance.setColorScheme()`.

**I18n**: Uses i18next with Lithuanian (lt) and English (en) translations. Language files are in `lib/constants/i18n.ts`. The app detects device language and falls back to English.

**Audio Playback**: Configured for background playback with lock screen controls. Uses `expo-audio` configured in `app/_layout.tsx`.

**Storage**: MMKV via `useStorage` hook for fast, synchronous persistent storage of user preferences (theme, language, etc.).

**Platform-Specific Code**: Web-specific variants use `.web.ts` extension (e.g., `useColorScheme.web.ts`).

**React Compiler**: This project uses React Compiler for automatic optimization. Do not use manual memoization techniques like `useCallback`, `useMemo`, or `React.memo` - the compiler handles this automatically.

## Environment Variables

The app requires a `.env` file (see `.env.example`):

- `ADMIN_EXPORT_URL` - The admin app's export endpoint (defaults to production)
- `ADMIN_EXPORT_TOKEN` - Shared secret for that endpoint

The admin app has its own variables; see `admin/.env.example`.

## Testing and Release

There are currently no automated tests (`npm test` exits successfully).

For production releases, see the Expo documentation on creating production builds. The `app.config.ts` automatically generates build numbers in `yymmdd##` format and reads the version from `package.json`.

## TypeScript Configuration

- `tsconfig.json` - Main app TypeScript config (React Native with path aliases). Excludes `admin/` and `dainorelisapp.com`, which have their own configs.
- `tsconfig.scripts.json` - Extends main config for Node.js scripts with CommonJS modules

## Linting and Formatting

ESLint uses Expo's flat config with Prettier integration. `admin/` is excluded and uses the Next.js config instead. Key rules:

- Prettier formatting enforced as errors
- Unused imports are automatically flagged and removed
- Ignores build artifacts (dist, ios, android, .expo) and `admin/`

## Astro Website

The `dainorelisapp.com/` directory contains a separate Astro static site (appears to be from a starter template). It's unclear if this is actively used or just a placeholder for future web presence.
