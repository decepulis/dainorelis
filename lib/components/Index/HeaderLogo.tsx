import { useEffect } from 'react';
import { DynamicColorIOS, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/lib/constants/themes';

import { isLiquidGlassStyleHeader } from '../Header';

export default function HeaderLogo({ onLoadEnd, headerHeight }: { headerHeight: number; onLoadEnd?: () => void }) {
  const inset = useSafeAreaInsets();
  // const darkMode = useColorScheme() === 'dark';
  useEffect(() => {
    onLoadEnd?.();
  }, [onLoadEnd]);
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
          fontFamily: 'Modekan',
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
  // return (
  //   <Image
  //     source={
  //       isLiquidGlassStyleHeader()
  //         ? // TODO can I do like, an SVG, that gets text color?
  //           darkMode
  //           ? require('@/assets/images/wordmark_white.png')
  //           : require('@/assets/images/wordmark_black.png')
  //         : require('@/assets/images/wordmark_white.png')
  //     }
  //     onLoadEnd={onLoadEnd}
  //     style={[
  //       headerStyles.title,
  //       {
  //         height: isLiquidGlassStyleHeader()
  //           ? Math.min((headerHeight - inset.top) * 0.5, 30)
  //           : Math.min((headerHeight - inset.top) * 0.6, 30),
  //       },
  //     ]}
  //     contentFit="contain"
  //   />
  // );
}
