import React, { memo, startTransition, useCallback, useState } from 'react';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';

import Button from '@/lib/components/Button';
import { HeaderBackground, HeaderButtonContainer, HeaderTitle } from '@/lib/components/Header';
import { NoFavorites, NoHits } from '@/lib/components/Index/Errors';
import HeaderLogo from '@/lib/components/Index/HeaderLogo';
import { ListHeader, ListItem } from '@/lib/components/Index/ListItem';
import Search from '@/lib/components/Index/Search';
import { useContentContainerStyle } from '@/lib/components/ScrollViewWithHeader';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import useSongList, { SongListItem, useManualItems } from '@/lib/hooks/useSongList';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

const MemoListItem = memo(ListItem);
const MemoListHeader = memo(ListHeader);

export default function Index() {
  // just a bunch of global state
  const inset = useSafeAreaInsets();
  const { width, height } = useSafeAreaFrame();
  const headerHeight = useHeaderHeight();
  const { setDidBackgroundLoad, setDidLogoLoad } = useDidImagesLoad();
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');
  const card0 = useThemeColor('card0');
  const separator = useThemeColor('separator');
  const { value: favorites } = useStorage('favorites');
  const contentContainerStyle = useContentContainerStyle();

  // list state
  const [isFavorites, setIsFavorites] = useState(false);
  const [isSongFestivalMode, setIsSongFestivalMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const listItems = useSongList({ isFavorites, isSongFestivalMode, searchText });
  const manualListItems = useManualItems({ isSongFestivalMode });

  // some heights and stuff we need to know for layout and animation
  const wideLayoutMode = width > maxWidth;
  const ultraWideLayoutMode = wideLayoutMode && width / height >= 4 / 3;

  const listRef = useAnimatedRef<Animated.FlatList<any>>();
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = useCallback(
    (event: LayoutChangeEvent) => {
      titleLayout.value = event.nativeEvent.layout;
    },
    [titleLayout]
  );
  const [searchHeight, setSearchHeight] = useState(0);

  const logoContainerAspectRatio = 747 / 177;
  const logoContainerWidth = Math.min(width - 80, 360);
  const logoContainerHeight = logoContainerWidth / logoContainerAspectRatio;
  const logoContainerPaddingTop = 80 + inset.top - headerHeight + 10;
  const logoContainerPaddingBottom = 80 + padding;

  // rendering
  const renderItem = useCallback(
    ({ item, index }: { item: SongListItem; index: number }) =>
      item.type === 'render' ? (
        item.id === 'search' ? (
          <Search
            scrollRef={listRef}
            isFavorites={isFavorites}
            setIsFavorites={(isFavorites) => startTransition(() => setIsFavorites(isFavorites))}
            isSongFestivalMode={isSongFestivalMode}
            setIsSongFestivalMode={(isSongFestivalMode) =>
              startTransition(() => {
                setIsSongFestivalMode(isSongFestivalMode);
                setSearchText('');
              })
            }
            setSearchText={(text) => startTransition(() => setSearchText(text))}
            setSearchHeight={setSearchHeight}
          />
        ) : (
          <View
            style={[
              styles.searchBackground,
              {
                marginTop: -searchHeight,
                paddingTop: searchHeight,
                backgroundColor: background,
              },
            ]}
          />
        )
      ) : item.type === 'header' ? (
        <MemoListHeader title={item.item} background={background} separator={separator} />
      ) : (
        <MemoListItem
          item={item.item}
          primary={primary}
          favorites={favorites}
          background={background}
          separator={separator}
          isLast={index === listItems.length - 1}
        />
      ),
    [
      background,
      favorites,
      isFavorites,
      isSongFestivalMode,
      listItems.length,
      listRef,
      primary,
      searchHeight,
      separator,
    ]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground scrollRef={listRef} shadow={false} />,
          headerTitleAlign: 'center',
          headerTitle: () => (
            <HeaderTitle scrollRef={listRef} titleLayout={titleLayout}>
              <HeaderLogo headerHeight={headerHeight} onLoadEnd={() => setDidLogoLoad(true)} />
            </HeaderTitle>
          ),
          headerRight: () => (
            <HeaderButtonContainer>
              <Link href="/nustatymai" asChild>
                <Button>
                  <FontAwesome6 name="sliders" size={16} color="#fff" />
                </Button>
              </Link>
            </HeaderButtonContainer>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: wideLayoutMode ? card0 : undefined }]}>
        <Image
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: ultraWideLayoutMode
              ? height
              : (logoContainerPaddingTop + logoContainerHeight + logoContainerPaddingBottom) * 2,
          }}
          source={require('@/assets/images/miskas_fade_10.png')}
          onLoadEnd={() => setDidBackgroundLoad(true)}
          contentFit="cover"
          contentPosition="bottom"
        ></Image>
        <Animated.FlatList
          // todo reduce jank by telling it about height
          // todo add jump-to-letter bar
          ref={listRef}
          data={listItems}
          stickyHeaderIndices={[1]}
          renderItem={renderItem}
          keyboardDismissMode="on-drag"
          contentContainerStyle={contentContainerStyle}
          ListHeaderComponent={
            <View
              onLayout={calculateTitleHeight}
              style={[
                styles.logoContainer,
                {
                  marginTop: logoContainerPaddingTop,
                  marginBottom: logoContainerPaddingBottom,
                  width: logoContainerWidth,
                  height: logoContainerHeight,
                },
              ]}
            >
              <Image
                style={StyleSheet.absoluteFillObject}
                source={require('@/assets/images/logo_white_v3.png')}
                contentFit="contain"
                onLoadEnd={() => setDidLogoLoad(true)}
              />
            </View>
          }
          ListFooterComponent={
            <View
              style={{
                width: '100%',
                maxWidth,
                marginHorizontal: 'auto',
                minHeight: wideLayoutMode ? padding : Math.max(inset.bottom, padding * 2),
                marginBottom: wideLayoutMode ? Math.max(inset.bottom, padding * 2) : undefined,
                backgroundColor: background,
                borderBottomLeftRadius: padding,
                borderBottomRightRadius: padding,
              }}
            >
              {listItems.length === manualListItems.length ? (
                <View
                  style={[
                    styles.listFooter,
                    {
                      // todo determine this number programmatically
                      minHeight: height / 2,
                    },
                  ]}
                >
                  {isFavorites ? <NoFavorites isSearch={searchText.length > 0} /> : <NoHits />}
                </View>
              ) : null}
            </View>
          }
        />
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
    position: 'relative',
  },
  searchBackground: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
    borderTopLeftRadius: padding,
    borderTopRightRadius: padding,
  },
  listFooter: {
    paddingHorizontal: padding,
    paddingVertical: padding * 2,
    alignItems: 'center',
  },
});
