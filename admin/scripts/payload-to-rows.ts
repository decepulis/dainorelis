import type { SongRow } from '../src/lib/song-file/build';
import type { ImportPayload } from './rows';

/**
 * Shapes an import payload the way the export's PostgREST query returns it, so
 * the transform can be exercised without a live database.
 */
export function payloadToSongRows(payload: ImportPayload): SongRow[] {
  const children = <T extends { song_id: string }>(rows: T[]) => {
    const bySong = new Map<string, T[]>();
    for (const row of rows) {
      bySong.set(row.song_id, [...(bySong.get(row.song_id) ?? []), row]);
    }
    return bySong;
  };

  const lyrics = children(payload.lyrics);
  const translations = children(payload.translations);
  const audio = children(payload.audio);
  const pdfs = children(payload.pdfs);
  const videos = children(payload.videos);

  return payload.songs.map(
    (song) =>
      ({
        ...song,
        lyrics: lyrics.get(song.id) ?? [],
        translations: translations.get(song.id) ?? [],
        audio: audio.get(song.id) ?? [],
        pdfs: pdfs.get(song.id) ?? [],
        videos: videos.get(song.id) ?? [],
      }) as unknown as SongRow
  );
}
