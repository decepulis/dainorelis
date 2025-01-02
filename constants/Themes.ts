import type { Theme as LibTheme } from '@react-navigation/native';

const fonts: Theme['fonts'] = {
  regular: {
    fontFamily: 'KlavikaRegular',
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'KlavikaRegular',
    fontWeight: 'normal',
  },
  bold: {
    fontFamily: 'KlavikaBold',
    fontWeight: '700',
  },
  heavy: {
    fontFamily: 'KlavikaBold',
    fontWeight: '700',
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
    background: '#FEF9F7',
    card: '#FFF',
    cardDark: '#ECE9E8',
    text: '#121314',
    border: '#121314',
    notification: 'rgb(255, 69, 58)',
  },
  fonts,
};
export const DarkTheme: Theme = {
  dark: false,
  colors: {
    primary: '#2f4236',
    background: '#121314',
    card: '#242628',
    cardDark: '#2A2A2E',
    text: '#FEF9F7',
    border: '#FEF9F7',
    notification: 'rgb(255, 69, 58)',
  },
  fonts,
};
