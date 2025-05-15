import React, { ComponentPropsWithoutRef, useEffect } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/springUtils';

import * as Haptics from 'expo-haptics';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';

const springConfig: SpringConfig = {
  mass: 1,
  damping: 50,
  stiffness: 700,
};

type OptionType = {
  label: string;
  value: string;
};

type OptionProps = {
  isSelected: boolean;
  option: OptionType;
  onPress: ComponentPropsWithoutRef<typeof RectButton>['onPress'];
  isFirst: boolean;
  isLast: boolean;
};
const Option = ({ isSelected, option, onPress, isFirst, isLast }: OptionProps) => {
  const text = useThemeColor('text');
  const { isBoldTextEnabled } = useAccessibilityInfo();
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
      color: withSpring(isSelected ? '#fff' : text, springConfig),
      ...font,
    };
  });

  return (
    <RectButton
      hitSlop={{ top: 3, bottom: 3, left: isFirst ? 3 : 0, right: isLast ? 3 : 0 }}
      key={option.value}
      style={styles.option}
      onPress={onPress}
    >
      <Animated.Text style={[styles.optionText, textStyle]}>{option.label}</Animated.Text>
    </RectButton>
  );
};

type Props = {
  options: OptionType[];
  value: string;
  onValueChange: (value: string) => void;
  style?: ComponentPropsWithoutRef<typeof View>['style'];
};

const SegmentedControl = ({ options, value, onValueChange, style }: Props) => {
  const primary = useThemeColor('primary');
  const card = useThemeColor('card');
  const separator = useThemeColor('separator');
  const optionWidth = useSharedValue(0);
  const activeIndex = options.findIndex((option) => option.value === value);
  const translateX = useSharedValue(0);

  // Calculate the indicator position when active index changes
  useEffect(() => {
    const targetIndex = activeIndex >= 0 ? activeIndex : 0;
    translateX.value = withSpring(targetIndex * optionWidth.value, springConfig);
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
              boxShadow: '0 0 10px rgba(64, 64, 64, 0.1)',
            },
          }),
        },
        style,
      ]}
      onLayout={onContainerLayout}
    >
      <Animated.View style={[styles.indicator, { backgroundColor: primary }, animatedIndicatorStyle]} />

      {options.map((option, index) => (
        <Option
          key={index}
          isSelected={option.value === value}
          isFirst={index === 0}
          isLast={index === options.length - 1}
          option={option}
          onPress={() => {
            onValueChange(option.value);
            if (option.value !== value) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
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
    boxShadow: Platform.OS === 'android' ? '0 0 10px rgba(64, 64, 64, 0.1)' : undefined,
  },
  indicator: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    top: 3,
    bottom: 3,
    left: 3,
    zIndex: 0,
  },
  option: {
    flex: 1, // Equal width for all options
    paddingVertical: 3,
    minHeight: 32,
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
