import React, { forwardRef } from 'react';
import Animated, { AnimatedScrollViewProps } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useDefaultHeaderHeight from '../hooks/useDefaultHeaderHeight';

const ScrollViewWithHeader = forwardRef<Animated.ScrollView, AnimatedScrollViewProps>(
  ({ children, scrollIndicatorInsets, ...props }, ref) => {
    const defaultHeaderHeight = useDefaultHeaderHeight();
    const inset = useSafeAreaInsets();
    return (
      <Animated.ScrollView
        ref={ref}
        scrollIndicatorInsets={{
          top: defaultHeaderHeight - inset.top,
          ...scrollIndicatorInsets,
        }}
        contentContainerStyle={{ marginTop: defaultHeaderHeight, marginBottom: inset.bottom }}
        {...props}
      >
        {children}
      </Animated.ScrollView>
    );
  }
);

ScrollViewWithHeader.displayName = 'ScrollViewWithHeader';

export default ScrollViewWithHeader;
