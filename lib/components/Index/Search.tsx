import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, TextInput, View } from 'react-native';
import Animated, { AnimatedRef, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/spring';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

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

type Props = {
  scrollRef: AnimatedRef<Animated.FlatList<any>>;
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
  isFavorites,
  setIsFavorites,
  isSongFestivalMode,
  setIsSongFestivalMode,
  setSearchText,
}: Props) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const separator = useThemeColor('separator');
  const card = useThemeColor('card');
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const searchRef = useRef<TextInput>(null);
  const { isBoldTextEnabled, isReduceMotionEnabled } = useAccessibilityInfo();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isAppWide = width > maxWidth;
  const compressedSearchWidth = buttonStyles.button.width;
  const expandedSearchWidth = isAppWide
    ? 360
    : width - padding / 2 - padding / 2 - buttonStyles.button.width - padding / 4;

  const playlistMenuAnimatedStyle = useAnimatedStyle(() => {
    const targetOpacity = isSearchFocused ? 0 : 1;
    const targetLeft = isSearchFocused ? padding : padding / 2;
    return {
      opacity: isReduceMotionEnabled ? targetOpacity : withSpring(targetOpacity, springConfig),
      left: isReduceMotionEnabled ? targetLeft : withSpring(targetLeft, springConfig),
    };
  });

  const searchBoxAnimatedStyle = useAnimatedStyle(() => {
    const targetWidth = isSearchFocused ? expandedSearchWidth : compressedSearchWidth;
    const targetRight = isSearchFocused ? buttonStyles.button.width + padding / 2 + padding / 4 : padding / 2;

    return {
      width: isReduceMotionEnabled ? targetWidth : withSpring(targetWidth, springConfig),
      right: isReduceMotionEnabled ? targetRight : withSpring(targetRight, springConfig),
    };
  });

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => {
    const targetOpacity = isSearchFocused ? 1 : 0;
    const targetRight = isSearchFocused ? padding / 2 : buttonStyles.button.width + padding / 2;

    return {
      opacity: isReduceMotionEnabled ? targetOpacity : withSpring(targetOpacity, springConfig),
      right: isReduceMotionEnabled ? targetRight : withSpring(targetRight, springConfig),
    };
  });

  const scrollToTop = () => {
    const scrollEl = scrollRef?.current;
    if (!scrollEl) return;
    scrollEl.scrollToOffset({ offset: 0, animated: !isReduceMotionEnabled });
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
    <SystemView
      style={{
        position: 'absolute',
        bottom: 0,
        height: inset.bottom + padding / 2 + buttonStyles.button.width,
        left: 0,
        right: 0,
      }}
    >
      <Animated.View
        style={[playlistMenuAnimatedStyle, { position: 'absolute', bottom: inset.bottom, top: padding / 2 }]}
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
          <SystemView
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: padding / 3,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: padding / 1.5,
              height: buttonStyles.button.width,
              borderRadius: buttonStyles.button.width,
              overflow: 'hidden',
            }}
          >
            <ThemedText bold adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 17, color: 'white' }}>
              {playlistTitle}
            </ThemedText>
            <FontAwesome6 name="chevron-up" color="white" size={12} style={{ marginTop: 2 }} />
          </SystemView>
        </MenuView>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: inset.bottom,
            top: padding / 2,
            borderRadius: buttonStyles.button.width,
            overflow: 'hidden',
          },
          searchBoxAnimatedStyle,
        ]}
      >
        <SystemView style={{ position: 'absolute', inset: 0 }}>
          <TextInput
            style={[
              isBoldTextEnabled ? fonts.bold : fonts.regular,
              {
                height: '100%',
                color: 'white',
                marginRight: !isSearchFocused ? 0 : Platform.OS === 'ios' ? 10 : buttonStyles.button.width,
                marginLeft: !isSearchFocused ? 0 : buttonStyles.button.width,
              },
            ]}
            clearButtonMode="never"
            autoCorrect={false}
            ref={searchRef}
            onChangeText={onChangeText}
            onFocus={() => {
              scrollToTop();
              setIsSearchFocused(true);
            }}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="done"
            selectionColor="white"
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: buttonStyles.button.width,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <FontAwesome6 name="magnifying-glass" size={14} color="white" />
          </View>
        </SystemView>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: inset.bottom,
            top: padding / 2,
            width: buttonStyles.button.width,
            borderRadius: buttonStyles.button.width,
            overflow: 'hidden',
          },
          cancelButtonAnimatedStyle,
        ]}
      >
        <Button
          onPress={() => {
            clearSearchText();
            searchRef.current?.blur();
          }}
        >
          <FontAwesome6 name="xmark" size={18} color="white" />
        </Button>
      </Animated.View>
    </SystemView>
  );
}
