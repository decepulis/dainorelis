/**
 * Builds the song file that the mobile app bundles at build time.
 *
 * Every transform here was lifted from the Airtable version of
 * `scripts/update-songs.ts`. They are reproduced exactly, quirks included,
 * because the app's generated `songs.ts` is committed to git — any behavioural
 * drift shows up as a spurious diff across hundreds of songs.
 */
import type { AudioField, LyricsField, PDFsField, Song, SongFile, TranslationsField, VideosField } from './types';

/** A child row as it comes out of Postgres, before variant names are resolved. */
type ChildRow = {
  id: string;
  position: number;
  variant_name: string | null;
  en_variant_name: string | null;
};

export type SongRow = {
  id: string;
  name: string;
  tags: string[] | null;
  sources: string[] | null;
  recommended_key: string | null;
  music_author: string | null;
  text_author: string | null;
  lt_description: string | null;
  en_description: string | null;
  hide: boolean;
  lyrics: (ChildRow & {
    lyrics_and_chords: string;
    show_chords: boolean | null;
    notes: string | null;
  })[];
  translations: (ChildRow & {
    title: string | null;
    lyrics: string;
    ai_generated: boolean | null;
    notes: string | null;
  })[];
  audio: (ChildRow & { url: string; album: string | null; artist: string | null })[];
  pdfs: (ChildRow & { url: string })[];
  videos: (ChildRow & { youtube_link: string })[];
};

/**
 * Airtable omits a field entirely when a checkbox is unchecked — it never sends
 * `false`. Emitting `false` here would add a key to every song that does not
 * have chords, so unchecked and unset both collapse to "absent".
 */
function checkbox(value: boolean | null): boolean | undefined {
  return value ? true : undefined;
}

/** Blank text in Airtable is an absent field, not an empty string. */
function text(value: string | null): string | undefined {
  return value ? value : undefined;
}

/** An empty multi-select is absent too, so `Tags: []` never reaches the JSON. */
function list(value: string[] | null): string[] | undefined {
  return value && value.length > 0 ? value : undefined;
}

/**
 * When `Variant Name` is not defined, we default to `${defaultName} ${idx + 1}`
 * When `EN Variant Name` is not defined, we default to `Variant Name`
 *
 * Two details are deliberate:
 *
 *  - The index suffix is only appended when MORE THAN ONE record is missing a
 *    name. A lone unnamed variant is just "Žodžiai", not "Žodžiai 1".
 *  - `idx` is the record's position among ALL of the song's records, not among
 *    the unnamed ones. So a song whose 1st and 3rd variants are unnamed yields
 *    "Žodžiai 1" and "Žodžiai 3". This is what Airtable produced, and the
 *    numbers are user-visible in the app, so the gap is preserved.
 */
function assignVariantNames<T extends ChildRow>(
  records: T[],
  defaultLtName: string,
  defaultEnName: string
): (T & { ltName: string; enName: string })[] {
  const numberOfMissingVariantNames = records.filter((record) => !record.variant_name).length;
  const shouldAppendIndexNumber = numberOfMissingVariantNames > 1;

  return records.map((record, idx) => {
    const alreadyHasName = !!record.variant_name;
    let ltName = alreadyHasName ? record.variant_name! : defaultLtName;
    let enName = alreadyHasName ? (record.en_variant_name ?? record.variant_name!) : defaultEnName;
    if (shouldAppendIndexNumber && !alreadyHasName) {
      ltName += ` ${idx + 1}`;
      enName += ` ${idx + 1}`;
    }
    return { ...record, ltName, enName };
  });
}

/**
 * Throughout lyrics, the pattern [space](Chord) is frequently used
 * Since that's often not enough space, we do a lil magic to fix it up a bit
 * Based on the number of wide characters in the chord, we add that many em spaces (Max 3)
 * E.g., [space](C) => [emspace](C)
 *       [space](C#) => [emspace emspace](C#)
 *       [space](C/D) => [emspace emspace](C/D)
 *       [space](C#maj7) => [emspace emspace emspace](C#maj7)
 *
 * This is idempotent: `\s` matches U+2003 EM SPACE, so re-running it over
 * already-adjusted lyrics is a no-op. That matters because the importer seeds
 * rows straight from the previously generated `songs.ts`.
 */
