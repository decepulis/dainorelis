import React, { useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
};

const SegmentedControl = ({ options, value, onValueChange }: Props) => {
  const card0 = useThemeColor('card0');
  const isDark = useColorScheme() === 'dark';

  const optionWidth = useSharedValue(0);
  const activeIndex = options.findIndex((option) => option.value === value);
  const translateX = useSharedValue(0);

  // Calculate the indicator position when active index changes
  useEffect(() => {
    const targetIndex = activeIndex >= 0 ? activeIndex : 0;
    translateX.value = withTiming(targetIndex * optionWidth.value, { duration: 200 });
  }, [activeIndex, translateX, optionWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: optionWidth.value,
    };
  });

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const containerWidth = event.nativeEvent.layout.width;
    // Calculate equal width for each option
    const equalWidth = (containerWidth - 6) / options.length; // Subtract padding
    optionWidth.value = equalWidth;

    // Set initial position for the indicator
    translateX.value = activeIndex * equalWidth;
  };

  return (
    <View
      style={[
        styles.container,
        {
          // TODO theme
          backgroundColor: isDark ? `rgba(255,255,255,0.125)` : `rgba(0,0,0,0.075)`,
        },
      ]}
      onLayout={onContainerLayout}
    >
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]}>
        <SystemView style={StyleSheet.absoluteFill} variant={isDark ? 'primary' : 'background'} />
      </Animated.View>

      {options.map((option) => (
        <Pressable
          hitSlop={{ top: 14, bottom: 14 }}
          key={option.value}
          style={styles.option}
          onPress={() => onValueChange(option.value)}
        >
          <ThemedText style={[styles.optionText, option.value === value ? fonts.medium : fonts.regular]}>
            {option.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 3,
    position: 'relative',
    width: '100%', // Ensure container takes full width
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    top: 3,
    bottom: 3,
    left: 3,
    zIndex: 0,
  },
  option: {
    flex: 1, // Equal width for all options
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: 14,
  },
});

export default SegmentedControl;
