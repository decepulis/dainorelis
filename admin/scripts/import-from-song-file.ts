/**
 * Seeds the database from the app's generated `songs.ts`.
 *
 *   pnpm --filter @dainorelis/admin import:song-file [-- --file ../songs.ts] [--force] [--yes]
 *
 * Replaces every row, so it asks for confirmation and refuses a non-empty
 * database unless --force is passed (see write-payload.ts).
 *
 * Intended for bootstrapping a dev database: it cannot carry hidden songs,
 * tags or sources, so never use it to restore production.
 */
import dotenv from 'dotenv';
import path from 'node:path';

import { payloadFromSongFile, readSongFile } from './from-song-file';
import { summarize } from './rows';
import { writePayload } from './write-payload';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const fileArg = process.argv.indexOf('--file');
  const filePath = fileArg !== -1 ? process.argv[fileArg + 1] : path.join(__dirname, '..', '..', 'songs.ts');

  console.log(`📖 Reading ${filePath}`);
  const payload = payloadFromSongFile(readSongFile(filePath));
  console.log(`   ${summarize(payload)}`);

  await writePayload(payload);
  console.log('✅ Done.');
  console.log('⚠️  Hide, Tags, Sources and Recommended Key are absent from songs.ts and were not restored.');
}

main().catch((error) => {
  console.error('❌ Import failed.', error);
  process.exit(1);
});
