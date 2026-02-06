# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dainorėlis is a React Native mobile and web app built with Expo for viewing and performing Lithuanian folk songs. The app displays song lyrics with chords, translations, audio recordings, sheet music (PDFs), and descriptions. All song data is sourced from an Airtable database.

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
npm run update-songs     # Fetch songs from Airtable and regenerate search indices
npm run generate-indices # Regenerate search indices (title and lyric search)
```

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
- **Audio**: react-native-audio-pro for background audio playback
- **Search**: Fuse.js with pre-generated indices
- **Backend**: Airtable (song database)
- **AI**: OpenAI API for generating song descriptions and translations

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
  - `update-songs.ts` - Fetch all song data from Airtable
  - `generate-search-indices.ts` - Create Fuse.js search indices
  - `generate-song-metadata.ts` - Use OpenAI to generate descriptions/translations

- **Generated Files** (do not edit manually)
  - `songs.ts` - Complete song database exported from Airtable
  - `song-festival.ts` - Curated lists for song festival repertoire
  - `title-index.json` - Search index for song titles
  - `lyric-index.json` - Search index for song lyrics

### Data Flow

1. Song data lives in Airtable with these related tables:
   - Songs (main table)
   - Lyrics & Chords (multiple variants per song)
   - Translations (English translations of lyrics)
   - Audio (Spotify/YouTube links)
   - PDFs (sheet music)
   - Videos (performance recordings)

2. `update-songs.ts` fetches from Airtable, validates with Zod schemas, and generates `songs.ts` and `song-festival.ts`

3. `generate-search-indices.ts` processes `songs.ts` to create Fuse.js indices for fast client-side search

4. The app imports `songs.ts` directly (no runtime API calls) and loads search indices on demand

### Key Design Patterns

**Lyrics with Chords**: Lyrics are stored as markdown with inline chord notation `[space](Chord)`. The `update-songs.ts` script automatically adjusts whitespace based on chord width to improve visual alignment. The `Lyrics` component renders this markdown with react-native-markdown-display.

**Variant Names**: Each song can have multiple variants (different arrangements, translations, etc.). If a variant lacks a name in Airtable, the script auto-generates one as `"Default Name {number}"` (e.g., "Žodžiai 1", "Lyrics 2"). The script normalizes Lithuanian and English variant names.

**Theme System**: The app uses React Navigation's theming with custom light/dark themes defined in `lib/constants/themes.ts`. The user's theme preference is stored in MMKV and applied via `Appearance.setColorScheme()`.

**I18n**: Uses i18next with Lithuanian (lt) and English (en) translations. Language files are in `lib/constants/i18n.ts`. The app detects device language and falls back to English.

**Audio Playback**: Configured for background playback with lock screen controls. Uses `react-native-audio-pro` configured in `app/_layout.tsx`.

**Storage**: MMKV via `useStorage` hook for fast, synchronous persistent storage of user preferences (theme, language, etc.).

**Platform-Specific Code**: Web-specific variants use `.web.ts` extension (e.g., `useColorScheme.web.ts`).

**React Compiler**: This project uses React Compiler for automatic optimization. Do not use manual memoization techniques like `useCallback`, `useMemo`, or `React.memo` - the compiler handles this automatically.

## Environment Variables

The app requires a `.env` file (see `.env.example`):

- `AIRTABLE_TOKEN` - For fetching songs via Airtable API
- `OPENAI_API_KEY` - For generating AI metadata

## Testing and Release

There are currently no automated tests (`npm test` exits successfully).

For production releases, see the Expo documentation on creating production builds. The `app.config.ts` automatically generates build numbers in `yymmdd##` format and reads the version from `package.json`.

## TypeScript Configuration

- `tsconfig.json` - Main app TypeScript config (React Native with path aliases)
- `tsconfig.scripts.json` - Extends main config for Node.js scripts with CommonJS modules

## Linting and Formatting

ESLint uses Expo's flat config with Prettier integration. Key rules:

- Prettier formatting enforced as errors
- Unused imports are automatically flagged and removed
- Ignores build artifacts (dist, ios, android, .expo)

## Astro Website

The `dainorelisapp.com/` directory contains a separate Astro static site (appears to be from a starter template). It's unclear if this is actively used or just a placeholder for future web presence.
