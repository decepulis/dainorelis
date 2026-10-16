-- Keep anonymous users out of the editor policies.
--
-- 0001 lets the `authenticated` role do anything, on the basis that sign-ups
-- are off and every account is an invited editor. Supabase's anonymous
-- sign-ins are a separate dashboard toggle, though, and an anonymous user also
-- gets the `authenticated` role. Turning that toggle on would make the whole
-- database writable by anyone holding the publishable key, which ships in the
-- browser bundle. Their JWT carries `is_anonymous: true`, so require it to be
-- false (it is absent on older tokens, hence the coalesce).
--
-- `(select auth.jwt())` rather than a bare call lets Postgres evaluate it once
-- per statement instead of once per row.
--
-- Safe to re-run: each policy is dropped and recreated. The DO block runs as a
-- single statement, so no table is left without its policy part-way through.

do $$
declare
  t text;
  editor constant text :=
    $q$coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false$q$;
begin
  foreach t in array array['songs', 'lyrics', 'translations', 'audio', 'pdfs', 'videos']
  loop
    execute format('drop policy if exists %I on %I', t || '_editors_all', t);
    execute format(
      'create policy %I on %I for all to authenticated using (%s) with check (%s)',
      t || '_editors_all', t, editor, editor
    );
  end loop;
end;
$$;
