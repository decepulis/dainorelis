import { useEffect, useState } from 'react';
import { Appearance, KeyboardAvoidingView, LayoutChangeEvent, Platform, useColorScheme } from 'react-native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { DidImagesLoadProvider, useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import useIsAndroidStatusBarHidden from '@/lib/hooks/useIsAndroidStatusBarHidden';
import useStorage, { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

Sentry.init({
  dsn: 'https://32e018a748671fa59063479f82810140@o4509108229242880.ingest.us.sentry.io/4509108265680896',
  sampleRate: __DEV__ ? 0 : 1,
});

type AppProps = {
  onLayout: (e: LayoutChangeEvent) => void;
};
function App({ onLayout }: AppProps) {
  const background = useThemeColor('background');
  const isAndroidStatusBarHidden = useIsAndroidStatusBarHidden();

  return (
    <>
      {Platform.OS === 'android' ? <StatusBar hidden={isAndroidStatusBarHidden} animated /> : null}
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
  const { didBackgroundLoad, didLogoLoad } = useDidImagesLoad();
  const { value: colorSchemePreference } = useStorage('theme');

  // keep color scheme in sync with storage
  useEffect(() => {
    Appearance.setColorScheme(colorSchemePreference === 'auto' ? null : colorSchemePreference);
    // due to batching, I might be setting this too early. tbd.
    setIsColorSchemeSet(true);
  }, [colorSchemePreference]);

  // do async work that needs to be done before the splash screen here
  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([initI18n()]);
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
    if (asyncWorkIsDone && isColorSchemeSet && didAppLayout && didBackgroundLoad && didLogoLoad) {
      SplashScreen.hide();
    }
  }, [asyncWorkIsDone, isColorSchemeSet, didAppLayout, didBackgroundLoad, didLogoLoad]);

  if (asyncWorkIsDone && isColorSchemeSet) {
    return <App onLayout={() => setDidAppLayout(true)} />;
  }
  return null;
}

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <StorageProvider>
      <DidImagesLoadProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
          <AppWithLoading />
        </ThemeProvider>
      </DidImagesLoadProvider>
    </StorageProvider>
  );
});
