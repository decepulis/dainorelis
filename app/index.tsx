import React, { memo, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import ThemedText from '@/components/ThemedText';
import useStorage from '@/hooks/useStorage';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SongFile } from '@/schemas/songs';
import songs from '@/songs';
import removeAccents from '@/utils/removeAccents';

// const groupSongsByLetter = (songs: SongFile) => {
//   const groupedSongs: { title: string; data: SongFile }[] = [];

//   songs.forEach((song) => {
//     const firstLetter = song.fields.Song?.charAt(0).toUpperCase() || '#';
//     const group = groupedSongs.find((group) => group.title === firstLetter);

//     if (group) {
//       group.data.push(song);
//     } else {
//       groupedSongs.push({ title: firstLetter, data: [song] });
//     }
//   });

//   return groupedSongs.sort((a, b) => a.title.localeCompare(b.title));
// };

// const sections = groupSongsByLetter(songs);

const _ListItem = ({ item }: { item: SongFile[number] }) => (
  <Link href={`/dainos/${item.id}`} asChild>
    <ThemedText style={styles.item}>{item.fields.Song}</ThemedText>
  </Link>
);
const ListItem = memo(_ListItem);

const _SectionHeader = ({ title }: { title: string }) => {
  const backgroundColor = useThemeColor('text');
  return (
    <View style={styles.headerContainer}>
      <View style={[{ backgroundColor }, styles.line]} />
      <ThemedText style={styles.header}>{title}</ThemedText>
      <View style={[{ backgroundColor }, styles.line]} />
    </View>
  );
};
const SectionHeader = memo(_SectionHeader);

type ListHeaderComponentProps = {
  filter: string;
  setFilter: (value: 'Visos' | 'Mano') => void;
  searchText: string;
  setSearchText: (value: string) => void;
};
const _ListHeaderComponent = ({ filter, setFilter, searchText, setSearchText }: ListHeaderComponentProps) => {
  const inset = useSafeAreaInsets();
  const color = useThemeColor('text');
  const cardDark = useThemeColor('cardDark');
  const primary = useThemeColor('primary');

  return (
    <>
      <View
        style={[
          styles.headerImageContainer,
          {
            height: 150 + inset.top,
            backgroundColor: primary,
            paddingTop: (3 * inset.top) / 4,
          },
        ]}
      >
        <Image source="miskas.jpg" style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="bottom" />
        <Image source="logo_white.png" style={styles.headerLogo} contentFit="contain" />
      </View>
      <View style={styles.searchContainer}>
        <SegmentedControl
          backgroundColor={cardDark}
          style={styles.searchFilter}
          tintColor={primary}
          fontStyle={{ color, fontSize: 16, fontFamily: 'KlavikaRegular' }}
          activeFontStyle={{ fontSize: 16, fontFamily: 'KlavikaBold', fontWeight: '700' }}
          selectedIndex={filter === 'Visos' ? 0 : 1}
          onValueChange={setFilter as (value: string) => void}
          values={['Visos', 'Mano']}
        />
        <View style={styles.searchInputContainer}>
          <TextInput
            style={[{ backgroundColor: cardDark, color }, styles.searchInput]}
            clearButtonMode="while-editing"
            autoCorrect={false}
            value={searchText}
            onChangeText={setSearchText}
            inputMode="search"
            returnKeyType="search"
          />
          <View style={styles.searchInputIconContainer}>
            <Ionicons name="search" size={18} color={color} />
          </View>
        </View>
      </View>
    </>
  );
};
const ListHeaderComponent = memo(_ListHeaderComponent);

export default function Index() {
  const inset = useSafeAreaInsets();

  const primary = useThemeColor('primary');
  const { value: favorites } = useStorage('favorites');
  const [filter, setFilter] = useState<'Visos' | 'Mano'>('Visos');
  const [searchText, setSearchText] = useState('');

  // todo: empty state when no filters / no search
  const filteredSongs = useMemo(
    () => (filter === 'Visos' ? songs : songs.filter((song) => favorites.includes(song.id))),
    [favorites, filter]
  );

  const searchResults = useMemo(
    () =>
      searchText
        ? filteredSongs.filter((song) =>
            removeAccents(song.fields.Song).toLowerCase().includes(removeAccents(searchText).toLowerCase())
          )
        : null,
    [searchText, filteredSongs]
  );

  // when searchResults changes, scroll SectionList to the top
  // const sectionListRef = useRef<SectionList>(null);
  // useEffect(() => {
  //   // todo: this is really unreliable
  //   if (renderSections.length > 0) {
  //     sectionListRef.current?.scrollToLocation({
  //       animated: false,
  //       sectionIndex: 0,
  //       itemIndex: 0,
  //     });
  //   }
  // }, [renderSections.length, searchResults]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          header: () => <View style={{ height: inset.top, backgroundColor: 'transparent' }} />,
          headerTransparent: true,
        }}
      />
      <View style={styles.container}>
        <FlatList
          // ref={sectionListRef}
          contentInsetAdjustmentBehavior="never"
          data={searchResults || filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListItem item={item} />}
          // renderSectionHeader={({ section }) => (searchResults ? null : <SectionHeader title={section.title} />)}
          // stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <ListHeaderComponent
              filter={filter}
              setFilter={setFilter}
              searchText={searchText}
              setSearchText={setSearchText}
            />
          }
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
  headerImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  headerLogo: { width: '100%', height: '100%' },
  searchContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 30 },
  searchFilter: { height: 40, borderRadius: 6 },
  searchInputContainer: {
    marginTop: 10,
    position: 'relative',
  },
  searchInput: {
    fontSize: 16,
    fontFamily: 'KlavikaRegular',
    height: 40,
    borderRadius: 6,
    paddingLeft: 40,
  },
  searchInputIconContainer: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    fontSize: 21,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  header: {
    fontSize: 21,
    paddingLeft: 20,
    paddingRight: 20,
    // it's important to apply paddingTop to the text containers
    // to leave room for diacritics (e.g., Č)
    paddingTop: 40,
    paddingBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  line: {
    flex: 1,
    height: 1,
    marginTop: 40,
    marginBottom: 20,
  },
});
