import { useWindowDimensions } from 'react-native';

import useHasHydrated from './useHasHydrated';

const zeroFrame = { x: 0, y: 0, width: 0, height: 0 };

/**
 * The window. expo-router's web SafeAreaProvider reports a zero frame for good, and static rendering knows no
 * window, so hydration starts from zero too.
 */
export default function useFrame() {
  const hasHydrated = useHasHydrated();
  const { width, height } = useWindowDimensions();
  return hasHydrated ? { x: 0, y: 0, width, height } : zeroFrame;
}
