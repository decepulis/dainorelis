import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import Button from '@/lib/components/Button';
import Header, { useHeaderScroll } from '@/lib/components/Header';
import IndexSearch from '@/lib/components/IndexSearch';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SegmentedControl from '@/lib/components/SegmentedControl';
import SystemView from '@/lib/components/SystemView';
import ThemedText from '@/lib/components/ThemedText';
import { fonts } from '@/lib/constants/themes';
import useDefaultHeaderHeight from '@/lib/hooks/useDefaultHeaderHeight';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Song, SongFile } from '@/lib/schemas/songs';
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
  sections.sort((a, b) => a.title.localeCompare(b.title));
  return sections;
};

const margin = 20;
const padding = 20;

function HeaderTitle() {
  const inset = useSafeAreaInsets();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  return (
    <Image
      source={require('@/assets/images/logo_white.png')}
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

export default function Index() {
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');
  const { value: favorites } = useStorage('favorites');
  const [filter, setFilter] = useState<'allSongs' | 'favoriteSongs'>('allSongs');
  const [searchText, setSearchText] = useState('');
  const [searchHeight, setSearchHeight] = useState(80); // Default initial value

  const filteredSongs = groupSongsByLetter(songs);
  const lastSection = filteredSongs[filteredSongs.length - 1];

  const scrollRef = useAnimatedRef<AnimatedScrollView>();
  const titleRef = useRef<View>(null);
  // const { scrollHandler, isTitleBehind } = useHeaderScroll(titleRef);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              scrollRef={scrollRef}
              controls={
                <Link href="/nustatymai" asChild>
                  <Button>
                    <FontAwesome6 name="sliders" size={14} color="#fff" />
                  </Button>
                </Link>
              }
              isTitleBehind={true}
              center
              hideBack
            >
              <HeaderTitle />
            </Header>
          ),
          headerTransparent: true, // I know it's not transparent, but this is what positions the header correctly
        }}
      />
      <View style={styles.container}>
        <Image
          style={[StyleSheet.absoluteFillObject, { height: Math.min(400 + inset.top, height / 2) }]}
          source={require('@/assets/images/miskas-fade-9.png')}
          contentFit="cover"
        ></Image>
        <ScrollViewWithHeader ref={scrollRef} onScroll={scrollHandler} stickyHeaderIndices={[1]}>
          <View
            ref={titleRef}
            style={[
              styles.logoContainer,
              {
                marginTop: 80 - defaultHeaderHeight + inset.top,
                width: Math.min(width - 80, 320),
              },
            ]}
          >
            <Image
              style={StyleSheet.absoluteFillObject}
              source={require('@/assets/images/logo_white.png')}
              contentFit="contain"
            />
          </View>
          <IndexSearch
            filter={filter}
            setFilter={setFilter}
            setSearchText={setSearchText}
            setSearchHeight={setSearchHeight}
            margin={margin}
            padding={padding}
            scrollY={scrollY}
          />
          <SystemView
            variant="background"
            style={[
              styles.blurContainer,
              {
                marginTop: -(searchHeight + padding),
                paddingTop: searchHeight + padding,
                marginBottom: inset.bottom + 40,
              },
            ]}
          >
            <SectionList
              scrollEnabled={false}
              sections={filteredSongs}
              renderSectionHeader={({ section }) => (
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
              )}
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
            />
          </SystemView>
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
    aspectRatio: 747 / 177,
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
});
