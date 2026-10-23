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
  // Saira Semi Condensed, for titles (song titles, playlist names, the list's section headers). One family name per
  // weight, the file's (and PostScript) name: Android picks a bundled font by file name and can't switch weights
  // through fontWeight. iOS gets the font's own weight too, so UIKit's weight matching within the family keeps it
  titleMedium: {
    fontFamily: 'SairaSemiCondensed-Medium',
    fontWeight: Platform.OS === 'ios' ? '500' : undefined,
  },
  titleSemiBold: {
    fontFamily: 'SairaSemiCondensed-SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
} as { [weight: string]: TextStyle };

export interface Theme extends Omit<LibTheme, 'colors'> {
  colors: {
    /** eglė (fir), the one tint: light in dark mode, so anything filled with it takes `onPrimary` on top */
    primary: string;
    /** text and icons on a `primary` fill */
    onPrimary: string;
    /**
     * the green bars that carry white content (the custom header, its buttons, the search bar, the player) and the
     * band under the iOS 26 large title: the light theme's eglė in both modes, since dark mode's eglė is a light color
     */
    chrome: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    card0: string;
    separator: string;
  };
}
// Brand v3 (Audinys): docs/plans/brand-v3-type-and-color.md
export const LightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#2F5240', // eglė
    onPrimary: '#FFFFFF',
    chrome: '#2F5240',
    card0: '#E2E0D8', // sunken
    background: '#EEECE5', // linas
    card: '#FFFFFF', // raised
    text: '#18201B',
    border: '#18201B',
    notification: 'rgb(255, 69, 58)',
    ...Platform.select({
      ios: {
        separator: PlatformColor('separator') as unknown as string,
      },
      default: {
        separator: `#18201B80`,
      },
    }),
  },
  fonts: fonts as Theme['fonts'], // shhh it's fine
};
export const LightHighContrastTheme: Theme = {
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    primary: '#234033',
    chrome: '#234033',
  },
};
export const DarkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#8FBA9C', // eglė, lifted
    onPrimary: '#0E1B13',
    chrome: LightTheme.colors.chrome,
    card0: '#0B0E0C', // sunken
    background: '#121614', // naktis
    card: '#1C221F', // raised
    text: '#ECEAE3',
    border: '#ECEAE3',
    notification: 'rgb(255, 69, 58)',
    ...Platform.select({
      ios: {
        separator: PlatformColor('separator') as unknown as string,
      },
      default: {
        separator: `#ECEAE380`,
      },
    }),
  },
  fonts: fonts as Theme['fonts'], // shhh it's fine
};
export const DarkHighContrastTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#A9CDB4',
    chrome: LightHighContrastTheme.colors.chrome,
  },
};
