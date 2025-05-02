import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  Pressable,
  SectionList,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import Button from '@/lib/components/Button';
import Header from '@/lib/components/Header';
import IndexSearch from '@/lib/components/IndexSearch';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SystemView from '@/lib/components/SystemView';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import useDefaultHeaderHeight from '@/lib/hooks/useDefaultHeaderHeight';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Song, SongFile } from '@/lib/schemas/songs';
import removeAccents from '@/lib/utils/removeAccents';
import songs from '@/songs';

const groupSongsByLetter = (songs: SongFile) => {
  const songsByLetter: { [letter: string]: Song[] } = {};

  songs.forEach((song) => {
    const firstLetter = song.fields.Name?.charAt(0).toUpperCase() || '#';
    const letterSongs = songsByLetter[firstLetter] || [];
    const newLetterSongs = [...letterSongs, song];
    songsByLetter[firstLetter] = newLetterSongs;
  });

  const sections = Object.entries(songsByLetter).map(([letter, songs]) => ({
    title: letter,
    data: songs,
  }));
  sections.sort((a, b) => a.title.localeCompare(b.title, 'lt'));
  return sections;
};

const margin = 20;
const padding = 20;

function HeaderTitle() {
  const inset = useSafeAreaInsets();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  return (
    <Image
      source="logo_white_v2"
      style={[
        headerStyles.title,
        {
          height: Math.min((defaultHeaderHeight - inset.top) * 0.75, 30),
        },
      ]}
      contentFit="contain"
    />
  );
}
const headerStyles = StyleSheet.create({
  title: {
    aspectRatio: 747 / 177,
  },
});

const NoHits = () => {
  const { t } = useTranslation();
  return <ThemedText style={errorStyles.text}>{t('noHits')}</ThemedText>;
};

const NoFavorites = () => {
  const { t } = useTranslation();
  return (
    <ThemedText style={errorStyles.text}>
      {t('noFavorites1')} <FontAwesome6 name="heart" size={14} /> {t('noFavorites2')}
    </ThemedText>
  );
};

