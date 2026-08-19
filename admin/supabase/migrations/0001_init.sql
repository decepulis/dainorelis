-- Dainorėlis admin schema.
--
-- This mirrors the Airtable base it replaces (base appW24b09D9VHYHfi) one table
-- at a time, so the JSON the app bundles at build time is unchanged.
--
-- Two Airtable behaviours are load-bearing and are preserved deliberately:
--
--   1. Record ids are text, not uuids, and existing rows keep their Airtable
--      `rec…` ids. The mobile app routes on them (`/dainos/[id]`), so changing
--      them would break every deep link and saved favourite.
--   2. Variant names are NULLABLE. A blank variant name in Airtable is not
--      missing data — it is the signal that the export should generate one
--      ("Žodžiai 2", "Lyrics 2"). Child rows therefore also carry an explicit
--      `position`, because the generated number comes from the record's
--      ordinal within its parent song.

-- New records get Airtable-shaped ids so nothing downstream has to care which
-- system a song was created in.
create or replace function gen_record_id() returns text
language sql volatile as $$
  select 'rec' || string_agg(
    substr(
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      1 + floor(random() * 62)::int,
      1
    ),
    ''
  )
  from generate_series(1, 14);
$$;

create table songs (
  id                text primary key default gen_record_id(),
  name              text not null,
  tags              text[],
  sources           text[],
  recommended_key   text,
  music_author      text,
  text_author       text,
  lt_description    text,
  en_description    text,
  -- Airtable's `Hide` checkbox. Hidden songs stay editable but are filtered
  -- out of the export, exactly like `filterByFormula: 'NOT(Hide)'` did.
  hide              boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index songs_name_idx on songs (name);

create table lyrics (
  id                text primary key default gen_record_id(),
  song_id           text not null references songs (id) on delete cascade,
  position          integer not null default 0,
  variant_name      text,
  en_variant_name   text,
  lyrics_and_chords text not null default '',
  show_chords       boolean,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table translations (
  id                text primary key default gen_record_id(),
  song_id           text not null references songs (id) on delete cascade,
  position          integer not null default 0,
  title             text,
  variant_name      text,
  en_variant_name   text,
  lyrics            text not null default '',
  ai_generated      boolean,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table audio (
  id                text primary key default gen_record_id(),
  song_id           text not null references songs (id) on delete cascade,
  position          integer not null default 0,
  variant_name      text,
  en_variant_name   text,
  url               text not null default '',
  album             text,
  artist            text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table pdfs (
  id                text primary key default gen_record_id(),
  song_id           text not null references songs (id) on delete cascade,
  position          integer not null default 0,
  variant_name      text,
  en_variant_name   text,
  url               text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table videos (
  id                text primary key default gen_record_id(),
  song_id           text not null references songs (id) on delete cascade,
  position          integer not null default 0,
  variant_name      text,
  en_variant_name   text,
  youtube_link      text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index lyrics_song_idx       on lyrics       (song_id, position);
create index translations_song_idx on translations (song_id, position);
create index audio_song_idx        on audio        (song_id, position);
create index pdfs_song_idx         on pdfs         (song_id, position);
create index videos_song_idx       on videos       (song_id, position);

-- updated_at bookkeeping ------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['songs', 'lyrics', 'translations', 'audio', 'pdfs', 'videos']
  loop
    execute format(
      'create trigger %I_touch_updated_at before update on %I
         for each row execute function touch_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- Row level security ----------------------------------------------------------
--
-- There are no roles in this app: anyone who can sign in is an editor. That
-- lets the browser hold nothing but the anon key, with Postgres — not
-- application code — deciding that a request must be authenticated.
--
-- Sign-ups are disabled in the Supabase dashboard; editors are invited by hand.

do $$
declare t text;
begin
  foreach t in array array['songs', 'lyrics', 'translations', 'audio', 'pdfs', 'videos']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_editors_all', t
    );
  end loop;
end;
$$;
