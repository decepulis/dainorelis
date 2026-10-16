import type { SongFields } from './types';

/**
 * The fields the app bundles. Mirrors `fieldFlags` in the app's
 * `scripts/update-songs.ts`, which drops every other field before it validates,
 * so a problem outside this set can't block an update.
 */
export const BUNDLED_FIELDS: ReadonlySet<keyof SongFields> = new Set<keyof SongFields>([
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

/**
 * Records that are useless without a link, and the key that holds it.
 * `update-songs` leaves out a row whose link is blank, with a warning, rather
 * than failing: the editor lets a row be added before its URL is known.
 */
export const LINK_KEYS = { Audio: 'URL', PDFs: 'URL', Videos: 'YouTube Link' } as const;
