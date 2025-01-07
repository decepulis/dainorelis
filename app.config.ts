import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dainorėlis',
  slug: 'dainorelis',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dainorelis.v2',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#70997F',
    },
    package: 'com.dainorelis.v2',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#70997F',
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/klavika-bold/fonts/KlavikaBold.ttf',
          './assets/fonts/klavika-regular/fonts/KlavikaRegular.ttf',
        ],
      },
    ],
    [
      'expo-asset',
      {
        assets: [
          './assets/images/miskas.jpg',
          './assets/images/logo_white.png',
          './assets/images/icon/fav_white.png',
          './assets/images/icon/fav_black.png',
          './assets/images/icon/settings_white.png',
          './assets/images/icon/book_white.png',
          './assets/images/profiles/daina.jpg',
          './assets/images/profiles/dar.jpg',
          './assets/images/profiles/jonas.jpg',
          './assets/images/profiles/kes.jpg',
          './assets/images/profiles/shar.jpg',
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
