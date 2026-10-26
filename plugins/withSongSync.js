const { withDangerousMod } = require('expo/config-plugins');
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILES = ['songs.ts', 'song-festival.ts', 'title-index.json', 'lyric-index.json'];

// One sync per prebuild, however many platforms it generates.
let synced = false;

/**
 * Runs `pnpm update-songs` while `expo prebuild` generates the native projects, so a store build
 * can't ship stale song data. It runs only as a mod (never when `expo start` or `expo export`
 * evaluates the config) and fails the prebuild if the sync fails. `SKIP_SONG_SYNC=1` skips it for
 * throwaway native builds; store builds must not set it.
 */
function withSongSync(config) {
  for (const platform of ['ios', 'android']) {
    config = withDangerousMod(config, [platform, (config) => syncSongs(config)]);
  }
  return config;
}

function syncSongs(config) {
  if (synced) return config;
  synced = true;
  if (process.env.SKIP_SONG_SYNC === '1') {
    console.warn('⚠️  SKIP_SONG_SYNC=1: building with the committed song data (never for a store build).');
    return config;
  }

  const root = config.modRequest.projectRoot;
  const hash = (file) => {
    const filePath = path.join(root, file);
    return fs.existsSync(filePath) ? crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex') : '';
  };
  const before = DATA_FILES.map(hash);

  try {
    execSync('pnpm update-songs', { cwd: root, stdio: 'inherit' });
  } catch {
    throw new Error(
      'Syncing songs from the admin failed (see above; check the network and ADMIN_EXPORT_TOKEN in .env). ' +
        'Store builds need fresh data. For a throwaway native build, rerun with SKIP_SONG_SYNC=1.'
    );
  }

  const changed = DATA_FILES.filter((file, i) => hash(file) !== before[i]);
  if (changed.length > 0) {
    const line = '='.repeat(72);
    console.warn(
      `\n${line}\n  SONG DATA CHANGED: ${changed.join(', ')}\n  Commit it ("data: sync songs from the admin") before shipping this build.\n${line}\n`
    );
  }
  return config;
}

module.exports = withSongSync;
