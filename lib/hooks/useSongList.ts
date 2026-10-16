import { useTranslation } from 'react-i18next';

import Fuse, { IFuseOptions } from 'fuse.js/basic';

import { Song, SongFile } from '@/lib/schemas/songs';
import songFestival from '@/song-festival';
import songs from '@/songs';

import useStorage from './useStorage';

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

/**
 * the song festival list is stored in a format without translations or full songs.
 * here, we unzip that format into a format compatible with sectionlist
 */
export const useSongFestivalList = () => {
  const { t } = useTranslation();
  const songsByPart: { title: string; data: Song[] }[] = songFestival.map((part) => ({
    title: t(part.title),
    data: part.data.map((songIndex) => songs[songIndex]),
  }));
  return songsByPart;
};

type SongItem = { type: 'song'; item: Song; id: string };
type HeaderItem = { type: 'header'; item: string; id: string };
export type SongListItem = SongItem | HeaderItem;

/**
 * Flattens sections into the header and song rows the home screen's FlatList renders
 */
const unrollSectionList = (sections: { title: string; data: Song[] }[]) => {
  const items: (SongItem | HeaderItem)[] = [];
  sections.forEach((section) => {
    items.push({ type: 'header', item: section.title, id: section.title });
    section.data.forEach((song) => {
      items.push({ type: 'song', item: song, id: song.id });
    });
  });
  return items;
};

export const useManualItems = ({ isSongFestivalMode }: { isSongFestivalMode?: boolean }) => {
  const { t } = useTranslation();

  let manualItems: SongListItem[] = [];
  if (isSongFestivalMode) {
    manualItems.push({
      type: 'header',
      item: t('songFestival'),
      id: 'songFestival',
    });
  }
  return manualItems;
};

// TODO blocker? add filter-by-mp3/pdf/chords
type Options = {
  isFavorites: boolean;
  isSongFestivalMode: boolean;
  searchText: string;
};
export default function useSongList({ isFavorites, isSongFestivalMode, searchText }: Options) {
  const { value: favorites } = useStorage('favorites');

  // make those lists
  const songsBySongFestivalSection = useSongFestivalList();
  const songList = isSongFestivalMode ? songsBySongFestivalSection : songsByLetter;

  // search results
  let searchResults: string[] | null = null;
  if (searchText.length > 0) {
    const { titleFuse, lyricFuse } = getFuses();
    const titleSearchResults = titleFuse.search(searchText, { limit: 20 });
    const lyricSearchResults = lyricFuse.search(searchText, { limit: 20 });
    const allSearchResults = [...titleSearchResults, ...lyricSearchResults].map((result) => result.item.id);
    searchResults = Array.from(new Set(allSearchResults));
  }

  const filteredSongList = songList
    .map((section) => ({
      ...section,
      data: section.data.filter((song) => {
        let keepSong = true;
        if (searchResults && !searchResults.includes(song.id)) {
          keepSong = false;
        }
        if (isFavorites && !favorites.includes(song.id)) {
          keepSong = false;
        }
        return keepSong;
      }),
    }))
    .filter((section) => section.data.length > 0);

  const manualItems = useManualItems({ isSongFestivalMode });
  const unrolledSongList = [...manualItems, ...unrollSectionList(filteredSongList)];
  return unrolledSongList;
}
