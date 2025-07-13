import fs from 'fs';
import Fuse from 'fuse.js';
import path from 'path';
import removeMd from 'remove-markdown';

import songs from '../songs';

const outputDir = path.join(__dirname, '..');
const titleIndexFilePath = path.join(outputDir, 'title-index.json');
const lyricIndexFilePath = path.join(outputDir, 'lyric-index.json');

console.log('🔍 Generating search indices...');

try {
  // Remove markdown from lyrics for better search results
  const songsWithoutMarkdown = songs.map((song) => ({
    ...song,
    fields: {
      ...song.fields,
      Lyrics: Object.fromEntries(
        Object.entries(song.fields.Lyrics).map(([id, variant]) => [
          id,
          {
            ...variant,
            'Lyrics & Chords': removeMd(variant['Lyrics & Chords']),
          },
        ])
      ),
    },
  }));

  // Create search indices
  const titleIndex = Fuse.createIndex([{ name: 'name', getFn: (s) => s.fields.Name }], songs);
  const lyricIndex = Fuse.createIndex(
    [{ name: 'lyrics', getFn: (s) => Object.values(s.fields.Lyrics).map((l) => l['Lyrics & Chords']) }],
    songsWithoutMarkdown
  );

  // Write indices to files
  fs.writeFileSync(titleIndexFilePath, JSON.stringify(titleIndex));
  fs.writeFileSync(lyricIndexFilePath, JSON.stringify(lyricIndex));

  console.log('✅ Search indices created and saved to title-index.json and lyric-index.json');
} catch (e) {
  console.error('❌ Error generating search indices:', e);
}
