import { Platform, PlatformColor, TextStyle } from 'react-native';

import type { Theme as LibTheme } from '@react-navigation/native';

export const fonts = {
  regular: {
    fontFamily: Platform.select({ ios: 'Nunito-Medium', default: 'Nunito_500Medium' }),
    fontWeight: Platform.select({ default: '500', android: 'normal' }),
  },
  regularItalic: {
    fontFamily: Platform.select({ ios: 'Nunito-MediumItalic', default: 'Nunito_500Medium_Italic' }),
    fontWeight: Platform.select({ default: '500', android: 'normal' }),
    fontStyle: 'italic',
  },
  medium: {
    fontFamily: Platform.select({ ios: 'Nunito-Bold', default: 'Nunito_700Bold' }),
    fontWeight: Platform.select({ default: '700', android: 'normal' }),
  },
  mediumItalic: {
    fontFamily: Platform.select({ ios: 'Nunito-BoldItalic', default: 'Nunito_700Bold_Italic' }),
    fontWeight: Platform.select({ default: '700', android: 'normal' }),
    fontStyle: 'italic',
  },
  bold: {
    fontFamily: Platform.select({ ios: 'Nunito-ExtraBold', default: 'Nunito_800ExtraBold' }),
    fontWeight: Platform.select({ default: '800', android: 'normal' }),
  },
  boldItalic: {
    fontFamily: Platform.select({ ios: 'Nunito-ExtraBoldItalic', default: 'Nunito_800ExtraBold_Italic' }),
    fontWeight: Platform.select({ default: '800', android: 'normal' }),
    fontStyle: 'italic',
  },
  heavy: {
    fontFamily: Platform.select({ ios: 'Nunito-Black', default: 'Nunito_900Black' }),
    fontWeight: Platform.select({ default: '900', android: 'normal' }),
  },
  heavyItalic: {
    fontFamily: Platform.select({ ios: 'Nunito-BlackItalic', default: 'Nunito_900Black_Italic' }),
    fontWeight: Platform.select({ default: '900', android: 'normal' }),
    fontStyle: 'italic',
  },
} as { [weight: string]: TextStyle };

export interface Theme extends LibTheme {
  colors: LibTheme['colors'] & {
    card0: string;
    separator: string;
  };
}
export const LightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#70997F',
    card0: '#e4e4dd', // darker
    background: '#f1f1ee', // normal
    card: '#ffffff', // brighter
    text: '#121314',
    border: '#121314',
    notification: 'rgb(255, 69, 58)',
    ...Platform.select({
      ios: {
        separator: PlatformColor('separator') as unknown as string,
      },
      default: {
        separator: `#12131480`,
      },
    }),
  },
  fonts: fonts as Theme['fonts'], // shhh it's fine
};
export const LightHighContrastTheme: Theme = {
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    primary: '#508062',
  },
};
export const DarkTheme: Theme = {
  dark: false,
  colors: {
    primary: '#53745e',
    card0: '#080910', // darker
    background: '#121314', // dark
    card: '#343638', // brighter
    text: '#FEF9F7',
    border: '#FEF9F7',
    notification: 'rgb(255, 69, 58)',
    ...Platform.select({
      ios: {
        separator: PlatformColor('separator') as unknown as string,
      },
      default: {
        separator: `#FEF9F780`,
      },
    }),
  },
  fonts: fonts as Theme['fonts'], // shhh it's fine
};
export const DarkHighContrastTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#375943',
  },
};
