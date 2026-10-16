-- One position per variant within a song.
--
-- `position` orders a song's variants, and with it the number in generated
-- names like "Žodžiai 2". Two rows sharing a position sort in whatever order
-- Postgres happens to return them, so the export could renumber variants
-- between runs. The importers and the editor already assign distinct
-- positions; this makes the database hold them to it.
--
-- DEFERRABLE INITIALLY DEFERRED checks at commit, so one statement or
-- transaction can permute positions (a re-import moving rows around) without
-- tripping over its own intermediate states. The editor's reorder issues one
-- request per row, each its own transaction, so it parks rows on spare
-- negative positions first instead (see swapPositions in actions.ts).
--
-- Safe to re-run.

do $$
declare t text;
begin
  foreach t in array array['lyrics', 'translations', 'audio', 'pdfs', 'videos']
  loop
    -- Settle any duplicates already present into a clean 0..n-1 sequence,
    -- keeping the existing order and breaking ties by id. Songs without
    -- duplicates are left alone, gaps included.
    execute format(
      'update %1$I as child
          set position = ranked.new_position
         from (
           select id,
                  row_number() over (partition by song_id order by position, id) - 1 as new_position
             from %1$I
            where song_id in (
              select song_id from %1$I group by song_id, position having count(*) > 1
            )
         ) as ranked
        where child.id = ranked.id
          and child.position <> ranked.new_position',
      t
    );

    execute format('alter table %I drop constraint if exists %I', t, t || '_song_position_key');
    execute format(
      'alter table %I add constraint %I unique (song_id, position) deferrable initially deferred',
      t, t || '_song_position_key'
    );

    -- The constraint's index covers (song_id, position), so 0001's plain
    -- index on the same columns is now redundant.
    execute format('drop index if exists %I', t || '_song_idx');
  end loop;
end;
$$;
