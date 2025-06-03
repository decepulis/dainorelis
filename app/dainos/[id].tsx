import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, LayoutChangeEvent, LayoutRectangle, Platform, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Sentry from '@sentry/react-native';

import Button from '@/lib/components/Button';
import { HeaderBackground, HeaderButtonContainer, HeaderLeft, HeaderTitle } from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import Player, { playerHeight } from '@/lib/components/Player';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SongMenu from '@/lib/components/SongMenu';
import ThemedText from '@/lib/components/ThemedText';
import VariantMenu from '@/lib/components/VariantMenu';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useMaxWidthPadding from '@/lib/hooks/useMaxWidthPadding';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Audio } from '@/lib/schemas/audio';
import { Lyrics as LyricsType } from '@/lib/schemas/lyrics';
import { PDFs } from '@/lib/schemas/pdfs';
import { Song } from '@/lib/schemas/songs';
import isLyrics from '@/lib/utils/isLyrics';
import useTitle from '@/lib/utils/useTitle';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { t } = useTranslation();
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');
  const headerHeight = useHeaderHeight();
  const inset = useSafeAreaInsets();
  const maxWidthPadding = useMaxWidthPadding();
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const { value: activeVariantIndexById, setValue: setActiveVariantIndexById } = useStorage('activeVariantIndexById');
  const { value: activeMediaIndexById, setValue: setActiveMediaIndexById } = useStorage('activeMediaIndexById');
  const { value: favorites, setValue: setFavorites } = useStorage('favorites');

  const { id } = useLocalSearchParams();
  if (typeof id !== 'string') throw new Error('Invalid id');

  const song = useMemo(() => songs.find((song) => song.id === id), [id]) as Song;
  const isFavorite = useMemo(() => favorites.includes(song.id), [favorites, song.id]);

  // Variants
  const storedActiveVariantIndex = useMemo(() => activeVariantIndexById[id], [activeVariantIndexById, id]);
  const variants: (LyricsType | PDFs)[] = useMemo(
    () => [...(song.fields.Lyrics || []), ...(song.fields.PDFs || [])],
    [song]
  );
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(() => {
    // if storage didn't have an active variant index, or if the song doesn't have that many variants, set it to 0
    if (typeof storedActiveVariantIndex === 'undefined' || storedActiveVariantIndex >= variants.length) {
      return 0;
    }
    return storedActiveVariantIndex;
  });
  useEffect(() => {
    // if the active variant index changes, store it in storage
    setActiveVariantIndexById({
      ...activeVariantIndexById,
      [id]: activeVariantIndex,
    });
  }, [activeVariantIndex, id]);
  const activeVariant = useMemo(() => variants[activeVariantIndex], [variants, activeVariantIndex]);
  const hasMultipleVariants = useMemo(() => variants.length > 1, [variants]);

  // chords
  const hasChords = isLyrics(activeVariant) && !!activeVariant['Show Chords'];

  // Footnotes
  const hasMusicAuthor = !!song.fields['Music Author'];
  const hasTextAuthor = !!song.fields['Text Author'];
  const hasSameAuthor = hasMusicAuthor && hasTextAuthor && song.fields['Music Author'] === song.fields['Text Author'];
  const hasFootnote = isLyrics(activeVariant) && !!activeVariant.Notes;

  // Media
  const storedActiveMediaIndex = useMemo(() => activeMediaIndexById[id], [activeMediaIndexById, id]);
  const media: Audio[] = useMemo(() => [...(song.fields.Audio || [])], [song]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(() => {
    // if storage didn't have an active media index, or if the song doesn't have that many media, set it to 0
    if (typeof storedActiveMediaIndex === 'undefined' || storedActiveMediaIndex >= media.length) {
      return 0;
    }
    return storedActiveMediaIndex;
  });
  useEffect(() => {
    // if the active media index changes, store it in storage
    setActiveMediaIndexById({
      ...activeMediaIndexById,
      [id]: activeMediaIndex,
    });
  }, [activeMediaIndex, id]);
  const activeMedia = useMemo(
    // the media array may be empty, so let's check safely
    () => (activeMediaIndex < media.length ? media[activeMediaIndex] : null),
    [media, activeMediaIndex]
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
  const { title, subtitle, variantName } = useTitle(song, activeVariant);
  const showLyrics = isLyrics(activeVariant);

  return (
    <Fragment>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground opaque />,
          // TODO can I force this to re-render when activeVariant changes?
          headerTitle: () => (
            <HeaderTitle
              scrollRef={showLyrics ? scrollRef : undefined}
              titleLayout={titleLayout}
              showTitle={isLyrics(activeVariant) ? undefined : true}
              titleWrapper={
                hasMultipleVariants
                  ? ({ children }) => (
                      <VariantMenu
                        variants={variants}
                        activeVariantIndex={activeVariantIndex}
                        setActiveVariantIndex={setActiveVariantIndex}
                      >
                        {children}
                      </VariantMenu>
                    )
                  : undefined
              }
              title={title}
              subtitle={subtitle}
              variantName={variantName}
            />
          ),
          headerLeft: (props) => <HeaderLeft {...props} />,
          headerRight: () => (
            <HeaderButtonContainer>
              <Button
                onPress={() =>
                  isFavorite
                    ? setFavorites(favorites.filter((id) => id !== song.id))
                    : setFavorites([...favorites, song.id])
                }
                haptics={isFavorite ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Medium}
              >
                <FontAwesome6 name="heart" solid={isFavorite} size={16} color="white" />
              </Button>
              <SongMenu song={song} />
            </HeaderButtonContainer>
          ),
        }}
      />
      {showLyrics ? (
        <ScrollViewWithHeader ref={scrollRef} style={[styles.scroll]}>
          <View
            style={[
              styles.container,
              {
                paddingLeft: maxWidthPadding.paddingLeft,
                paddingRight: maxWidthPadding.paddingRight,
                paddingBottom: activeMedia
                  ? Math.max(inset.bottom + padding * 2 + playerHeight, padding * 4 + playerHeight)
                  : Math.max(inset.bottom + padding * 2, padding * 4),
              },
            ]}
          >
            <View style={styles.titleContainer} onLayout={calculateTitleHeight}>
              <View style={styles.titleAndSubtitle}>
                <ThemedText bold style={[styles.mainTitle]}>
                  {title}
                </ThemedText>
                {subtitle ? <ThemedText style={[styles.subtitle]}>{subtitle}</ThemedText> : null}
              </View>
              {hasChords ? (
                <Button
                  onPress={() => setShowChords(!showChords)}
                  haptics={showChords ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Medium}
                >
                  <FontAwesome6 name="guitar" solid={showChords} size={16} color="white" />
                </Button>
              ) : null}
            </View>

            <Markdown showLinksAsChords showChords={hasChords && showChords}>
              {activeVariant['Lyrics & Chords']}
            </Markdown>
            {hasFootnote ? <View style={[styles.hr, { backgroundColor: text }]} /> : null}
            {hasFootnote ? <Markdown>{activeVariant['Notes']}</Markdown> : null}
            {hasMusicAuthor || hasTextAuthor ? <View style={[styles.hr, { backgroundColor: text }]} /> : null}
            {hasSameAuthor ? (
              <ThemedText>
                {t('musicAndWordsBy')}
                {song.fields['Music Author']}
              </ThemedText>
            ) : null}
            {!hasSameAuthor && hasMusicAuthor ? (
              <ThemedText>
                {t('musicBy')}
                {song.fields['Music Author']}
              </ThemedText>
            ) : null}
            {!hasSameAuthor && hasTextAuthor ? (
              <ThemedText>
                {t('wordsBy')}
                {song.fields['Text Author']}
              </ThemedText>
            ) : null}
          </View>
        </ScrollViewWithHeader>
      ) : (
        // TODO this not falling behind the menu bar makes me sad
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          {/* TODO isTitleBehind on scroll */}
          {/* TODO scroll is off on load? */}
          <Pdf
            source={{ uri: activeVariant.URL, cache: true }}
            style={{ width: '100%', flex: 1, backgroundColor: 'transparent' }}
            // https://github.com/wonday/react-native-pdf/issues/837
            trustAllCerts={Platform.OS === 'android' ? false : undefined}
            fitPolicy={0}
            minScale={0.5}
            maxScale={4}
            spacing={padding}
            onError={(error) => {
              console.error(error);
              Sentry.captureException(error);
            }}
            // TODO maybe a better offline experience?
            renderActivityIndicator={(progress) => (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="large" color={primary} />
              </View>
            )}
          />
        </View>
      )}
      <Player
        title={title}
        media={media}
        activeMediaIndex={activeMediaIndex}
        setActiveMediaIndex={setActiveMediaIndex}
      />
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
  },
  titleContainer: {
    marginTop: padding * 2,
    marginBottom: padding,
    flexDirection: 'row',
    gap: padding,
    alignItems: 'center',
  },
  titleAndSubtitle: {
    flexShrink: 1,
  },
  mainTitle: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 19,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    marginTop: padding * 2,
    marginBottom: padding * 2,
  },
});
