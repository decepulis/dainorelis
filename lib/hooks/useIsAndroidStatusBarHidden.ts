import { Platform, useWindowDimensions } from 'react-native';

export default function useIsAndroidStatusBarHidden() {
  const { width, height } = useWindowDimensions();
  const aspectRatio = width / height;
  return Platform.OS === 'android' && aspectRatio > 16 / 9;
}
