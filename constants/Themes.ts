import type { Theme } from '@react-navigation/native';

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

export const LightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#70997f',
    background: '#e2e4dd',
    card: '#F4F6F4',
    text: '#000',
    border: '#000',
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
    text: '#fff',
    border: '#fff',
    notification: 'rgb(255, 69, 58)',
  },
  fonts,
};
