import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{song.fields.Song}</Text>
      <Text style={styles.lyrics}>{song.fields.Lyrics}</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lyrics: {
    fontSize: 18,
  },
});
