import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import useStorage from '@/lib/hooks/useStorage';
import { Song, SongFile } from '@/lib/schemas/songs';
import songs from '@/songs';

import { NoFavorites } from './Errors';
import ListHeader from './ListHeader';
import ListItem from './ListItem';

const groupSongsByLetter = (songs: SongFile) => {
  const songsByLetter: { [letter: string]: Song[] } = {};

  songs.forEach((song) => {
    const firstLetter = song.fields.Name?.charAt(0).toUpperCase() || '#';
    const letterSongs = songsByLetter[firstLetter] || [];
    const newLetterSongs = [...letterSongs, song];
    songsByLetter[firstLetter] = newLetterSongs;
  });

  const sections = Object.entries(songsByLetter).map(([letter, songs]) => ({
    title: letter,
    data: songs,
  }));
  sections.sort((a, b) => a.title.localeCompare(b.title, 'lt'));
  return sections;
};

type Props = {
  filter: 'allSongs' | 'favoriteSongs';
};
export default function List({ filter }: Props) {
  const { value: favorites } = useStorage('favorites');

  const filteredSongs = useMemo(() => {
    if (filter === 'favoriteSongs') {
      return songs.filter((song) => favorites.includes(song.id));
    }
    return songs;
  }, [filter, favorites]);

  const songsByLetter = useMemo(() => {
    return groupSongsByLetter(filteredSongs);
  }, [filteredSongs]);

  const lastSection = useMemo(() => songsByLetter[songsByLetter.length - 1], [songsByLetter]);

  return (
    <SectionList
      scrollEnabled={false}
      sections={songsByLetter}
      renderSectionHeader={({ section }) => <ListHeader title={section.title} />}
      renderItem={({ item, section, index }) => {
        const isLast = section.title === lastSection.title && index === lastSection.data.length - 1;
        return <ListItem item={item} isLast={isLast} />;
      }}
      ListFooterComponent={
        filter === 'favoriteSongs' && songsByLetter.length === 0 ? (
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
