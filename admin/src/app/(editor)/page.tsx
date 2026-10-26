import { PRIMARY_BUTTON } from '@/lib/styles';
import { fetchAll } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';

import { createSong } from './actions';
import SongList from './song-list';
import SubmitButton from './submit-button';

export default async function SongsPage() {
  const supabase = await createClient();

  // 619 songs is small enough to filter in the browser, which keeps search
  // instant and avoids a round trip per keystroke.
  const { data: songs, error } = await fetchAll((from, to) =>
    supabase
      .from('songs')
      .select('id, name, hide, lyrics(count), translations(count), audio(count), pdfs(count)')
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );

  if (error) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load songs: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Songs</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {songs.length} songs · {songs.filter((song) => song.hide).length} hidden from the app
          </p>
        </div>
        <form action={createSong}>
          <SubmitButton pendingLabel="Creating…" className={PRIMARY_BUTTON}>
            New song
          </SubmitButton>
        </form>
      </div>

      <SongList songs={songs} />
    </main>
  );
}
