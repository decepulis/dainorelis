import React, { startTransition, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
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
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Image } from 'expo-image';
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
import SectionIndex, { RowLayout, RowMeasurer, sectionIndexRowPadding } from '@/lib/components/Index/SectionIndex';
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

// a lifted row stays opaque (the default fades it) and keeps the default slight grow
const liftedRowAnimations = { opacity: 1 };
// how long a resize has to settle before the rows are measured again
const measureDelay = 300;
// the bottom bar's buttons' height
const bottomBarHeight = 44;

// web: the static HTML's title and description
export const generateMetadata = () => siteMetadata;

/**
 * The list keeps every row's measured layout, even once the row has scrolled away, and prefers it to
 * getItemLayout's; when the rows are measured again (a new width or text size) those are stale, so it forgets them.
 * The rows it shows report their layouts again as they move. (VirtualizedList has no public way to do this; giving
 * the rows new keys instead would remount them all.)
 */
function forgetRowLayouts(list: unknown) {
  (list as { _listRef?: { __getListMetrics?: () => { _cellMetrics?: Map<string, unknown> } } } | null)?._listRef
    ?.__getListMetrics?.()
    ._cellMetrics?.clear();
}

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
  const chrome = useThemeColor('chrome');
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
  // the bar's background appears as the list reaches it, past the forest and the logo
  const listTop = listHeaderHeight - headerHeight;

  // Past the forest, the first row in sight stays put while rows above it change height: a rotation or a fold
  // rewraps them (and the forest's own height changes), then they're measured again. Above that, the list stays
  // where it is, at the top, rather than following the first row. Search results are replaced as they're typed,
  // with nothing to keep
  const [isPastListTop, setIsPastListTop] = useState(false);
  // the list's own offset (the header's scrollOffset only follows while the custom header's background is shown),
  // and where it was just before the first resize since the rows were last measured
  const listScrollOffset = useSharedValue(0);
  const listWidth = useSharedValue(0);
  const offsetBeforeResize = useSharedValue<number | null>(null);
  const onListScroll = useAnimatedScrollHandler((e) => {
    if (e.layoutMeasurement.width !== listWidth.get()) {
      if (listWidth.get() !== 0 && offsetBeforeResize.get() === null) offsetBeforeResize.set(listScrollOffset.get());
      listWidth.set(e.layoutMeasurement.width);
    }
    listScrollOffset.set(e.contentOffset.y);
  });
  useAnimatedReaction(
    () => listScrollOffset.get() > listTop,
    (isPast, wasPast) => {
      if (isPast !== wasPast) scheduleOnRN(setIsPastListTop, isPast);
    }
  );
  const maintainVisibleContentPosition = isPastListTop && !isSearching ? { minIndexForVisible: 0 } : undefined;

  // all songs, by letter, gets a jump-to-letter index. Rows wrap differently with the width and the text size, so
  // they're measured unseen first; the list then knows every row's place, and a section's header lands exactly
  const isAllSongs = !playlist;
  const hasHydrated = useHasHydrated();
  // the index shows with all songs; over the rows (not in a wide layout's gutter), their icons keep clear of it
  const rowTrailingPadding =
    isAllSongs && (safeWidth - maxWidth) / 2 < sectionIndexRowPadding ? sectionIndexRowPadding : padding;
  // what the rows' layout depends on (the icons scale with the window's width, and a favourite gets a heart)
  const measureKey = [
    Math.round(safeWidth),
    Math.round(width),
    fontScale,
    isBoldTextEnabled,
    rowTrailingPadding,
    favorites.songIds.join(),
  ].join(':');
  // Measuring every row is slow, so it waits until a resize (a fold, a rotation) settles, and only for sizes not
  // measured before; meanwhile the list and the index keep the last layouts, close enough
  const [measured, setMeasured] = useState<{ key: string; layouts: RowLayout[] } | null>(null);
  const [measuringKey, setMeasuringKey] = useState<string | null>(null);
  const layoutCache = useRef(new Map<string, RowLayout[]>());
  // New layouts move every row, and the list renders the rows at its old offset in them. Android's
  // maintainVisibleContentPosition keeps the row in sight through that, but iOS mounts the moved rows and their
  // replacements in one update, which it can't follow; there (and on the web, which lacks it) the first row in sight
  // before the resize is found in the old layouts and scrolled back to in the new ones
  const measuredGeometry = useRef({ listHeaderHeight, headerHeight });
  useEffect(() => {
    if (measured?.key === measureKey) measuredGeometry.current = { listHeaderHeight, headerHeight };
  });
  const pendingAnchor = useRef<{ key: string; index: number; offsetInRow: number } | null>(null);
  const applyLayouts = (key: string, layouts: RowLayout[]) => {
    const old = measuredGeometry.current;
    // the top of the rows' area below the bar, in the old layouts
    const y = (offsetBeforeResize.get() ?? listScrollOffset.get()) + old.headerHeight - old.listHeaderHeight;
    offsetBeforeResize.set(null);
    // The scroll handler notices a resize at its next scroll event. A resize that scrolls nothing would be noticed
    // only at this anchor's scroll or a later one, and its stale offset kept until the next resize, which would jump
    // back to it; that next event's width is taken as current instead
    listWidth.set(0);
    const index =
      process.env.EXPO_OS !== 'android' && measured && !isSearching && y > 0
        ? measured.layouts.findIndex((l) => l.y + l.height > y)
        : -1;
    pendingAnchor.current = index >= 0 && measured ? { key, index, offsetInRow: y - measured.layouts[index].y } : null;
    forgetRowLayouts(listRef.current);
    setMeasured({ key, layouts });
  };
  const applyCachedLayouts = useEffectEvent(applyLayouts);
  useEffect(() => {
    if (!isAllSongs || !hasHydrated || measured?.key === measureKey) return;
    const cached = layoutCache.current.get(measureKey);
    if (cached) {
      applyCachedLayouts(measureKey, cached);
      return;
    }
    const timer = setTimeout(() => startTransition(() => setMeasuringKey(measureKey)), measureDelay);
    return () => clearTimeout(timer);
  }, [isAllSongs, hasHydrated, measured?.key, measureKey]);
  const rowLayouts =
    isAllSongs && !isSearching && measured?.layouts.length === displayItems.length ? measured.layouts : null;
  useLayoutEffect(() => {
    const anchor = pendingAnchor.current;
    if (!anchor || !rowLayouts || anchor.key !== measured?.key || anchor.index >= rowLayouts.length) return;
    pendingAnchor.current = null;
    listRef.current?.scrollToOffset({
      offset: listHeaderHeight + rowLayouts[anchor.index].y + anchor.offsetInRow - headerHeight,
      animated: false,
    });
  }, [measured?.key, rowLayouts, listHeaderHeight, headerHeight, listRef]);
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
  const listContentHeight = useSharedValue(0);
  // the keyboard would cover it
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  // The bottom bar's buttons (iOS 26 iPhone's toolbar, or the floating bar) sit this far above the bottom safe area;
  // iPad's Liquid Glass keeps them in the navigation bar. The list doesn't scroll under them on its own (no automatic
  // content inset), so its end, the index and the drag hint keep clear of them
  const isPadToolbar = isLiquidGlassStyleHeader() && Platform.OS === 'ios' && Platform.isPad;
  const bottomBarClearance = isPadToolbar
    ? inset.bottom
    : Math.max(inset.bottom + floatingBottomGap, padding) + bottomBarHeight;
  // the list's end: the last row, or the wide card's rounded bottom, a little above the bar
  const listEndClearance = Math.max(bottomBarClearance + padding / 2, padding * 2);

  const footerMinHeight = wideLayoutMode ? padding : listEndClearance;
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

  const topScrollEdgeEffect = useTopScrollEdgeEffect(listTop);

  // wide, the list's card sits on a darker backdrop. It's the scroll view's own background: a background on a view
  // around it would keep that view from being flattened away, and react-native-screens and UIKit only find a scroll
  // view at the start of the screen's view hierarchy (for the navigation bar's scroll edge background)
  const listStyle = { backgroundColor: wideLayoutMode ? card0 : undefined };
  const contentContainerStyle = {
    paddingLeft: inset.left,
    paddingRight: inset.right,
    // narrow, the rows fill the width, so the gutters beside them match
    backgroundColor: wideLayoutMode ? undefined : background,
  };
  const listHeader = (
    <>
      {/* above the forest, brand green reaching far up, so pulling down past the top shows green, as the song
          screen's band does. It tucks under the photo's top edge, so no seam shows between them */}
      <View
        style={{
          position: 'absolute',
          top: -2000,
          height: 2000 + padding,
          left: -inset.left,
          right: -inset.right,
          backgroundColor: chrome,
        }}
      />
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
          source={require('@/assets/images/miskas_v3_fade.webp')}
          // a reorderable playlist gets its own list, which remounts this header: from memory it doesn't reload
          cachePolicy="memory"
          onLoadEnd={() => setDidBackgroundLoad(true)}
          contentFit="cover"
          contentPosition="bottom"
        ></Image>
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
            cachePolicy="memory"
            contentFit="contain"
            onLoadEnd={() => setDidLogoLoad(true)}
          />
        </View>
        {/* wide: the top edge of the list's card, which starts over the header's green */}
        {wideLayoutMode ? (
          <View style={[styles.cardTop, { left: inset.left, right: inset.right }]}>
            <View style={[styles.cardTopEdge, { backgroundColor: background }]} />
          </View>
        ) : null}
      </View>
    </>
  );
  const listFooter = (
    <View
      style={{
        width: '100%',
        maxWidth,
        marginHorizontal: 'auto',
        minHeight: footerHeight,
        marginBottom: wideLayoutMode ? listEndClearance : undefined,
        backgroundColor: background,
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
        <ThemedText style={[styles.reorderHint, { paddingBottom: wideLayoutMode ? padding : listEndClearance }]}>
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
              keyExtractor={(item) => item.id}
              getItemLayout={getItemLayout}
              maintainVisibleContentPosition={maintainVisibleContentPosition}
              onScroll={onListScroll}
              // half the default's rows rendered beyond the screen: fewer to lay out again after a resize
              windowSize={11}
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
        {/* only while measuring, and only once hydrated: a static web page renders it into every route's HTML
            otherwise */}
        {isAllSongs && hasHydrated && measuringKey === measureKey ? (
          <RowMeasurer
            key={measuringKey}
            items={allSongItems}
            favoriteIds={favoriteIds}
            primary={primary}
            background={background}
            separator={separator}
            left={inset.left}
            right={inset.right}
            trailingPadding={rowTrailingPadding}
            onMeasure={(layouts) => {
              if (layoutCache.current.size > 8) layoutCache.current.clear();
              layoutCache.current.set(measuringKey, layouts);
              applyLayouts(measuringKey, layouts);
              setMeasuringKey(null);
            }}
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
            top={headerHeight + padding / 2}
            bottom={bottomBarClearance + padding / 2}
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
