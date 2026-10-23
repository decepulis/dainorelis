import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TextInput, type TextInputInstance, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  AnimatedRef,
  WithSpringConfig,
  createAnimatedComponent,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassContainer, GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import floatingBottomGap from '@/lib/constants/floatingBottomGap';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { fonts } from '@/lib/constants/themes';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import useFrame from '@/lib/hooks/useFrame';
import withAlpha from '@/lib/utils/withAlpha';

import { PlaylistAction, PlaylistActionId, createPlaylistIcon } from '../../hooks/usePlaylistActions';
import usePlaylists, { Playlist, allSongsId } from '../../hooks/usePlaylists';
import { useThemeColor } from '../../hooks/useThemeColor';
import Button, { ButtonSurface, styles as buttonStyles } from '../Button';
import { isLiquidGlassStyleHeader } from '../Header';
import MenuView, { type MenuAction } from '../MenuView';
import ThemedText from '../ThemedText';

const AnimatedGlassView = createAnimatedComponent(GlassView);
const expandedSearchHeight = 44;
const buttonSize = 44;
const color = '#ffffff';
const createPlaylistId = 'createPlaylist';

type Props = {
  scrollRef: AnimatedRef<Animated.FlatList<any>>;
  top: number;
  selectedPlaylistId: string;
  setSelectedPlaylistId: (id: string) => void;
  onCreatePlaylist: () => void;
  playlistActions: PlaylistAction[];
  onPlaylistAction: (id: PlaylistActionId) => void;
  setSearchText: (text: string) => void;
};
const springConfig: WithSpringConfig = {
  mass: 1,
  damping: 30,
  stiffness: 400,
};

/**
 * The bottom search bar for headers without Liquid Glass. app/index.tsx renders it only when
 * !isLiquidGlassStyleHeader(), and expo-glass-effect's isLiquidGlassAvailable() is only ever true
 * on iOS 26+, where isLiquidGlassStyleHeader() is true too, so nothing here needs a Liquid Glass
 * branch. The iOS 26 header gets IndexToolbar below instead.
 */
