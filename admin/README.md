# Dainorėlis admin

The CMS for the Dainorėlis app. Replaces the Airtable base the song database
used to live in.

The mobile app never talks to this service at runtime. It reads `songs.ts`,
which is generated at build time from the export endpoint here and committed to
the repo, so a release build is reproducible and works offline.

```
admin (Next.js on Vercel)  ──▶  Supabase Postgres
        │
        │  GET /api/export   (bearer token)
        ▼
app repo: npm run update-songs  ──▶  songs.ts + song-festival.ts + search indices
        │
        ▼
   bundled into the app
```

## Setup

1. **Create the Supabase project.** Install Supabase from the Vercel
   Marketplace so the connection variables are wired into the deployment for
   you, then run `supabase/migrations/0001_init.sql` in the SQL editor.

2. **Turn off sign-ups.** Authentication → Sign In / Providers → disable
   "Allow new users to sign up". There are no roles in this app: anyone who can
   sign in is an editor, so accounts are created by invitation only
   (Authentication → Users → Add user).

3. **Set the environment variables.** See `.env.example`. `EXPORT_TOKEN` is a
   secret you generate yourself (`openssl rand -hex 32`) and share with the app
   repo's `.env` as `ADMIN_EXPORT_TOKEN`.

4. **Migrate from Airtable**, once, from a machine holding the Airtable token:

   ```bash
   cd admin
   pnpm import:airtable -- --dry-run   # read Airtable, report, write nothing
   pnpm import:airtable                # for real
   ```

   The dry run is worth doing first: it reports records that are linked to no
   song, or to more than one, which the relational schema cannot represent the
   way Airtable did.

5. **Verify.** Open `/export` in the admin app and confirm the song count and
   that there are no blocking errors. Then, in the app repo, run
   `npm run update-songs` and check `git diff songs.ts` — immediately after the
   migration it should be **empty**. A clean diff proves the new pipeline
   reproduces Airtable's output exactly.

## Local development

```bash
pnpm --filter @dainorelis/admin dev     # or `pnpm admin` from the repo root
```

To work against a throwaway database, seed it from the app's committed data:

```bash
pnpm import:song-file
```

Note that `songs.ts` only carries the fields the app bundles, so this cannot
restore `Hide`, `Tags`, `Sources`, `Recommended Key` or videos — every song
comes back visible and untagged. It is for dev convenience, not for migration.

## Verifying the export without a database

```bash
pnpm verify          # round-trips the committed songs.ts through the transform
pnpm export:fixture  # serves /api/export from songs.ts on :4100
```

`pnpm verify` feeds the app's committed `songs.ts` through the importer's row
mapping and back out through the export transform, then asserts the result is
byte-identical. It covers JSON key order, the absent-vs-empty-string rules,
variant numbering and chord whitespace — the details that would otherwise show
up as a spurious thousand-line diff in the app repo. Run it after touching
anything in `src/lib/song-file/`.

`pnpm export:fixture` serves the same payload over HTTP so the app's
`update-songs` can be exercised end to end with no Supabase project:

```bash
# in admin/
EXPORT_TOKEN=fixture-token pnpm export:fixture

# in the app repo
ADMIN_EXPORT_URL=http://127.0.0.1:4100/ ADMIN_EXPORT_TOKEN=fixture-token \
  npx ts-node --project tsconfig.scripts.json ./scripts/update-songs.ts
```

## How the data model maps to Airtable

| Airtable        | Table          |
| --------------- | -------------- |
| Songs           | `songs`        |
| Lyrics & Chords | `lyrics`       |
| Translations    | `translations` |
| Audio           | `audio`        |
| PDFs            | `pdfs`         |
| Videos          | `videos`       |

Three things about the schema are deliberate and easy to "tidy up" by mistake:

- **Record ids are text and keep their Airtable `rec…` values.** The app routes
  on them (`/dainos/[id]`), so renumbering breaks every deep link.
- **Variant names are nullable.** A blank variant name is not missing data — it
  is the signal for the export to generate one ("Žodžiai 2"). The number comes
  from the record's position within its song, which is why child rows carry an
  explicit `position`.
- **Checkboxes distinguish false from absent.** Airtable omits an unchecked
  field entirely, so the export drops falsy booleans rather than emitting
  `false`. Emitting it would add a key to hundreds of songs.

## Where the transforms live

`src/lib/song-file/build.ts` owns everything that used to happen in the app's
`scripts/update-songs.ts`: variant naming, chord whitespace widening, hidden
song filtering and title ordering. The app repo now only decides which _fields_
to bundle, via `fieldFlags` in its own `update-songs.ts`.

One subtlety recorded there: song ordering uses `en` collation, because that is
what reproduces Airtable's sort. Lithuanian collation orders `š` differently and
would reshuffle the bundle — which also shifts the indices `song-festival.ts`
refers to.

## Keeping Supabase awake

Supabase pauses free-tier projects after seven days of inactivity, and
un-pausing is a manual trip to the dashboard. `vercel.json` registers a daily
cron against `/api/health`, which issues one trivial query. That is enough to
keep the project counted as active between editing sessions.

## AI translations

```bash
pnpm generate-metadata -- --limit 5   # cheap dry run over the first 5 candidates
pnpm generate-metadata                # every song without a translation
pnpm generate-metadata -- --force     # regenerate even where one exists
```

This writes a row into `translations` with `ai_generated` set. The Airtable
version wrote to `EN Title` / `EN Translation` columns on the Songs table, which
nothing ever read — the app has always read the Translations table — so the port
targets the table the app actually consumes.
