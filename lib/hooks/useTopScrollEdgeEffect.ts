import { useState } from 'react';
import { Platform } from 'react-native';
import Animated, { AnimatedRef, SharedValue, useAnimatedReaction, useScrollOffset } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// iOS 27 gives the navigation bar a background (the scroll view's top scroll edge effect, in its hard style)
// only behind a native title: glass buttons and custom title views don't count, so a screen with a custom title
// (the logo, HeaderTitle) or none shows scrolled content straight through the bar. iOS 26 draws its soft edge
// effect either way.
const needsExplicitEdgeEffect = process.env.EXPO_OS === 'ios' && parseInt(String(Platform.Version), 10) >= 27;

/**
 * The `scrollEdgeEffects` screen option for a screen whose navigation bar has no native title: the hard top
 * edge effect (the standard bar background) once content scrolls under the bar past `threshold`, the automatic
 * one at the scroll edge. The scroll view must be the first in the screen's view hierarchy, where
 * react-native-screens and UIKit look for it. `providedOffset` is the screen's own scroll offset, kept up to date
 * here too.
 */
export default function useTopScrollEdgeEffect(
  scrollRef: AnimatedRef<Animated.ScrollView> | AnimatedRef<Animated.FlatList<any>>,
  threshold = 0,
  providedOffset?: SharedValue<number>
) {
  // @ts-expect-error useScrollOffset doesn't know this works with flatlist
  const scrollOffset = useScrollOffset(needsExplicitEdgeEffect ? scrollRef : null, providedOffset);
  const [isScrolledUnder, setIsScrolledUnder] = useState(false);
  useAnimatedReaction(
    () => needsExplicitEdgeEffect && scrollOffset.get() > threshold,
    (isUnder, wasUnder) => {
      if (isUnder !== wasUnder) scheduleOnRN(setIsScrolledUnder, isUnder);
    }
  );
  return needsExplicitEdgeEffect ? { top: isScrolledUnder ? ('hard' as const) : ('automatic' as const) } : undefined;
}
