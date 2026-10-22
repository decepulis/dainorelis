import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AccessibilityActionEvent, PixelRatio, StyleSheet, View } from 'react-native';
import { Touchable, type TouchableProps } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useReorderableDrag } from 'react-native-reorderable-list';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { createPlaylistIcon } from '@/lib/hooks/usePlaylistActions';
import { favoritesId } from '@/lib/hooks/usePlaylists';
import { Song } from '@/lib/schemas/songs';
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

/** a user playlist, for the long-press menu: the list builds these once, not every row */
export type RowPlaylist = { id: string; name: string; songIds: Set<string> };

type Props = {
  item: Song;
  primary: string;
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
  separator,
  isLast,
  isFavorite,
  userPlaylists,
  toggleSong,
  shownUserPlaylistId,
  onNewPlaylistWithSong,
  reorder,
}: Props) {
  const { t } = useTranslation();
  const { title, subtitle } = useTitle(item);
  const firstLyrics = Object.values(item.fields.Lyrics)[0];

  const toggleFavorite = () => {
    const isIn = toggleSong(favoritesId, item.id);
    Haptics.impactAsync(isIn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Soft);
  };

  const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);

  const close = () => swipeableRef.current?.close();
  // the menu's native host sizes to its content, so its action gets the row's height explicitly
  const [rowHeight, setRowHeight] = useState<number>();
  // swiping a row reveals two actions: the heart at the edge, and beside it Add to playlist (a menu of the
  // user's playlists) or, inside one of them, Remove
  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      {shownUserPlaylistId ? (
        <Touchable
          {...rowPressFeedback}
          accessibilityLabel={t('removeFromPlaylist')}
          style={[styles.swipeAction, { backgroundColor: removeColor }]}
          onPress={() => {
            toggleSong(shownUserPlaylistId, item.id);
            close();
          }}
        >
          <FontAwesome6 name="circle-minus" size={20} iconStyle="solid" color="#fff" />
        </Touchable>
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
            else toggleSong(nativeEvent.event, item.id);
            close();
          }}
        >
          <View style={[styles.swipeAction, { backgroundColor: addColor, height: rowHeight }]}>
            <FontAwesome6 name="list-ul" size={20} iconStyle="solid" color="#fff" />
          </View>
        </MenuView>
      )}
      <Touchable
        {...rowPressFeedback}
        accessibilityLabel={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        style={[styles.swipeAction, { backgroundColor: primary }]}
        onPress={() => {
          toggleFavorite();
          close();
        }}
      >
        <FontAwesome6 name="heart" size={20} iconStyle={!isFavorite ? 'solid' : 'regular'} color="#fff" />
      </Touchable>
    </View>
  );

  return (
    <View
      style={[styles.outerContainer, { backgroundColor: background }]}
      onLayout={(e) => setRowHeight(e.nativeEvent.layout.height)}
    >
      <ReanimatedSwipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
        <Link href={`/dainos/${item.id}`} asChild>
          <Link.Trigger>
            <Touchable
              {...rowPressFeedback}
              {...(reorder
                ? {
                    onLongPress: reorder.onDrag,
                    delayLongPress: reorderLongPressMs,
                    accessibilityActions: [
                      { name: 'moveUp', label: t('moveUp') },
                      { name: 'moveDown', label: t('moveDown') },
                    ],
                    onAccessibilityAction: ({ nativeEvent }: AccessibilityActionEvent) =>
                      reorder.onMoveBy(nativeEvent.actionName === 'moveUp' ? -1 : 1),
                  }
                : null)}
            >
              <ListItemContent item={item} primary={primary} background={background} isFavorite={isFavorite} />
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
                <ThemedText bold style={{ fontSize: 22 }}>
                  {title}
                </ThemedText>
                {subtitle ? <ThemedText style={{ opacity: 0.75 }}>{subtitle}</ThemedText> : null}
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
                      onPress={() => toggleSong(playlist.id, item.id)}
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
  );
}

type ListItemContentProps = { item: Song; primary: string; background: string; isFavorite: boolean };
/** a row's title, subtitle and icons, shared by the linked row and the reorderable one */
function ListItemContent({ item, primary, background, isFavorite }: ListItemContentProps) {
  const { isBoldTextEnabled, isHighContrastEnabled } = useAccessibilityInfo();
  const { title, subtitle } = useTitle(item);
  const { width } = useSafeAreaFrame();

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
          paddingRight: padding,
        },
      ]}
    >
      <View style={styles.itemText}>
        <ThemedText style={[styles.text, { letterSpacing: isBoldTextEnabled ? undefined : -0.05 }]}>{title}</ThemedText>
        {subtitle ? <ThemedText style={{ opacity: isHighContrastEnabled ? 1 : 0.75 }}>{subtitle}</ThemedText> : null}
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
          {
            borderBottomColor: separator,
            borderBottomWidth: process.env.EXPO_OS === 'ios' ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <ThemedText bold style={[styles.sectionHeader, styles.text, large ? styles.largeHeader : null]}>
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
  sectionHeader: {
    fontSize,
  },
  largeHeader: {
    fontSize: 24,
    lineHeight: 24 * 1.25,
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
  },
  swipeAction: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
});
