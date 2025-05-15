import { Fragment, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, LayoutRectangle, Platform, StyleSheet, View } from 'react-native';
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
  const headerHeight = useHeaderHeight();
  const inset = useSafeAreaInsets();
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const maxWidthPadding = useMaxWidthPadding();

  const { id } = useLocalSearchParams();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]) as Song;

  // Variants
  // TODO blocker persist last used variant in storage
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const variants: (LyricsType | PDFs)[] = useMemo(
    () => [...(song.fields.Lyrics || []), ...(song.fields.PDFs || [])],
    [song]
  );
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
  // TODO blocker persist last used media in storage
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const media: Audio[] = useMemo(() => [...(song.fields.Audio || [])], [song]);
  const activeMedia = useMemo(() => media[activeMediaIndex], [media, activeMediaIndex]);

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

  return (
    <Fragment>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground opaque />,
          // TODO can I force this to re-render when activeVariant changes?
          headerTitle: () => (
            <HeaderTitle
              scrollRef={scrollRef}
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
              <SongMenu song={song} />
            </HeaderButtonContainer>
          ),
        }}
      />
      {isLyrics(activeVariant) ? (
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
          {/* TODO BLOCKER scroll is off on load? */}
          <Pdf
            source={{ uri: activeVariant.URL, cache: true }}
            style={{ width: '100%', flex: 1, backgroundColor: 'transparent' }}
            // https://github.com/wonday/react-native-pdf/issues/837
            trustAllCerts={Platform.OS === 'android' ? false : undefined}
            onError={(error) => {
              Sentry.captureException(error);
            }}
            // TODO blocker do I throw an error when there's no internet?
            // TODO custom loading indicator
            // renderActivityIndicator={}
            // onLoadProgress={}
          />
        </View>
      )}
      <Player media={media} activeMediaIndex={activeMediaIndex} setActiveMediaIndex={setActiveMediaIndex} />
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
    flex: 1,
  },
  mainTitle: {
    flex: 1,
    fontSize: 28,
  },
  subtitle: {
    fontSize: 20,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    marginTop: padding * 2,
    marginBottom: padding * 2,
  },
});
