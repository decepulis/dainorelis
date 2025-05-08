import React from 'react';
import { LayoutRectangle, Platform, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import Button, { buttonSlop } from './Button';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const timing = {
  duration: 150,
};

type HeaderBackgroundProps = {
  scrollRef?: AnimatedRef<AnimatedScrollView>;
  opaque?: boolean;
  shadow?: boolean;
};

export function HeaderBackground({ scrollRef, opaque, shadow = true }: HeaderBackgroundProps) {
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opaque ? 1 : interpolate(scrollOffset.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  // TODO BLOCKER manage status bar color & tint color dynamically
  return (
    <Animated.View style={[{ height: '100%' }, typeof scrollRef !== 'undefined' ? headerStyle : {}]}>
      <SystemView variant="primary" shadow={shadow} style={{ flex: 1 }}></SystemView>
    </Animated.View>
  );
}

const useAlign = () => {
  const inset = useSafeAreaInsets();
  return Platform.OS === 'ios' && inset.top >= 30 ? 'flex-start' : 'center';
};

type HeaderTitleProps = {
  scrollRef?: AnimatedRef<AnimatedScrollView>;
  titleLayout?: SharedValue<LayoutRectangle | null>;
  children?: React.ReactNode;
  title?: string[];
};
export const HeaderTitle = ({ scrollRef, titleLayout, children, title }: HeaderTitleProps) => {
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);

  const animatedTitleStyle = useAnimatedStyle(() => {
    let isTitleBehind = true;
    if (titleLayout?.value) {
      isTitleBehind = scrollOffset.value > titleLayout.value.y + titleLayout.value.height;
    }
    return {
      opacity: withTiming(isTitleBehind ? 1 : 0, timing),
      transform: [{ translateY: withTiming(isTitleBehind ? 0 : 5, timing) }],
    };
  });

  return (
    <Animated.View style={animatedTitleStyle}>
      {title ? (
        title.map((part, index) => (
          <ThemedText
            key={index}
            numberOfLines={title.length === 1 && index === 0 ? 2 : 1}
            bold={index === 0}
            style={[
              {
                fontSize: title.length === 1 ? 17 : index === 0 ? 16 : 14,
                lineHeight: title.length === 1 ? 28 : index === 0 ? 16 * 1.25 : 14 * 1.25,
                textAlign: Platform.select({ default: 'center', android: 'left' }),
                position: 'relative',
                top: title.length === 1 ? 1 : 0,
                color: '#fff',
              },
            ]}
          >
            {part}
          </ThemedText>
        ))
      ) : typeof children === 'string' ? (
        <ThemedText>{children}</ThemedText>
      ) : (
        children
      )}
    </Animated.View>
  );
};

export const HeaderLeft: NativeStackNavigationOptions['headerLeft'] = ({ href, canGoBack }) => {
  if (!canGoBack) return null;

  return (
    <Link href={href || '../'} asChild>
      <Button>
        <FontAwesome6 name="chevron-left" size={16} color="white" />
      </Button>
    </Link>
  );
};

const gap = buttonSlop.left + buttonSlop.right;

type HeaderButtonContainerProps = {
  children?: React.ReactNode;
};
export const HeaderButtonContainer = ({ children }: HeaderButtonContainerProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap,
      }}
    >
      {children}
    </View>
  );
};
