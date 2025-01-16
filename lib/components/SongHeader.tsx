import React, { memo, useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';

import { fonts } from '../constants/themes';
import useDefaultHeaderHeight from '../hooks/useDefaultHeaderHeight';
import { useThemeColor } from '../hooks/useThemeColor';
import splitTitle from '../utils/splitTitle';
import HomeButton from './HomeButton';
import ThemedText from './ThemedText';

const timing = {
  duration: 200,
};

type SongHeaderProps = {
  title?: string;
  isTitleBehind: boolean;
};
const _SongHeader = ({ title, isTitleBehind }: SongHeaderProps) => {
  const height = useDefaultHeaderHeight();
  const inset = useSafeAreaInsets();

  const background = useThemeColor('background');
  const primary = useThemeColor('primary');
  const sv = useSharedValue(isTitleBehind);

  useEffect(() => {
    sv.value = isTitleBehind;
  }, [isTitleBehind, sv]);

  // todo reduce motion
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(sv.value ? primary : background, timing),
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(sv.value ? 1 : 0, timing),
    transform: [{ translateY: withTiming(sv.value ? 0 : 5, timing) }],
  }));

  // if the header title has parentheses, break it up!
  const parts = splitTitle(title);

  return (
    <>
      <StatusBar style={isTitleBehind ? 'light' : 'auto'} />
      <Animated.View
        style={[
          {
            height,
            paddingTop: inset.top,
          },
          styles.header,
          animatedHeaderStyle,
        ]}
      >
        <HomeButton color={isTitleBehind ? '#fff' : primary} timing={timing} />
        <Animated.View
          style={[
            {
              top: inset.top,
            },
            styles.title,
            animatedTitleStyle,
          ]}
        >
          {parts.map((part, index) => (
            <ThemedText
              key={index}
              numberOfLines={parts.length === 1 && index === 0 ? 2 : 1}
              style={[
                {
                  ...(index === 0 ? fonts.bold : fonts.regular),
                  fontSize: parts.length === 1 ? 17 : index === 0 ? 16 : 14,
                  lineHeight: parts.length === 1 ? 17 * 1.25 : index === 0 ? 16 * 1.25 : 14 * 1.25,
                  textAlign: Platform.select({ default: 'center', android: 'left' }),
                  position: 'relative',
                  top: parts.length === 1 ? 1 : 0,
                  color: '#fff',
                },
              ]}
            >
              {part}
            </ThemedText>
          ))}
        </Animated.View>
      </Animated.View>
    </>
  );
};
const SongHeader = memo(_SongHeader);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 0,
    justifyContent: 'center',
    alignItems: Platform.select({ default: 'center', android: 'flex-start' }),
  },
});

export default SongHeader;
