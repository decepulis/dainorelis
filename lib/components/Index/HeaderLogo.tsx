import { StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { isLiquidGlassStyleHeader } from '../Header';

export default function HeaderLogo({ onLoadEnd, headerHeight }: { headerHeight: number; onLoadEnd?: () => void }) {
  const inset = useSafeAreaInsets();
  const darkMode = useColorScheme() === 'dark';
  return (
    <Image
      source={
        isLiquidGlassStyleHeader()
          ? // TODO can I do like, an SVG, that gets text color?
            darkMode
            ? require('@/assets/images/wordmark_white.png')
            : require('@/assets/images/wordmark_black.png')
          : require('@/assets/images/wordmark_white.png')
      }
      onLoadEnd={onLoadEnd}
      style={[
        headerStyles.title,
        {
          height: isLiquidGlassStyleHeader()
            ? Math.min((headerHeight - inset.top) * 0.5, 30)
            : Math.min((headerHeight - inset.top) * 0.6, 30),
        },
      ]}
      contentFit="contain"
    />
  );
}
const headerStyles = StyleSheet.create({
  title: {
    aspectRatio: 747 / 177,
  },
});
