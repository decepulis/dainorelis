import { Platform } from 'react-native';

// iOS 27 gives the navigation bar a background (the scroll view's top scroll edge effect, in its hard style)
// only behind a native title: glass buttons and custom title views don't count, so a screen with a custom title
// (the logo, HeaderTitle) or none shows scrolled content straight through the bar. iOS 26 draws its soft edge
// effect either way.
const needsExplicitEdgeEffect = process.env.EXPO_OS === 'ios' && parseInt(String(Platform.Version), 10) >= 27;

/**
 * Screen options for a screen whose navigation bar has no native title: the hard top edge effect (the standard
 * bar background) once content scrolls under the bar past `threshold`, the automatic one at the scroll edge. The
 * screens patch's `topScrollEdgeEffectThreshold` switches it natively, in step with the scroll view (a round trip
 * through JS lags behind fast flicks). The scroll view must be the first in the screen's view hierarchy, where
 * react-native-screens and UIKit look for it.
 */
export default function useTopScrollEdgeEffect(threshold = 0) {
  return needsExplicitEdgeEffect
    ? // a patched prop (see patches/react-native-screens), so not in the published types
      { unstable_nativeProps: { topScrollEdgeEffectThreshold: threshold } as object }
    : undefined;
}
