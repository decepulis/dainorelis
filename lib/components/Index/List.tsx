import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Song, SongFile } from '@/lib/schemas/songs';
import songs from '@/songs';

import { NoFavorites } from './Errors';
import { ListHeader, ListItem, listItemHeight } from './ListItem';

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

type SongItem = { type: 'song'; item: Song; id: string };
type HeaderItem = { type: 'header'; item: string; id: string };
const isHeaderItem = (item: SongItem | HeaderItem): item is HeaderItem => item.type === 'header';

/**
 * unroll section list for FlashList
 */
const unrollSectionList = (sections: { title: string; data: Song[] }[]) => {
  const items: (SongItem | HeaderItem)[] = [];
  sections.forEach((section) => {
    items.push({ type: 'header', item: section.title, id: section.title });
    section.data.forEach((song) => {
      items.push({ type: 'song', item: song, id: song.id });
    });
  });
  if (items.length <= 10) {
    items.filter((item) => !isHeaderItem(item));
  }
  return items;
};

type Props = {
  filter: 'allSongs' | 'favoriteSongs';
};
export default function List({ filter }: Props) {
  const primary = useThemeColor('primary');
  const separator = useThemeColor('separator');
  const { value: favorites } = useStorage('favorites');

  const filteredSongs = useMemo(() => {
    if (filter === 'favoriteSongs') {
      return songs.filter((song) => favorites.includes(song.id));
    }
    return songs;
  }, [filter, favorites]);

  const listItems = useMemo(() => {
    return unrollSectionList(groupSongsByLetter(filteredSongs));
  }, [filteredSongs]);

  // TODO this is INSANELY slow on Android
  return (
    <FlashList
      scrollEnabled={false}
      data={listItems}
      estimatedItemSize={listItemHeight}
      renderItem={({ item, index }) =>
        item.type === 'header' ? (
          <ListHeader title={item.item} separator={separator} />
        ) : (
          <ListItem
            item={item.item}
            isLast={index === listItems.length - 1}
            primary={primary}
            separator={separator}
            favorites={favorites}
          />
        )
      }
      ListEmptyComponent={
        filter === 'favoriteSongs' ? (
          <View style={[styles.listFooter]}>
            <NoFavorites />
          </View>
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
