import { useEffect, useLayoutEffect, useState } from 'react';
import { Appearance, KeyboardAvoidingView, LayoutChangeEvent, Platform, useColorScheme } from 'react-native';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import {
  FiraSans_400Regular,
  FiraSans_400Regular_Italic,
  FiraSans_500Medium,
  FiraSans_500Medium_Italic,
  FiraSans_700Bold,
  FiraSans_700Bold_Italic,
  FiraSans_800ExtraBold,
  FiraSans_800ExtraBold_Italic,
  useFonts,
} from '@expo-google-fonts/fira-sans';
import { ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import useStorage, { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

Sentry.init({
  dsn: 'https://32e018a748671fa59063479f82810140@o4509108229242880.ingest.us.sentry.io/4509108265680896',
  sampleRate: __DEV__ ? 0 : 1,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

type AppProps = {
  onLayout: (e: LayoutChangeEvent) => void;
};
function App({ onLayout }: AppProps) {
  const background = useThemeColor('background');
  const primary = useThemeColor('primary');

  // Keep android navigation bar color in sync with the app
  useLayoutEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(primary);
      NavigationBar.setButtonStyleAsync('light');
    }
  }, [primary]);

  return (
    <>
      <StatusBar style="light" backgroundColor={primary} translucent={false} />
      <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1, backgroundColor: background }} onLayout={onLayout}>
        <Stack>
          {/* we're unsetting all the titles here so we can set them dynamically within the pages... or provide a custom header within that page */}
          <Stack.Screen name="index" options={{ title: '' }} />
          <Stack.Screen name="nustatymai" options={{ title: '' }} />
          <Stack.Screen name="dainos/[id]" options={{ title: '' }} />
        </Stack>
      </KeyboardAvoidingView>
    </>
  );
}

// Wrapping App is the Root Layout, which manages resource loading and the splash screen
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});
function AppWithLoading() {
  const [asyncWorkIsDone, setAsyncWorkIsDone] = useState(false);
  const [isColorSchemeSet, setIsColorSchemeSet] = useState(false);
  const [didAppLayout, setDidAppLayout] = useState(false);
  const { value: colorSchemePreference, loading: isColorSchemePreferenceLoading } = useStorage('theme');
  const [fontIsReady, fontError] = useFonts({
    FiraSans_400Regular,
    FiraSans_400Regular_Italic,
    FiraSans_500Medium,
    FiraSans_500Medium_Italic,
    FiraSans_700Bold,
    FiraSans_700Bold_Italic,
    FiraSans_800ExtraBold,
    FiraSans_800ExtraBold_Italic,
  });

  // keep color scheme in sync with storage
  useEffect(() => {
    if (isColorSchemePreferenceLoading) return;
    Appearance.setColorScheme(colorSchemePreference === 'auto' ? null : colorSchemePreference);
    // due to batching, I might be setting this too early. tbd.
    setIsColorSchemeSet(true);
  }, [colorSchemePreference, isColorSchemePreferenceLoading]);

  // do async work that needs to be done before the splash screen here
  useEffect(() => {
    async function prepare() {
      try {
        await initI18n();
      } catch (e) {
        console.warn(e);
      } finally {
        setAsyncWorkIsDone(true);
      }
    }

    prepare();
  }, []);

  // hide the splash screen when we're good to go
  useEffect(() => {
    if (asyncWorkIsDone && isColorSchemeSet && (fontIsReady || fontError) && didAppLayout) {
      SplashScreen.hide();
    }
  }, [asyncWorkIsDone, isColorSchemeSet, fontIsReady, fontError, didAppLayout]);

  if (asyncWorkIsDone && isColorSchemeSet && (fontIsReady || fontError)) {
    return <App onLayout={() => setDidAppLayout(true)} />;
  }
  return null;
}

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <StorageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
        <AppWithLoading />
      </ThemeProvider>
    </StorageProvider>
  );
});
