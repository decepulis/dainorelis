/**
 * One-time migration from Airtable into Supabase.
 *
 *   cd admin
 *   AIRTABLE_TOKEN=… pnpm import:airtable          # or put it in admin/.env
 *   pnpm import:airtable -- --dry-run              # inspect without writing
 *
 * Run this once, from a machine that has the Airtable token, before the app's
 * `update-songs` is pointed at the admin API.
 *
 * Everything is stored raw. Blank variant names stay blank and chord
 * whitespace stays un-widened, because those are export-time transforms —
 * baking them in here would make the stored data differ from what Airtable
 * actually held. Unlike the app's old fetch, this does NOT filter on
 * `NOT(Hide)`: hidden songs are real data and are carried over with the flag
 * set, so nothing is lost in the move.
 */
import Airtable, { type FieldSet, type Records } from 'airtable';
import dotenv from 'dotenv';
import path from 'node:path';

import { type ChildInsert, type ImportPayload, bool, emptyPayload, list, str, summarize } from './rows';
import { writePayload } from './write-payload';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const AIRTABLE_BASE = 'appW24b09D9VHYHfi';

const dryRun = process.argv.includes('--dry-run');

if (!process.env.AIRTABLE_TOKEN) {
  console.error('❌ AIRTABLE_TOKEN is not set.');
  process.exit(1);
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(AIRTABLE_BASE);

function fetchTable(table: string, fields: string[]) {
  return base(table).select({ view: 'Grid view', fields }).all();
}

/** Airtable link fields hold arrays of record ids. */
function linkedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string');
}

type ChildMapper = (id: string, fields: FieldSet, songId: string, position: number) => ChildInsert;

/**
 * Walks a song's link field in order, so `position` matches the order Airtable
 * showed — which is what drives both the JSON key order and the number in
 * auto-generated variant names.
 */
function collectChildren(
  songs: Records<FieldSet>,
  linkField: string,
  records: Records<FieldSet>,
  map: ChildMapper,
  warnings: string[]
): ChildInsert[] {
  const byId = new Map(records.map((record) => [record.id, record.fields]));
  const claimed = new Map<string, string>();
  const rows: ChildInsert[] = [];

  for (const song of songs) {
    linkedIds(song.fields[linkField]).forEach((recordId, position) => {
      const fields = byId.get(recordId);
      if (!fields) {
        warnings.push(`${linkField}: ${recordId} is linked from "${song.fields.Name}" but not in the table.`);
        return;
      }

      const existingParent = claimed.get(recordId);
      if (existingParent) {
        warnings.push(
          `${linkField}: ${recordId} is linked from both "${existingParent}" and ` +
            `"${song.fields.Name}". Keeping the first; re-link the second by hand.`
        );
        return;
      }

      claimed.set(recordId, String(song.fields.Name));
      rows.push(map(recordId, fields, song.id, position));
    });
  }

  for (const recordId of byId.keys()) {
    if (!claimed.has(recordId)) {
      warnings.push(`${linkField}: ${recordId} is not linked to any song and was skipped.`);
    }
  }

  return rows;
}

async function main() {
  console.log('🎵 Reading Airtable…');

  const [songs, lyrics, videos, audio, pdfs, translations] = await Promise.all([
    base('Songs')
      .select({
        view: 'Grid view',
        fields: [
          'Name',
          'Lyrics',
          'Videos',
          'Audio',
          'PDFs',
          'Translations',
          'Tags',
          'Sources',
          'Recommended Key',
          'Music Author',
          'Text Author',
          'LT Description',
          'EN Description',
          'Hide',
        ],
        sort: [{ field: 'Name', direction: 'asc' }],
      })
      .all(),
    fetchTable('Lyrics & Chords', ['Variant Name', 'EN Variant Name', 'Lyrics & Chords', 'Show Chords', 'Notes']),
    fetchTable('Videos', ['Variant Name', 'EN Variant Name', 'YouTube Link']),
    fetchTable('Audio', ['Variant Name', 'EN Variant Name', 'URL', 'Album', 'Artist']),
    fetchTable('PDFs', ['Variant Name', 'EN Variant Name', 'URL']),
    fetchTable('Translations', ['Title', 'Variant Name', 'EN Variant Name', 'Lyrics', 'AI Generated', 'Notes']),
  ]);

  const warnings: string[] = [];
  const payload: ImportPayload = emptyPayload();

  for (const song of songs) {
    payload.songs.push({
      id: song.id,
      name: String(song.fields.Name ?? '').trim() || 'Be pavadinimo',
      tags: list(song.fields.Tags),
      sources: list(song.fields.Sources),
      recommended_key: str(song.fields['Recommended Key']),
      music_author: str(song.fields['Music Author']),
      text_author: str(song.fields['Text Author']),
      lt_description: str(song.fields['LT Description']),
      en_description: str(song.fields['EN Description']),
      hide: song.fields.Hide === true,
    });
  }

  const variant = (fields: FieldSet) => ({
    variant_name: str(fields['Variant Name']),
    en_variant_name: str(fields['EN Variant Name']),
  });

  payload.lyrics = collectChildren(
    songs,
    'Lyrics',
    lyrics,
    (id, fields, song_id, position) => ({
      id,
      song_id,
      position,
      ...variant(fields),
      lyrics_and_chords: typeof fields['Lyrics & Chords'] === 'string' ? fields['Lyrics & Chords'] : '',
      show_chords: bool(fields['Show Chords']),
      notes: str(fields.Notes),
    }),
    warnings
  );

  payload.translations = collectChildren(
    songs,
    'Translations',
    translations,
    (id, fields, song_id, position) => ({
      id,
      song_id,
      position,
      title: str(fields.Title),
      ...variant(fields),
      lyrics: typeof fields.Lyrics === 'string' ? fields.Lyrics : '',
      ai_generated: bool(fields['AI Generated']),
      notes: str(fields.Notes),
    }),
    warnings
  );

  payload.audio = collectChildren(
    songs,
    'Audio',
    audio,
    (id, fields, song_id, position) => ({
      id,
      song_id,
      position,
      ...variant(fields),
      url: str(fields.URL) ?? '',
      album: str(fields.Album),
      artist: str(fields.Artist),
    }),
    warnings
  );

  payload.pdfs = collectChildren(
    songs,
    'PDFs',
    pdfs,
    (id, fields, song_id, position) => ({
      id,
      song_id,
      position,
      ...variant(fields),
      url: str(fields.URL) ?? '',
    }),
    warnings
  );

  payload.videos = collectChildren(
    songs,
    'Videos',
    videos,
    (id, fields, song_id, position) => ({
      id,
      song_id,
      position,
      ...variant(fields),
      youtube_link: str(fields['YouTube Link']) ?? '',
    }),
    warnings
  );

  console.log(`   ${summarize(payload)}`);
  console.log(`   ${payload.songs.filter((song) => song.hide).length} of those songs are hidden.`);

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} thing(s) worth a look:`);
    for (const warning of warnings) console.log(`   - ${warning}`);
    console.log('');
  }

  if (dryRun) {
    console.log('🧪 --dry-run: nothing was written.');
    return;
  }

  console.log('✍️  Writing to Supabase (replacing existing rows)…');
  await writePayload(payload, { replace: true });
  console.log('✅ Migration complete. Check /export in the admin app, then run update-songs in the app repo.');
}

main().catch((error) => {
  console.error('❌ Import failed.', error);
  process.exit(1);
});
