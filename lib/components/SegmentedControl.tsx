import React, { ComponentPropsWithoutRef, useEffect } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';
import useA11yBoldText from '../hooks/useA11yBoldText';

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
  onPress: ComponentPropsWithoutRef<typeof RectButton>['onPress'];
};
const Option = ({ isSelected, option, onPress }: OptionProps) => {
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');
  const isBoldTextEnabled = useA11yBoldText();
  // Animated style for the text
  const textStyle = useAnimatedStyle(() => {
    const font = isSelected
      ? isBoldTextEnabled
        ? fonts.bold
        : fonts.medium
      : isBoldTextEnabled
        ? fonts.medium
        : fonts.regular;
    return {
      color: withTiming(isSelected ? '#fff' : text, timing),
      ...font,
    };
  });

  return (
    <RectButton hitSlop={{ top: 14, bottom: 14 }} key={option.value} style={styles.option} onPress={onPress}>
      <Animated.Text style={[styles.optionText, textStyle]}>{option.label}</Animated.Text>
    </RectButton>
  );
};

type Props = {
  options: OptionType[];
  value: string;
  onValueChange: (value: string) => void;
};

const SegmentedControl = ({ options, value, onValueChange }: Props) => {
  const primary = useThemeColor('primary');
  const card = useThemeColor('card');
  const separator = useThemeColor('separator');
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${card}bb`,
          ...Platform.select({
            ios: {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: separator,
            },
            default: {
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)',
            },
          }),
        },
      ]}
      onLayout={onContainerLayout}
    >
      <Animated.View style={[styles.indicator, { backgroundColor: primary }, animatedIndicatorStyle]} />

      {options.map((option, index) => (
        <Option
          key={index}
          isSelected={option.value === value}
          option={option}
          onPress={() => {
            setTimeout(() => {
              // there's no guarantee that the animation will be done in 150ms;
              // some things may delay it
              // but this will at least be closer than triggering the haptics immediately
              // and by the time withTiming would call its AnimationCallback it would be too late
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }, timing.duration - 100);
            onValueChange(option.value);
          }}
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
    flexShrink: 1,
    boxShadow: Platform.OS === 'android' ? '0 0 10px rgba(0, 0, 0, 0.05)' : undefined,
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
    borderRadius: 20,
    zIndex: 1,
  },
  optionText: {
    fontSize: 14,
  },
});

export default SegmentedControl;
