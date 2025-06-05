import { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, LayoutChangeEvent, LayoutRectangle, Platform, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';

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
  const { value: activeVariantIdBySongId, setValue: setActiveVariantIdBySongId } =
    useStorage('activeVariantIdBySongId');
  const { value: activeMediaIdBySongId, setValue: setActiveMediaIdBySongId } = useStorage('activeMediaIdBySongId');
  const { value: favorites, setValue: setFavorites } = useStorage('favorites');

  const { id, v: activeVariantId, m: activeMediaId } = useLocalSearchParams<{ id: string; v?: string; m?: string }>();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]) as Song;
  const isFavorite = useMemo(() => favorites.includes(song.id), [favorites, song.id]);

  // Variants
  const storedActiveVariantId = useMemo(() => activeVariantIdBySongId[id], [activeVariantIdBySongId, id]);
  const variants: { [id: string]: LyricsType | PDFs } = useMemo(
    () => ({ ...song.fields.Lyrics, ...song.fields.PDFs }),
    [song]
  );
  useEffect(() => {
    // on load, check the query param for a variant id
    if (!activeVariantId) {
      // if none is provided...
      if (storedActiveVariantId) {
        // try and load it from storage
        router.setParams({ v: storedActiveVariantId });
      } else {
        // otherwise, try and set it to the first variant id
        const firstVariantId = Object.keys(variants)[0];
        if (firstVariantId) {
          router.setParams({ v: firstVariantId });
        }
      }
    }
  }, [activeVariantId, variants, storedActiveVariantId]);

  const setActiveVariantId = (v: string) => {
    router.setParams({ v });
    setActiveVariantIdBySongId({
      ...activeVariantIdBySongId,
      [id]: v,
    });
  };
  const activeVariant = useMemo(
    () => (activeVariantId ? variants[activeVariantId] : Object.values(variants)[0]),
    [variants, activeVariantId]
  );
  const hasMultipleVariants = useMemo(() => Object.keys(variants).length > 1, [variants]);

  // chords
  const hasChords = isLyrics(activeVariant) && !!activeVariant['Show Chords'];

  // Footnotes
  const hasMusicAuthor = !!song.fields['Music Author'];
  const hasTextAuthor = !!song.fields['Text Author'];
  const hasSameAuthor = hasMusicAuthor && hasTextAuthor && song.fields['Music Author'] === song.fields['Text Author'];
  const hasFootnote = isLyrics(activeVariant) && !!activeVariant.Notes;

  // Media
  const storedActiveMediaId = useMemo(() => activeMediaIdBySongId[id], [activeMediaIdBySongId, id]);
  const media: { [id: string]: Audio } = useMemo(() => ({ ...song.fields.Audio }), [song]);
  useEffect(() => {
    // on load, check the query param for a media id
    if (!activeMediaId) {
      // if none is provided...
      if (storedActiveMediaId) {
        // try and load it from storage
        router.setParams({ m: storedActiveMediaId });
      } else {
        // otherwise, try and set it to the first media id
        const firstMediaId = Object.keys(media)[0];
        if (firstMediaId) {
          router.setParams({ m: firstMediaId });
        }
      }
    }
  }, [activeMediaId, media, storedActiveMediaId]);

  const setActiveMediaId = (m: string) => {
    router.setParams({ m });
    setActiveMediaIdBySongId({
      ...activeMediaIdBySongId,
      [id]: m,
    });
  };

  const activeMedia = useMemo(() => (activeMediaId ? (media[activeMediaId] ?? null) : null), [media, activeMediaId]);

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
                        activeVariantId={activeVariantId}
                        setActiveVariantId={setActiveVariantId}
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
      <Player media={media} activeMediaId={activeMediaId} setActiveMediaId={setActiveMediaId} />
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
