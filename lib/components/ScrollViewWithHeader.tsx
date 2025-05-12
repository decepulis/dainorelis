import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import Animated, { AnimatedScrollViewProps } from 'react-native-reanimated';

import { useHeaderHeight } from '@react-navigation/elements';

const ScrollViewWithHeader = forwardRef<Animated.ScrollView, AnimatedScrollViewProps>(
  ({ children, contentContainerStyle, ...props }, ref) => {
    const headerHeight = useHeaderHeight();
    return (
      <Animated.ScrollView
        ref={ref}
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
