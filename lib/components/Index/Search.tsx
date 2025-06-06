import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeMethods, StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from 'react-native-reanimated';

import { FontAwesome6 } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';

import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';

import maxWidth from '../../constants/maxWidth';
import { useThemeColor } from '../../hooks/useThemeColor';
import SystemView from '../SystemView';
import ThemedText from '../ThemedText';

const paddingVertical = padding / 2;

type Props = {
  scrollRef: AnimatedRef<Animated.FlatList<any>>;
  isFavorites: boolean;
  setIsFavorites: (value: boolean) => void;
  setSearchText: (text: string) => void;
  setSearchHeight: (height: number) => void;
};
export default function Search({ scrollRef, isFavorites, setIsFavorites, setSearchText, setSearchHeight }: Props) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const separator = useThemeColor('separator');
  const card = useThemeColor('card');
  const isDark = useColorScheme() === 'dark';
  // @ts-expect-error useScrollViewOffset doesn't know this works with flatlist
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);
  const headerHeight = useHeaderHeight();
  const searchRef = useRef<TextInput>(null);

  const { isBoldTextEnabled, isReduceMotionEnabled } = useAccessibilityInfo();

  const viewRef = useRef<View>(null);
  const howFarThisIsFromTheTop = useSharedValue<number | null>(null);
  // TODO onLayoutEffect?
  const figureOutHowFarThisIsFromTheTop = useCallback(() => {
    const scrollEl = scrollRef?.current?.getNativeScrollRef() as NativeMethods;
    const viewEl = viewRef?.current as NativeMethods;
    if (!scrollEl || !viewEl) return;
    viewEl.measureLayout(scrollEl, (_x, y) => {
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
        scrollEl.scrollToOffset({ offset: howFarThisIsFromTheTop.value + padding, animated: !isReduceMotionEnabled });
      } else {
        scrollEl.scrollToOffset({ offset: 0, animated: !isReduceMotionEnabled });
      }
    },
    [howFarThisIsFromTheTop, isReduceMotionEnabled, scrollRef]
  );
  const onChangeText = useCallback(
    (t: string) => {
      setSearchText(t);
      if (t.length > 0) {
        scrollToTop(true);
      }
    },
    [setSearchText, scrollToTop]
  );
  const clearSearchText = useCallback(() => {
    const searchEl = searchRef?.current;
    if (searchEl) {
      searchRef.current?.clear();
      onChangeText('');
    }
  }, [onChangeText]);

  // const title = 'XI-toji Šiaurės Amerikos Dainų Šventė';
  // const title = 'XI North American Lithuanian Song Festival';
  const title = 'Visos dainos';
  // const title = 'Mėgstamiausios';

  return (
    // TODO if this is wide enough, make it horizontal
    <View
      style={{
        position: 'relative',
      }}
      ref={viewRef}
      onLayout={figureOutHowFarThisIsFromTheTop}
    >
      {/* background once sticky */}
      <Animated.View style={[StyleSheet.absoluteFill, fadeInStyle]}>
        <SystemView
          style={[StyleSheet.absoluteFill, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: primary }]}
        />
      </Animated.View>
      <View
        onLayout={(event) => {
          setSearchHeight(event.nativeEvent.layout.height);
        }}
        style={{
          maxWidth: maxWidth,
          width: '100%',
          marginHorizontal: 'auto',
          paddingLeft: padding,
          paddingRight: 14, // this forces alignment with iOS header
          paddingVertical,
        }}
      >
        <View
          style={{
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <View
            style={{
              flexGrow: 1,
              flexShrink: 1,
              flexDirection: 'row',
              gap: padding / 2,
              alignItems: 'center',
              minHeight: 34,
            }}
          >
            <ThemedText
              bold
              adjustsFontSizeToFit
              // 40 characters is kinda arbitrary. the ideal number will vary according to screen size. my objective here is to prevent orphaned words on the second line and to prevent text from getting too small on a single line.
              numberOfLines={title.length > 40 ? 2 : 1}
              style={{ fontSize: 18, flexShrink: 1 }}
            >
              {title}
            </ThemedText>
            <FontAwesome6 name="chevron-down" color={text} size={12} style={{ position: 'relative', top: -1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <SystemView
              style={{
                width: 34,
                height: 34,
                borderRadius: 9999,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesome6 name="magnifying-glass" size={15} color="white" />
              {/* <FontAwesome6 name="info" size={15} color="white" style={{ position: 'relative', top: -1 }} /> */}
            </SystemView>
          </View>
        </View>
        {/* <View
          style={{
            marginTop: padding / 3,
            position: 'relative',
            height: searchHeight,
            borderRadius: 9999,
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
                marginHorizontal: searchHeight,
              },
            ]}
            autoCorrect={false}
            ref={searchRef}
            onChangeText={onChangeText}
            onFocus={() => scrollToTop(true)}
            returnKeyType="done"
            selectionColor={primary}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FontAwesome6 name="magnifying-glass" size={16} color={text} />
          </View>
          <Pressable
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 40,
              borderRadius: 9999,
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={clearSearchText}
          >
            <FontAwesome6 name="xmark" size={18} color={text} />
          </Pressable>
        </View> */}
      </View>
    </View>
  );
}
