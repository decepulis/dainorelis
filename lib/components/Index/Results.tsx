import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import Fuse, { FuseResult, IFuseOptions } from 'fuse.js/basic';

import useStorage from '@/lib/hooks/useStorage';
import lyricIndexJson from '@/lyric-index.json';
import songFestivalIndex from '@/song-festival';
import songs from '@/songs';
import titleIndexJson from '@/title-index.json';

import { Song } from '../../schemas/songs';
import { NoFavorites, NoHits } from './Errors';
import { ListItem } from './ListItem';

const songFestivalIndices = songFestivalIndex.flatMap((part) => part.data);
const songFestivalIds = songFestivalIndices.map((songIndex) => songs[songIndex].id);

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

type Props = {
  searchText: string;
  filter: 'allSongs' | 'favoriteSongs';
  isSongFestivalMode: boolean;
};
export default function Results({ searchText, filter, isSongFestivalMode }: Props) {
  const { value: favorites } = useStorage('favorites');

  const searchResults: FuseResult<Song>[] = useMemo(() => {
    if (searchText.length > 0) {
      const titleSearchResults = titleFuse.search<Song>(searchText, { limit: 20 });
      const lyricSearchResults = lyricFuse.search<Song>(searchText, { limit: 20 });
      const lyricResultsThatAreNotTitleResults = lyricSearchResults.filter(
        (result) => !titleSearchResults.some((titleResult) => titleResult.item.id === result.item.id)
      );
      const allResults = [...titleSearchResults, ...lyricResultsThatAreNotTitleResults];
      const filteredResults = allResults.filter((result) => {
        let favoriteFilter = true;
        if (filter === 'favoriteSongs') {
          favoriteFilter = favorites.includes(result.item.id);
        }
        let songFestivalFilter = true;
        if (isSongFestivalMode) {
          songFestivalFilter = songFestivalIds.includes(result.item.id);
        }
        return favoriteFilter && songFestivalFilter;
      });
      return filteredResults;
    } else {
      return [];
    }
  }, [favorites, filter, isSongFestivalMode, searchText]);
  return (
    <FlatList
      scrollEnabled={false}
      data={searchResults}
      keyExtractor={(item) => item.item.id}
      renderItem={({ item, index }) => {
        const isLast = index === searchResults.length - 1;
        // todo show snippet from text if there's a match in the lyrics
        return <ListItem item={item.item} isLast={isLast} />;
      }}
      ListFooterComponent={
        searchResults.length === 0 ? (
          <View style={[styles.listFooter]}>{filter === 'favoriteSongs' ? <NoFavorites isSearch /> : <NoHits />}</View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listFooter: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
});
