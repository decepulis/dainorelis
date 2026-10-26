/** the longest playlist name, in characters: typed, renamed, or from a shared link */
export const playlistNameMaxLength = 60;

/** cut to `maxLength` characters (code points, so an emoji isn't split in half) */
export const clampPlaylistName = (name: string, maxLength = playlistNameMaxLength) =>
  name.length <= maxLength ? name : Array.from(name).slice(0, maxLength).join('');
