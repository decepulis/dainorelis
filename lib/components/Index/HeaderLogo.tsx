import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

export default function HeaderLogo({ onLoadEnd, headerHeight }: { headerHeight; onLoadEnd?: () => void }) {
  const inset = useSafeAreaInsets();
  return (
    <Image
      source={require('@/assets/images/logo_white.png')}
      onLoadEnd={onLoadEnd}
      style={[
        headerStyles.title,
        {
          height: Math.min((headerHeight - inset.top) * 0.75, 30),
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
