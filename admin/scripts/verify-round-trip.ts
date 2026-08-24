/**
 * Proves the migration is lossless, without needing a database.
 *
 *   pnpm --filter @dainorelis/admin verify
 *
 * Feeds the app's committed `songs.ts` through the importer's row mapping and
 * back out through the export transform, then compares the result to the
 * original file. A clean run means the schema, the importer and the export all
 * agree with what Airtable was producing — including JSON key order, the
 * absent-vs-empty rules, variant numbering and chord whitespace.
 */
import path from 'node:path';

import { buildSongFile } from '../src/lib/song-file/build';
import type { SongFile } from '../src/lib/song-file/types';
import { payloadFromSongFile, readSongFile } from './from-song-file';
import { payloadToSongRows } from './payload-to-rows';

/** Mirrors `fieldFlags` in the app's scripts/update-songs.ts. */
const BUNDLED_FIELDS = new Set([
  'Name',
  'Lyrics',
  'Audio',
  'PDFs',
  'Translations',
  'Music Author',
  'Text Author',
  'LT Description',
  'EN Description',
]);

function applyFieldFlags(songs: SongFile) {
  return songs.map((song) => ({
    id: song.id,
    fields: Object.fromEntries(Object.entries(song.fields).filter(([key]) => BUNDLED_FIELDS.has(key))),
  }));
}

const songFilePath = path.join(__dirname, '..', '..', 'songs.ts');
const original = readSongFile(songFilePath);

const roundTripped = buildSongFile(payloadToSongRows(payloadFromSongFile(original)));

const before = JSON.stringify(applyFieldFlags(original), null, 2);
const after = JSON.stringify(applyFieldFlags(roundTripped), null, 2);

if (before === after) {
  console.log(`✅ Round trip is byte-identical across ${original.length} songs.`);
  process.exit(0);
}

console.error('❌ Round trip differs from songs.ts.');

const beforeLines = before.split('\n');
const afterLines = after.split('\n');
let shown = 0;

for (let index = 0; index < Math.max(beforeLines.length, afterLines.length) && shown < 20; index += 1) {
  if (beforeLines[index] !== afterLines[index]) {
    console.error(`\n  line ${index + 1}`);
    console.error(`    songs.ts: ${JSON.stringify(beforeLines[index])}`);
    console.error(`    export:   ${JSON.stringify(afterLines[index])}`);
    shown += 1;
  }
}

if (beforeLines.length !== afterLines.length) {
  console.error(`\n  line count: songs.ts ${beforeLines.length}, export ${afterLines.length}`);
}

process.exit(1);
