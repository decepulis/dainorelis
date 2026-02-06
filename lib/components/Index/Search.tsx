import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleProp, TextInput, View, ViewStyle } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { AnimatedRef, createAnimatedComponent, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/spring';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';

import { FontAwesome6 } from '@expo/vector-icons';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { fonts } from '@/lib/constants/themes';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';

import { useThemeColor } from '../../hooks/useThemeColor';
import Button, { styles as buttonStyles } from '../Button';
import MenuView from '../MenuView';
import SystemView from '../SystemView';
import ThemedText from '../ThemedText';

const AnimatedGlassContainer = createAnimatedComponent(GlassContainer);
const AnimatedGlassView = createAnimatedComponent(GlassView);
const expandedSearchHeight = isLiquidGlassAvailable() ? 56 : 44;
const buttonSize = isLiquidGlassAvailable() ? 56 : 44;

type Props = {
  scrollRef: AnimatedRef<Animated.FlatList<any>>;
  top: number;
  isFavorites: boolean;
  setIsFavorites: (value: boolean) => void;
  isSongFestivalMode: boolean;
  setIsSongFestivalMode: (value: boolean) => void;
  setSearchText: (text: string) => void;
};
const springConfig: SpringConfig = {
  mass: 1,
  damping: 30,
  stiffness: 400,
};

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
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const background = useThemeColor('background');
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const searchRef = useRef<TextInput>(null);
  const { isBoldTextEnabled, isReduceMotionEnabled } = useAccessibilityInfo();
  const { height, progress } = useReanimatedKeyboardAnimation();

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const keyboardHeight = height.get();
    const keyboardProgress = progress.get();
    return {
      transform: [{ translateY: keyboardHeight * keyboardProgress }],
    };
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isAppWide = width > maxWidth;
  const compressedSearchWidth = buttonSize;
  const expandedSearchWidth = isAppWide ? 360 : width - padding - padding - expandedSearchHeight - padding / 2;

  const playlistMenuAnimatedStyle = useAnimatedStyle(() => {
    const targetScale = isSearchOpen ? 0 : 1;
    const targetLeft = isSearchOpen ? padding * 2 : padding;
    return {
      transform: [{ scale: isReduceMotionEnabled ? targetScale : withSpring(targetScale, springConfig) }],
      left: isReduceMotionEnabled ? targetLeft : withSpring(targetLeft, springConfig),
    };
  });

  const searchBoxAnimatedStyle = useAnimatedStyle(() => {
    const targetWidth = isSearchOpen ? expandedSearchWidth : compressedSearchWidth;
    const targetHeight = isSearchOpen ? expandedSearchHeight : buttonSize;
    const targetRight = isSearchOpen ? expandedSearchHeight + padding + padding / 2 : padding;

    return {
      width: isReduceMotionEnabled ? targetWidth : withSpring(targetWidth, springConfig),
      height: isReduceMotionEnabled ? targetHeight : withSpring(targetHeight, springConfig),
      right: isReduceMotionEnabled ? targetRight : withSpring(targetRight, springConfig),
    };
  });

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => {
    const targetScale = isSearchOpen ? 1 : 0;
    const targetRight = isSearchOpen ? padding : buttonSize + padding;

    return {
      right: isReduceMotionEnabled ? targetRight : withSpring(targetRight, springConfig),
      transform: [{ scale: isReduceMotionEnabled ? targetScale : withSpring(targetScale, springConfig) }],
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

  const ButtonWrapper = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) =>
    isLiquidGlassAvailable() ? (
      <View style={[style]}>{children}</View>
    ) : (
      <SystemView shadow={false} style={[style]}>
        {children}
      </SystemView>
    );

  const playlistTitle = isFavorites ? t('favoriteSongs') : t('allSongs');
  const color = isLiquidGlassAvailable() ? text : '#ffffff';
  const accent = isLiquidGlassAvailable() ? primary : '#ffffff';

  return (
    <AnimatedGlassContainer
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: inset.bottom + expandedSearchHeight,
          flexBasis: inset.bottom + expandedSearchHeight,
        },
        containerAnimatedStyle,
      ]}
    >
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
        // tintColor={primary}
        isInteractive
        style={[
          {
            position: 'absolute',
            bottom: inset.bottom,
            width: expandedSearchHeight,
            height: expandedSearchHeight,
            borderRadius: expandedSearchHeight / 2,
          },
          isLiquidGlassAvailable() ? {} : { overflow: 'hidden' },
          cancelButtonAnimatedStyle,
        ]}
      >
        <Button
          noGlass
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
          <FontAwesome6 name="xmark" size={18} color={color} />
        </Button>
      </AnimatedGlassView>
      {/* Playlist Menu */}
      <AnimatedGlassView
        // tintColor={primary}
        isInteractive
        style={[
          playlistMenuAnimatedStyle,
          {
            position: 'absolute',
            bottom: inset.bottom,
            height: buttonSize,
            borderRadius: buttonSize,
          },
          isLiquidGlassAvailable() ? {} : { overflow: 'hidden' },
        ]}
      >
        <MenuView
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
          onPressAction={({ nativeEvent }) => setIsFavorites(nativeEvent.event === 'favoriteSongs')}
        >
          <ButtonWrapper
            style={[
              buttonStyles.button,
              {
                width: 'auto',
                flexBasis: '100%',
                flexDirection: 'row',
                gap: padding / 3,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: buttonSize / 3,
              },
            ]}
          >
            <ThemedText
              bold
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ fontSize: isLiquidGlassAvailable() ? 19 : 17, color }}
            >
              {playlistTitle}
            </ThemedText>
            <FontAwesome6
              name="chevron-up"
              color={color}
              size={isLiquidGlassAvailable() ? 16 : 12}
              style={{ marginTop: 2 }}
            />
          </ButtonWrapper>
        </MenuView>
      </AnimatedGlassView>
      {/* Search Box */}
      <AnimatedGlassView
        // tintColor={primary}
        isInteractive
        style={[
          {
            position: 'absolute',
            bottom: inset.bottom,
            borderRadius: buttonSize,
          },
          isLiquidGlassAvailable() ? {} : { overflow: 'hidden' },
          searchBoxAnimatedStyle,
        ]}
      >
        <ButtonWrapper style={{ position: 'absolute', inset: 0 }}>
          <TextInput
            style={[
              isBoldTextEnabled ? fonts.bold : fonts.regular,
              {
                height: '100%',
                color,
                marginRight: !isSearchOpen ? 0 : Platform.OS === 'ios' ? 10 : buttonSize,
                marginLeft: !isSearchOpen ? 0 : buttonSize,
              },
            ]}
            clearButtonMode="never"
            autoCorrect={false}
            ref={searchRef}
            onChangeText={onChangeText}
            onFocus={() => {
              scrollToTop();
              setIsSearchOpen(true);
            }}
            returnKeyType="done"
            selectionColor={accent}
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
            <FontAwesome6 name="magnifying-glass" size={isLiquidGlassAvailable() ? 18 : 14} color={color} />
          </View>
        </ButtonWrapper>
      </AnimatedGlassView>
    </AnimatedGlassContainer>
  );
}
