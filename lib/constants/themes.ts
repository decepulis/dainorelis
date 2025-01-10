import type { Theme as LibTheme } from '@react-navigation/native';

type Fonts = Theme['fonts'] & {
  regularItalic: {
    fontFamily: string;
  };
  boldItalic: {
    fontFamily: string;
  };
};
export const fonts: Fonts = {
  regular: {
    fontFamily: 'TitilliumWeb-Regular',
    fontWeight: 'normal',
  },
  regularItalic: {
    fontFamily: 'TitilliumWeb-Italic',
  },
  medium: {
    fontFamily: 'TitilliumWeb-Regular',
    fontWeight: 'normal',
  },
  bold: {
    fontFamily: 'TitilliumWeb-Bold',
    fontWeight: '400',
  },
  boldItalic: {
    fontFamily: 'TitilliumWeb-BoldItalic',
  },
  heavy: {
    fontFamily: 'TitilliumWeb-Bold',
    fontWeight: '400',
  },
};

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
  fonts,
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
  fonts,
};
