import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import Animated, { AnimatedScrollViewProps } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useDefaultHeaderHeight from '../hooks/useDefaultHeaderHeight';

const ScrollViewWithHeader = forwardRef<Animated.ScrollView, AnimatedScrollViewProps>(
  ({ children, scrollIndicatorInsets, contentContainerStyle, ...props }, ref) => {
    const defaultHeaderHeight = useDefaultHeaderHeight();
    const inset = useSafeAreaInsets();
    return (
      <Animated.ScrollView
        ref={ref}
        scrollIndicatorInsets={{
          top: defaultHeaderHeight - inset.top,
          ...scrollIndicatorInsets,
        }}
        contentContainerStyle={[
          {
            marginTop: defaultHeaderHeight,
            paddingBottom: Platform.OS === 'android' ? defaultHeaderHeight : 0,
          },
          contentContainerStyle,
        ]}
        {...props}
      >
        {children}
      </Animated.ScrollView>
    );
  }
);

ScrollViewWithHeader.displayName = 'ScrollViewWithHeader';

export default ScrollViewWithHeader;
