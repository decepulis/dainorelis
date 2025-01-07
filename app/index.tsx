import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import IndexHeader, { useIndexHeaderEndHeight, useIndexHeaderStartHeight } from '@/lib/components/IndexHeader';
import IndexSearch, { indexSearchHeight } from '@/lib/components/IndexSearch';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import { fonts } from '@/lib/constants/themes';
import useStorage from '@/lib/hooks/useStorage';
import { Song, SongFile } from '@/lib/schemas/songs';
import removeAccents from '@/lib/utils/removeAccents';
import songs from '@/songs';

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

const itemPaddingVertical = 20;
const itemFontSize = 21;

const _ListItem = ({ item, isFavorite }: { item: SongFile[number]; isFavorite: boolean }) => {
  const colorScheme = useColorScheme();

  return (
    <Link href={`/dainos/${item.id}`} asChild>
      <Pressable style={styles.itemContainer}>
        <View style={styles.itemInnerContainer}>
          <ThemedText style={styles.item}>{item.fields.Song}</ThemedText>
          {isFavorite && (
            <Image source={colorScheme === 'dark' ? 'fav_white' : 'fav_black'} style={styles.itemFavorite} />
          )}
        </View>
      </Pressable>
    </Link>
  );
};
const ListItem = memo(_ListItem);

const _SectionHeader = ({ title }: { title: string }) => {
  return (
    <View style={styles.headerContainer}>
      <ThemedText style={styles.header}>{title}</ThemedText>
    </View>
  );
};
const SectionHeader = memo(_SectionHeader);

const _NoHits = () => {
  const { t } = useTranslation();
  return <ThemedText>{t('noHits')}</ThemedText>;
};
const NoHits = memo(_NoHits);

const _NoFavorites = () => {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  return (
    <ThemedText>
      {t('noFavorites1')}
      <Image source={colorScheme === 'dark' ? 'fav_white' : 'fav_black'} style={styles.noResultsFavorite} />
      {t('noFavorites2')}
    </ThemedText>
  );
};
const NoFavorites = memo(_NoFavorites);

export default function Index() {
  const inset = useSafeAreaInsets();
  const listRef = useAnimatedRef<SectionList>();
  const headerStartHeight = useIndexHeaderStartHeight();
  const headerEndHeight = useIndexHeaderEndHeight();

  const { value: favorites } = useStorage('favorites');
  const [filter, setFilter] = useState<'Visos' | 'Mano'>('Visos');
  const [searchText, setSearchText] = useState('');

  // TODO: debounce this
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
        removeAccents(song.fields.Song.toLowerCase()).includes(removeAccents(searchText.toLowerCase()))
      );
    }

    if (filteredSongs.length < 10) {
      showHeaders = false;
    }

    // finally, sort into sections
    const filteredSections = groupSongsByLetter(filteredSongs);

    return { filteredSections, showHeaders };
  }, [favorites, filter, searchText]);

  // for a few reasons, it's useful to know how many items we have
  const itemCount = useMemo(
    () => filteredSections.reduce((acc, section) => acc + section.data.length, 0),
    [filteredSections]
  );
  const resultStatus: 'results' | 'no-hits' | 'no-favorites' = useMemo(() => {
    if (searchText.length > 0 && itemCount === 0) {
      return 'no-hits';
    }
    if (filter === 'Mano' && itemCount === 0) {
      return 'no-favorites';
    }
    return 'results';
  }, [filter, itemCount, searchText]);

  // no matter how many search results are available,
  // we always want to be able to hide the header by scrolling
  // so we add space below the last item to account for missing items
  const { height } = useWindowDimensions();
  const noHeaderPadding = useMemo(() => (showHeaders ? 0 : 20), [showHeaders]);
  const whiteSpaceToAdd = useMemo(() => {
    const itemHeight = itemPaddingVertical * 2 + itemFontSize;
    const itemsHeight = itemCount * itemHeight;
    const maxWhiteSpaceToAdd = height - headerEndHeight - indexSearchHeight;
    return Math.max(maxWhiteSpaceToAdd - itemsHeight - noHeaderPadding, inset.bottom);
  }, [headerEndHeight, height, inset.bottom, itemCount, noHeaderPadding]);

  // when searchResults changes, scroll SectionList to the top
  useEffect(() => {
    if (filteredSections.length === 0) return;
    if (searchText.length === 0) return;

    listRef.current?.scrollToLocation({
      sectionIndex: 0,
      itemIndex: 0,
      viewOffset: indexSearchHeight + headerEndHeight,
    });
  }, [filteredSections, headerEndHeight, inset.top, listRef, searchText.length]);

  return (
    <>
      <Stack.Screen
        options={{
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
          contentInsetAdjustmentBehavior="never"
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListItem item={item} isFavorite={favorites.includes(item.id)} />}
          renderSectionHeader={({ section }) => (showHeaders ? <SectionHeader title={section.title} /> : null)}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={<View style={{ height: headerStartHeight + indexSearchHeight + noHeaderPadding }} />}
          ListFooterComponent={
            <View style={[styles.listFooter, { height: whiteSpaceToAdd }]}>
              {resultStatus === 'no-hits' ? <NoHits /> : resultStatus === 'no-favorites' ? <NoFavorites /> : null}
            </View>
          }
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
    paddingHorizontal: 20,
  },
  itemInnerContainer: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    paddingVertical: itemPaddingVertical,
    fontSize: itemFontSize,
  },
  itemFavorite: {
    width: 20,
    height: 20,
    position: 'relative',
    top: -4,
  },
  headerContainer: {
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 21,
    paddingTop: 40,
    paddingBottom: 20,
    fontFamily: fonts.bold.fontFamily,
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  noResultsFavorite: {
    width: 18,
    height: 18,
    position: 'relative',
    top: -3,
  },
  listFooter: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
});
