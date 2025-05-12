import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dainorėlis',
  slug: 'dainorelis',
  version: '2.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dainorelis.dainorelis',
    buildNumber: '250512',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#70997F',
    },
    package: 'com.dainorelis.dainorelis',
    versionCode: 250512,
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'react-native',
        organization: 'darius-cepulis',
      },
    ],
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
          'node_modules/@expo-google-fonts/fira-sans/400Regular/FiraSans_400Regular.ttf',
          'node_modules/@expo-google-fonts/fira-sans/400Regular_Italic/FiraSans_400Regular_Italic.ttf',
          'node_modules/@expo-google-fonts/fira-sans/500Medium/FiraSans_500Medium.ttf',
          'node_modules/@expo-google-fonts/fira-sans/500Medium_Italic/FiraSans_500Medium_Italic.ttf',
          'node_modules/@expo-google-fonts/fira-sans/700Bold/FiraSans_700Bold.ttf',
          'node_modules/@expo-google-fonts/fira-sans/700Bold_Italic/FiraSans_700Bold_Italic.ttf',
          'node_modules/@expo-google-fonts/fira-sans/800ExtraBold/FiraSans_800ExtraBold.ttf',
          'node_modules/@expo-google-fonts/fira-sans/800ExtraBold_Italic/FiraSans_800ExtraBold_Italic.ttf',
        ],
      },
    ],
    [
      './plugins/withAndroidDrawables',
      {
        drawableFiles: [
          './assets/images/icons/description_20px.xml',
          './assets/images/icons/feedback_20px.xml',
          './assets/images/icons/format_quote_20px.xml',
          './assets/images/icons/menu_book_20px.xml',
          './assets/images/icons/share_20px.xml',
        ],
      },
    ],
  ],
});
