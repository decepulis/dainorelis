import { DynamicColorIOS, Text, useWindowDimensions } from 'react-native';

import { fonts } from '@/lib/constants/themes';

import { isLiquidGlassStyleHeader } from '../Header';

// The wordmark is text in the natively embedded Modeka Extended font, so there's nothing to wait for at launch.
// It's a fixed size, not one derived from the header's height: that went stale or came out tiny on narrow windows
// (iPhone Duo's outer screen, some iPad widths). Only a compact bar (iPhone landscape, 32pt) takes a smaller one,
// and it shrinks to fit only when the bar truly has no room for it.
export default function HeaderLogo() {
  const { width, height } = useWindowDimensions();
  const isCompactBar = process.env.EXPO_OS === 'ios' && width > height && Math.min(width, height) < 500;
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      allowFontScaling={false}
      style={{
        ...fonts.brand,
        textAlign: 'center',
        fontSize: isCompactBar ? 19 : 26,
        color: isLiquidGlassStyleHeader()
          ? DynamicColorIOS({
              light: '#000',
              dark: '#fff',
            })
          : '#fff',
      }}
    >
      {'Dainorėlis'.toLocaleUpperCase()}
    </Text>
  );
}
