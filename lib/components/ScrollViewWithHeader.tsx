import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import Animated, { AnimatedScrollViewProps } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderHeight } from '@react-navigation/elements';

const ScrollViewWithHeader = forwardRef<Animated.ScrollView, AnimatedScrollViewProps>(
  ({ children, scrollIndicatorInsets, contentContainerStyle, ...props }, ref) => {
    const headerHeight = useHeaderHeight();
    const inset = useSafeAreaInsets();
    return (
      <Animated.ScrollView
        ref={ref}
        scrollIndicatorInsets={{
          top: headerHeight - inset.top,
          ...scrollIndicatorInsets,
        }}
        contentContainerStyle={[
          {
            marginTop: headerHeight,
            paddingBottom: Platform.OS === 'android' ? headerHeight : 0,
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
