import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeMethods, Platform, StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';

import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';

import maxWidth from '../../constants/maxWidth';
import { fonts } from '../../constants/themes';
import { useThemeColor } from '../../hooks/useThemeColor';
import { buttonSlop } from '../Button';
import SegmentedControl from '../SegmentedControl';
import SystemView from '../SystemView';

const paddingVertical = padding / 4;

type Props = {
  scrollRef: AnimatedRef<Animated.FlatList<any>>;
  isFavorites: boolean;
  setIsFavorites: (value: boolean) => void;
  isSongFestivalMode: boolean;
  setIsSongFestivalMode: (value: boolean) => void;
  setSearchText: (text: string) => void;
  setSearchHeight: (height: number) => void;
};
export default function Search({
  scrollRef,
  isFavorites,
  setIsFavorites,
  isSongFestivalMode,
  setIsSongFestivalMode,
  setSearchText,
  setSearchHeight,
}: Props) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const separator = useThemeColor('separator');
  const card = useThemeColor('card');
  const isDark = useColorScheme() === 'dark';
  // @ts-expect-error useScrollViewOffset doesn't know this works with flatlist
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);
  const headerHeight = useHeaderHeight();
  const { setDidSongFestivalLoad } = useDidImagesLoad();

  const { isBoldTextEnabled } = useAccessibilityInfo();

  const viewRef = useRef<View>(null);
  const howFarThisIsFromTheTop = useSharedValue<number | null>(null);
  const figureOutHowFarThisIsFromTheTop = useCallback(() => {
    const scrollEl = scrollRef?.current?.getNativeScrollRef() as NativeMethods;
    const viewEl = viewRef?.current as NativeMethods;
    if (!scrollEl || !viewEl) return;
    viewEl.measureLayout(scrollEl, (_x, y, width, height) => {
      howFarThisIsFromTheTop.value = y - headerHeight;
    });
  }, [headerHeight, howFarThisIsFromTheTop, scrollRef]);

  // onLayout fires before headerHeight changes, so, let's do this just to be sure
  useEffect(figureOutHowFarThisIsFromTheTop, [figureOutHowFarThisIsFromTheTop]);

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: howFarThisIsFromTheTop.value
      ? interpolate(
          scrollOffset.value,
          [howFarThisIsFromTheTop.value, howFarThisIsFromTheTop.value + padding],
          [0, 1],
          Extrapolation.CLAMP
        )
      : 0,
  }));

  const scrollToTop = useCallback(
    (isSearch = false) => {
      const scrollEl = scrollRef?.current;
      if (!scrollEl) return;
      if (isSearch && howFarThisIsFromTheTop.value) {
        scrollEl.scrollToOffset({ offset: howFarThisIsFromTheTop.value + padding, animated: true });
      } else {
        scrollEl.scrollToOffset({ offset: 0, animated: true });
      }
    },
    [howFarThisIsFromTheTop, scrollRef]
  );

  return (
    // TODO if this is wide enough, make it horizontal
    <View
      style={{
        position: 'relative',
        marginBottom: padding - paddingVertical,
      }}
      ref={viewRef}
      onLayout={figureOutHowFarThisIsFromTheTop}
    >
      {/* background once sticky */}
      <Animated.View style={[StyleSheet.absoluteFill, fadeInStyle]}>
        <SystemView
          variant="primary"
          style={[StyleSheet.absoluteFill, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: primary }]}
        />
      </Animated.View>
      <View
        onLayout={(event) => {
          setSearchHeight(event.nativeEvent.layout.height + (padding - paddingVertical) * 2);
        }}
        style={{
          maxWidth: maxWidth,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: padding - 5,
          paddingVertical,
        }}
      >
        <View style={{ flexDirection: 'row', gap: buttonSlop.left }}>
          <SegmentedControl
            options={[
              { label: t('allSongs'), value: 'allSongs' },
              { label: t('favoriteSongs'), value: 'favoriteSongs' },
            ]}
            value={isFavorites ? 'favoriteSongs' : 'allSongs'}
            onValueChange={(value) => {
              setIsFavorites(value === 'favoriteSongs');
              scrollToTop();
            }}
            style={{
              flex: 1,
            }}
          />
          <BorderlessButton
            // TODO blocker? why is this not rippling?
            hitSlop={{ ...buttonSlop, right: padding }}
            onPress={() => {
              Haptics.impactAsync(
                isSongFestivalMode ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Medium
              );
              setIsSongFestivalMode(!isSongFestivalMode);
              scrollToTop();
            }}
            style={{
              aspectRatio: 1,
            }}
          >
            <View
              style={[
                {
                  flex: 1,
                  borderRadius: 9999,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSongFestivalMode ? 'black' : `${card}bb`,
                  ...Platform.select({
                    ios: {
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isSongFestivalMode ? card : separator,
                    },
                    default: {
                      borderWidth: 1,
                      borderColor: isSongFestivalMode && isDark ? card : 'transparent',
                      boxShadow: '0 0 10px rgba(64, 64, 64, 0.1)',
                    },
                  }),
                },
              ]}
            >
              <Image
                source={require('@/assets/images/ds2025_logo_image.png')}
                style={{
                  width: '66%',
                  height: '66%',
                }}
                onLoad={() => setDidSongFestivalLoad(true)}
                contentFit="contain"
                contentPosition="center"
              />
            </View>
          </BorderlessButton>
        </View>
        <View
          style={{
            marginTop: padding / 4,
            position: 'relative',
            height: 40,
            borderRadius: 15,
            backgroundColor: `${card}bb`,
            ...Platform.select({
              ios: {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: separator,
              },
              default: {
                boxShadow: '0 0 10px rgba(64, 64, 64, 0.1)',
              },
            }),
          }}
        >
          <TextInput
            style={[
              isBoldTextEnabled ? fonts.bold : fonts.regular,
              {
                height: '100%',
                color: text,
                marginRight: 10,
                marginLeft: 40,
              },
            ]}
            clearButtonMode="while-editing"
            autoCorrect={false}
            onChangeText={(t) => {
              setSearchText(t);
              scrollToTop(true);
            }}
            onFocus={() => scrollToTop(true)}
            returnKeyType="done"
            selectionColor={primary}
          />
          <View
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              width: 20,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="search" size={18} color={text} />
          </View>
        </View>
      </View>
    </View>
  );
}
