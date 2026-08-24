import { createClient } from '@/lib/supabase/server';

import { createSong } from './actions';
import SongList from './song-list';

export const dynamic = 'force-dynamic';

export default async function SongsPage() {
  const supabase = await createClient();

  // 619 songs is small enough to filter in the browser, which keeps search
  // instant and avoids a round trip per keystroke.
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, name, hide, lyrics(count), translations(count), audio(count), pdfs(count)')
    .order('name', { ascending: true });

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
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white
              hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            New song
          </button>
        </form>
      </div>

      <SongList songs={songs} />
    </main>
  );
}
