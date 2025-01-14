import { Platform, TextStyle } from 'react-native';

import type { Theme as LibTheme } from '@react-navigation/native';

export const fonts = {
  regular: {
    fontFamily: Platform.select({ ios: 'FiraSans-Regular', default: 'FiraSans_400Regular' }),
    fontWeight: 'normal',
  },
  regularItalic: {
    fontFamily: Platform.select({ ios: 'FiraSans-Italic', default: 'FiraSans_400Regular_Italic' }),
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  medium: {
    // instead of loading a medium font, we re-use the 400
    fontFamily: Platform.select({ ios: 'FiraSans-Regular', default: 'FiraSans_400Regular' }),
    fontWeight: 'normal',
  },
  bold: {
    fontFamily: Platform.select({ ios: 'FiraSans-Bold', default: 'FiraSans_700Bold' }),
    fontWeight: Platform.select({ default: '700', android: 'normal' }),
  },
  boldItalic: {
    fontFamily: Platform.select({ ios: 'FiraSans-BoldItalic', default: 'FiraSans_700Bold_Italic' }),
    fontWeight: Platform.select({ default: '700', android: 'normal' }),
    fontStyle: 'italic',
  },
  heavy: {
    // instead of loading a heavy font, we re-use the 700
    fontFamily: Platform.select({ ios: 'FiraSans-Bold', default: 'FiraSans_700Bold' }),
    fontWeight: Platform.select({ default: '700', android: 'normal' }),
  },
} as { [weight: string]: TextStyle };

export interface Theme extends LibTheme {
  colors: LibTheme['colors'] & {
    cardDark: string;
  };
}
export const LightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#70997F',
    background: '#e4e4dd',
    card: '#FFF',
    cardDark: '#D6D6D2',
    text: '#121314',
    border: '#121314',
    notification: 'rgb(255, 69, 58)',
  },
  fonts: fonts as Theme['fonts'], // shhh it's fine
};
export const DarkTheme: Theme = {
  dark: false,
  colors: {
    primary: '#53745e',
    background: '#121314',
    card: '#242628',
    cardDark: '#2A2A2E',
    text: '#FEF9F7',
    border: '#FEF9F7',
    notification: 'rgb(255, 69, 58)',
  },
  fonts: fonts as Theme['fonts'], // shhh it's fine
};
