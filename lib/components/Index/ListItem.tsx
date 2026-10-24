import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AccessibilityActionEvent, PixelRatio, StyleSheet, View } from 'react-native';
import { GestureDetector, Touchable, type TouchableProps, usePanGesture } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  ReduceMotion,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReorderableDrag } from 'react-native-reorderable-list';
import { scheduleOnRN } from 'react-native-worklets';

import { Link } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import useFrame from '@/lib/hooks/useFrame';
import { createPlaylistIcon } from '@/lib/hooks/usePlaylistActions';
import { favoritesId } from '@/lib/hooks/usePlaylists';
import { Song } from '@/lib/schemas/songs';
import haptic from '@/lib/utils/haptic';
import isLyrics from '@/lib/utils/isLyrics';
import useTitle from '@/lib/utils/useTitle';

import Markdown from '../Markdown';
import MenuView from '../MenuView';
import ThemedText from '../ThemedText';

const newPlaylistActionId = 'newPlaylist';
// the system's grey and red for swipe actions, beside the brand-green heart
const addColor = '#8e8e93';
const removeColor = '#ff3b30';
// how long a reorderable row is held before it lifts to be dragged
const reorderLongPressMs = 250;
// each swipe action's width
const swipeActionWidth = 70;
const swipeActionsWidth = swipeActionWidth * 2;

// the row whose swipe actions are open: one at a time, as in iOS lists. Swiping another row or scrolling the
// list (closeOpenRow) closes it.
type OpenRow = { close: () => void };
let openRow: OpenRow | null = null;
/** closes the row whose swipe actions are open, if any: for the list's onScrollBeginDrag */
export const closeOpenRow = () => {
  openRow?.close();
  openRow = null;
};

/** a user playlist, for the long-press menu: the list builds these once, not every row */
export type RowPlaylist = { id: string; name: string; songIds: Set<string> };

