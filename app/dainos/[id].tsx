import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';

import ThemedText from '@/components/ThemedText';
import useStorage from '@/hooks/useStorage';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { id } = useLocalSearchParams();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]);

  const { value: favorites, setValue: setFavorites, loading } = useStorage('favorites');
  const isFavorite = useMemo(() => song?.id && favorites.includes(song.id), [favorites, song]);

  if (!song) {
    // todo: better error state
    return null;
  }

  const addToFavorites = () => {
    if (!loading) {
      setFavorites([...favorites, song.id]);
    }
  };
  const removeFromFavorites = () => {
    if (!loading) {
      setFavorites(favorites.filter((id) => id !== song.id));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: song.fields.Song,
          headerRight: () => (
            <Pressable disabled={loading} onPress={isFavorite ? removeFromFavorites : addToFavorites}>
              <Image
                source="icon_fav_white.png"
                style={{ opacity: loading || !isFavorite ? 0.5 : 1, width: 20, height: 20 }}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
        <ThemedText style={styles.lyrics}>{song.fields.Lyrics}</ThemedText>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  lyrics: {
    fontSize: 21,
    lineHeight: 28,
  },
});
