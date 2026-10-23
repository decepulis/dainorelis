import { clampPlaylistName } from '@/lib/constants/playlistName';
import songs from '@/songs';

/**
 * Shared playlists travel as a web link, so a phone without the app lands on the website, which links to the
 * stores: https://www.dainorelisapp.com/p?n=<name>&s=<song ids>. The app opens the same link (universal link /
 * Android App Link, or dainorelis://p?… for testing) on app/p.tsx.
 *
 * To keep the QR code scannable the ids drop their shared "rec" prefix (every song id is "rec" + 14 characters,
 * see admin/supabase/migrations) and are joined with commas: a 40-song playlist is a ~660-character link, a
 * version 18 QR code (89×89 modules) at the lowest error correction, which phones read off a screen easily.
 */
const playlistLinkBase = 'https://www.dainorelisapp.com/p';

const idPrefix = 'rec';
const songIds = new Set(songs.map((song) => song.id));
// a link from elsewhere can say anything: no playlist needs more songs than the songbook has
const maxTokens = 1000;

export function playlistUrl(name: string, ids: string[]) {
  const compact = ids.map((id) => (id.startsWith(idPrefix) ? id.slice(idPrefix.length) : id));
  return `${playlistLinkBase}?n=${encodeURIComponent(name)}&s=${compact.join(',')}`;
}

/** the playlist a link's `n` and `s` params describe, split into songs this version of the app has and doesn't */
export function parsePlaylistParams(params: { n?: string | string[]; s?: string | string[] }) {
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';
  const name = clampPlaylistName(first(params.n).trim()).trim();
  const tokens = first(params.s)
    .split(',', maxTokens)
    .map((token) => token.trim())
    .filter(Boolean);
  const ids = [...new Set(tokens.map((token) => (songIds.has(token) ? token : `${idPrefix}${token}`)))];
  return {
    name,
    songIds: ids.filter((id) => songIds.has(id)),
    missingCount: ids.filter((id) => !songIds.has(id)).length,
  };
}
