import React, { memo } from 'react';
import { SectionList, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Constants from 'expo-constants';

import { getDefaultHeaderHeight } from '@react-navigation/elements';

import { useThemeColor } from '@/lib/hooks/useThemeColor';
import easeInOutSine from '@/lib/utils/easeInOutSine';

import AnimatedImage from './AnimatedImage';

export function useIndexHeaderStartHeight() {
  const { height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  return Math.max(200 + inset.top, height / 4);
}
export function useIndexHeaderEndHeight() {
  const inset = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  // todo this is slightly off on android
  return getDefaultHeaderHeight({ height, width }, false, inset.top);
}

// todo: maybe disable this on web and ipad
type IndexHeaderProps = {
  scrollRef: AnimatedRef<SectionList<any>>;
  children?: React.ReactNode;
};
const _IndexHeader = ({ scrollRef, children }: IndexHeaderProps) => {
  const primary = useThemeColor('primary');
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const headerStartHeight = useIndexHeaderStartHeight();
  const headerEndHeight = useIndexHeaderEndHeight();

  // @ts-expect-error SectionList is an acceptable thing to have here
  const scrollOffset = useScrollViewOffset(scrollRef);
  const scrollOffsetEnd = headerStartHeight - headerEndHeight;

  // header height animation
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height: Math.max(headerStartHeight - scrollOffset.value, headerEndHeight),
  }));

  // background fade animation
  // todo: scale instead of top/bottom?
  const backgroundStartOpacity = 1;
  const backgroundEndOpacity = 0;
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    top: Math.min(-1 * 0.5 * scrollOffset.value, 0),
    bottom: Math.min(-1 * 0.5 * scrollOffset.value, 0),
    opacity: interpolate(
      easeInOutSine(scrollOffset.value, scrollOffsetEnd),
      [0, 1],
      [backgroundStartOpacity, backgroundEndOpacity],
      Extrapolation.CLAMP
    ),
  }));

  // logo scale animation
  // todo: use scale instead of width...?
  const logoAspectRatio = 784 / 250; // width  / height
  const logoStartWidth = Math.min(width - 80, 320);
  const logoEndHeight = headerEndHeight - Constants.statusBarHeight - 5;
  const logoEndWidth = logoEndHeight * logoAspectRatio; // 5px vertical padding
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(scrollOffset.value, [0, scrollOffsetEnd], [logoStartWidth, logoEndWidth], Extrapolation.CLAMP),
  }));

  return (
    <View>
      <Animated.View
        style={[
          styles.headerImageContainer,
          {
            backgroundColor: primary,
            paddingTop: 5 + (3 * inset.top) / 4,
          },
          headerAnimatedStyle,
        ]}
      >
        <AnimatedImage source="miskas" style={[styles.headerBackground, backgroundAnimatedStyle]} contentFit="cover" />
        <AnimatedImage source="logo_white" style={[styles.headerLogo, logoAnimatedStyle]} contentFit="contain" />
      </Animated.View>
      {children}
    </View>
  );
};
const IndexHeader = memo(_IndexHeader);

const styles = StyleSheet.create({
  headerImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  headerLogo: { height: '100%' },
});

export default IndexHeader;
