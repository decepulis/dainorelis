import { ConfigContext, ExpoConfig } from 'expo/config';

// Import package.json to get version number
import packageJson from './package.json';

// Generate build number in format yymmdd##
const buildToday = '01';
const generateBuildNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}${buildToday}`;
};

const buildNumber = generateBuildNumber();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dainorėlis',
  slug: 'dainorelis',
  version: packageJson.version,
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dainorelis.dainorelis',
    buildNumber: buildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ['audio'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#70997F',
    },
    package: 'com.dainorelis.dainorelis',
    versionCode: parseInt(buildNumber, 10),
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
          'node_modules/@expo-google-fonts/nunito/500Medium/Nunito_500Medium.ttf',
          'node_modules/@expo-google-fonts/nunito/500Medium_Italic/Nunito_500Medium_Italic.ttf',
          'node_modules/@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf',
          'node_modules/@expo-google-fonts/nunito/700Bold_Italic/Nunito_700Bold_Italic.ttf',
          'node_modules/@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf',
          'node_modules/@expo-google-fonts/nunito/800ExtraBold_Italic/Nunito_800ExtraBold_Italic.ttf',
          'node_modules/@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf',
          'node_modules/@expo-google-fonts/nunito/900Black_Italic/Nunito_900Black_Italic.ttf',
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
          './assets/images/icons/music_note_20px.xml',
        ],
      },
    ],
  ],
});
