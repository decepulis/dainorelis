/**
 * Serves the export API from the committed `songs.ts` instead of a database.
 *
 *   pnpm --filter @dainorelis/admin export:fixture
 *
 * Lets the app's `update-songs` be exercised end to end with no Supabase
 * project and no network — useful in CI, and for confirming a change to the
 * transform does not disturb the generated file.
 */
import http from 'node:http';
import path from 'node:path';

import { buildSongFile } from '../src/lib/song-file/build';
import { payloadFromSongFile, readSongFile } from './from-song-file';
import { payloadToSongRows } from './payload-to-rows';

const PORT = Number(process.env.PORT ?? 4100);
const TOKEN = process.env.EXPORT_TOKEN ?? 'fixture-token';

const songFilePath = process.env.SONG_FILE ?? path.join(__dirname, '..', '..', 'songs.ts');
const songs = buildSongFile(payloadToSongRows(payloadFromSongFile(readSongFile(songFilePath))));
const body = JSON.stringify(songs);

const server = http.createServer((request, response) => {
  const provided = (request.headers.authorization ?? '').replace(/^Bearer\s+/i, '');

  if (provided !== TOKEN) {
    response.writeHead(401, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(body);
});

server.listen(PORT, () => {
  console.log(`🎵 Fixture export for ${songs.length} songs on http://localhost:${PORT} (token: ${TOKEN})`);
});
