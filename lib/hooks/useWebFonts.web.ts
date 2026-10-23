import { useFonts } from 'expo-font';

/** The fonts the native apps embed (app.config.ts). Static rendering links them in each page's <head>. */
export default function useWebFonts() {
  useFonts({
    Modekan: require('@/assets/fonts/Modekan.ttf'),
    'SairaSemiCondensed-Medium': require('@/assets/fonts/SairaSemiCondensed-Medium.ttf'),
    'SairaSemiCondensed-SemiBold': require('@/assets/fonts/SairaSemiCondensed-SemiBold.ttf'),
    // the families react-native-vector-icons names on web
    'FontAwesome6Free-Regular': require('@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Regular.ttf'),
    'FontAwesome6Free-Solid': require('@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Solid.ttf'),
  });
}
