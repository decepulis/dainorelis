import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-screens/experimental';
import { scheduleOnRN } from 'react-native-worklets';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useHeaderHeight } from 'expo-router/react-navigation';
import type { GenerateMetadataFunction } from 'expo-router/server';

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
import Pdf from '@/lib/components/Pdf';
import Player, { playerHeight } from '@/lib/components/Player';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SongMenu, { AddToPlaylistMenu, SongDetailToolbar, useSongOverflowMenu } from '@/lib/components/SongMenu';
import SongToolbar from '@/lib/components/SongToolbar';
import ThemedText from '@/lib/components/ThemedText';
import VariantMenu from '@/lib/components/VariantMenu';
import floatingBottomGap from '@/lib/constants/floatingBottomGap';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { fonts } from '@/lib/constants/themes';
import useContentColumnStyle from '@/lib/hooks/useContentColumnStyle';
import useHasHydrated from '@/lib/hooks/useHasHydrated';
import useSongAudio from '@/lib/hooks/useSongAudio';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Audio } from '@/lib/schemas/audio';
import { Lyrics as LyricsType } from '@/lib/schemas/lyrics';
import { PDFs } from '@/lib/schemas/pdfs';
import { Song } from '@/lib/schemas/songs';
import isLyrics from '@/lib/utils/isLyrics';
import { siteMetadata, songMetadata, songPageTitle } from '@/lib/utils/pageMetadata';
import useTitle from '@/lib/utils/useTitle';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export const generateMetadata: GenerateMetadataFunction = (_request, params) => {
  const song = songs.find((song) => song.id === params.id);
  return song ? songMetadata(song) : siteMetadata;
};

