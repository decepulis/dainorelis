import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import Animated, { AnimatedScrollViewProps } from 'react-native-reanimated';

import { useHeaderHeight } from '@react-navigation/elements';

export const useContentContainerStyle = () => {
  const headerHeight = useHeaderHeight();
  return {
    marginTop: headerHeight,
    paddingBottom: Platform.OS === 'android' ? headerHeight : 0,
  };
};

const ScrollViewWithHeader = forwardRef<Animated.ScrollView, AnimatedScrollViewProps>(
  ({ children, contentContainerStyle: argContentContainerStyle, ...props }, ref) => {
    const contentContainerStyle = useContentContainerStyle();
    return (
      <Animated.ScrollView
        ref={ref}
        contentContainerStyle={[contentContainerStyle, argContentContainerStyle]}
        {...props}
      >
        {children}
      </Animated.ScrollView>
    );
  }
);

ScrollViewWithHeader.displayName = 'ScrollViewWithHeader';

export default ScrollViewWithHeader;
