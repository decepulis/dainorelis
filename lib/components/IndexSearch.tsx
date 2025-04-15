import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';

import maxWidth from '../constants/maxWidth';
import { fonts } from '../constants/themes';
import useDefaultHeaderHeight from '../hooks/useDefaultHeaderHeight';
import { useThemeColor } from '../hooks/useThemeColor';
import SegmentedControl from './SegmentedControl';
import SystemView from './SystemView';

type Props = {
  scrollRef: AnimatedRef<AnimatedScrollView>;
  filter: 'allSongs' | 'favoriteSongs';
  setFilter: (value: 'allSongs' | 'favoriteSongs') => void;
  searchText?: string;
  setSearchText: (text: string) => void;
  setSearchHeight: (height: number) => void;
  margin: number;
  padding: number;
};
export default function IndexSearch({
  scrollRef,
  filter,
  setFilter,
  searchText,
  setSearchText,
  setSearchHeight,
  margin,
  padding,
}: Props) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const card2 = useThemeColor('card2');
  const scrollOffset = useScrollViewOffset(scrollRef);
  const defaultHeaderHeight = useDefaultHeaderHeight();

  // hard coding this for now
  const howFarThisIsFromTheTop = useSharedValue(250);
  const figureOutHowFarThisIsFromTheTop = useCallback(
    (event: LayoutChangeEvent) => {
      event.target.measureInWindow((_x, y, _width, _height) => {
        howFarThisIsFromTheTop.value = y - defaultHeaderHeight;
      });
    },
    [howFarThisIsFromTheTop, defaultHeaderHeight]
  );

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.value,
      [howFarThisIsFromTheTop.value, howFarThisIsFromTheTop.value + padding],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={{ position: 'relative' }} onLayout={figureOutHowFarThisIsFromTheTop}>
      <Animated.View style={[StyleSheet.absoluteFill, fadeInStyle]}>
        <SystemView
          variant="primary"
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
          paddingHorizontal: margin + padding - 5,
          paddingVertical: padding / 4,
        }}
      >
        <SegmentedControl
          options={[
            { label: t('allSongs'), value: 'allSongs' },
            { label: t('favoriteSongs'), value: 'favoriteSongs' },
          ]}
          value={filter}
          onValueChange={(value) => {
            setFilter(value as 'allSongs' | 'favoriteSongs');
          }}
        />
        <TextInput
          style={[
            fonts.regular, // a11y bold
            {
              backgroundColor: `${card2}bb`,
              color: text,
              marginTop: padding / 4,
              paddingHorizontal: padding,
              height: 40,
              borderRadius: 15,
              boxShadow: Platform.OS === 'android' ? '0 0 10px rgba(0, 0, 0, 0.05)' : undefined,
            },
          ]}
          clearButtonMode="while-editing"
          autoCorrect={false}
          defaultValue={searchText}
          onChangeText={setSearchText}
          returnKeyType="done"
          selectionColor={primary}
        />
      </View>
    </View>
  );
}
