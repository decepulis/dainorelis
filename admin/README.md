# Dainorėlis admin

The CMS for the Dainorėlis app. Replaces the Airtable base the song database
used to live in.

The mobile app never talks to this service at runtime. It reads `songs.ts`,
which is generated at build time from the export endpoint here and committed to
the repo, so a release build is reproducible and works offline.

```
admin (Next.js 16 on Vercel)  ──▶  Supabase Postgres
        │
        │  GET /api/export   (bearer token)
        ▼
app repo: pnpm update-songs      ──▶  songs.ts + song-festival.ts + search indices
        │
        ▼
   bundled into the app
```

## Setup

1. **Create the Supabase project.** Install Supabase from the Vercel
   Marketplace so the connection variables are wired into the deployment for
   you.

   Then create the schema (via migrations — no dashboard SQL editor needed).
   It lives as versioned migrations in `supabase/migrations/` and is applied
   by the **Apply DB migrations** GitHub Action
   (`.github/workflows/db-push.yml` at the repo root). Add three repository
   secrets under **GitHub → Settings → Secrets and variables → Actions**:
   - `SUPABASE_PROJECT_REF` — your project ref (Supabase **Project Settings →
     General**, or the `<ref>` in the dashboard URL).
   - `SUPABASE_ACCESS_TOKEN` — a personal access token from
     [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
   - `SUPABASE_DB_PASSWORD` — the database password (Supabase **Project
     Settings → Database**; reset it there if you don't have it).

   Then trigger it once: run it by hand from **Actions → Apply DB migrations →
   Run workflow**, or push any change under `admin/supabase/` to `main`. (The
   workflow has to be on `main` before either works.) It applies every
   migration the project hasn't recorded yet, so a second run is a no-op.

   To apply them before the workflow is on `main`, push from your machine with
   the connection string the Supabase integration puts in the Vercel project:
   `vercel env pull .env.local`, then from `admin/`,
   `supabase db push --db-url "$POSTGRES_URL_NON_POOLING"`. The workflow
   then finds them recorded and does nothing.

2. **Apply the auth settings.** They live in `supabase/config.toml` (the
   `[auth]` sections) and `supabase/templates/`, and are applied with the
   Supabase CLI rather than set in the dashboard. From `admin/`, after a
   one-time `supabase login` in an interactive terminal:

   ```bash
   export RESEND_SMTP_KEY=re_...   # a Resend "Sending access" key
   supabase config diff --project-ref <ref>   # preview
   supabase config push --project-ref <ref>
   ```

   Properties the file doesn't declare are left as they are on the project.
   What it sets:

   - **Sign-ups and anonymous sign-ins off.** There are no roles in this app:
     anyone who can sign in is an editor, so accounts are created by
     invitation only (Authentication → Users → Add user → Send invitation).
     Anonymous users also get the `authenticated` role; the
     `editors_not_anonymous` migration keeps them out of the policies, but
     there is no reason to rely on that alone.
   - **Resend as the mailer** (`noreply@dainorelis.app`, domain verified in
     Resend with its records in Cloudflare). Supabase's built-in mailer only
     delivers to members of the Supabase organization, sends a few emails an
     hour, and won't let the templates be edited. `RESEND_SMTP_KEY` is read at
     push time, so set it for every push (the key isn't committed anywhere).
   - **Site URL** `https://admin.dainorelis.app`, and the **Invite** and
     **Reset password** templates.

3. **How the auth emails work.** The invite and password-reset links land on
   `/auth/confirm`. The editor clicks **Continue** there, which signs them in
   and sends them to `/account/password` to choose a password. (The click is
   what spends the one-time token: mail scanners open every link in a message
   first, and would otherwise use it up.) Supabase's default templates link to
   its own verify endpoint instead, which is why the templates in
   `supabase/templates/` link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (or
   `type=recovery`).

   Both parameters are required, and `type` must be `invite` or `recovery`;
   the page turns any other link away. It needs nothing else: both types go
   on to `/account/password`, and the reset form doesn't pass a `redirectTo`,
   so `{{ .RedirectTo }}` would only ever hold the Site URL.

   The links are built from the Site URL, so they always go to production;
   to try the flow against `next dev`, temporarily point the Site URL at
   `http://localhost:3100`. Signed-in editors can change their password from
   the "Password" link in the header.

4. **Set the environment variables.** See `.env.example`. The Supabase
   integration provides `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. The legacy
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` names still
   work as a fallback, but Supabase retires those keys at the end of 2026.
   `EXPORT_TOKEN` is a secret you generate yourself (`openssl rand -hex 32`) and
   share with the app repo's `.env` as `ADMIN_EXPORT_TOKEN`.

5. **Migrate from Airtable**, once, from a machine holding the Airtable token:

   ```bash
   cd admin
   pnpm import:airtable -- --dry-run   # read Airtable, report, write nothing
   pnpm import:airtable                # for real
   ```

   The dry run is worth doing first: it reports records that are linked to no
   song, or to more than one, which the relational schema cannot represent the
   way Airtable did.

   Both importers **delete every row and re-insert**, with no transaction. Before
   writing they print the target `NEXT_PUBLIC_SUPABASE_URL` and how many songs
   it holds, then:

   - refuse to run if the `songs` table is not empty, unless you pass `--force`;
   - ask you to type `yes`, unless you pass `--yes` (required when stdin is not
     a terminal).

   Remember that `.env.local` holds the production keys after a
   `vercel env pull`.

6. **Verify.** Open `/export` in the admin app and confirm the song count and
   that there are no blocking errors. Then, in the app repo, run
   `pnpm update-songs` and check `git diff songs.ts`. Immediately after the
   migration, expect exactly one changed line: the importer trims song names,
   and one Airtable title (`"Mes broliukai du du du\n"`) carries a trailing
   newline. Anything beyond that means the new pipeline does not reproduce
   Airtable's output, and is worth chasing before going further.

## Changing the database schema

Schema changes are code, not dashboard clicks. Each change is a SQL file in
`supabase/migrations/`; once it reaches `main`, the **Apply DB migrations** Action
runs `supabase db push` and applies anything the project hasn't seen yet. Pushes
that don't touch `admin/supabase/` leave the database alone.

To add one (with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
installed), from `admin/`:

```bash
supabase migration new add_whatever   # creates a timestamped .sql file
#  ...write the ALTER/CREATE SQL in it...
git add supabase/migrations && git commit   # CI applies it once it reaches main
```

Keep `src/lib/supabase/types.ts` in step with it. You never have to open the SQL
editor. If you'd rather apply a migration from your machine instead of via CI,
`supabase link --project-ref <ref>` once (from `admin/`), then
`supabase db push`.

## Local development

```bash
pnpm --filter @dainorelis/admin dev     # or `pnpm admin` from the repo root
```

Next.js 16 needs Node 20.9 or later, and builds with Turbopack by default.
Lint with `pnpm lint` (the ESLint CLI; `next lint` no longer exists), and
typecheck with `pnpm typecheck`.

Every request except static assets goes through `src/proxy.ts` (Next 16's name
for middleware; it always runs on the Node.js runtime). It refreshes the
Supabase session cookie and sends signed-out visitors to `/login`. The routes
reachable without a session are listed in `src/lib/supabase/proxy.ts`.

To work against a throwaway database, seed it from the app's committed data:

```bash
pnpm import:song-file                    # empty database; asks for confirmation
pnpm import:song-file -- --force --yes   # replace a populated one without asking
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
  pnpm exec tsx ./scripts/update-songs.ts
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
  explicit `position`, unique per song (the `unique_child_positions`
  migration).
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

Set `CRON_SECRET` on the Vercel project. Vercel's cron sends it as a bearer
token, and in production the endpoint refuses every request (503) while it is
unset, so a missing secret also means the keep-alive silently stops. Under
`next dev` the endpoint stays open when the variable is unset.

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
