import Fuse, { IFuseOptions } from 'fuse.js/basic';

import { Song, SongFile } from '@/lib/schemas/songs';
import songs from '@/songs';

import { type Playlist } from './usePlaylists';

// set up fuse
const fuseSettings: IFuseOptions<Song> = {
  isCaseSensitive: false,
  ignoreDiacritics: true,
  findAllMatches: true,
  shouldSort: true,
  ignoreLocation: true,
};

// The indices (lyric-index.json is ~370 KB) are only required, parsed and turned into Fuse
// instances on the first search, not while the home screen is starting up: Metro doesn't evaluate a
// module until its first require().
let fuses: { titleFuse: Fuse<Song>; lyricFuse: Fuse<Song> } | null = null;
const getFuses = () => {
  if (!fuses) {
    const titleIndex = Fuse.parseIndex<Song>(require('@/title-index.json'));
    const lyricIndex = Fuse.parseIndex<Song>(require('@/lyric-index.json'));
    fuses = {
      titleFuse: new Fuse(songs, { ...fuseSettings, threshold: 0.25 }, titleIndex),
      lyricFuse: new Fuse(songs, { ...fuseSettings, threshold: 0.1 }, lyricIndex),
    };
  }
  return fuses;
};

/**
 * songs grouped into sections by first letter
 */
const groupSongsByLetter = (songs: SongFile) => {
  const songsByLetter = new Map<string, Song[]>();

  songs.forEach((song) => {
    const firstLetter = song.fields.Name.charAt(0).toUpperCase() || '#';
    const letterSongs = songsByLetter.get(firstLetter) || [];
    const newLetterSongs = [...letterSongs, song];
    songsByLetter.set(firstLetter, newLetterSongs);
  });

  const sections = Array.from(songsByLetter.entries()).map(([letter, songs]) => {
    return {
      title: letter,
      data: songs,
    };
  });
  sections.sort((a, b) => a.title.localeCompare(b.title, 'lt', { sensitivity: 'variant' }));
  return sections;
};
// songs is static, so this only needs computing once
const songsByLetter = groupSongsByLetter(songs);

type SongItem = { type: 'song'; item: Song; id: string };
type HeaderItem = { type: 'header'; item: string; id: string };
export type SongListItem = SongItem | HeaderItem;

/**
 * Flattens sections into the header and song rows the home screen's FlatList renders. Untitled
 * sections (a playlist without parts) get no header row. Rows are keyed by song id, so a song
 * listed twice is shown once, where it first appears.
 */
const unrollSectionList = (sections: { title?: string; data: Song[] }[]) => {
  const items: (SongItem | HeaderItem)[] = [];
  const seen = new Set<string>();
  sections.forEach((section, index) => {
    const songs = section.data.filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
    if (songs.length === 0) return;
    if (section.title) items.push({ type: 'header', item: section.title, id: `${index}:${section.title}` });
    songs.forEach((song) => {
      items.push({ type: 'song', item: song, id: song.id });
    });
  });
  return items;
};

const songsById = new Map(songs.map((song) => [song.id, song]));

// TODO blocker? add filter-by-mp3/pdf/chords
type Options = {
  /** null for all songs, alphabetically by letter; a playlist keeps its own order */
  playlist: Playlist | null;
  searchText: string;
};
export default function useSongList({ playlist, searchText }: Options) {
  // search results
  let searchResults: Set<string> | null = null;
  if (searchText.length > 0) {
    const { titleFuse, lyricFuse } = getFuses();
    const titleSearchResults = titleFuse.search(searchText, { limit: 20 });
    const lyricSearchResults = lyricFuse.search(searchText, { limit: 20 });
    searchResults = new Set([...titleSearchResults, ...lyricSearchResults].map((result) => result.item.id));
  }

  const sections: { title?: string; data: Song[] }[] = playlist
    ? (playlist.sections ?? [{ songIds: playlist.songIds }]).map((section) => ({
        title: 'title' in section ? section.title : undefined,
        // a song removed from the songbook since it was added is skipped
        data: section.songIds.map((id) => songsById.get(id)).filter((song): song is Song => !!song),
      }))
    : songsByLetter;

  const filteredSections = sections
    .map((section) => ({
      ...section,
      data: searchResults ? section.data.filter((song) => searchResults.has(song.id)) : section.data,
    }))
    .filter((section) => section.data.length > 0);

  return unrollSectionList(filteredSections);
}
