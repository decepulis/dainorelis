import React, { startTransition, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';

import { FontAwesome6 } from '@expo/vector-icons';

import Button from '@/lib/components/Button';
import {
  HeaderBackground,
  HeaderButtonContainer,
  HeaderTitle,
  isLiquidGlassStyleHeader,
} from '@/lib/components/Header';
import { NoFavorites, NoHits } from '@/lib/components/Index/Errors';
import HeaderLogo from '@/lib/components/Index/HeaderLogo';
import { ListHeader, ListItem, listItemHeight } from '@/lib/components/Index/ListItem';
import Search, { IndexToolbar } from '@/lib/components/Index/Search';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import useSongList, { SongListItem, useManualItems } from '@/lib/hooks/useSongList';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

export default function Index() {
  // just a bunch of global state
  const inset = useSafeAreaInsets();
  const { width, height } = useSafeAreaFrame();
  const headerHeight = useHeaderHeight();
  const { setDidBackgroundLoad, setDidLogoLoad, setDidWordmarkLoad } = useDidImagesLoad();
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');
  const card0 = useThemeColor('card0');
  const separator = useThemeColor('separator');
  const { t } = useTranslation();

  // list state
  const [isFavorites, setIsFavorites] = useState(false);
  const [isSongFestivalMode, setIsSongFestivalMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const listItems = useSongList({ isFavorites, isSongFestivalMode, searchText });
  const manualListItems = useManualItems({ isSongFestivalMode });

  const showPlaylistHeader = isLiquidGlassStyleHeader() && isFavorites;
  const displayItems = showPlaylistHeader
    ? [{ type: 'header' as const, item: t('favoriteSongs'), id: 'playlistHeader' }, ...listItems]
    : listItems;

  // some heights and stuff we need to know for layout and animation
  const wideLayoutMode = width > maxWidth;
  const ultraWideLayoutMode = wideLayoutMode && width / height >= 4 / 3;

  const listRef = useAnimatedRef<Animated.FlatList<any>>();
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = useCallback(
    (event: LayoutChangeEvent) => {
      titleLayout.set(event.nativeEvent.layout);
    },
    [titleLayout]
  );

  const logoContainerAspectRatio = 747 / 177;
  const logoContainerWidth = Math.min(width - 80, 360);
  const logoContainerHeight = logoContainerWidth / logoContainerAspectRatio;
  const logoContainerPaddingTop = 100 + inset.top + 5; // idk why 5 it looks good
  const logoContainerPaddingBottom = 100 + padding;

  const footerMinHeight = wideLayoutMode ? padding : Math.max(inset.bottom, padding * 2);
  const visibleListItems = listItems.filter((item) => listItems.length > 10 || item.type !== 'header');
  const footerTargetHeight =
    height - visibleListItems.length * listItemHeight - headerHeight + padding + padding - padding / 4;
  const footerHeight = Math.max(footerMinHeight, footerTargetHeight);

  // rendering
  const renderItem = ({ item, index }: { item: SongListItem; index: number }) =>
    item.type === 'header' ? (
      listItems.length > 10 || item.id === 'playlistHeader' ? (
        <ListHeader title={item.item} background={background} separator={separator} />
      ) : null
    ) : (
      <ListItem
        item={item.item}
        primary={primary}
        background={background}
        separator={separator}
        isLast={index === displayItems.length - 1}
      />
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground scrollRef={listRef} />,
          headerTitleAlign: 'center',
          headerTitle: () => (
            <HeaderTitle scrollRef={listRef} titleLayout={titleLayout} center>
              <HeaderLogo headerHeight={headerHeight} onLoadEnd={() => setDidWordmarkLoad(true)} />
            </HeaderTitle>
          ),
          headerRight: !isLiquidGlassStyleHeader()
            ? () => (
                <HeaderButtonContainer>
                  <Link href="/nustatymai" asChild>
                    <Button>
                      <FontAwesome6 name="sliders" size={16} color="#fff" />
                    </Button>
                  </Link>
                </HeaderButtonContainer>
              )
            : undefined,
        }}
      />
      <IndexToolbar
        listRef={listRef}
        scrollToSearchOffset={logoContainerPaddingTop + logoContainerHeight + logoContainerPaddingBottom - headerHeight}
        isFavorites={isFavorites}
        setIsFavorites={(v) => startTransition(() => setIsFavorites(v))}
        setSearchText={(text) => startTransition(() => setSearchText(text))}
      />
      <View style={[styles.container, { backgroundColor: wideLayoutMode ? card0 : undefined }]}>
        <Animated.FlatList
          // todo reduce jank by telling it about height
          // todo add jump-to-letter bar
          ref={listRef}
          data={displayItems}
          renderItem={renderItem}
          keyboardDismissMode="on-drag"
          // contentContainerStyle={contentContainerStyle}
          ListHeaderComponent={
            <View
              style={{
                position: 'relative',
                height: logoContainerPaddingTop + logoContainerHeight + logoContainerPaddingBottom,
                paddingTop: logoContainerPaddingTop,
                paddingBottom: logoContainerPaddingBottom,
              }}
            >
              {/* the background itself */}
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
              {/* feather the top for overscroll */}
              <LinearGradient
                colors={[`${background}`, `${background}00`]}
                style={{
                  position: 'absolute',
                  top: 0,
                  height: 50,
                  left: 0,
                  right: 0,
                }}
              />
              {/* the logo is separate so we can measure its extents */}
              <View
                onLayout={calculateTitleHeight}
                style={[
                  styles.logoContainer,
                  {
                    width: logoContainerWidth,
                    height: logoContainerHeight,
                  },
                ]}
              >
                <Image
                  style={StyleSheet.absoluteFill}
                  source={require('@/assets/images/logo_white_v3.png')}
                  contentFit="contain"
                  onLoadEnd={() => setDidLogoLoad(true)}
                />
              </View>
            </View>
          }
          ListFooterComponent={
            <View
              style={{
                width: '100%',
                maxWidth,
                marginHorizontal: 'auto',
                minHeight: footerHeight,
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
                      minHeight: height - headerHeight,
                    },
                  ]}
                >
                  {isFavorites ? <NoFavorites isSearch={searchText.length > 0} /> : <NoHits />}
                </View>
              ) : null}
            </View>
          }
        />
        {!isLiquidGlassStyleHeader() && (
          <Search
            scrollRef={listRef}
            top={logoContainerPaddingTop + logoContainerHeight + logoContainerPaddingBottom - headerHeight}
            isFavorites={isFavorites}
            setIsFavorites={(isFavorites) => startTransition(() => setIsFavorites(isFavorites))}
            isSongFestivalMode={isSongFestivalMode}
            setIsSongFestivalMode={(isSongFestivalMode) =>
              startTransition(() => {
                setIsSongFestivalMode(isSongFestivalMode);
              })
            }
            setSearchText={(text) => startTransition(() => setSearchText(text))}
          />
        )}
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