// Liquid Glass's player: false puts info and play/pause in the native bottom toolbar, with the full player in a
// sheet (UIKit places the items, e.g. in the closed iPhone Duo's trailing bar); true uses the floating player that
// springs open in place, as before iOS 26 and on Android. A switch for comparing the two
const floatingPlayerOnLiquidGlass = false;

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
  const onPrimary = useThemeColor('onPrimary');
  const chrome = useThemeColor('chrome');
  const background = useThemeColor('background');
  const headerHeight = useHeaderHeight();
  const inset = useSafeAreaInsets();
  const contentColumn = useContentColumnStyle();
  const hasHydrated = useHasHydrated();
  const { value: showChords } = useStorage('showChords');
  const { value: activeVariantIdBySongId, setValue: setActiveVariantIdBySongId } =
    useStorage('activeVariantIdBySongId');
  const { value: activeMediaIdBySongId, setValue: setActiveMediaIdBySongId } = useStorage('activeMediaIdBySongId');

  // ?v= / ?m= only exist once the user picks from a menu (or a link carries them)
  // (web: not before hydration, since the statically rendered page has no query)
  const searchParams = useLocalSearchParams<{ v?: string; m?: string }>();
  const { v: variantIdParam, m: mediaIdParam } = hasHydrated ? searchParams : {};

  const { id } = song;

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

  // Liquid Glass: a native title with the variant as its subtitle and a title menu to switch variants
  // (our react-native-screens patch). At rest the big title is on screen, so the nav title is the
  // variant alone; past it (or over a PDF) it's the song, with the variant as the subtitle.
  const scrollOffset = useScrollOffset(showLyrics ? scrollRef : null);
  const [isPastTitle, setIsPastTitle] = useState(false);
  // whether the PDF failed to load, and a key that remounts <Pdf> to retry. Switching variants clears the error
  // (adjusted during render, so the new variant's first render already has it cleared), and coming back to the
  // PDF mounts a new <Pdf>, which tries again
  const [pdfFailed, setPdfFailed] = useState(false);
  const [pdfAttempt, setPdfAttempt] = useState(0);
  const [pdfVariantId, setPdfVariantId] = useState(activeVariantId);
  if (pdfVariantId !== activeVariantId) {
    setPdfVariantId(activeVariantId);
    setPdfFailed(false);
  }
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
  const overflowMenu = useSongOverflowMenu(song, hasChords);
  const variantTitle = (variant: LyricsType | PDFs) =>
    i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'];
  const nativeHeader = {
    title: showSongTitle ? title : (variantName ?? ''),
    headerConfig: {
      // the variant (whose pop-up sits under the large title), else the title's parenthetical, e.g. Lietuva
      // (Kokia nuostabi); truncated, so a long one doesn't crowd the title and the bar buttons
      subtitle: showSongTitle && (variantName ?? subtitle) ? truncate((variantName ?? subtitle)!, 28) : undefined,
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
      // the song's other actions are in UIKit's overflow menu; pinned past its ⋯ button, Add to Playlist never joins them
      ...overflowMenu,
      pinsTrailingItems: true,
      // the large title lines up with the lyrics' centred column (useContentColumnStyle) where the bar is wider
      largeTitleMaxWidth: maxWidth,
    },
  };

  const Root = isLargeTitle ? Fragment : View;

  return (
    <>
      {/* a large title tracks the screen's first scroll view, so don't wrap it in a View */}
      <Root {...(isLargeTitle ? {} : { style: { flex: 1, backgroundColor: background } })}>
        {process.env.EXPO_OS === 'web' ? (
          <Head>
            <title>{songPageTitle(song)}</title>
          </Head>
        ) : null}
        <Stack.Screen
          options={{
            headerBackground: isLargeTitle ? undefined : () => <HeaderBackground opaque />,
            headerLargeTitle: isLargeTitle,
            headerLargeTitleShadowVisible: false,
            // the large title sits on the green band below, which scrolls away with the content
            headerLargeTitleStyle: isLargeTitle
              ? { fontFamily: fonts.titleSemiBold.fontFamily, color: '#ffffff' }
              : undefined,
            // the song's title in the bar: collapsed from the large title, or over a PDF
            headerTitleStyle: { fontFamily: fonts.titleSemiBold.fontFamily },
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
                    <AddToPlaylistMenu song={song} />
                    <SongMenu song={song} hasChords={hasChords} />
                  </HeaderButtonContainer>
                )
              : undefined,
          }}
        />
        <SongDetailToolbar song={song} />
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
                  backgroundColor: chrome,
                }}
              />
            ) : null}
            <View
              style={[
                contentColumn,
                {
                  paddingTop: isLargeTitle ? padding * 3 : undefined,
                  // room for the player
                  paddingBottom: activeMedia
                    ? Math.max(
                        inset.bottom + floatingBottomGap + padding * 2 + playerHeight,
                        padding * 4 + playerHeight
                      )
                    : Math.max(inset.bottom + padding * 2, padding * 4),
                },
              ]}
            >
              {isLargeTitle ? null : (
                // the custom header (Android, iOS 18): the bar stays green and the title is plain text
                <View style={[styles.titleContainer]} onLayout={calculateTitleHeight}>
                  <View style={styles.titleAndSubtitle}>
                    <ThemedText title bold style={styles.mainTitle}>
                      {title}
                    </ThemedText>
                    {subtitle ? (
                      <ThemedText title style={styles.subtitle}>
                        {subtitle}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              )}

              {isLargeTitle && variantName && subtitle ? (
                // under a large title the variant's pop-up takes the subtitle, so the title's parenthetical
                // (Lietuvos himnas (Tautiška giesmė)) leads the lyrics, as it does under the custom header's title
                <ThemedText title style={styles.largeTitleParenthetical}>
                  {subtitle}
                </ThemedText>
              ) : null}
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
          // the sheet music runs edge to edge vertically but stays clear of the horizontal safe area
          // (landscape notches, the closed iPhone Duo's toolbar strip), measured natively for this screen
          <SafeAreaView
            edges={{ left: true, right: true }}
            style={
              process.env.EXPO_OS === 'web'
                ? { flex: 1, paddingTop: headerHeight }
                : { paddingTop: process.env.EXPO_OS === 'android' ? headerHeight : undefined }
            }
          >
            {pdfFailed ? (
              <View
                style={[
                  styles.pdfError,
                  {
                    // iOS draws the PDF under the transparent header and lets PDFKit inset it; this view has to clear it
                    paddingTop: process.env.EXPO_OS === 'ios' ? headerHeight + padding : padding,
                    // clear the floating player, or the native toolbar on Liquid Glass
                    paddingBottom:
                      inset.bottom +
                      padding +
                      (activeMedia ? floatingBottomGap + playerHeight : isLiquidGlassStyleHeader() ? 44 + padding : 0),
                  },
                ]}
              >
                <FontAwesome6
                  name="file-circle-exclamation"
                  iconStyle="solid"
                  size={44}
                  color={text}
                  style={styles.pdfErrorIcon}
                />
                <ThemedText bold style={styles.pdfErrorTitle}>
                  {t('pdfErrorTitle')}
                </ThemedText>
                <ThemedText style={styles.pdfErrorHint} lineBreakStrategyIOS="push-out">
                  {t('pdfErrorHint')}
                </ThemedText>
                <Button
                  noGlass
                  hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  style={styles.pdfErrorButton}
                  innerStyle={[styles.pdfErrorButtonInner, { backgroundColor: primary }]}
                  accessibilityLabel={t('tryAgain')}
                  onPress={() => {
                    setPdfFailed(false);
                    setPdfAttempt(pdfAttempt + 1);
                  }}
                >
                  <ThemedText bold style={[styles.pdfErrorButtonText, { color: onPrimary }]}>
                    {t('tryAgain')}
                  </ThemedText>
                </Button>
              </View>
            ) : (
              <Pdf
                key={`${activeVariant.URL}#${pdfAttempt}`}
                source={{ uri: activeVariant.URL, cache: true }}
                style={{
                  width: '100%',
                  flex: 1,
                  backgroundColor: 'transparent',
                  // (patched) keeps the last page clear of the floating player: on iOS a content inset the pages scroll
                  // under the player through (PDFKit already insets the bottom safe area, and Liquid Glass's native
                  // toolbar raises it), on Android, which has no inset, the pages end above it
                  paddingBottom:
                    activeMedia && !(isLiquidGlassStyleHeader() && !floatingPlayerOnLiquidGlass)
                      ? Math.max(inset.bottom + floatingBottomGap, padding) +
                        playerHeight -
                        (process.env.EXPO_OS === 'ios' ? inset.bottom : 0)
                      : 0,
                }}
                // the default (true) skips TLS certificate validation on every platform;
                // https://github.com/wonday/react-native-pdf/issues/837 is why it was first turned off on Android
                trustAllCerts={false}
                fitPolicy={0}
                minScale={0.5}
                maxScale={4}
                spacing={padding}
                onError={(error) => {
                  console.warn(error);
                  setPdfFailed(true);
                }}
                renderActivityIndicator={(progress) => (
                  <View style={styles.pdfLoading}>
                    <ActivityIndicator size="large" color={primary} />
                    {/* 0..1 while downloading; nothing to show before the first bytes or for a cached file */}
                    {progress > 0 && progress < 1 ? (
                      <ThemedText style={styles.pdfProgress}>{Math.round(progress * 100)}%</ThemedText>
                    ) : null}
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        )}
      </Root>
      {/* outside Root: on Liquid Glass its type changes between lyrics and a PDF, which remounted the player and
      stopped the recording. On web the server has no audio element to render a player with */}
      {hasHydrated ? (
        <SongAudio title={title} media={media} activeMediaId={activeMediaId} setActiveMediaId={setActiveMediaId} />
      ) : null}
    </>
  );
}

type SongAudioProps = {
  title: string;
  media: { [id: string]: Audio };
  activeMediaId: string | undefined;
  setActiveMediaId: (id: string) => void;
};

/**
 * Owns the audio player and renders its controls. The player lives here rather than in Player, so the controls can
 * move (into the native bottom toolbar on Liquid Glass) or remount without restarting playback.
 */
function SongAudio({ title, media, activeMediaId, setActiveMediaId }: SongAudioProps) {
  const activeMedia = activeMediaId ? media[activeMediaId] : null;
  const audio = useSongAudio(title, activeMedia);
  return isLiquidGlassStyleHeader() && !floatingPlayerOnLiquidGlass ? (
    // native toolbar items and a player sheet
    <SongToolbar
      title={title}
      media={media}
      activeMediaId={activeMediaId}
      setActiveMediaId={setActiveMediaId}
      audio={audio}
    />
  ) : activeMedia ? (
    <Player media={media} activeMediaId={activeMediaId} setActiveMediaId={setActiveMediaId} audio={audio} />
  ) : null;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  titleContainer: {
    position: 'relative',
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
  largeTitleParenthetical: {
    fontSize: 17,
    opacity: 0.7,
    marginBottom: padding,
  },
  pdfLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: padding / 2,
  },
  pdfProgress: {
    fontVariant: ['tabular-nums'],
    opacity: 0.8,
  },
  // the look of the list's empty states (lib/components/Index/Errors.tsx)
  pdfError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: padding * 2,
  },
  pdfErrorIcon: {
    opacity: 0.5,
    marginBottom: padding,
  },
  pdfErrorTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: padding / 2,
  },
  pdfErrorHint: {
    fontSize: 18,
    lineHeight: 18 * 1.33,
    opacity: 0.8,
    textAlign: 'center',
    maxWidth: 400,
  },
  pdfErrorButton: {
    marginTop: padding * 1.5,
  },
  pdfErrorButtonInner: {
    width: 'auto',
    height: 44,
    flexBasis: 'auto',
    borderRadius: 22,
    paddingHorizontal: padding,
  },
  pdfErrorButtonText: {
    fontSize: 17,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    marginTop: padding * 2,
    marginBottom: padding * 2,
  },
});