const errorStyles = StyleSheet.create({
  text: {
    fontSize: 17,
    lineHeight: 22.5,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default function Index() {
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  const card0 = useThemeColor('card0');
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');
  const { value: favorites } = useStorage('favorites');
  const [_pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'allSongs' | 'favoriteSongs'>('allSongs');
  const [searchText, setSearchText] = useState('');
  const [searchHeight, setSearchHeight] = useState(80); // Default initial value

  const scrollRef = useAnimatedRef<AnimatedScrollView>();
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = useCallback(
    (event: LayoutChangeEvent) => {
      titleLayout.value = event.nativeEvent.layout;
    },
    [titleLayout]
  );

  const { filteredSections, showHeaders } = useMemo(() => {
    let filteredSongs = songs;
    let showHeaders = true;
    // first, filter by the filters
    if (filter === 'favoriteSongs') {
      filteredSongs = songs.filter((song) => favorites.includes(song.id));
    }

    // then, filter by the search query
    if (searchText) {
      filteredSongs = filteredSongs.filter((song) => {
        const songName = song.fields.Name;
        if (songName) {
          return removeAccents(songName.toLowerCase()).includes(removeAccents(searchText.toLowerCase()));
        }
        return false;
      });
    }

    if (filteredSongs.length < 10) {
      showHeaders = false;
    }

    // finally, sort into sections
    const filteredSections = groupSongsByLetter(filteredSongs);

    return { filteredSections, showHeaders };
  }, [favorites, filter, searchText]);

  // for a few reasons, it's useful to know how many items we have
  const itemCount = useMemo(
    () => filteredSections.reduce((acc, section) => acc + section.data.length, 0),
    [filteredSections]
  );
  const resultStatus: 'results' | 'no-hits' | 'no-favorites' = useMemo(() => {
    if (searchText.length > 0 && itemCount === 0) {
      return 'no-hits';
    }
    if (filter === 'favoriteSongs' && itemCount === 0) {
      return 'no-favorites';
    }
    return 'results';
  }, [filter, itemCount, searchText]);

  const lastSection = filteredSections[filteredSections.length - 1];

  // we could do this with css aspect ratio, but we need the height for other reasons...
  const logoContainerAspectRatio = 747 / 177;
  const logoContainerWidth = Math.min(width - 80, 320);
  const logoContainerHeight = logoContainerWidth / logoContainerAspectRatio;

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              scrollRef={scrollRef}
              titleLayout={titleLayout}
              controls={
                <Link href="/nustatymai" asChild>
                  <Button>
                    <FontAwesome6 name="sliders" size={14} color="#fff" />
                  </Button>
                </Link>
              }
              center
              hideBack
              shadow={false}
            >
              <HeaderTitle />
            </Header>
          ),
          headerTransparent: true, // I know it's not transparent, but this is what positions the header correctly
        }}
      />
      <View style={[styles.container, { backgroundColor: card0 }]}>
        <Image
          style={[StyleSheet.absoluteFillObject, { height: (logoContainerHeight + 160 + inset.top) * 1.75 }]}
          source="miskas_fade_9"
          // TODO this break on widescreen (see iPad)
          contentFit="cover"
        ></Image>
        <ScrollViewWithHeader ref={scrollRef} stickyHeaderIndices={[1]}>
          <View
            onLayout={calculateTitleHeight}
            style={[
              styles.logoContainer,
              {
                marginTop: 80 - defaultHeaderHeight + inset.top,
                width: logoContainerWidth,
                height: logoContainerHeight,
              },
            ]}
          >
            <Image style={StyleSheet.absoluteFillObject} source="logo_white_v2" contentFit="contain" />
          </View>
          <IndexSearch
            scrollRef={scrollRef}
            filter={filter}
            setFilter={(filter) => startTransition(() => setFilter(filter))}
            searchText={searchText}
            setSearchText={(text) => startTransition(() => setSearchText(text))}
            setSearchHeight={setSearchHeight}
            margin={margin}
            padding={padding}
          />
          <View style={{ width: '100%', maxWidth: maxWidth, marginHorizontal: 'auto' }}>
            <SystemView
              variant="background"
              style={[
                styles.blurContainer,
                {
                  minHeight:
                    // TODO this calculation isn't really working on android so I'm probably doing something wrong
                    height - defaultHeaderHeight - logoContainerHeight - searchHeight - inset.top - inset.bottom - 40,
                  marginTop: -(searchHeight + padding - padding / 4),
                  paddingTop: searchHeight + padding - padding / 4,
                  marginBottom: Math.max(inset.bottom, margin),
                },
              ]}
            >
              <SectionList
                scrollEnabled={false}
                sections={filteredSections}
                renderSectionHeader={({ section }) =>
                  showHeaders ? (
                    <ThemedText
                      bold
                      style={[
                        styles.sectionHeader,
                        {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: `${text}80`,
                        },
                      ]}
                    >
                      {section.title}
                    </ThemedText>
                  ) : null
                }
                renderItem={({ item, section, index }) => {
                  const isLast = section.title === lastSection.title && index === lastSection.data.length - 1;
                  return (
                    <Link
                      style={[
                        styles.itemContainer,
                        {
                          borderBottomColor: `${text}66`,
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                        },
                      ]}
                      href={`/dainos/${item.id}`}
                      asChild
                    >
                      <Pressable>
                        <ThemedText style={styles.itemText}>{item.fields.Name}</ThemedText>
                        {favorites.includes(item.id) ? (
                          <FontAwesome6 name="heart" size={20} color={primary} solid style={styles.itemHeart} />
                        ) : null}
                      </Pressable>
                    </Link>
                  );
                }}
                ListFooterComponent={
                  resultStatus !== 'results' ? (
                    <View style={[styles.listFooter]}>
                      {resultStatus === 'no-hits' ? (
                        <NoHits />
                      ) : resultStatus === 'no-favorites' ? (
                        <NoFavorites />
                      ) : null}
                    </View>
                  ) : null
                }
              />
            </SystemView>
          </View>
        </ScrollViewWithHeader>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    marginHorizontal: 'auto',
    marginBottom: 80 + padding,
    position: 'relative',
  },
  blurContainer: {
    marginHorizontal: margin,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    marginLeft: padding,
    paddingRight: padding,
    paddingVertical: 18,
    fontSize: 18,
  },
  itemContainer: {
    marginLeft: padding,
    paddingRight: padding,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 18,
    letterSpacing: -0.1,
    flex: 1,
  },
  itemHeart: {
    width: 20,
    height: 20,
    flexShrink: 0,
    flexBasis: 20,
    marginLeft: 20,
  },
  listFooter: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
});