export function adjustChordWhitespace(lyrics: string): string {
  const emSpace = ' ';
  const wideCharRegex = /[a-zA-Z0-9#]/g; // Only count alphanumeric and "#" as wide characters

  return lyrics.replace(/\[\s*\]\(([^)]+)\)/g, (_match, chord: string) => {
    const wideCount = (chord.match(wideCharRegex) || []).length;
    const emSpaces = emSpace.repeat(Math.min(3, wideCount));
    return `[${emSpaces}](${chord})`;
  });
}

/** Keys an object by record id, preserving the order the rows came in. */
function keyById<T extends { id: string }, V>(records: T[], toValue: (record: T) => V): Record<string, V> {
  return Object.fromEntries(records.map((record) => [record.id, toValue(record)]));
}

function byPosition<T extends ChildRow>(records: T[] | null | undefined): T[] {
  return [...(records ?? [])].sort((a, b) => a.position - b.position);
}

function buildSong(row: SongRow): Song {
  const lyrics = assignVariantNames(byPosition(row.lyrics), 'Žodžiai', 'Lyrics');
  const videos = assignVariantNames(byPosition(row.videos), 'Įrašas', 'Recording');
  const audio = assignVariantNames(byPosition(row.audio), 'Įrašas', 'Recording');
  const pdfs = assignVariantNames(byPosition(row.pdfs), 'Natos', 'Score');
  const translations = assignVariantNames(byPosition(row.translations), 'Vertimas', 'Translation');

  // Key order matters: the app's generated file is committed, and this order
  // matches the declaration order of the app's own Zod schema.
  return {
    id: row.id,
    fields: {
      Name: row.name,
      Lyrics: keyById(
        lyrics,
        (record): LyricsField => ({
          'Variant Name': record.ltName,
          'EN Variant Name': record.enName,
          'Lyrics & Chords': adjustChordWhitespace(record.lyrics_and_chords),
          'Show Chords': checkbox(record.show_chords),
          Notes: text(record.notes),
        })
      ),
      Videos: keyById(
        videos,
        (record): VideosField => ({
          'Variant Name': record.ltName,
          'EN Variant Name': record.enName,
          'YouTube Link': record.youtube_link,
        })
      ),
      Audio: keyById(
        audio,
        (record): AudioField => ({
          'Variant Name': record.ltName,
          'EN Variant Name': record.enName,
          URL: record.url,
          Album: text(record.album),
          Artist: text(record.artist),
        })
      ),
      PDFs: keyById(
        pdfs,
        (record): PDFsField => ({
          'Variant Name': record.ltName,
          'EN Variant Name': record.enName,
          URL: record.url,
        })
      ),
      Translations: keyById(
        translations,
        (record): TranslationsField => ({
          Title: record.title ?? '',
          'Variant Name': record.ltName,
          'EN Variant Name': record.enName,
          Lyrics: record.lyrics,
          'AI Generated': checkbox(record.ai_generated),
          Notes: text(record.notes),
        })
      ),
      Tags: list(row.tags),
      Sources: list(row.sources),
      'Recommended Key': text(row.recommended_key),
      'Music Author': text(row.music_author),
      'Text Author': text(row.text_author),
      'LT Description': text(row.lt_description),
      'EN Description': text(row.en_description),
    },
  };
}

/**
 * Sorting note: Airtable's `sort: [{ field: 'Name', direction: 'asc' }]` is
 * reproduced by JS collation under the `en` locale — verified against all 619
 * songs in the last Airtable-generated `songs.ts`. Lithuanian collation is
 * NOT equivalent (it orders `š` after `s` rather than with it) and would
 * reorder the bundle, which in turn shifts the indices `song-festival.ts`
 * refers to. The app re-sorts its own section headers with `lt` collation at
 * runtime, so this only governs the order inside the generated file.
 */
export function sortSongs(songs: SongFile): SongFile {
  return [...songs].sort((a, b) => a.fields.Name.localeCompare(b.fields.Name, 'en'));
}

/** Hidden songs stay editable in the admin but never reach the app. */
export function buildSongFile(rows: SongRow[]): SongFile {
  return sortSongs(rows.filter((row) => !row.hide).map(buildSong));
}
