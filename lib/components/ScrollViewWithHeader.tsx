import { Platform } from 'react-native';
import Animated, { type AnimatedRef, type AnimatedScrollViewProps } from 'react-native-reanimated';

import { useHeaderHeight } from 'expo-router/react-navigation';

export const useContentContainerStyle = () => {
  const headerHeight = useHeaderHeight();
  return {
    marginTop: headerHeight,
    paddingBottom: Platform.OS === 'android' ? headerHeight : 0,
  };
};

type Props = AnimatedScrollViewProps & {
  ref?: AnimatedRef<Animated.ScrollView> | React.Ref<Animated.ScrollView>;
};

/**
 * I don't remember why this complicated scroll view wrapper is necessary,
 * TODO: At some point, I should try removing it to see what happens...
 */
export default function ScrollViewWithHeader({
  children,
  contentContainerStyle: argContentContainerStyle,
  ref,
  ...props
}: Props) {
  const contentContainerStyle = useContentContainerStyle();
  return (
    <Animated.ScrollView
      ref={ref as React.Ref<Animated.ScrollView>}
      contentContainerStyle={[contentContainerStyle, argContentContainerStyle]}
      {...props}
    >
      {children}
    </Animated.ScrollView>
  );
}
