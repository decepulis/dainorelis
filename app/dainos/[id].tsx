import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { id } = useLocalSearchParams();
  const song = songs.find((song) => song.id === id);
  if (!song) {
    // todo: better error state
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: song.fields.Song }} />
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
    lineHeight: 25,
  },
});
