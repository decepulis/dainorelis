import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Fuse, { IFuseOptions } from 'fuse.js/basic';

import { Song, SongFile } from '@/lib/schemas/songs';
import lyricIndexJson from '@/lyric-index.json';
import songFestival from '@/song-festival';
import songs from '@/songs';
import titleIndexJson from '@/title-index.json';

import useStorage from './useStorage';

// set up fuse
const fuseSettings: IFuseOptions<unknown> = {
  isCaseSensitive: false,
  ignoreDiacritics: true,
  findAllMatches: false,
  includeMatches: true,
  shouldSort: true,
};
// @ts-expect-error this is fine, I promise
const titleIndex = Fuse.parseIndex(titleIndexJson);
const titleFuse = new Fuse(
  songs,
  {
    ...fuseSettings,
    threshold: 0.25,
  },
  titleIndex
);
// @ts-expect-error this is fine, I promise
const lyricIndex = Fuse.parseIndex(lyricIndexJson);
const lyricFuse = new Fuse(
  songs,
  {
    ...fuseSettings,
    ignoreLocation: true,
    threshold: 0.1,
  },
  lyricIndex
);

/**
 * an output compatible with SectionList
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
      // assume these are sorted by airtable
      data: songs,
    };
  });
  return sections;
};

/**
 * the song festival list is stored in a format without translations or full songs.
 * here, we unzip that format into a format compatible with sectionlist
 */
export const useSongFestivalList = () => {
  const { t } = useTranslation();
  const songsByPart: { title: string; data: Song[] }[] = useMemo(
    () =>
      songFestival.map((part) => ({
        title: t(part.title),
        data: part.data.map((songIndex) => songs[songIndex]),
      })),
    [t]
  );
  return songsByPart;
};

type RenderItem = { type: 'render'; id: 'search' | 'search-background' };
type SongItem = { type: 'song'; item: Song; id: string };
type HeaderItem = { type: 'header'; item: string; id: string };
export type SongListItem = RenderItem | SongItem | HeaderItem;

/**
 * An output compatible with FlatList and FlashList, with search added on
 */
const unrollSectionList = (sections: { title: string; data: Song[] }[]) => {
  const items: (RenderItem | SongItem | HeaderItem)[] = [];
  sections.forEach((section) => {
    items.push({ type: 'header', item: section.title, id: section.title });
    section.data.forEach((song) => {
      items.push({ type: 'song', item: song, id: song.id });
    });
  });
  if (items.length <= 10) {
    items.filter((item) => item.type !== 'header');
  }
  return items;
};

export const useManualItems = ({ isSongFestivalMode }: { isSongFestivalMode?: boolean }) => {
  const { t } = useTranslation();

  let manualItems: SongListItem[] = [
    { type: 'render', id: 'search' },
    { type: 'render', id: 'search-background' },
  ];
  if (isSongFestivalMode) {
    manualItems.push({
      type: 'header',
      item: t('songFestival'),
      id: 'songFestival',
    });
  }
  return manualItems;
};

// TODO blocker (maybe?) add filter-by-mp3/pdf/chords
type Options = {
  isFavorites: boolean;
  isSongFestivalMode: boolean;
  searchText: string;
};
export default function useSongList({ isFavorites, isSongFestivalMode, searchText }: Options) {
  const { value: favorites } = useStorage('favorites');

  // make those lists
  const songsBySongFestivalSection = useSongFestivalList();
  const songsByLetter = useMemo(() => groupSongsByLetter(songs), []);
  const songList = useMemo(
    () => (isSongFestivalMode ? songsBySongFestivalSection : songsByLetter),
    [isSongFestivalMode, songsByLetter, songsBySongFestivalSection]
  );

  // search results
  const searchResults: string[] | null = useMemo(() => {
    if (searchText.length > 0) {
      const titleSearchResults = titleFuse.search<Song>(searchText, { limit: 20 });
      const lyricSearchResults = lyricFuse.search<Song>(searchText, { limit: 20 });
      const searchResults = [...titleSearchResults, ...lyricSearchResults].map((result) => result.item.id);
      const exclusiveSearchResults = new Set(searchResults);
      return Array.from(exclusiveSearchResults);
    }
    return null;
  }, [searchText]);

  const filteredSongList = useMemo(
    () =>
      songList
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
        .filter((section) => section.data.length > 0),
    [favorites, isFavorites, searchResults, songList]
  );

  const manualItems = useManualItems({ isSongFestivalMode });
  const unrolledSongList = useMemo(() => {
    const unrolledSongList = unrollSectionList(filteredSongList);
    return [...manualItems, ...unrolledSongList];
  }, [filteredSongList, manualItems]);
  return unrolledSongList;
}
