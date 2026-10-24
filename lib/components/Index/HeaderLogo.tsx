import { DynamicColorIOS, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/lib/constants/themes';

import { isLiquidGlassStyleHeader } from '../Header';

// The wordmark is text in the natively embedded Modeka Extended font, so there's nothing to wait for at launch
export default function HeaderLogo({ headerHeight }: { headerHeight: number }) {
  const inset = useSafeAreaInsets();
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={[
        {
          ...fonts.brand,
          textAlign: 'center',
          fontSize: 28,
          marginBottom: -4, // optical alignment
          paddingTop: 2, // diacriticals
          height: isLiquidGlassStyleHeader()
            ? Math.min((headerHeight - inset.top) * 0.6, 30)
            : Math.min((headerHeight - inset.top) * 0.7, 30),
          color: isLiquidGlassStyleHeader()
            ? DynamicColorIOS({
                light: '#000',
                dark: '#fff',
              })
            : '#fff',
        },
      ]}
    >
      {'Dainorėlis'.toLocaleUpperCase()}
    </Text>
  );
}
