import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Link } from 'expo-router';

import { SongFile } from '@/schemas/songs';
import songs from '@/songs';

const ListItem = ({ item }: { item: SongFile[number] }) => (
  <Link href={`/dainos/${item.id}`} style={styles.item}>
    {item.fields.Song}
  </Link>
);

export default function Index() {
  return (
    <View style={styles.container}>
      <FlatList data={songs} keyExtractor={(item) => item.id} renderItem={ListItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    borderRadius: 5,
    fontSize: 18,
  },
});
