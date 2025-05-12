import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';

import useStorage from '@/lib/hooks/useStorage';
import { Song } from '@/lib/schemas/songs';
import songFestivalIndex from '@/song-festival';
import songs from '@/songs';

import { NoFavorites } from './Errors';
import { ListHeader, ListItem } from './ListItem';

export const useSongFestivalList = () => {
  const { t } = useTranslation();
  const songsByPart: { title: string; data: Song[] }[] = useMemo(
    () =>
      songFestivalIndex.map((part) => ({
        title: t(part.title),
        data: part.data.map((songIndex) => songs[songIndex]),
      })),
    [t]
  );
  return songsByPart;
};

type Props = {
  filter: 'allSongs' | 'favoriteSongs';
};
export default function SongFestivalList({ filter }: Props) {
  const { value: favorites } = useStorage('favorites');
  const songFestivalList = useSongFestivalList();

  const filteredSongs = useMemo(() => {
    if (filter === 'favoriteSongs') {
      return songFestivalList
        .map((section) => ({
          ...section,
          data: section.data.filter((song) => favorites.includes(song.id)),
        }))
        .filter((section) => section.data.length > 0);
    }
    return songFestivalList;
  }, [filter, songFestivalList, favorites]);

  const lastSection = useMemo(() => filteredSongs[filteredSongs.length - 1], [filteredSongs]);

  return (
    <SectionList
      scrollEnabled={false}
      sections={filteredSongs}
      renderSectionHeader={({ section }) => <ListHeader title={section.title} />}
      renderItem={({ item, section, index }) => {
        const isLast = section.title === lastSection.title && index === lastSection.data.length - 1;
        return <ListItem item={item} isLast={isLast} />;
      }}
      ListFooterComponent={
        filter === 'favoriteSongs' && filteredSongs.length === 0 ? (
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
