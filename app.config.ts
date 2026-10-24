import { ConfigContext, ExpoConfig } from 'expo/config';

// Import package.json to get version number
import packageJson from './package.json' with { type: 'json' };

// Generate build number in format yymmdd##
const buildToday = '02'; // Increment this manually for multiple builds in one day
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
    // compiles modules/app-intents (Siri, Shortcuts, Spotlight) into the iOS app target, where
    // Apple's App Intents metadata extraction can see it
    inlineModules: { watchedDirectories: ['modules/app-intents'] },
  },
  ios: {
    icon: './assets/images/icon.icon',
    supportsTablet: true,
    bundleIdentifier: 'com.dainorelis.dainorelis',
    appleTeamId: '5BPU37MJR9',
    buildNumber: buildNumber,
    // song and shared playlist links (https://dainorelis.app/dainos/…, /p?…) open the app; the site serves
    // .well-known/apple-app-site-association (public/). Only the apex: www redirects there, and Apple doesn't follow
    // redirects to the file.
    associatedDomains: ['applinks:dainorelis.app'],
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: ['audio'],
      // The app is localized in Lithuanian and English, so system UI (edit mode, share sheets,
      // alerts' system buttons) follows the app's language rather than staying English.
      // lib/utils/systemLanguage.ts keeps it in step with the in-app language setting.
      CFBundleDevelopmentRegion: 'lt',
      CFBundleLocalizations: ['lt', 'en'],
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
      // generated from assets/images/icon_v3.svg by scripts/generate-brand-assets.ts
      foregroundImage: './assets/images/adaptive-icon.png',
      monochromeImage: './assets/images/adaptive-icon-monochrome.png',
      backgroundColor: '#006A44',
    },
    package: 'com.dainorelis.dainorelis',
    versionCode: parseInt(buildNumber, 10),
    // song and shared playlist links open the app (Android App Links); the site serves .well-known/assetlinks.json
    // (public/). Only hosts that serve it: below Android 12, one host failing verification fails them all.
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        // exactly /p (the query is ignored): a prefix would also take /privacy, /pdf…
        data: [
          { scheme: 'https', host: 'dainorelis.app', path: '/p' },
          { scheme: 'https', host: 'dainorelis.app', pathPrefix: '/dainos/' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    // favicons and the link preview image are in public/ (scripts/generate-brand-assets.ts)
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-image',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        // the app icon's colors, so the launch continues from the icon
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#006A44',
        dark: { backgroundColor: '#121614' },
      },
    ],
    [
      'expo-font',
      {
        // Modeka Extended (licensed from WildOnes Design) for the wordmark; Saira Semi Condensed (SIL OFL,
        // assets/fonts/SairaSemiCondensed-OFL.txt) for titles
        fonts: [
          './assets/fonts/ModekaExtended-Regular.otf',
          './assets/fonts/ModekaExtended-Bold.otf',
          './assets/fonts/SairaSemiCondensed-Medium.ttf',
          './assets/fonts/SairaSemiCondensed-SemiBold.ttf',
        ],
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // compileSdk / targetSdk / minSdk / buildTools come from the SDK's version catalog
          // (react-native/gradle/libs.versions.toml); none of them is overridden here.
          // SDK 58 enables R8 in release builds. react-native-pdf's pdfium binding is reached
          // through JNI by class name, so R8 must not rename or strip it.
          extraProguardRules: '-keep class io.legere.pdfiumandroid.** { *; }',
        },
      },
    ],
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false }],
    '@react-native-vector-icons/fontawesome6',
    ['expo-app-intents', { directory: 'modules/app-intents' }],
    './plugins/withAndroidReleaseSigning',
    './plugins/withAndroidFontScaleConfigChange',
    './plugins/withIosReleaseScheme',
  ],
});
