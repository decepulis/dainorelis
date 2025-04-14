import React, { ComponentPropsWithoutRef, useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';

const timing = {
  duration: 150,
};

type OptionType = {
  label: string;
  value: string;
};

type OptionProps = {
  isSelected: boolean;
  option: OptionType;
  onPress: ComponentPropsWithoutRef<typeof Pressable>['onPress'];
};
const Option = ({ isSelected, option, onPress }: OptionProps) => {
  const text = useThemeColor('text');
  // Animated style for the text
  const textStyle = useAnimatedStyle(() => {
    const font = isSelected ? fonts.medium : fonts.regular;
    return {
      color: withTiming(isSelected ? '#fff' : text, timing),
      ...font,
    };
  });

  return (
    <Pressable hitSlop={{ top: 14, bottom: 14 }} key={option.value} style={styles.option} onPress={onPress}>
      <Animated.Text style={[styles.optionText, textStyle]}>{option.label}</Animated.Text>
    </Pressable>
  );
};

type Props = {
  options: OptionType[];
  value: string;
  onValueChange: (value: string) => void;
};

const SegmentedControl = ({ options, value, onValueChange }: Props) => {
  const primary = useThemeColor('primary');
  const card2 = useThemeColor('card2');
  const optionWidth = useSharedValue(0);
  const activeIndex = options.findIndex((option) => option.value === value);
  const translateX = useSharedValue(0);

  // Calculate the indicator position when active index changes
  useEffect(() => {
    const targetIndex = activeIndex >= 0 ? activeIndex : 0;
    translateX.value = withTiming(targetIndex * optionWidth.value, timing);
  }, [activeIndex, translateX, optionWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: optionWidth.value,
  }));

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const containerWidth = event.nativeEvent.layout.width;
    // Calculate equal width for each option
    const equalWidth = (containerWidth - 6) / options.length; // Subtract padding
    optionWidth.value = equalWidth;

    // Set initial position for the indicator
    translateX.value = activeIndex * equalWidth;
  };

  return (
    <View style={[styles.container, { backgroundColor: `${card2}bb` }]} onLayout={onContainerLayout}>
      <Animated.View style={[styles.indicator, { backgroundColor: primary }, animatedIndicatorStyle]} />

      {options.map((option, index) => (
        <Option
          key={index}
          isSelected={option.value === value}
          option={option}
          onPress={() => onValueChange(option.value)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 25,
    overflow: 'hidden',
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
