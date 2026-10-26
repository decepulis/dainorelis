import { useFonts } from 'expo-font';

/** The fonts the native apps embed (app.config.ts). Static rendering links them in each page's <head>. */
export default function useWebFonts() {
  useFonts({
    // the wordmark's web files, half the size of the .otf the apps embed (.woff is missing from Expo's lint list)
    /* eslint-disable @typescript-eslint/no-require-imports */
    'ModekaExtended-Regular': require('@/assets/fonts/ModekaExtended-Regular.woff'),
    'ModekaExtended-Bold': require('@/assets/fonts/ModekaExtended-Bold.woff'),
    /* eslint-enable @typescript-eslint/no-require-imports */
    'SairaSemiCondensed-Regular': require('@/assets/fonts/SairaSemiCondensed-Regular.ttf'),
    'SairaSemiCondensed-Medium': require('@/assets/fonts/SairaSemiCondensed-Medium.ttf'),
    'SairaSemiCondensed-SemiBold': require('@/assets/fonts/SairaSemiCondensed-SemiBold.ttf'),
    // the families react-native-vector-icons names on web
    'FontAwesome6Free-Regular': require('@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Regular.ttf'),
    'FontAwesome6Free-Solid': require('@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Solid.ttf'),
  });
}
