import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

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
import SongToolbar from '@/lib/components/SongToolbar';
import ThemedText from '@/lib/components/ThemedText';
import VariantMenu from '@/lib/components/VariantMenu';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useMaxWidthPadding from '@/lib/hooks/useMaxWidthPadding';
import useSongAudio from '@/lib/hooks/useSongAudio';
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

const truncate = (text: string, maxLength: number) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;

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
  const { t, i18n } = useTranslation();
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
  const audio = useSongAudio(title, activeMedia);
  const showLyrics = isLyrics(activeVariant);

  // Liquid Glass: a native title with the variant as its subtitle and a title menu to switch variants
  // (our react-native-screens patch). At rest the big title is on screen, so the nav title is the
  // variant alone; past it (or over a PDF) it's the song, with the variant as the subtitle.
  const scrollOffset = useScrollOffset(showLyrics ? scrollRef : null);
  const [isPastTitle, setIsPastTitle] = useState(false);
  useAnimatedReaction(
    () => {
      const layout = titleLayout.get();
      return !!layout && scrollOffset.get() > layout.y + layout.height;
    },
    (isPast, wasPast) => {
      if (isPast !== wasPast) scheduleOnRN(setIsPastTitle, isPast);
    }
  );
  // EXPERIMENT: a native large title (lyrics) that UIKit collapses into the inline title on scroll,
  // so the nav title is always the song and the variant always its subtitle
  const isLargeTitle = isLiquidGlassStyleHeader() && showLyrics;
  const showSongTitle = isLargeTitle || !showLyrics || isPastTitle;
  const variantTitle = (variant: LyricsType | PDFs) =>
    i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'];
  const nativeHeader = {
    title: showSongTitle ? title : (variantName ?? ''),
    headerConfig: {
      // UIKit would rather fold the heart and ⋯ into an overflow menu than truncate a long subtitle
      subtitle: showSongTitle && variantName ? truncate(variantName, 28) : undefined,
      titleMenu: hasMultipleVariants
        ? {
            title: t('variantsMenuTitle'),
            singleSelection: true,
            items: Object.entries(variants).map(([variantId, variant]) => ({
              menuId: variantId,
              title: variantTitle(variant),
              state: variantId === activeVariantId ? 'on' : 'off',
              sfSymbolName: isLyrics(variant) ? 'text.quote' : 'document',
            })),
          }
        : undefined,
      onPressTitleMenuItem: (e: { nativeEvent: { menuId: string } }) => setActiveVariantId(e.nativeEvent.menuId),
    },
  };

  const Root = isLargeTitle ? Fragment : View;

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
    // a large title tracks the screen's first scroll view, so don't wrap it in a View
    <Root {...(isLargeTitle ? {} : { style: { flex: 1, backgroundColor: background } })}>
      <Stack.Screen
        options={{
          headerBackground: isLargeTitle ? undefined : () => <HeaderBackground opaque />,
          headerLargeTitle: isLargeTitle,
          headerLargeTitleShadowVisible: false,
          // the large title sits on the green band below, which scrolls away with the content
          headerLargeTitleStyle: isLargeTitle ? { color: '#ffffff' } : undefined,
          ...(isLiquidGlassStyleHeader()
            ? {
                headerTitle: nativeHeader.title,
                // patched props (see patches/react-native-screens), so not in the published types
                unstable_nativeProps: { headerConfig: nativeHeader.headerConfig as object },
              }
            : {
                headerTitle: () => (
                  <HeaderTitle
                    scrollRef={showLyrics ? scrollRef : undefined}
                    titleLayout={titleLayout}
                    showTitle={isLyrics(activeVariant) ? undefined : true}
                    title={title}
                    subtitle={subtitle}
                    // the variant menu lives in the title here, as the native title menu does on Liquid Glass
                    titleWrapper={
                      hasMultipleVariants
                        ? (titleElement) => (
                            <VariantMenu
                              variants={variants}
                              activeVariantId={activeVariantId}
                              setActiveVariantId={setActiveVariantId}
                            >
                              {titleElement}
                            </VariantMenu>
                          )
                        : undefined
                    }
                    variantName={variantName}
                  />
                ),
              }),
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
        <ScrollViewWithHeader
          ref={scrollRef}
          style={[styles.scroll, isLargeTitle ? { backgroundColor: background } : null]}
          // a large title collapses only with system-managed insets
          contentInsetAdjustmentBehavior={isLargeTitle ? 'automatic' : undefined}
          contentContainerStyle={isLargeTitle ? { marginTop: 0 } : undefined}
        >
          {isLargeTitle ? (
            // HIG: brand color in the content layer, not the bar. It reaches up under the
            // transparent bar and the large title, across the full width.
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: -2000,
                height: 2000 + padding * 1.5,
                backgroundColor: primary,
              }}
            />
          ) : null}
          <View
            style={[
              styles.container,
              {
                paddingLeft: maxWidthPadding.paddingLeft,
                paddingRight: maxWidthPadding.paddingRight,
                paddingTop: isLargeTitle ? padding * 3 : undefined,
                // room for the player
                paddingBottom: activeMedia
                  ? Math.max(inset.bottom + padding * 2 + playerHeight, padding * 4 + playerHeight)
                  : Math.max(inset.bottom + padding * 2, padding * 4),
              },
            ]}
          >
            {isLargeTitle ? null : (
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
            )}

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
        <View style={{ flex: 1, paddingTop: process.env.EXPO_OS === 'android' ? headerHeight : undefined }}>
          {/* TODO scroll is off on load? */}
          <Pdf
            source={{ uri: activeVariant.URL, cache: true }}
            style={{ width: '100%', flex: 1, backgroundColor: 'transparent' }}
            // the default (true) skips TLS certificate validation on every platform;
            // https://github.com/wonday/react-native-pdf/issues/837 is why it was first turned off on Android
            trustAllCerts={false}
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
      {process.env.EXPO_OS === 'ios' ? (
        // native toolbar items and a player sheet (a classic UIToolbar before iOS 26)
        <SongToolbar
          title={title}
          media={media}
          activeMediaId={activeMediaId}
          setActiveMediaId={setActiveMediaId}
          audio={audio}
        />
      ) : activeMedia ? (
        <Player media={media} activeMediaId={activeMediaId} setActiveMediaId={setActiveMediaId} audio={audio} />
      ) : null}
    </Root>
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
    marginTop: padding * 2,
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
