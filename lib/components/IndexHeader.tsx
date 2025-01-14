import React, { memo } from 'react';
import { Pressable, SectionList, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { getDefaultHeaderHeight } from '@react-navigation/elements';

import { useThemeColor } from '@/lib/hooks/useThemeColor';
import easeInOutSine from '@/lib/utils/easeInOutSine';

import easeOutSine from '../utils/easeOutSine';
import AnimatedImage from './AnimatedImage';

export function useIndexHeaderStartHeight() {
  const { height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  return Math.max(200 + inset.top, height / 4);
}
export function useIndexHeaderEndHeight() {
  const inset = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  // TODO this is slightly off on android
  return getDefaultHeaderHeight({ height, width }, false, inset.top);
}

// TODO: maybe disable this on web and ipad
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
    height: Math.min(Math.max(headerStartHeight - scrollOffset.value, headerEndHeight), headerStartHeight),
  }));

  // background fade animation
  const backgroundStartOpacity = 1;
  const backgroundEndOpacity = 0;
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, scrollOffsetEnd],
          [0, -scrollOffsetEnd / 1.5],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      easeInOutSine(scrollOffset.value, scrollOffsetEnd),
      [0, 1], // [0, 1] instead of [0, scrollOffsetEnd] since that's what easeInOutSine returns
      [backgroundStartOpacity, backgroundEndOpacity],
      Extrapolation.CLAMP
    ),
  }));

  // logo scale animation
  // TODO: use scale instead of width...?
  const logoAspectRatio = 784 / 250; // width  / height
  const logoStartWidth = Math.min(width - 80, 320);
  const logoEndHeight = headerEndHeight - inset.top - 5; // 5px vertical padding
  const logoEndWidth = logoEndHeight * logoAspectRatio;

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(
      easeOutSine(scrollOffset.value, scrollOffsetEnd),
      [0, 1], // [0, 1] instead of [0, scrollOffsetEnd] since that's what easeOutSine returns,
      [logoStartWidth, logoEndWidth],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View>
      <Animated.View style={[styles.headerImageContainer, { backgroundColor: primary }, headerAnimatedStyle]}>
        <AnimatedImage
          source={require('@/assets/images/miskas.jpg')}
          style={[styles.headerBackground, { height: headerStartHeight }, backgroundAnimatedStyle]}
          contentFit="cover"
        />
        <AnimatedImage
          source={require('@/assets/images/logo_white.png')}
          style={[{ top: inset.top }, styles.headerLogo, logoAnimatedStyle]}
          contentFit="contain"
        />
        <Animated.View style={[{ top: inset.top, height: headerEndHeight - inset.top }, styles.headerButtonContainer]}>
          <Link href="/apie" asChild>
            <Pressable hitSlop={24}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" style={styles.headerButton} />
            </Pressable>
          </Link>
        </Animated.View>
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
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerLogo: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: '-50%' }],
  },
  headerButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {},
});

export default IndexHeader;
