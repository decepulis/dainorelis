import fs from 'node:fs';

import type { SongFile } from '../src/lib/song-file/types';
import { type ImportPayload, bool, emptyPayload, list, str } from './rows';

/**
 * Reads the app's generated `songs.ts`.
 *
 * The file is a TypeScript module, but its body is a plain JSON array, so it
 * can be sliced out without evaluating the module or pulling in the app's
 * path aliases.
 */
export function readSongFile(filePath: string): SongFile {
  const source = fs.readFileSync(filePath, 'utf8');
  const start = source.indexOf('[');
  const end = source.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error(`${filePath} does not contain a song array.`);
  return JSON.parse(source.slice(start, end + 1)) as SongFile;
}

/**
 * Converts a generated song file back into database rows.
 *
 * Caveat worth knowing: `songs.ts` only contains the fields the app bundles.
 * `Hide`, `Tags`, `Sources`, `Recommended Key` and `Videos` were never written
 * to it, so seeding from this source cannot recover them — every song comes
 * back visible and untagged. Use the Airtable importer for the real migration;
 * this path is for bootstrapping a dev database and for round-trip testing.
 */
export function payloadFromSongFile(songs: SongFile): ImportPayload {
  const payload = emptyPayload();

  for (const song of songs) {
    payload.songs.push({
      id: song.id,
      name: song.fields.Name,
      tags: list(song.fields.Tags),
      sources: list(song.fields.Sources),
      recommended_key: str(song.fields['Recommended Key']),
      music_author: str(song.fields['Music Author']),
      text_author: str(song.fields['Text Author']),
      lt_description: str(song.fields['LT Description']),
      en_description: str(song.fields['EN Description']),
      hide: false,
    });

    Object.entries(song.fields.Lyrics ?? {}).forEach(([id, record], position) => {
      payload.lyrics.push({
        id,
        song_id: song.id,
        position,
        variant_name: str(record['Variant Name']),
        en_variant_name: str(record['EN Variant Name']),
        lyrics_and_chords: record['Lyrics & Chords'] ?? '',
        show_chords: bool(record['Show Chords']),
        notes: str(record.Notes),
      });
    });

    Object.entries(song.fields.Translations ?? {}).forEach(([id, record], position) => {
      payload.translations.push({
        id,
        song_id: song.id,
        position,
        title: str(record.Title),
        variant_name: str(record['Variant Name']),
        en_variant_name: str(record['EN Variant Name']),
        lyrics: record.Lyrics ?? '',
        ai_generated: bool(record['AI Generated']),
        notes: str(record.Notes),
      });
    });

    Object.entries(song.fields.Audio ?? {}).forEach(([id, record], position) => {
      payload.audio.push({
        id,
        song_id: song.id,
        position,
        variant_name: str(record['Variant Name']),
        en_variant_name: str(record['EN Variant Name']),
        url: record.URL ?? '',
        album: str(record.Album),
        artist: str(record.Artist),
      });
    });

    Object.entries(song.fields.PDFs ?? {}).forEach(([id, record], position) => {
      payload.pdfs.push({
        id,
        song_id: song.id,
        position,
        variant_name: str(record['Variant Name']),
        en_variant_name: str(record['EN Variant Name']),
        url: record.URL ?? '',
      });
    });

    Object.entries(song.fields.Videos ?? {}).forEach(([id, record], position) => {
      payload.videos.push({
        id,
        song_id: song.id,
        position,
        variant_name: str(record['Variant Name']),
        en_variant_name: str(record['EN Variant Name']),
        youtube_link: record['YouTube Link'] ?? '',
      });
    });
  }

  return payload;
}