export default function Search({
  scrollRef,
  top,
  selectedPlaylistId,
  setSelectedPlaylistId,
  onCreatePlaylist,
  playlistActions,
  onPlaylistAction,
  setSearchText,
}: Props) {
  const { t } = useTranslation();
  const background = useThemeColor('background');
  const inset = useSafeAreaInsets();
  const { width } = useFrame();
  const searchRef = useRef<TextInputInstance>(null);
  // live Reduce Motion: the springs jump to their targets and the list scrolls without animating
  const { isBoldTextEnabled, isReduceMotionEnabled, reduceMotion } = useAccessibilityInfo();
  const spring = { ...springConfig, reduceMotion };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isAppWide = width > maxWidth;
  const compressedSearchWidth = buttonSize;
  const expandedSearchWidth = isAppWide
    ? 360
    : width - inset.left - inset.right - padding * 1.25 - padding * 1.25 - expandedSearchHeight - padding;

  const playlistMenuAnimatedStyle = useAnimatedStyle(() => {
    const targetScale = isSearchOpen ? 0 : 1;
    const targetLeft = inset.left + (isSearchOpen ? padding * 2 : padding * 1.25);
    return {
      transform: [{ scale: withSpring(targetScale, spring) }],
      left: withSpring(targetLeft, spring),
    };
  });

  const searchBoxAnimatedStyle = useAnimatedStyle(() => {
    const targetWidth = isSearchOpen ? expandedSearchWidth : compressedSearchWidth;
    const targetHeight = isSearchOpen ? expandedSearchHeight : buttonSize;
    const targetRight = inset.right + (isSearchOpen ? expandedSearchHeight + padding * 1.25 + padding : padding * 1.25);

    return {
      width: withSpring(targetWidth, spring),
      height: withSpring(targetHeight, spring),
      right: withSpring(targetRight, spring),
    };
  });

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => {
    const targetScale = isSearchOpen ? 1 : 0;
    const targetRight = inset.right + (isSearchOpen ? padding * 1.25 : buttonSize + padding * 1.25);

    return {
      right: withSpring(targetRight, spring),
      transform: [{ scale: withSpring(targetScale, spring) }],
    };
  });

  const scrollToTop = () => {
    const scrollEl = scrollRef?.current;
    if (!scrollEl) return;
    scrollEl.scrollToOffset({ offset: top, animated: !isReduceMotionEnabled });
  };
  const onChangeText = (t: string) => {
    setSearchText(t);
    if (t.length > 0) {
      scrollToTop();
    }
  };
  const clearSearchText = () => {
    const searchEl = searchRef?.current;
    if (searchEl) {
      searchRef.current?.clear();
      onChangeText('');
    }
  };

  const { playlists, favorites, curated, user } = usePlaylists();
  const playlistTitle = playlists.find((p) => p.id === selectedPlaylistId)?.name ?? t('allSongs');
  const playlistAction = (playlist: Playlist): MenuAction => ({
    id: playlist.id,
    title: playlist.name,
    state: playlist.id === selectedPlaylistId ? 'on' : 'off',
  });

  // the bar's buttons sit this far above the bottom of the container
  const bottom = inset.bottom + floatingBottomGap;

  return (
    // rides on top of the keyboard as it opens and closes. Android's keyboard height includes the
    // navigation bar, so drop the inset there and keep the same gap above the keyboard as above the bar
    <KeyboardStickyView
      offset={{ opened: process.env.EXPO_OS === 'android' ? inset.bottom : 0 }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: bottom + expandedSearchHeight,
        flexBasis: bottom + expandedSearchHeight,
      }}
    >
      <GlassContainer style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[withAlpha(background, '00'), withAlpha(background, 'AA'), background]}
          start={{ x: 0.5, y: 0.1 }}
          style={{
            position: 'absolute',
            bottom: 0,
            height: bottom + padding / 2 + buttonSize,
            left: 0,
            right: 0,
          }}
        />
        {/* Cancel Button */}
        <AnimatedGlassView
          isInteractive
          // scaled to nothing while search is closed, so keep screen readers off it too
          accessibilityElementsHidden={!isSearchOpen}
          importantForAccessibility={isSearchOpen ? 'auto' : 'no-hide-descendants'}
          style={[
            {
              position: 'absolute',
              bottom,
              width: expandedSearchHeight,
              height: expandedSearchHeight,
              borderRadius: expandedSearchHeight / 2,
              overflow: 'hidden',
            },
            cancelButtonAnimatedStyle,
          ]}
        >
          <Button
            noGlass
            accessibilityLabel={t('clearSearch')}
            onPress={() => {
              clearSearchText();
              setIsSearchOpen(false);
              searchRef.current?.blur();
            }}
            innerStyle={{
              width: expandedSearchHeight,
              height: expandedSearchHeight,
              flexBasis: expandedSearchHeight,
              borderRadius: expandedSearchHeight / 2,
            }}
          >
            <FontAwesome6 name="xmark" iconStyle="solid" size={18} color={color} />
          </Button>
        </AnimatedGlassView>
        {/* Playlist Menu */}
        <AnimatedGlassView
          isInteractive
          // scaled to nothing while search is open
          accessibilityElementsHidden={isSearchOpen}
          importantForAccessibility={isSearchOpen ? 'no-hide-descendants' : 'auto'}
          style={[
            playlistMenuAnimatedStyle,
            {
              position: 'absolute',
              bottom,
              height: buttonSize,
              borderRadius: buttonSize,
              overflow: 'hidden',
              // the shown playlist's settings sit right beside the pill
              flexDirection: 'row',
              gap: padding / 4,
            },
          ]}
        >
          <MenuView
            // the pill already fills a 44pt target, so the 32pt-button slop would only offset it
            hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
            accessibilityLabel={`${t('playlists')}: ${playlistTitle}`}
            actions={[
              {
                id: allSongsId,
                title: t('allSongs'),
                state: selectedPlaylistId === allSongsId ? 'on' : 'off',
              },
              playlistAction(favorites),
              // one section: Android draws a divider on each side of every section, doubling up between two
              {
                id: 'playlistsSection',
                title: '',
                displayInline: true,
                subactions: [...curated, ...user].map(playlistAction),
              },
              {
                id: createPlaylistId,
                title: t('createPlaylist'),
                image: process.env.EXPO_OS === 'ios' ? createPlaylistIcon.sfSymbol : createPlaylistIcon.material,
              },
            ]}
            onPressAction={({ nativeEvent }) => {
              if (nativeEvent.event === createPlaylistId) {
                onCreatePlaylist();
              } else {
                setSelectedPlaylistId(nativeEvent.event);
              }
            }}
          >
            <ButtonSurface
              style={[
                buttonStyles.button,
                {
                  width: 'auto',
                  height: buttonSize,
                  flexBasis: buttonSize,
                  borderRadius: buttonSize / 2,
                  flexDirection: 'row',
                  gap: padding / 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: buttonSize / 3,
                  // a long playlist name stops short of the search button and truncates, keeping the chevron.
                  // Here, not on the glass around it: the menu sizes to this view, so only here can the text shrink
                  maxWidth:
                    width -
                    inset.left -
                    inset.right -
                    padding * 1.25 * 2 -
                    buttonSize -
                    padding / 2 -
                    (playlistActions.length ? buttonSize + padding / 4 : 0),
                },
              ]}
            >
              <ThemedText title bold numberOfLines={1} style={{ flexShrink: 1, fontSize: 17, color }}>
                {playlistTitle}
              </ThemedText>
              <FontAwesome6 name="chevron-up" iconStyle="solid" color={color} size={12} style={{ marginTop: 2 }} />
            </ButtonSurface>
          </MenuView>
          {playlistActions.length ? (
            <MenuView
              hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
              accessibilityLabel={t('playlistActions')}
              actions={playlistActions.map((action) => ({
                id: action.id,
                title: action.title,
                image: process.env.EXPO_OS === 'ios' ? action.sfSymbol : action.material,
                attributes: { destructive: action.destructive },
              }))}
              onPressAction={({ nativeEvent }) => onPlaylistAction(nativeEvent.event as PlaylistActionId)}
            >
              <ButtonSurface
                style={[
                  buttonStyles.button,
                  { width: buttonSize, height: buttonSize, flexBasis: buttonSize, borderRadius: buttonSize / 2 },
                ]}
              >
                <FontAwesome6 name="gear" iconStyle="solid" size={17} color={color} />
              </ButtonSurface>
            </MenuView>
          ) : null}
        </AnimatedGlassView>
        {/* Search Box */}
        <AnimatedGlassView
          isInteractive
          style={[
            {
              position: 'absolute',
              bottom,
              borderRadius: buttonSize,
              overflow: 'hidden',
            },
            searchBoxAnimatedStyle,
          ]}
        >
          <ButtonSurface style={{ position: 'absolute', inset: 0 }}>
            <TextInput
              style={[
                isBoldTextEnabled ? fonts.bold : fonts.regular,
                {
                  height: '100%',
                  color,
                  marginRight: !isSearchOpen ? 0 : process.env.EXPO_OS === 'ios' ? 10 : buttonSize,
                  marginLeft: !isSearchOpen ? 0 : buttonSize,
                },
              ]}
              accessibilityLabel={t('search')}
              clearButtonMode="never"
              autoCorrect={false}
              ref={searchRef}
              onChangeText={onChangeText}
              onFocus={() => {
                scrollToTop();
                setIsSearchOpen(true);
              }}
              returnKeyType="done"
              selectionColor={color}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: buttonSize,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <FontAwesome6 name="magnifying-glass" iconStyle="solid" size={14} color={color} />
            </View>
          </ButtonSurface>
        </AnimatedGlassView>
      </GlassContainer>
    </KeyboardStickyView>
  );
}

