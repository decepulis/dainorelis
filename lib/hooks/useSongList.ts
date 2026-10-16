import { useTranslation } from 'react-i18next';

import Fuse, { IFuseOptions } from 'fuse.js/basic';

import { Song, SongFile } from '@/lib/schemas/songs';
import lyricIndexJson from '@/lyric-index.json';
import songFestival from '@/song-festival';
import songs from '@/songs';
import titleIndexJson from '@/title-index.json';

import useStorage from './useStorage';

// set up fuse
const fuseSettings: IFuseOptions<Song> = {
  isCaseSensitive: false,
  ignoreDiacritics: true,
  findAllMatches: true,
  includeMatches: true,
  shouldSort: true,
  ignoreLocation: true,
};
const titleIndex = Fuse.parseIndex<Song>(titleIndexJson);
const titleFuse = new Fuse(
  songs,
  {
    ...fuseSettings,
    threshold: 0.25,
  },
  titleIndex
);
const lyricIndex = Fuse.parseIndex<Song>(lyricIndexJson);
const lyricFuse = new Fuse(
  songs,
  {
    ...fuseSettings,
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
 * An output compatible with FlatList and FlashList, with search added on
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
