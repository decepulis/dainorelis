import { ConfigContext, ExpoConfig } from 'expo/config';

// Import package.json to get version number
import packageJson from './package.json' with { type: 'json' };

// Generate build number in format yymmdd##
const buildToday = '01'; // Increment this manually for multiple builds in one day
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
  scheme: 'dainorelis',
  userInterfaceStyle: 'automatic',
  experiments: {
    reactCompiler: true,
  },
  ios: {
    icon: './assets/images/icon.icon',
    supportsTablet: true,
    bundleIdentifier: 'com.dainorelis.dainorelis',
    buildNumber: buildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ['audio'],
    },
    // Required-reason API declarations. Previously a hand-carried PrivacyInfo.xcprivacy in ios/;
    // declared here so prebuild regenerates it.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1', '0A2A.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['85F4.1', 'E174.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#70997F',
    },
    package: 'com.dainorelis.dainorelis',
    versionCode: parseInt(buildNumber, 10),
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-image',
    'expo-web-browser',
    'expo-status-bar',
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
        fonts: ['./assets/fonts/Modekan.ttf'],
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // compileSdk / targetSdk / buildTools come from the SDK's version catalog
          // (react-native/gradle/libs.versions.toml). Only minSdk is raised above its default (24).
          minSdkVersion: 26,
          // SDK 58 enables R8 in release builds. react-native-pdf's pdfium binding is reached
          // through JNI by class name, so R8 must not rename or strip it.
          extraProguardRules: '-keep class io.legere.pdfiumandroid.** { *; }',
        },
      },
    ],
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false }],
    '@react-native-vector-icons/fontawesome6',
    './plugins/withAndroidReleaseSigning',
    './plugins/withIosReleaseScheme',
  ],
});
