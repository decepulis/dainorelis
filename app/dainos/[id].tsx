import { Fragment, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';

import { Stack, useLocalSearchParams } from 'expo-router';

import Header from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import Player from '@/lib/components/Player';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SongMenu from '@/lib/components/SongMenu';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Audio } from '@/lib/schemas/audio';
import { Lyrics as LyricsType } from '@/lib/schemas/lyrics';
import { PDFs } from '@/lib/schemas/pdfs';
import { Song } from '@/lib/schemas/songs';
import { Videos } from '@/lib/schemas/videos';
import getTitle from '@/lib/utils/getTitle';
import isLyrics from '@/lib/utils/isLyrics';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { t } = useTranslation();
  const text = useThemeColor('text');
  const { value: showChords } = useStorage('showChords');

  const { id } = useLocalSearchParams();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]) as Song;

  const hasAttribution = !!song.fields['Music Author'] || !!song.fields['Text Author'];

  // Variants
  // TODO persist last used variant in storage
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const variants: (LyricsType | PDFs)[] = useMemo(
    () => [...(song.fields.Lyrics || []), ...(song.fields.PDFs || [])],
    [song]
  );
  const activeVariant = useMemo(() => variants[activeVariantIndex], [variants, activeVariantIndex]);

  // Media
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const media: (Audio | Videos)[] = useMemo(
    () => [...(song.fields.Audio || []), ...(song.fields.Videos || [])],
    [song]
  );
  const activeMedia = useMemo(
    () => (typeof activeMediaIndex === 'number' ? media[activeMediaIndex] : null),
    [activeMediaIndex, media]
  );

  // Title
  const scrollRef = useAnimatedRef<AnimatedScrollView>();
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = useCallback(
    (event: LayoutChangeEvent) => {
      titleLayout.value = event.nativeEvent.layout;
    },
    [titleLayout]
  );
  const title = useMemo(() => getTitle(song, variants, activeVariant), [song, variants, activeVariant]);

  return (
    <Fragment>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              scrollRef={scrollRef}
              titleLayout={titleLayout}
              title={title}
              opaque
              controls={
                <SongMenu
                  song={song}
                  variants={variants}
                  activeVariant={activeVariant}
                  setActiveVariantIndex={setActiveVariantIndex}
                  media={media}
                  activeMedia={activeMedia}
                  setActiveMediaIndex={setActiveMediaIndex}
                />
              }
            />
          ),
          headerTransparent: true, // I know it's not transparent, but this is what positions the header correctly
        }}
      />
      <ScrollViewWithHeader ref={scrollRef} style={[styles.scroll]}>
        <View style={styles.container}>
          <View style={styles.titleContainer} onLayout={calculateTitleHeight}>
            {/* TODO title in different font? */}
            {title.map((part, index) => (
              <ThemedText
                key={index}
                bold={index === 0}
                style={[styles.title, index === 0 ? styles.mainTitle : styles.subtitle]}
              >
                {part}
              </ThemedText>
            ))}
          </View>
          {isLyrics(activeVariant) ? (
            <Markdown showLinksAsChords showChords={showChords}>
              {activeVariant['Lyrics & Chords']}
            </Markdown>
          ) : null}
          {/* add notes field */}
          {hasAttribution ? <View style={[styles.hr, { backgroundColor: text }]} /> : null}
          {/* what if music and text are by the same author? */}
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
      </ScrollViewWithHeader>
      {activeMedia ? <Player asset={activeMedia} onClose={() => setActiveMediaIndex(null)} /> : null}
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
    marginTop: 40,
    marginBottom: 20,
  },
  title: {},
  mainTitle: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: 18,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    marginTop: 40,
    marginBottom: 40,
  },
});
