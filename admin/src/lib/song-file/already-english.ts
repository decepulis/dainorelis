/**
 * Songs whose titles start with these (the US and Canadian anthems) are
 * already in English, so a missing translation is expected rather than an
 * oversight.
 *
 * Shared by /export's warnings, `generate-metadata`, and the app repo's
 * `scripts/update-songs.ts`, which imports this file directly. Keep it free of
 * imports so that script can load it without the admin app's path aliases.
 */
const ALREADY_ENGLISH_PREFIXES = ['JAV ', 'Kanados '];

export function isAlreadyEnglish(title: string): boolean {
  return ALREADY_ENGLISH_PREFIXES.some((prefix) => title.startsWith(prefix));
}
