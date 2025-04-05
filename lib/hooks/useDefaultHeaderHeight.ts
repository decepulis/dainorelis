import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDefaultHeaderHeight } from '@react-navigation/elements';

export default function useDefaultHeaderHeight() {
  const inset = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  // TODO this is slightly off on android
  return getDefaultHeaderHeight({ height, width }, false, inset.top);
}
