import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, LayoutChangeEvent, LayoutRectangle, Platform, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import Animated, { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import Button from '@/lib/components/Button';
import {
  HeaderBackground,
  HeaderButtonContainer,
  HeaderLeft,
  HeaderTitle,
  isLiquidGlassStyleHeader,
} from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import NotFound from '@/lib/components/NotFound';
import Player, { playerHeight } from '@/lib/components/Player';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SongMenu, { SongDetailToolbar } from '@/lib/components/SongMenu';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = songs.find((song) => song.id === id);
  if (!song) {
    return <NotFound message={t('songNotFound')} />;
  }
  return <SongPage song={song} />;
}

function SongPage({ song }: { song: Song }) {
  const router = useRouter();
  const { t } = useTranslation();
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');
  const headerHeight = useHeaderHeight();
  const inset = useSafeAreaInsets();
  const maxWidthPadding = useMaxWidthPadding();
  const { value: showChords } = useStorage('showChords');
  const { value: activeVariantIdBySongId, setValue: setActiveVariantIdBySongId } =
    useStorage('activeVariantIdBySongId');
  const { value: activeMediaIdBySongId, setValue: setActiveMediaIdBySongId } = useStorage('activeMediaIdBySongId');
  const { value: favorites, setValue: setFavorites } = useStorage('favorites');

  const { v: activeVariantId, m: activeMediaId } = useLocalSearchParams<{ v?: string; m?: string }>();

  const { id } = song;
  const isFavorite = favorites.includes(song.id);

  // Variants
  const storedActiveVariantId = activeVariantIdBySongId[id];
  const variants: { [id: string]: LyricsType | PDFs } = { ...song.fields.Lyrics, ...song.fields.PDFs };
  // a primitive, so the effect below doesn't depend on the identity of the merged `variants` object
  const firstVariantId: string | undefined = Object.keys(variants)[0];
  useEffect(() => {
    // on load, check the query param for a variant id
    if (!activeVariantId) {
      // if none is provided...
      if (storedActiveVariantId) {
        // try and load it from storage
        router.setParams({ v: storedActiveVariantId });
      } else {
        // otherwise, try and set it to the first variant id
        if (firstVariantId) {
          router.setParams({ v: firstVariantId });
        }
      }
    }
  }, [activeVariantId, firstVariantId, storedActiveVariantId, router]);

  const setActiveVariantId = (v: string) => {
    router.setParams({ v });
    setActiveVariantIdBySongId({
      ...activeVariantIdBySongId,
      [id]: v,
    });
  };
  const activeVariant = activeVariantId ? variants[activeVariantId] : Object.values(variants)[0];
  const hasMultipleVariants = Object.keys(variants).length > 1;

  // chords
  const hasChords = isLyrics(activeVariant) && !!activeVariant['Show Chords'];

  // Footnotes
  const hasMusicAuthor = !!song.fields['Music Author'];
  const hasTextAuthor = !!song.fields['Text Author'];
  const hasSameAuthor = hasMusicAuthor && hasTextAuthor && song.fields['Music Author'] === song.fields['Text Author'];
  const hasFootnote = isLyrics(activeVariant) && !!activeVariant.Notes;

  // Media
  const storedActiveMediaId = activeMediaIdBySongId[id];
  // not copied: song data is static and never mutated, so this stays referentially stable across renders
  const media: { [id: string]: Audio } = song.fields.Audio;
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
  }, [activeMediaId, media, storedActiveMediaId, router]);

  const setActiveMediaId = (m: string) => {
    router.setParams({ m });
    setActiveMediaIdBySongId({
      ...activeMediaIdBySongId,
      [id]: m,
    });
  };

  const activeMedia = activeMediaId ? (media[activeMediaId] ?? null) : null;

  // Title
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = (event: LayoutChangeEvent) => {
    titleLayout.set(event.nativeEvent.layout);
  };
  const { title, subtitle, variantName } = useTitle(song, activeVariant);
  const showLyrics = isLyrics(activeVariant);

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites(favorites.filter((id) => id !== song.id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } else {
      setFavorites([...favorites, song.id]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground opaque />,
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
          headerLeft: !isLiquidGlassStyleHeader() ? (props) => <HeaderLeft {...props} /> : undefined,
          headerRight: !isLiquidGlassStyleHeader()
            ? () => (
                <HeaderButtonContainer>
                  <Button
                    onPress={toggleFavorite}
                    accessibilityLabel={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                  >
                    <FontAwesome6 name="heart" iconStyle={isFavorite ? 'solid' : 'regular'} size={16} color="white" />
                  </Button>
                  <SongMenu song={song} hasChords={hasChords} />
                </HeaderButtonContainer>
              )
            : undefined,
        }}
      />
      <SongDetailToolbar song={song} hasChords={hasChords} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
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
            <View style={[styles.titleContainer]} onLayout={calculateTitleHeight}>
              {isLiquidGlassStyleHeader() ? (
                <View
                  style={{
                    backgroundColor: primary,
                    position: 'absolute',
                    left: -maxWidthPadding.paddingLeft,
                    right: -maxWidthPadding.paddingRight,
                    top: -headerHeight * 10,
                    bottom: -padding,
                  }}
                />
              ) : null}
              <View style={styles.titleAndSubtitle}>
                <ThemedText bold style={[styles.mainTitle, isLiquidGlassStyleHeader() ? { color: 'white' } : null]}>
                  {title}
                </ThemedText>
                {subtitle ? (
                  <ThemedText style={[styles.subtitle, isLiquidGlassStyleHeader() ? { color: 'white' } : null]}>
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <Markdown showChords={hasChords && showChords}>{activeVariant['Lyrics & Chords']}</Markdown>
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
        <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? headerHeight : undefined }}>
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
            }}
            // TODO a better offline experience?
            renderActivityIndicator={(_progress) => (
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
      <Player title={title} media={media} activeMediaId={activeMediaId} setActiveMediaId={setActiveMediaId} />
    </View>
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
    position: 'relative',
    marginTop: isLiquidGlassStyleHeader() ? padding * 2 : padding * 2,
    marginBottom: isLiquidGlassStyleHeader() ? padding * 2 : padding,
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
