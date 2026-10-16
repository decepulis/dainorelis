import { Platform, PlatformColor, TextStyle } from 'react-native';

import type { Theme as LibTheme } from 'expo-router/react-navigation';

export const fonts = {
  regular: {
    fontWeight: '400',
  },
  regularItalic: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  medium: {
    fontWeight: '700',
  },
  mediumItalic: {
    fontWeight: '700',
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '800',
  },
  boldItalic: {
    fontWeight: '800',
    fontStyle: 'italic',
  },
  heavy: {
    fontWeight: '900',
  },
  heavyItalic: {
    fontWeight: '900',
    fontStyle: 'italic',
  },
  brand: {
    fontFamily: 'Modekan',
    fontWeight: '400',
  },
} as { [weight: string]: TextStyle };

export interface Theme extends Omit<LibTheme, 'colors'> {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
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
  dark: true,
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
