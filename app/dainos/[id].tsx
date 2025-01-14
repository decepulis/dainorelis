import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';

import Markdown from '@/lib/components/Markdown';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { id } = useLocalSearchParams();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]);

  const text = useThemeColor('text');
  const cardDark = useThemeColor('cardDark');
  const primary = useThemeColor('primary');
  const { t } = useTranslation();

  const { value: showChords, setValue: setShowChords, loading: showChordsLoading } = useStorage('showChords');

  const { value: favorites, setValue: setFavorites, loading: favoritesLoading } = useStorage('favorites');
  const isFavorite = useMemo(() => song?.id && favorites.includes(song.id), [favorites, song]);

  // TODO: better error states
  if (!song) return null;
  if (!Array.isArray(song.fields.Lyrics) || song.fields.Lyrics.length === 0) return null;

  const activeLyrics = song.fields.Lyrics[1] ?? song.fields.Lyrics[0];
  const hasChords = activeLyrics['Show Chords'];
  const hasVideos = Array.isArray(song.fields.Videos) && song.fields.Videos.length > 0;
  const hasAudio = Array.isArray(song.fields.Audio) && song.fields.Audio.length > 0;
  const hasPDFs = Array.isArray(song.fields.PDFs) && song.fields.PDFs.length > 0;
  const hasAttribution = song.fields['Music Author'] || song.fields['Text Author'];

  const addToFavorites = () => {
    if (!favoritesLoading) {
      setFavorites([...favorites, song.id]);
    }
  };
  const removeFromFavorites = () => {
    if (!favoritesLoading) {
      setFavorites(favorites.filter((id) => id !== song.id));
    }
  };

  return (
    <Fragment>
      <Stack.Screen
        options={{
          title: song.fields.Name,
          headerRight: () => (
            <Pressable
              hitSlop={24}
              disabled={favoritesLoading}
              onPress={isFavorite ? removeFromFavorites : addToFavorites}
              style={{ marginLeft: 24 }}
            >
              <Image
                source={require('@/assets/images/icon/fav_white.png')}
                // TODO higher contrast indicator
                style={{ opacity: favoritesLoading || !isFavorite ? 0.5 : 1, width: 20, height: 20 }}
              />
            </Pressable>
          ),
        }}
      />
      {/* TODO padding on scroll view makes android unhappy */}
      <ScrollView style={styles.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.container}>
          {hasChords ? (
            <View style={styles.showChords}>
              <Switch
                disabled={showChordsLoading}
                value={showChords}
                onValueChange={setShowChords}
                trackColor={{
                  false: cardDark,
                  true: Platform.select({
                    default: cardDark,
                    ios: primary,
                  }),
                }}
              />
              <ThemedText style={styles.showChordsText}>{t('showChords')}</ThemedText>
            </View>
          ) : null}
          <Markdown showLinksAsChords showChords={showChords}>
            {activeLyrics['Lyrics & Chords']}
          </Markdown>
          {hasAttribution ? <View style={[styles.hr, { backgroundColor: text }]} /> : null}
          {song.fields['Music Author'] ? (
            <ThemedText>
              {t('musicBy')}
              {song.fields['Music Author']}
            </ThemedText>
          ) : null}
          {song.fields['Text Author'] ? (
            <ThemedText>
              {t('wordsBy')}
              {song.fields['Text Author']}
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>
    </Fragment>
  );
}
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  showChords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  showChordsText: {
    fontSize: 17,
    lineHeight: 25,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    marginTop: 40,
    marginBottom: 40,
  },
});
