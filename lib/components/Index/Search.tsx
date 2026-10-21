import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, type TextInputInstance, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  AnimatedRef,
  WithSpringConfig,
  createAnimatedComponent,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassContainer, GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { fonts } from '@/lib/constants/themes';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';

import { useThemeColor } from '../../hooks/useThemeColor';
import Button, { ButtonSurface, styles as buttonStyles } from '../Button';
import { isLiquidGlassStyleHeader } from '../Header';
import MenuView from '../MenuView';
import ThemedText from '../ThemedText';

const AnimatedGlassView = createAnimatedComponent(GlassView);
const expandedSearchHeight = 44;
const buttonSize = 44;
const color = '#ffffff';

type Props = {
  scrollRef: AnimatedRef<Animated.FlatList<any>>;
  top: number;
  isFavorites: boolean;
  setIsFavorites: (value: boolean) => void;
  isSongFestivalMode: boolean;
  setIsSongFestivalMode: (value: boolean) => void;
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
  isFavorites,
  setIsFavorites,
  isSongFestivalMode: _isSongFestivalMode,
  setIsSongFestivalMode: _setIsSongFestivalMode,
  setSearchText,
}: Props) {
  const { t } = useTranslation();
  const background = useThemeColor('background');
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const searchRef = useRef<TextInputInstance>(null);
  // live Reduce Motion: the springs jump to their targets and the list scrolls without animating
  const { isBoldTextEnabled, isReduceMotionEnabled, reduceMotion } = useAccessibilityInfo();
  const spring = { ...springConfig, reduceMotion };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isAppWide = width > maxWidth;
  const compressedSearchWidth = buttonSize;
  const expandedSearchWidth = isAppWide
    ? 360
    : width - padding * 1.25 - padding * 1.25 - expandedSearchHeight - padding;

  const playlistMenuAnimatedStyle = useAnimatedStyle(() => {
    const targetScale = isSearchOpen ? 0 : 1;
    const targetLeft = isSearchOpen ? padding * 2 : padding * 1.25;
    return {
      transform: [{ scale: withSpring(targetScale, spring) }],
      left: withSpring(targetLeft, spring),
    };
  });

  const searchBoxAnimatedStyle = useAnimatedStyle(() => {
    const targetWidth = isSearchOpen ? expandedSearchWidth : compressedSearchWidth;
    const targetHeight = isSearchOpen ? expandedSearchHeight : buttonSize;
    const targetRight = isSearchOpen ? expandedSearchHeight + padding * 1.25 + padding : padding * 1.25;

    return {
      width: withSpring(targetWidth, spring),
      height: withSpring(targetHeight, spring),
      right: withSpring(targetRight, spring),
    };
  });

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => {
    const targetScale = isSearchOpen ? 1 : 0;
    const targetRight = isSearchOpen ? padding * 1.25 : buttonSize + padding * 1.25;

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

  const playlistTitle = isFavorites ? t('favoriteSongs') : t('allSongs');

  return (
    // rides on top of the keyboard as it opens and closes
    <KeyboardStickyView
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: inset.bottom + expandedSearchHeight,
        flexBasis: inset.bottom + expandedSearchHeight,
      }}
    >
      <GlassContainer style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[`${background}00`, `${background}AA`, background]}
          start={{ x: 0.5, y: 0.1 }}
          style={{
            position: 'absolute',
            bottom: 0,
            height: inset.bottom + padding / 2 + buttonSize,
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
              bottom: inset.bottom,
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
              bottom: inset.bottom,
              height: buttonSize,
              borderRadius: buttonSize,
              overflow: 'hidden',
            },
          ]}
        >
          <MenuView
            // the pill already fills a 44pt target, so the 32pt-button slop would only offset it
            hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
            actions={[
              {
                id: 'allSongs',
                title: t('allSongs'),
                state: isFavorites ? 'off' : 'on',
              },
              {
                id: 'favoriteSongs',
                title: t('favoriteSongs'),
                state: isFavorites ? 'on' : 'off',
              },
            ]}
            onPressAction={({ nativeEvent }) => {
              setIsFavorites(nativeEvent.event === 'favoriteSongs');
              scrollToTop();
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
                },
              ]}
            >
              <ThemedText bold adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 17, color }}>
                {playlistTitle}
              </ThemedText>
              <FontAwesome6 name="chevron-up" iconStyle="solid" color={color} size={12} style={{ marginTop: 2 }} />
            </ButtonSurface>
          </MenuView>
        </AnimatedGlassView>
        {/* Search Box */}
        <AnimatedGlassView
          isInteractive
          style={[
            {
              position: 'absolute',
              bottom: inset.bottom,
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
  isFavorites: boolean;
  setIsFavorites: (value: boolean) => void;
  setSearchText: (text: string) => void;
};
export function IndexToolbar({
  listRef,
  scrollToSearchOffset,
  isFavorites,
  setIsFavorites,
  setSearchText,
}: IndexToolbarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const { isReduceMotionEnabled } = useAccessibilityInfo();

  if (!isLiquidGlassStyleHeader()) return null;

  return (
    <>
      <Stack.SearchBar
        placeholder={t('search')}
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
      <Stack.Toolbar>
        <Stack.Toolbar.Menu
          title={t('playlists')}
          separateBackground
          icon="music.note.list"
          tintColor={isFavorites ? primary : undefined}
        >
          <Stack.Toolbar.MenuAction
            isOn={!isFavorites}
            onPress={() => {
              setIsFavorites(false);
              listRef.current?.scrollToOffset({ offset: scrollToSearchOffset, animated: !isReduceMotionEnabled });
            }}
          >
            {t('allSongs')}
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            isOn={isFavorites}
            onPress={() => {
              setIsFavorites(true);
              listRef.current?.scrollToOffset({ offset: scrollToSearchOffset, animated: !isReduceMotionEnabled });
            }}
          >
            {t('favoriteSongs')}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.SearchBarSlot />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="slider.horizontal.3" onPress={() => router.navigate('/nustatymai')}>
          {t('settingsTitle')}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
