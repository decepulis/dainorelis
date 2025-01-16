import { ComponentPropsWithoutRef, Fragment, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import Markdown from '@/lib/components/Markdown';
import SongHeader from '@/lib/components/SongHeader';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import { fonts } from '@/lib/constants/themes';
import useDefaultHeaderHeight from '@/lib/hooks/useDefaultHeaderHeight';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import splitTitle from '@/lib/utils/splitTitle';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  // TODO break this file up
  const { id } = useLocalSearchParams();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]);

  const inset = useSafeAreaInsets();
  const text = useThemeColor('text');
  const background = useThemeColor('background');
  const cardDark = useThemeColor('cardDark');
  const primary = useThemeColor('primary');

  const { t } = useTranslation();

  const { value: showChords, setValue: setShowChords, loading: showChordsLoading } = useStorage('showChords');

  const { value: favorites, setValue: setFavorites, loading: favoritesLoading } = useStorage('favorites');
  const isFavorite = useMemo(() => song?.id && favorites.includes(song.id), [favorites, song]);

  const titleRef = useRef<View>(null);
  const [isTitleBehind, setIsTitleBehind] = useState(false);
  const headerHeight = useDefaultHeaderHeight();

  const scrollHandler: ComponentPropsWithoutRef<typeof ScrollView>['onScroll'] = (event) => {
    const titleEl = titleRef.current;
    if (titleEl) {
      titleEl.measure((_x, _y, _width, titleHeight, _pageX, _pageY) => {
        // TODO this spacing is a bit off on android
        const scrollY = event.nativeEvent.contentOffset.y;
        const target = headerHeight - titleHeight;
        if (scrollY < target) setIsTitleBehind(false);
        else setIsTitleBehind(true);
      });
    }
  };

  // TODO: better error states
  if (!song) return null;
  if (!Array.isArray(song.fields.Lyrics) || song.fields.Lyrics.length === 0) return null;

  const activeLyrics = song.fields.Lyrics[1] ?? song.fields.Lyrics[0];
  const hasVariants = song.fields.Lyrics.length > 1;
  const hasChords = activeLyrics['Show Chords'];
  const hasVideos = Array.isArray(song.fields.Videos) && song.fields.Videos.length > 0;
  const hasAudio = Array.isArray(song.fields.Audio) && song.fields.Audio.length > 0;
  const hasPDFs = Array.isArray(song.fields.PDFs) && song.fields.PDFs.length > 0;
  const hasDescriptions = false; // TODO add to schema
  const hasAttribution = song.fields['Music Author'] || song.fields['Text Author'];

  const titleParts = splitTitle(song.fields.Name);

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
          header: () => <SongHeader title={song.fields.Name} isTitleBehind={isTitleBehind} />,
        }}
      />
      {/* TODO padding on scroll view makes android unhappy */}
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={scrollHandler}
        scrollEventThrottle={100}
      >
        <View style={styles.container}>
          <View style={styles.titleContainer} ref={titleRef}>
            {titleParts.map((part, index) => (
              <ThemedText key={index} style={[styles.title, index === 0 ? styles.mainTitle : styles.subtitle]}>
                {part}
              </ThemedText>
            ))}
          </View>
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
      <View style={[styles.controlBar, { backgroundColor: primary, paddingBottom: Math.max(inset.bottom, 10) }]}>
        {/* chords */}
        {hasChords ? (
          <Pressable disabled={showChordsLoading} onPress={() => setShowChords(!showChords)} hitSlop={24}>
            <FontAwesome6 name="guitar" size={24} color="#fff" style={{ opacity: showChords ? 1 : 0.5 }} />
          </Pressable>
        ) : null}
        {/* recordings */}
        {hasVideos || hasAudio ? <FontAwesome6 name="play" size={24} color="#fff" /> : null}
        {/* variants */}
        {hasVariants || hasPDFs ? <FontAwesome6 name="list" size={24} color="#fff" /> : null}
        {/* info */}
        {hasDescriptions ? <FontAwesome6 name="circle-info" size={24} color="#fff" /> : null}
        {/* favorites */}
        <Pressable
          style={{
            marginLeft:
              !hasChords && !hasVideos && !hasAudio && !hasVariants && !hasPDFs && !hasDescriptions ? 'auto' : 0,
          }}
          disabled={favoritesLoading}
          onPress={isFavorite ? removeFromFavorites : addToFavorites}
          hitSlop={24}
        >
          <FontAwesome6 name="heart" size={24} color="#fff" solid style={{ opacity: isFavorite ? 1 : 0.5 }} />
        </Pressable>
      </View>
    </Fragment>
  );
}
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 80,
  },
  titleContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {},
  mainTitle: {
    ...fonts.bold,
    fontSize: 30,
  },
  subtitle: {
    fontSize: 18,
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
  controlBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
