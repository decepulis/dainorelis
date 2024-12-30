import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link, Stack } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SongFile } from '@/schemas/songs';
import songs from '@/songs';

const groupSongsByLetter = (songs: SongFile) => {
  const groupedSongs: { title: string; data: SongFile }[] = [];

  songs.forEach((song) => {
    const firstLetter = song.fields.Song?.charAt(0).toUpperCase() || '#';
    const group = groupedSongs.find((group) => group.title === firstLetter);

    if (group) {
      group.data.push(song);
    } else {
      groupedSongs.push({ title: firstLetter, data: [song] });
    }
  });

  return groupedSongs.sort((a, b) => a.title.localeCompare(b.title));
};

const removeAccents = (value: string) =>
  value
    .replace(/ą/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ė/g, 'e')
    .replace(/ę/g, 'e')
    .replace(/į/g, 'i')
    .replace(/š/g, 's')
    .replace(/ų/g, 'u')
    .replace(/ū/g, 'u')
    .replace(/ž/g, 'z');

const sections = groupSongsByLetter(songs);

const ListItem = memo(({ item }: { item: SongFile[number] }) => (
  <Link href={`/dainos/${item.id}`} asChild>
    <ThemedText style={styles.item}>{item.fields.Song}</ThemedText>
  </Link>
));

const SectionHeader = memo(({ title }: { title: string }) => {
  const backgroundColor = useThemeColor('text');
  return (
    <View style={styles.headerContainer}>
      <View style={[{ backgroundColor }, styles.line]} />
      <ThemedText style={styles.header}>{title}</ThemedText>
      <View style={[{ backgroundColor }, styles.line]} />
    </View>
  );
});

export default function Index() {
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');

  const [searchText, setSearchText] = useState('');
  const searchResults = useMemo(
    () =>
      searchText && searchText.length >= 2
        ? songs
            .filter((song) =>
              removeAccents(song.fields.Song).toLowerCase().includes(removeAccents(searchText).toLowerCase())
            )
            .map((song) => ({ title: '', data: [song] }))
        : null,
    [searchText]
  );
  const renderSections = useMemo(() => searchResults || sections, [searchResults]);

  // when searchResults changes, scroll SectionList to the top
  // todo this doesn't work
  const sectionListRef = useRef<SectionList>(null);
  useEffect(() => {
    if (renderSections.length > 0) {
      sectionListRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0 });
    }
  }, [searchResults]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dainorėlis',
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            cancelButtonText: '×',
            placeholder: '',
            barTintColor: background,
            onChangeText: (e) => setSearchText(e.nativeEvent.text),
            onBlur: () => setSearchText(''),
            onCancelButtonPress: () => setSearchText(''),
            onClose: () => setSearchText(''),
          },
        }}
      />
      <View style={styles.container}>
        <SectionList
          ref={sectionListRef}
          contentInsetAdjustmentBehavior="automatic"
          sections={renderSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListItem item={item} />}
          renderSectionHeader={({ section }) => (searchResults ? null : <SectionHeader title={section.title} />)}
          stickySectionHeadersEnabled={false}
          // clumsily use listHeaderComponent/listFooterComponent to add padding to the top/bottom of the list
          ListHeaderComponent={searchResults ? <View style={{ height: 20 }} /> : null}
          ListFooterComponent={<View style={{ height: useSafeAreaInsets().bottom }} />}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInputContainer: {
    position: 'relative',
    marginLeft: 20,
    marginRight: 20,
    marginTop: 40,
  },
  textInputIcon: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  textInput: {
    height: 50,
    fontSize: 18,
    borderWidth: 1,
    paddingLeft: 40,
    fontFamily: 'KlavikaRegular',
  },
  textClearButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    paddingRight: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    textAlign: 'center',
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
  },
  line: {
    flex: 1,
    height: 1,
    marginTop: 40,
    marginBottom: 20,
  },
});
