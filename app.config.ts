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
    bundleIdentifier: 'com.dainorelis.dainorelis',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#70997F',
    },
    package: 'com.dainorelis.dainorelis',
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
          // bundling everything, just in case.
          // todo: slim down to only what we're shipping
          './assets/images/miskas.jpg',
          './assets/images/miskas2.jpg',
          './assets/images/miskas2light.jpg',
          './assets/images/miskas2dark.jpg',
          './assets/images/icon_book_white.png',
          './assets/images/icon_fav_white.png',
          './assets/images/icon_settings_white.png',
          './assets/images/logo_white.png',
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
