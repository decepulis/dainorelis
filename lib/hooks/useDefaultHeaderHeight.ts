import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDefaultHeaderHeight } from '@react-navigation/elements';

export default function useDefaultHeaderHeight() {
  const inset = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  return getDefaultHeaderHeight({ height, width }, false, inset.top);
}
