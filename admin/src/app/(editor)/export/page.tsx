import Link from 'next/link';

import { buildSongFileFromDatabase } from '@/lib/song-file/query';
import { countRecords, findIssues } from '@/lib/song-file/validate';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-stone-500 dark:text-stone-400">{label}</div>
    </div>
  );
}

export default async function ExportPage() {
  const supabase = await createClient();
  const songs = await buildSongFileFromDatabase(supabase);

  const totals = countRecords(songs);
  const issues = findIssues(songs);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const bytes = Buffer.byteLength(JSON.stringify(songs, null, 2));

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Export</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        This is exactly what <code>npm run update-songs</code> pulls into the app’s <code>songs.ts</code>. Hidden songs
        are already excluded.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="songs" value={songs.length} />
        <Stat label="lyrics variants" value={totals.lyrics} />
        <Stat label="translations" value={totals.translations} />
        <Stat label="audio" value={totals.audio} />
        <Stat label="sheet music" value={totals.pdfs} />
        <Stat label="JSON size" value={`${Math.round(bytes / 1024)} KB`} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Blocking errors <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">{errors.length}</span>
        </h2>
        {errors.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">None — the app will accept this export.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {errors.map((issue, index) => (
              <li key={index} className="text-red-600 dark:text-red-400">
                <Link href={`/songs/${issue.songId}`} className="underline">
                  {issue.songName}
                </Link>{' '}
                — {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Warnings <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">{warnings.length}</span>
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          These still build. Missing translations are the usual candidates for <code>npm run generate-metadata</code>.
        </p>
        <ul className="mt-2 flex max-h-96 flex-col gap-1 overflow-y-auto text-sm">
          {warnings.map((issue, index) => (
            <li key={index} className="text-stone-600 dark:text-stone-300">
              <Link href={`/songs/${issue.songId}`} className="underline">
                {issue.songName}
              </Link>{' '}
              — {issue.message}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 border-t border-stone-200 pt-6 dark:border-stone-800">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Pulling it into the app</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          From the app repo, with <code>ADMIN_EXPORT_URL</code> and <code>ADMIN_EXPORT_TOKEN</code> set in{' '}
          <code>.env</code>:
        </p>
        <pre
          className="mt-2 overflow-x-auto rounded-lg border border-stone-200 p-3 text-xs
            dark:border-stone-800"
        >
          npm run update-songs
        </pre>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">
          That regenerates <code>songs.ts</code>, <code>song-festival.ts</code> and the search indices. Commit the
          result — the app reads the file, never this API.
        </p>
      </section>
    </main>
  );
}