type Props = {
  item: Song;
  primary: string;
  /** the heart on the brand-green swipe action */
  onPrimary: string;
  background: string;
  separator: string;
  isLast?: boolean;
  isFavorite: boolean;
  userPlaylists: RowPlaylist[];
  /** usePlaylists' toggleSong */
  toggleSong: (playlistId: string, songId: string) => boolean;
  /** the user playlist the list shows, if any: its rows offer Remove instead of Add to playlist */
  shownUserPlaylistId?: string;
  onNewPlaylistWithSong: (songId: string) => void;
  /** ListItemContent's */
  trailingPadding?: number;
  /**
   * in a reorderable list: holding the row lifts it to be dragged (instead of the preview and its menu), and
   * screen readers get Move up / Move down
   */
  reorder?: {
    onDrag: () => void;
    /** moves the song a row up (-1) or down (1) */
    onMoveBy: (delta: number) => void;
  };
};
export function ListItem({
  item,
  background,
  primary,
  onPrimary,
  separator,
  isLast,
  isFavorite,
  userPlaylists,
  toggleSong,
  shownUserPlaylistId,
  onNewPlaylistWithSong,
  trailingPadding,
  reorder,
}: Props) {
  const { t } = useTranslation();
  const { title, subtitle } = useTitle(item);
  const firstLyrics = Object.values(item.fields.Lyrics)[0];

  // felt, as the song screen's Add to Playlist menu is: the row shows only Favorites, and a menu closes as it acts
  const togglePlaylist = (playlistId: string) => haptic(toggleSong(playlistId, item.id) ? 'on' : 'off');
  const toggleFavorite = () => togglePlaylist(favoritesId);

  const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);

  const close = () => swipeableRef.current?.close();
  // this row in the one-open-row registry
  const [rowHandle] = useState<OpenRow>(() => ({ close: () => swipeableRef.current?.close() }));
  useEffect(
    () => () => {
      if (openRow === rowHandle) openRow = null;
    },
    [rowHandle]
  );
  // the swipe actions render with every row, and the add-to-playlist menu is a native host (on Android a
  // Compose view each, tens of megabytes across the songbook), so it mounts once the row is first swiped; until
  // then its icon stands alone
  const [hasSwiped, setHasSwiped] = useState(false);
  // the actions sit behind the row until it's swiped open, hidden from screen readers too: the row offers
  // them as accessibility actions instead
  const [isRevealed, setIsRevealed] = useState(false);
  const onOpenStartDrag = () => {
    setHasSwiped(true);
    if (openRow !== rowHandle) closeOpenRow();
  };
  const onWillOpen = () => {
    setIsRevealed(true);
    if (openRow !== rowHandle) closeOpenRow();
    openRow = rowHandle;
  };
  const onClose = () => {
    setIsRevealed(false);
    if (openRow === rowHandle) openRow = null;
  };
  // the menu's native host sizes to its content, so its action gets the row's height explicitly
  const [rowSize, setRowSize] = useState<{ width: number; height: number }>();
  const rowHeight = rowSize?.height;

  // a full swipe (iOS Mail's): past the threshold the heart stretches over the row and arms, and letting go
  // toggles the favourite and closes the row. The swipeable only reports where the row settles, so the
  // release is caught by a pan running alongside its own; it moves with the swipeable's, which starts from
  // the open position when the row is open.
  const fullSwipeThreshold = Math.max(swipeActionsWidth + 60, (rowSize?.width ?? 0) / 2);
  const isOpen = useSharedValue(false);
  const onFullSwipe = () => {
    toggleFavorite();
    close();
  };
  const fullSwipeGesture = usePanGesture({
    activeOffsetX: [-10, 10],
    onDeactivate: (e) => {
      const revealed = -e.translationX + (isOpen.get() ? swipeActionsWidth : 0);
      if (!e.canceled && revealed > fullSwipeThreshold) scheduleOnRN(onFullSwipe);
    },
  });

  const addToPlaylistIcon = (
    <View style={[styles.swipeAction, { backgroundColor: addColor, height: rowHeight }]}>
      <FontAwesome6 name="list-ul" size={20} iconStyle="solid" color="#fff" />
    </View>
  );
  // swiping a row reveals two actions: the heart at the edge, and beside it Add to playlist (a menu of the
  // user's playlists) or, inside one of them, Remove
  const renderRightActions = (_progress: SharedValue<number>, translation: SharedValue<number>) => (
    <SwipeActions
      translation={translation}
      threshold={fullSwipeThreshold}
      isRevealed={isRevealed}
      secondaryColor={shownUserPlaylistId ? removeColor : addColor}
      primaryColor={primary}
      primary={
        <Touchable
          {...rowPressFeedback}
          accessibilityLabel={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
          style={styles.swipeActionFill}
          onPress={() => {
            toggleFavorite();
            close();
          }}
        >
          <FontAwesome6 name="heart" size={20} iconStyle={!isFavorite ? 'solid' : 'regular'} color={onPrimary} />
        </Touchable>
      }
      secondary={
        shownUserPlaylistId ? (
          <Touchable
            {...rowPressFeedback}
            accessibilityLabel={t('removeFromPlaylist')}
            style={[styles.swipeAction, { backgroundColor: removeColor, height: rowHeight }]}
            onPress={() => {
              togglePlaylist(shownUserPlaylistId);
              close();
            }}
          >
            <FontAwesome6 name="circle-minus" size={20} iconStyle="solid" color="#fff" />
          </Touchable>
        ) : !hasSwiped ? (
          addToPlaylistIcon
        ) : (
          <MenuView
            hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
            accessibilityLabel={t('addToPlaylist')}
            actions={[
              ...userPlaylists.map((playlist) => ({
                id: playlist.id,
                title: playlist.name,
                state: playlist.songIds.has(item.id) ? ('on' as const) : ('off' as const),
              })),
              {
                id: newPlaylistActionId,
                title: t('createPlaylist'),
                image: process.env.EXPO_OS === 'ios' ? createPlaylistIcon.sfSymbol : createPlaylistIcon.material,
              },
            ]}
            onPressAction={({ nativeEvent }) => {
              if (nativeEvent.event === newPlaylistActionId) onNewPlaylistWithSong(item.id);
              else togglePlaylist(nativeEvent.event);
              close();
            }}
          >
            {addToPlaylistIcon}
          </MenuView>
        )
      }
    />
  );

  // what the swipe actions (and on iOS the long-press menu) do, for screen readers. Android has no long-press
  // menu, and neither does a reorderable row on iOS, so they also get a playlist's worth of Add to actions.
  const playlistActionPrefix = 'playlist:';
  const offersPlaylistActions = !shownUserPlaylistId && (process.env.EXPO_OS !== 'ios' || !!reorder);
  const accessibilityActions = [
    { name: 'favorite', label: isFavorite ? t('removeFromFavorites') : t('addToFavorites') },
    ...(shownUserPlaylistId ? [{ name: 'removeFromPlaylist', label: t('removeFromPlaylist') }] : []),
    ...(offersPlaylistActions
      ? [
          ...userPlaylists.map((playlist) => ({
            name: `${playlistActionPrefix}${playlist.id}`,
            label: playlist.songIds.has(item.id)
              ? t('removeFromNamedPlaylist', { name: playlist.name })
              : t('addToNamedPlaylist', { name: playlist.name }),
          })),
          { name: newPlaylistActionId, label: t('createPlaylist') },
        ]
      : []),
    ...(reorder
      ? [
          { name: 'moveUp', label: t('moveUp') },
          { name: 'moveDown', label: t('moveDown') },
        ]
      : []),
  ];
  const onAccessibilityAction = ({ nativeEvent: { actionName } }: AccessibilityActionEvent) => {
    if (actionName === 'favorite') toggleFavorite();
    else if (actionName === 'removeFromPlaylist' && shownUserPlaylistId) togglePlaylist(shownUserPlaylistId);
    else if (actionName.startsWith(playlistActionPrefix)) togglePlaylist(actionName.slice(playlistActionPrefix.length));
    else if (actionName === newPlaylistActionId) onNewPlaylistWithSong(item.id);
    else if (actionName === 'moveUp') reorder?.onMoveBy(-1);
    else if (actionName === 'moveDown') reorder?.onMoveBy(1);
  };

  return (
    <GestureDetector gesture={fullSwipeGesture}>
      <View
        style={[styles.outerContainer, { backgroundColor: background }]}
        onLayout={(e) => setRowSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        <ReanimatedSwipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          // dragging on past the actions stretches them, toward the full swipe
          overshootRight
          simultaneousWith={fullSwipeGesture}
          onSwipeableOpenStartDrag={onOpenStartDrag}
          onSwipeableWillOpen={onWillOpen}
          onSwipeableClose={onClose}
        >
          <Link href={`/dainos/${item.id}`} asChild>
            <Link.Trigger>
              <Touchable
                {...rowPressFeedback}
                {...(reorder ? { onLongPress: reorder.onDrag, delayLongPress: reorderLongPressMs } : null)}
                accessibilityActions={accessibilityActions}
                onAccessibilityAction={onAccessibilityAction}
              >
                <ListItemContent
                  item={item}
                  primary={primary}
                  background={background}
                  isFavorite={isFavorite}
                  trailingPadding={trailingPadding}
                />
              </Touchable>
            </Link.Trigger>
            {reorder ? null : (
              <Link.Preview
                style={{
                  backgroundColor: background,
                  paddingHorizontal: padding,
                  paddingVertical: padding * 1.5,
                  width: 340,
                  height: 440,
                }}
              >
                <View style={{ marginBottom: 20, gap: 4 }}>
                  <ThemedText title bold style={{ fontSize: 22 }}>
                    {title}
                  </ThemedText>
                  {subtitle ? (
                    <ThemedText title style={{ opacity: 0.75 }}>
                      {subtitle}
                    </ThemedText>
                  ) : null}
                  {isLyrics(firstLyrics) ? (
                    <Markdown showChords={false}>{firstLyrics['Lyrics & Chords']}</Markdown>
                  ) : null}
                </View>
              </Link.Preview>
            )}
            {reorder ? null : (
              <Link.Menu>
                <Link.MenuAction icon={isFavorite ? 'heart.fill' : 'heart'} onPress={toggleFavorite}>
                  {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                </Link.MenuAction>
                {userPlaylists.length ? (
                  <Link.Menu title={t('addToPlaylist')} icon="text.badge.plus">
                    {userPlaylists.map((playlist) => (
                      <Link.MenuAction
                        key={playlist.id}
                        isOn={playlist.songIds.has(item.id)}
                        onPress={() => togglePlaylist(playlist.id)}
                      >
                        {playlist.name}
                      </Link.MenuAction>
                    ))}
                  </Link.Menu>
                ) : null}
              </Link.Menu>
            )}
          </Link>
        </ReanimatedSwipeable>
        {!isLast ? <RowSeparator separator={separator} /> : null}
      </View>
    </GestureDetector>
  );
}

type SwipeActionsProps = {
  /** the row's translation, from the swipeable: negative as it reveals the actions */
  translation: SharedValue<number>;
  threshold: number;
  /** swiped open: until then screen readers skip the actions */
  isRevealed: boolean;
  /** Add to playlist or Remove, beside the edge */
  secondary: React.ReactNode;
  secondaryColor: string;
  /** the heart at the edge, which a full swipe triggers */
  primary: React.ReactNode;
  primaryColor: string;
};
/**
 * the two swipe actions. Dragged past them they stretch, each over half the revealed width; past the
 * threshold the edge action arms and grows over the other, its icon following the row's edge.
 */
function SwipeActions({
  translation,
  threshold,
  isRevealed,
  secondary,
  secondaryColor,
  primary,
  primaryColor,
}: SwipeActionsProps) {
  // 0 → 1 as the edge action covers the other (Reduce Motion: a jump)
  const armProgress = useSharedValue(0);
  useAnimatedReaction(
    () => -translation.get() > threshold,
    (armed, wasArmed) => {
      if (armed === (wasArmed ?? false)) return;
      armProgress.set(withTiming(armed ? 1 : 0, { duration: 150, reduceMotion: ReduceMotion.System }));
      if (armed) scheduleOnRN(haptic, 'threshold');
    }
  );

  // the actions sit in a fixed width at the trailing edge (the swipeable measures it to know where the row
  // opens to); the overshoot is drawn leftward, past that box
  const revealedWidth = () => {
    'worklet';
    return Math.max(swipeActionsWidth, -translation.get());
  };
  const secondaryFillStyle = useAnimatedStyle(() => ({ width: revealedWidth() }));
  const secondaryStyle = useAnimatedStyle(() => ({
    // centred in the revealed width's leading half
    transform: [{ translateX: -(revealedWidth() - swipeActionsWidth) * 0.75 }],
  }));
  const primaryStyle = useAnimatedStyle(() => ({
    width: (revealedWidth() / 2) * (1 + armProgress.get()),
  }));
  // a closed row's actions aren't drawn: their edges would show around a row lifted to be dragged
  const containerStyle = useAnimatedStyle(() => ({ opacity: Math.abs(translation.get()) < 0.5 ? 0 : 1 }));
  const primaryIconStyle = useAnimatedStyle(() => {
    const width = (revealedWidth() / 2) * (1 + armProgress.get());
    // centred, until armed: then at the leading edge, beside the row
    return { transform: [{ translateX: ((width - swipeActionWidth) / 2) * (1 - armProgress.get()) }] };
  });

  return (
    <Animated.View
      style={[styles.swipeActions, containerStyle]}
      importantForAccessibility={isRevealed ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!isRevealed}
    >
      <Animated.View style={[styles.swipeActionsFill, { backgroundColor: secondaryColor }, secondaryFillStyle]} />
      <Animated.View style={secondaryStyle}>{secondary}</Animated.View>
      <Animated.View style={[styles.swipeActionsFill, { backgroundColor: primaryColor }, primaryStyle]}>
        <Animated.View style={[styles.swipeActionIcon, primaryIconStyle]}>{primary}</Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

type ListItemContentProps = {
  item: Song;
  primary: string;
  background: string;
  isFavorite: boolean;
  /** wider beside the jump-to-letter index, to keep the icons clear of it */
  trailingPadding?: number;
};
/**
 * a row's title, subtitle and icons, shared by the linked row, the reorderable one and the jump-to-letter index's
 * measuring
 */
export function ListItemContent({
  item,
  primary,
  background,
  isFavorite,
  trailingPadding = padding,
}: ListItemContentProps) {
  const { isBoldTextEnabled, isHighContrastEnabled } = useAccessibilityInfo();
  const { title, subtitle } = useTitle(item);
  const { width } = useFrame();

  // from 375px to 450px, gently scale the icon size up
  const iconScale = Math.min(0.8, Math.max(0.65, width / 562.5));
  const iconSize = PixelRatio.roundToNearestPixel(fontSize * iconScale);
  const icons = [
    isFavorite ? (
      <FontAwesome6
        name="heart"
        key="heart"
        size={iconSize}
        iconStyle="solid"
        color={primary}
        style={iconStyle(iconSize)}
      />
    ) : null,
    Object.values(item.fields.Lyrics).some((l) => l['Show Chords']) ? (
      <FontAwesome6
        name="guitar"
        key="guitar"
        size={iconSize * 1.1}
        iconStyle="solid"
        color={primary}
        style={iconStyle(iconSize * 1.1)}
      />
    ) : null,
    Object.keys(item.fields.PDFs).length ? (
      <FontAwesome6
        name="file"
        key="file"
        size={iconSize}
        iconStyle="solid"
        color={primary}
        style={iconStyle(iconSize)}
      />
    ) : null,
    Object.keys(item.fields.Audio).length ? (
      <FontAwesome6
        name="play"
        key="play"
        size={iconSize}
        iconStyle="solid"
        color={primary}
        style={iconStyle(iconSize)}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <View
      style={[
        styles.itemContainer,
        {
          backgroundColor: background,
          paddingVertical: PixelRatio.roundToNearestPixel(paddingVertical),
          paddingLeft: padding,
          paddingRight: trailingPadding,
        },
      ]}
    >
      <View style={styles.itemText}>
        <ThemedText title style={[styles.text, { letterSpacing: isBoldTextEnabled ? undefined : -0.05 }]}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText title style={{ opacity: isHighContrastEnabled ? 1 : 0.75 }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {icons.length > 0 ? (
        <View style={[styles.iconContainer, { gap: (fontSize * iconScale) / 1.75 }]}>{icons}</View>
      ) : null}
    </View>
  );
}

/** iOS draws a hairline between rows, inset from the leading edge */
function RowSeparator({ separator }: { separator: string }) {
  if (process.env.EXPO_OS !== 'ios') return null;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: padding,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: separator,
      }}
    />
  );
}

/** a ListItem in a react-native-reorderable-list: holding it starts the drag */
export function ReorderableListItem({
  onMoveBy,
  ...props
}: Omit<Props, 'reorder'> & { onMoveBy: (delta: number) => void }) {
  const drag = useReorderableDrag();
  return <ListItem {...props} reorder={{ onDrag: drag, onMoveBy }} />;
}

type ListHeaderProps = {
  title: string;
  background: string;
  separator: string;
  /** the playlist's name, above its parts */
  large?: boolean;
};
export function ListHeader({ title, background, separator, large }: ListHeaderProps) {
  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: background,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          large ? styles.largeHeaderContainer : styles.sectionHeaderContainer,
          {
            borderBottomColor: separator,
            borderBottomWidth: process.env.EXPO_OS === 'ios' ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <ThemedText title bold style={large ? styles.largeHeader : styles.sectionHeader}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

// Android gets a ripple, iOS a dark underlay (what RectButton used to do)
const rowPressFeedback: Pick<TouchableProps, 'androidRipple' | 'underlayColor'> =
  process.env.EXPO_OS === 'android' ? { androidRipple: {} } : { underlayColor: 'black' };

const iconStyle = (iconSize: number) => ({
  width: iconSize,
  flexBasis: iconSize,
  flexShrink: 0,
  flexGrow: 0,
});

const fontSize = 18;
const lineHeight = fontSize * 1.33;
export const listItemHeight = fontSize * 3;
const paddingVertical = (listItemHeight - lineHeight) / 2;

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  container: {
    paddingVertical: PixelRatio.roundToNearestPixel(paddingVertical),
    marginLeft: padding,
    paddingRight: padding,
  },
  text: {
    // keep this applied to <Text /> to avoid clipping diacriticals
    fontSize,
    lineHeight,
  },
  // a section (a letter, a part of the programme) stands out from the rows by size, and by more room above than
  // below, which ties it to the rows it heads
  sectionHeaderContainer: {
    paddingTop: Math.round(padding * 1.5),
    paddingBottom: Math.round(padding / 2),
  },
  sectionHeader: {
    fontSize: 22,
    lineHeight: 22 * 1.25,
  },
  largeHeaderContainer: {
    paddingTop: padding,
  },
  largeHeader: {
    fontSize: 28,
    lineHeight: 28 * 1.25,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: padding,
  },
  swipeActions: {
    flexDirection: 'row',
    width: swipeActionsWidth,
  },
  swipeActionsFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: swipeActionWidth,
  },
  swipeActionIcon: {
    flex: 1,
    width: swipeActionWidth,
  },
  swipeActionFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
