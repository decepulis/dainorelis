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

  // ?v= / ?m= only exist once the user picks from a menu (or a link carries them)
  const { v: variantIdParam, m: mediaIdParam } = useLocalSearchParams<{ v?: string; m?: string }>();

  const { id } = song;
  const isFavorite = favorites.includes(song.id);

  // Variants: the URL's choice, else the one remembered for this song, else the first. Either may
  // name a variant that no longer exists (deleted in the admin, or a bad link), so only valid ids
  // count. Derived on every render rather than synced into the URL, so the first frame is right.
  const variants: { [id: string]: LyricsType | PDFs } = { ...song.fields.Lyrics, ...song.fields.PDFs };
  const variantIds = Object.keys(variants);
  const activeVariantId =
    [variantIdParam, activeVariantIdBySongId[id]].find((v) => v !== undefined && variantIds.includes(v)) ??
    variantIds[0];

  const setActiveVariantId = (v: string) => {
    router.setParams({ v });
    setActiveVariantIdBySongId({
      ...activeVariantIdBySongId,
      [id]: v,
    });
  };
  const activeVariant = variants[activeVariantId];
  const hasMultipleVariants = variantIds.length > 1;

  // chords
  const hasChords = isLyrics(activeVariant) && !!activeVariant['Show Chords'];

  // Footnotes
  const hasMusicAuthor = !!song.fields['Music Author'];
  const hasTextAuthor = !!song.fields['Text Author'];
  const hasSameAuthor = hasMusicAuthor && hasTextAuthor && song.fields['Music Author'] === song.fields['Text Author'];
  const hasFootnote = isLyrics(activeVariant) && !!activeVariant.Notes;

  // Media: same fallbacks as variants; undefined when the song has no recordings
  // not copied: song data is static and never mutated, so this stays referentially stable across renders
  const media: { [id: string]: Audio } = song.fields.Audio;
  const mediaIds = Object.keys(media);
  const activeMediaId: string | undefined =
    [mediaIdParam, activeMediaIdBySongId[id]].find((m) => m !== undefined && mediaIds.includes(m)) ?? mediaIds[0];

  const setActiveMediaId = (m: string) => {
    router.setParams({ m });
    setActiveMediaIdBySongId({
      ...activeMediaIdBySongId,
      [id]: m,
    });
  };

  const activeMedia = activeMediaId ? media[activeMediaId] : null;

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
