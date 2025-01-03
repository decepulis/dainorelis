import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import IndexHeader, { useIndexHeaderEndHeight, useIndexHeaderStartHeight } from '@/components/IndexHeader';
import IndexSearch, { indexSearchHeight } from '@/components/IndexSearch';
import ThemedText from '@/components/ThemedText';
import useStorage from '@/hooks/useStorage';
import { Song, SongFile } from '@/schemas/songs';
import songs from '@/songs';
import removeAccents from '@/utils/removeAccents';

const groupSongsByLetter = (songs: SongFile) => {
  const songsByLetter: { [letter: string]: Song[] } = {};

  songs.forEach((song) => {
    const firstLetter = song.fields.Song?.charAt(0).toUpperCase() || '#';
    const letterSongs = songsByLetter[firstLetter] || [];
    const newLetterSongs = [...letterSongs, song];
    songsByLetter[firstLetter] = newLetterSongs;
  });

  const sections = Object.entries(songsByLetter).map(([letter, songs]) => ({
    title: letter,
    data: songs,
  }));
  sections.sort((a, b) => a.title.localeCompare(b.title));
  return sections;
};

const _ListItem = ({ item, isFavorite }: { item: SongFile[number]; isFavorite: boolean }) => (
  <Link href={`/dainos/${item.id}`} asChild>
    <Pressable style={styles.itemContainer}>
      <ThemedText style={styles.item}>{item.fields.Song}</ThemedText>
      {isFavorite && <Image source="icon_fav_white" style={styles.itemFavorite} />}
    </Pressable>
  </Link>
);
const ListItem = memo(_ListItem);

const _SectionHeader = ({ title }: { title: string }) => {
  return <ThemedText style={styles.header}>{title}</ThemedText>;
};
const SectionHeader = memo(_SectionHeader);

export default function Index() {
  const inset = useSafeAreaInsets();
  const listRef = useAnimatedRef<SectionList>();
  const headerStartHeight = useIndexHeaderStartHeight();
  const headerEndHeight = useIndexHeaderEndHeight();

  const { value: favorites } = useStorage('favorites');
  const [filter, setFilter] = useState<'Visos' | 'Mano'>('Visos');
  const [searchText, setSearchText] = useState('');

  // todo: empty state when no filters / no search
  // todo: debounce this
  // apply filters and search to song list
  const { filteredSections, showHeaders } = useMemo(() => {
    let filteredSongs = songs;
    let showHeaders = true;
    // first, filter by the filters
    if (filter === 'Mano') {
      filteredSongs = songs.filter((song) => favorites.includes(song.id));
    }

    // then, filter by the search query
    if (searchText) {
      filteredSongs = filteredSongs.filter((song) =>
        removeAccents(song.fields.Song).toLowerCase().includes(removeAccents(searchText).toLowerCase())
      );
    }

    if (filteredSongs.length < 10) {
      showHeaders = false;
    }

    // finally, sort into sections
    const filteredSections = groupSongsByLetter(filteredSongs);

    return { filteredSections, showHeaders };
  }, [favorites, filter, searchText]);

  // when searchResults changes, scroll SectionList to the top
  useEffect(() => {
    if (filteredSections.length === 0) return;
    if (searchText.length === 0) return;

    listRef.current?.scrollToLocation({
      sectionIndex: 0,
      itemIndex: 0,
      viewOffset: -1 * (indexSearchHeight + headerEndHeight - Constants.statusBarHeight - 30),
    });
  }, [filteredSections, headerEndHeight, listRef, searchText.length]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dainos',
          header: () => (
            <IndexHeader scrollRef={listRef}>
              <IndexSearch
                filter={filter}
                setFilter={setFilter}
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </IndexHeader>
          ),
          headerTransparent: true, // I know it's not transparent, but this is what positions the header correctly
        }}
      />
      <View style={styles.container}>
        <SectionList
          ref={listRef}
          style={{ paddingTop: headerStartHeight + indexSearchHeight + (showHeaders ? 0 : 20) }}
          contentInsetAdjustmentBehavior="never"
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListItem item={item} isFavorite={favorites.includes(item.id)} />}
          renderSectionHeader={({ section }) => (showHeaders ? <SectionHeader title={section.title} /> : null)}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={<View style={{ height: inset.bottom }} />}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  item: {
    fontSize: 21,
  },
  itemFavorite: {
    width: 20,
    height: 20,
    position: 'relative',
    top: -4,
  },
  header: {
    fontSize: 21,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    fontFamily: 'KlavikaBold',
    fontWeight: 'bold',
  },
});
