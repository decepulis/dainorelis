import React, { startTransition, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, useNativeGesture } from 'react-native-gesture-handler';
import { useKeyboardState } from 'react-native-keyboard-controller';
import Animated, { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import Button from '@/lib/components/Button';
import {
  HeaderBackground,
  HeaderButtonContainer,
  HeaderTitle,
  isLiquidGlassStyleHeader,
} from '@/lib/components/Header';
import { EmptyPlaylist, NoHits } from '@/lib/components/Index/Errors';
import HeaderLogo from '@/lib/components/Index/HeaderLogo';
import {
  ListHeader,
  ListItem,
  ReorderableListItem,
  RowPlaylist,
  closeOpenRow,
  listItemHeight,
} from '@/lib/components/Index/ListItem';
import Search, { IndexToolbar } from '@/lib/components/Index/Search';
import SectionIndex, {
  RowLayout,
  RowMeasurer,
  sectionIndexRowPadding,
  sectionIndexWidth,
} from '@/lib/components/Index/SectionIndex';
import { GetTheAppButton } from '@/lib/components/StoreLinks';
import ThemedText from '@/lib/components/ThemedText';
import floatingBottomGap from '@/lib/constants/floatingBottomGap';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import useFrame from '@/lib/hooks/useFrame';
import useHasHydrated from '@/lib/hooks/useHasHydrated';
import usePlaylistActions from '@/lib/hooks/usePlaylistActions';
import usePlaylists from '@/lib/hooks/usePlaylists';
import useSongList, { SongListItem, allSongItems } from '@/lib/hooks/useSongList';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import useTopScrollEdgeEffect from '@/lib/hooks/useTopScrollEdgeEffect';
import haptic from '@/lib/utils/haptic';
import { siteMetadata } from '@/lib/utils/pageMetadata';
import withAlpha from '@/lib/utils/withAlpha';

// a lifted row stays opaque (the default fades it) and keeps the default slight grow
const liftedRowAnimations = { opacity: 1 };
// the bottom bar's buttons, which the hint below a reorderable playlist stays clear of
const bottomBarHeight = 44;

// web: the static HTML's title and description
export const generateMetadata = () => siteMetadata;

export default function Index() {
  // just a bunch of global state
  const inset = useSafeAreaInsets();
  const { width, height } = useFrame();
  const { fontScale } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const { setDidBackgroundLoad, setDidLogoLoad } = useDidImagesLoad();
  const primary = useThemeColor('primary');
  const onPrimary = useThemeColor('onPrimary');
  const background = useThemeColor('background');
  const card0 = useThemeColor('card0');
  const separator = useThemeColor('separator');
  const { t } = useTranslation();

  const listRef = useAnimatedRef<Animated.FlatList<any>>();
  // The list's scrolling takes part in gesture handling, like the reorderable list's, so it and a row's swipe
  // settle who gets a touch. Otherwise, on Android, a row's swipe could take a scroll's touch partway in and
  // stop the list after a few pixels.
  const listScrollGesture = useNativeGesture({});
  // the list's scroll offset, shared by the header's scroll effects: a list that replaces another (a reorderable
  // playlist's, all songs') starts at the top without a scroll event, so it's reset here
  const scrollOffset = useSharedValue(0);
  const [searchText, setSearchText] = useState('');

  // list state: the selected playlist is remembered across launches
  const {
    playlist,
    selectedPlaylistId,
    setSelectedPlaylistId: storeSelectedPlaylistId,
    actions: playlistActions,
    onAction: onPlaylistAction,
    promptCreatePlaylist,
    dialogs,
  } = usePlaylistActions();
  const setSelectedPlaylistId = (id: string) => startTransition(() => storeSelectedPlaylistId(id));
  // Favorites and user playlists are always reorderable by dragging (but not their search results); all songs and
  // curated playlists aren't
  const isReorderable = playlist?.kind === 'favorites' || playlist?.kind === 'user';
  const isSearching = searchText.length > 0;
  const listItems = useSongList({ playlist, searchText });
  // what the rows show and their long-press menu toggles, worked out here once rather than in every row
  const { favorites, user, toggleSong, setSongIds } = usePlaylists();
  const favoriteIds = new Set(favorites.songIds);
  const userPlaylists: RowPlaylist[] = user.map((p) => ({ id: p.id, name: p.name, songIds: new Set(p.songIds) }));

  // Liquid Glass has no pill to name the playlist, so the list does
  const showPlaylistHeader = isLiquidGlassStyleHeader() && !!playlist;
  const displayItems = showPlaylistHeader
    ? [{ type: 'header' as const, item: playlist.name, id: 'playlistHeader' }, ...listItems]
    : listItems;

  // some heights and stuff we need to know for layout and animation. The list sits inside the
  // horizontal safe area (landscape notches, the closed iPhone Duo's toolbar strip); the forest doesn't.
  const safeWidth = width - inset.left - inset.right;
  const wideLayoutMode = safeWidth > maxWidth;
  const ultraWideLayoutMode = wideLayoutMode && width / height >= 4 / 3;

  // however a playlist gets picked (the menu, a new or duplicated playlist, a deleted one's fallback), it starts
  // from the very top: the forest and the logo above its name
  const { isReduceMotionEnabled, isBoldTextEnabled } = useAccessibilityInfo();
  const shownPlaylistId = useRef(selectedPlaylistId);
  useEffect(() => {
    if (shownPlaylistId.current === selectedPlaylistId) return;
    shownPlaylistId.current = selectedPlaylistId;
    listRef.current?.scrollToOffset({ offset: 0, animated: !isReduceMotionEnabled });
  }, [selectedPlaylistId, listRef, isReduceMotionEnabled]);
  // each reorderable playlist gets a fresh list (keyed below), and the FlatList comes back fresh after one
  const listKey = isReorderable ? playlist.id : 'flatList';
  const shownListKey = useRef(listKey);
  useEffect(() => {
    if (shownListKey.current === listKey) return;
    shownListKey.current = listKey;
    scrollOffset.set(0);
  }, [listKey, scrollOffset]);
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = (event: LayoutChangeEvent) => {
    titleLayout.set(event.nativeEvent.layout);
  };

  const logoContainerAspectRatio = 747 / 177;
  const logoContainerWidth = Math.min(safeWidth - 80, 360);
  const logoContainerHeight = logoContainerWidth / logoContainerAspectRatio;
  const logoContainerPaddingTop = 100 + inset.top + 5; // idk why 5 it looks good
  const logoContainerPaddingBottom = 100 + padding;

  const listHeaderHeight = logoContainerPaddingTop + logoContainerHeight + logoContainerPaddingBottom;

  // all songs, by letter, gets a jump-to-letter index. Rows wrap differently with the width and the text size, so
  // they're measured unseen first; the list then knows every row's place, and a section's header lands exactly
  const isAllSongs = !playlist;
  const hasHydrated = useHasHydrated();
  const [measuredLayouts, setMeasuredLayouts] = useState<RowLayout[] | null>(null);
  const rowLayouts =
    isAllSongs && !isSearching && measuredLayouts?.length === displayItems.length ? measuredLayouts : null;
  const getItemLayout = rowLayouts
    ? (_: unknown, index: number) => ({
        index,
        length: rowLayouts[index].height,
        offset: listHeaderHeight + rowLayouts[index].y,
      })
    : undefined;
  const indexSections = rowLayouts
    ? displayItems.flatMap((item, index) =>
        item.type === 'header' ? [{ letter: item.item, offset: listHeaderHeight + rowLayouts[index].y }] : []
      )
    : [];
  // the index shows with all songs; over the rows (not beside a wide layout's card), their icons keep clear of it
  const rowTrailingPadding =
    isAllSongs && (safeWidth - maxWidth) / 2 < sectionIndexWidth ? sectionIndexRowPadding : padding;
  const listContentHeight = useSharedValue(0);
  // the list keeps every row's measured layout, even once the row has scrolled away, and prefers it to
  // getItemLayout's; a new width or text size makes those stale, so the rows get new keys
  const rowKeySuffix = `${Math.round(safeWidth)}:${fontScale}:${isBoldTextEnabled}:${rowTrailingPadding}`;
  // the keyboard would cover it
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  // clear of the bottom bar's buttons (iOS 26 iPhone's toolbar, or the floating bar), which iPad doesn't have
  const isPadToolbar = isLiquidGlassStyleHeader() && Platform.OS === 'ios' && Platform.isPad;
  const sectionIndexStyle = {
    top: headerHeight + padding / 2,
    bottom: inset.bottom + (isPadToolbar ? 0 : floatingBottomGap + bottomBarHeight) + padding / 2,
    // wide, beside the list's card
    right: inset.right + Math.max(0, (safeWidth - maxWidth) / 2 - sectionIndexWidth),
  };

  const footerMinHeight = wideLayoutMode ? padding : Math.max(inset.bottom, padding * 2);
  const isHeaderVisible = (item: SongListItem) => listItems.length > 10 || item.id === 'playlistHeader';
  const visibleListItems = displayItems.filter((item) => item.type !== 'header' || isHeaderVisible(item));
  const footerTargetHeight =
    height - visibleListItems.length * listItemHeight - headerHeight + padding + padding - padding / 4;
  const footerHeight = Math.max(footerMinHeight, footerTargetHeight);

  // rendering
  const renderItem = ({ item, index }: { item: SongListItem; index: number }) =>
    item.type === 'header' ? (
      isHeaderVisible(item) ? (
        <ListHeader
          title={item.item}
          background={background}
          separator={separator}
          large={item.id === 'playlistHeader'}
        />
      ) : null
    ) : (
      <ListItem
        item={item.item}
        primary={primary}
        onPrimary={onPrimary}
        background={background}
        separator={separator}
        isLast={index === displayItems.length - 1}
        isFavorite={favoriteIds.has(item.item.id)}
        userPlaylists={userPlaylists}
        toggleSong={toggleSong}
        shownUserPlaylistId={userPlaylists.some((p) => p.id === selectedPlaylistId) ? selectedPlaylistId : undefined}
        onNewPlaylistWithSong={(songId) => promptCreatePlaylist([songId])}
        trailingPadding={rowTrailingPadding}
      />
    );

  // a reorderable playlist: its songs (no section headers), saved as they move. Songs since removed from the
  // songbook stay in the playlist, out of sight, at the end
  const reorderableItems = listItems.filter((item) => item.type === 'song');
  const moveSong = (from: number, to: number) => {
    if (!playlist || isSearching || to < 0 || to >= reorderableItems.length || from === to) return;
    const shownIds = reorderableItems.map((item) => item.id);
    const shown = new Set(shownIds);
    const hiddenIds = playlist.songIds.filter((id) => !shown.has(id));
    setSongIds(playlist.id, [...reorderItems(shownIds, from, to), ...hiddenIds]);
  };
  const renderReorderableItem = ({ item, index }: { item: SongListItem; index: number }) =>
    item.type === 'song' ? (
      <ReorderableListItem
        item={item.item}
        primary={primary}
        onPrimary={onPrimary}
        background={background}
        separator={separator}
        isLast={index === reorderableItems.length - 1}
        isFavorite={favoriteIds.has(item.item.id)}
        userPlaylists={userPlaylists}
        toggleSong={toggleSong}
        shownUserPlaylistId={userPlaylists.some((p) => p.id === selectedPlaylistId) ? selectedPlaylistId : undefined}
        onNewPlaylistWithSong={(songId) => promptCreatePlaylist([songId])}
        onMoveBy={(delta) => moveSong(index, index + delta)}
      />
    ) : null;

  // the bar's background appears as the list reaches it, past the forest and the logo
  const listTop = listHeaderHeight - headerHeight;
  const topScrollEdgeEffect = useTopScrollEdgeEffect(listTop);

  // wide, the list's card sits on a darker backdrop, which also shows above the forest when overscrolled. It's the
  // scroll view's own background: a background on a view around it would keep that view from being flattened away,
  // and react-native-screens and UIKit only find a scroll view at the start of the screen's view hierarchy (for the
  // navigation bar's scroll edge background)
  const backdrop = wideLayoutMode ? card0 : background;
  const listStyle = { backgroundColor: wideLayoutMode ? card0 : undefined };
  const contentContainerStyle = {
    paddingLeft: inset.left,
    paddingRight: inset.right,
    // narrow, the rows fill the width, so the gutters beside them match
    backgroundColor: wideLayoutMode ? undefined : background,
  };
  const listHeader = (
    <View
      style={{
        position: 'relative',
        height: listHeaderHeight,
        paddingTop: logoContainerPaddingTop,
        paddingBottom: logoContainerPaddingBottom,
        // full bleed, with the logo centred in the safe area
        marginLeft: -inset.left,
        marginRight: -inset.right,
        paddingLeft: inset.left,
        paddingRight: inset.right,
        // narrow, the rows hide the forest's lower half; clip it so it can't show in the gutters
        overflow: wideLayoutMode ? undefined : 'hidden',
      }}
    >
      {/* the background itself */}
      <Image
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: ultraWideLayoutMode ? height : listHeaderHeight * 2,
        }}
        source={require('@/assets/images/miskas_fade_10.webp')}
        onLoadEnd={() => setDidBackgroundLoad(true)}
        contentFit="cover"
        contentPosition="bottom"
      ></Image>
      {/* feather the top into the backdrop that shows above it when overscrolled */}
      <LinearGradient
        colors={[backdrop, withAlpha(backdrop, '00')]}
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
      {/* wide: the rounded top of the list's card, to match the footer's rounded bottom */}
      {wideLayoutMode ? (
        <View style={[styles.cardTop, { left: inset.left, right: inset.right }]}>
          <View style={[styles.cardTopEdge, { backgroundColor: background }]} />
        </View>
      ) : null}
    </View>
  );
  const listFooter = (
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
      {listItems.length === 0 ? (
        <View
          style={[
            styles.listFooter,
            {
              minHeight: height - headerHeight,
            },
          ]}
        >
          {playlist ? <EmptyPlaylist isSearch={searchText.length > 0} /> : <NoHits />}
        </View>
      ) : isReorderable && !isSearching && reorderableItems.length > 1 ? (
        // no drag handles, so a word on how; clear of the bottom bar's buttons
        <ThemedText
          style={[styles.reorderHint, { paddingBottom: inset.bottom + floatingBottomGap + padding + bottomBarHeight }]}
        >
          {t('reorderHint')}
        </ThemedText>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground scrollRef={listRef} scrollOffset={scrollOffset} />,
          headerTitleAlign: 'center',
          // web: a link to the app stores
          headerLeft: process.env.EXPO_OS === 'web' ? () => <GetTheAppButton /> : undefined,
          ...topScrollEdgeEffect,
          headerTitle: () => (
            <HeaderTitle scrollRef={listRef} scrollOffset={scrollOffset} titleLayout={titleLayout} center>
              <HeaderLogo />
            </HeaderTitle>
          ),
          headerRight: !isLiquidGlassStyleHeader()
            ? () => (
                <HeaderButtonContainer>
                  <Link href="/nustatymai" asChild>
                    <Button role="button" accessibilityLabel={t('settingsTitle')}>
                      <FontAwesome6 name="info" iconStyle="solid" size={16} color="#fff" />
                    </Button>
                  </Link>
                </HeaderButtonContainer>
              )
            : undefined,
        }}
      />
      <View style={styles.container}>
        {isReorderable ? (
          <ReorderableList
            // a fresh list for each playlist, starting from the top
            key={listKey}
            // the reorderable list registers itself with listRef (a callback ref), so the header's scroll effects
            // and search's scrolling follow it
            ref={listRef as unknown as React.Ref<FlatList<SongListItem>>}
            data={reorderableItems}
            keyExtractor={(item) => item.id}
            renderItem={renderReorderableItem}
            // search results are a filtered view, so they stay put
            dragEnabled={!isSearching}
            keyboardDismissMode="on-drag"
            // scrolling closes a row's open swipe actions
            onScrollBeginDrag={closeOpenRow}
            style={listStyle}
            contentContainerStyle={contentContainerStyle}
            ListHeaderComponent={
              <>
                {listHeader}
                {showPlaylistHeader ? (
                  <ListHeader title={playlist.name} background={background} separator={separator} large />
                ) : null}
              </>
            }
            ListFooterComponent={listFooter}
            onReorder={({ from, to }) => moveSong(from, to)}
            onDragStart={() => {
              'worklet';
              scheduleOnRN(haptic, 'lift');
            }}
            onIndexChange={() => {
              'worklet';
              scheduleOnRN(haptic, 'tick');
            }}
            cellAnimations={liftedRowAnimations}
            // autoscroll starts below the navigation bar and above the bottom bar
            autoscrollThresholdOffset={{ start: headerHeight, end: inset.bottom + floatingBottomGap + listItemHeight }}
          />
        ) : (
          <GestureDetector gesture={listScrollGesture}>
            <Animated.FlatList
              ref={listRef}
              data={displayItems}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.id}:${rowKeySuffix}`}
              getItemLayout={getItemLayout}
              onContentSizeChange={(_, contentHeight) => listContentHeight.set(contentHeight)}
              keyboardDismissMode="on-drag"
              // scrolling closes a row's open swipe actions
              onScrollBeginDrag={closeOpenRow}
              style={listStyle}
              contentContainerStyle={contentContainerStyle}
              ListHeaderComponent={listHeader}
              ListFooterComponent={listFooter}
            />
          </GestureDetector>
        )}
        {/* only once hydrated: a static web page renders it into every route's HTML otherwise */}
        {isAllSongs && hasHydrated ? (
          <RowMeasurer
            items={allSongItems}
            favoriteIds={favoriteIds}
            primary={primary}
            background={background}
            separator={separator}
            left={inset.left}
            right={inset.right}
            trailingPadding={rowTrailingPadding}
            onMeasure={setMeasuredLayouts}
          />
        ) : null}
        {!isLiquidGlassStyleHeader() && (
          <Search
            scrollRef={listRef}
            top={listTop}
            selectedPlaylistId={selectedPlaylistId}
            setSelectedPlaylistId={setSelectedPlaylistId}
            onCreatePlaylist={() => promptCreatePlaylist()}
            playlistActions={playlistActions}
            onPlaylistAction={onPlaylistAction}
            setSearchText={(text) => startTransition(() => setSearchText(text))}
          />
        )}
        {indexSections.length > 1 && !isKeyboardVisible ? (
          <SectionIndex
            sections={indexSections}
            listRef={listRef}
            topInset={headerHeight}
            contentHeight={listContentHeight}
            listHeight={height}
            style={sectionIndexStyle}
          />
        ) : null}
      </View>
      {/* after the list: UIKit tracks the scroll view at the start of the screen's view hierarchy (for the
          navigation bar's scroll edge background), and the toolbar's host view would come first */}
      <IndexToolbar
        listRef={listRef}
        scrollToSearchOffset={listTop}
        selectedPlaylistId={selectedPlaylistId}
        setSelectedPlaylistId={setSelectedPlaylistId}
        onCreatePlaylist={() => promptCreatePlaylist()}
        playlistActions={playlistActions}
        onPlaylistAction={onPlaylistAction}
        setSearchText={(text) => startTransition(() => setSearchText(text))}
      />
      {dialogs}
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
  cardTop: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  cardTopEdge: {
    width: '100%',
    maxWidth,
    height: padding,
    borderTopLeftRadius: padding,
    borderTopRightRadius: padding,
  },
  reorderHint: {
    paddingTop: padding,
    paddingHorizontal: padding,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 13 * 1.4,
    opacity: 0.6,
  },
  listFooter: {
    paddingHorizontal: padding,
    paddingVertical: padding * 2,
    alignItems: 'center',
  },
});