// the setters arrive already wrapped in startTransition by app/index.tsx
type IndexToolbarProps = {
  listRef: AnimatedRef<Animated.FlatList<any>>;
  scrollToSearchOffset: number;
  selectedPlaylistId: string;
  setSelectedPlaylistId: (id: string) => void;
  onCreatePlaylist: () => void;
  playlistActions: PlaylistAction[];
  onPlaylistAction: (id: PlaylistActionId) => void;
  setSearchText: (text: string) => void;
};
export function IndexToolbar({
  listRef,
  scrollToSearchOffset,
  selectedPlaylistId,
  setSelectedPlaylistId,
  onCreatePlaylist,
  playlistActions,
  onPlaylistAction,
  setSearchText,
}: IndexToolbarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const { isReduceMotionEnabled } = useAccessibilityInfo();
  const { favorites, curated, user } = usePlaylists();

  if (!isLiquidGlassStyleHeader()) return null;
  const isPad = Platform.OS === 'ios' && Platform.isPad;

  const playlistAction = (playlist: Playlist) => (
    <Stack.Toolbar.MenuAction
      key={playlist.id}
      isOn={playlist.id === selectedPlaylistId}
      onPress={() => setSelectedPlaylistId(playlist.id)}
    >
      {playlist.name}
    </Stack.Toolbar.MenuAction>
  );

  // the playlist picker and the shown playlist's settings: the bottom toolbar's leading group on iPhone,
  // the navigation bar's leading items on iPad
  const playlistMenus = [
    <Stack.Toolbar.Menu
      key="playlists"
      title={t('playlists')}
      icon="music.note.list"
      tintColor={selectedPlaylistId !== allSongsId ? primary : undefined}
    >
      <Stack.Toolbar.MenuAction
        isOn={selectedPlaylistId === allSongsId}
        onPress={() => setSelectedPlaylistId(allSongsId)}
      >
        {t('allSongs')}
      </Stack.Toolbar.MenuAction>
      {playlistAction(favorites)}
      <Stack.Toolbar.Menu inline>{curated.map(playlistAction)}</Stack.Toolbar.Menu>
      {user.length ? <Stack.Toolbar.Menu inline>{user.map(playlistAction)}</Stack.Toolbar.Menu> : null}
      <Stack.Toolbar.Menu inline>
        <Stack.Toolbar.MenuAction icon={createPlaylistIcon.sfSymbol} onPress={onCreatePlaylist}>
          {t('createPlaylist')}
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar.Menu>,
    playlistActions.length ? (
      // the shown playlist's settings, next to the button that picks it
      <Stack.Toolbar.Menu key="playlistActions" icon="gearshape" title="" accessibilityLabel={t('playlistActions')}>
        {playlistActions.map((action) => (
          <Stack.Toolbar.MenuAction
            key={action.id}
            icon={action.sfSymbol}
            destructive={action.destructive}
            onPress={() => onPlaylistAction(action.id)}
          >
            {action.title}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    ) : null,
  ];

  return (
    <>
      <Stack.SearchBar
        placeholder={t('search')}
        // in the bar, not stacked under it: on iPad (where search never joins the toolbar) a narrow window shows a
        // search button at the bar's trailing edge instead of a field over the forest. iPhone keeps it in the toolbar
        placement="integrated"
        onChangeText={(e) => {
          const text = e.nativeEvent.text;
          setSearchText(text);
          if (text.length > 0) {
            listRef.current?.scrollToOffset({
              offset: scrollToSearchOffset,
              animated: !isReduceMotionEnabled,
            });
          }
        }}
        onFocus={() => {
          listRef.current?.scrollToOffset({
            offset: scrollToSearchOffset,
            animated: !isReduceMotionEnabled,
          });
        }}
      />
      {isPad ? (
        // iPad keeps every control in the navigation bar, like Files and Notes: the playlist menus lead it
        <Stack.Toolbar placement="left">{playlistMenus}</Stack.Toolbar>
      ) : (
        <Stack.Toolbar>
          {playlistMenus}
          {/* a fixed gap: the playlist button and its settings are one group, search another */}
          <Stack.Toolbar.Spacer width={8} />
          <Stack.Toolbar.SearchBarSlot />
        </Stack.Toolbar>
      )}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="info" onPress={() => router.navigate('/nustatymai')}>
          {t('settingsTitle')}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
